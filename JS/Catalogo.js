// Gestiona la cartelera normal y el resultado fijo de una votación de sala.
const CLAVE_SALA_ACTIVA = "limoncioSalaActiva";
const parametros = new URLSearchParams(window.location.search);
const codigoSalaResultado = parametros.get("sala");
const gridCatalogo = document.getElementById("catalogo-grid");
const estadoCatalogo = document.getElementById("estado-catalogo");
const tituloCatalogo = document.getElementById("catalogo-titulo");
const introduccionCatalogo = document.querySelector(".catalogo-panel .lead");

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tituloDeCartel(imagen) {
  return imagen.alt
    .replace(/^Cartel de\s*/i, "")
    .replace(/\s+\((?:(?:19|20)\d{2}\s+)?film\)$/i, "")
    .trim();
}

function abrirFicha(imagen) {
  const titulo = tituloDeCartel(imagen);
  const genero = imagen.closest(".genero-card")?.querySelector("h2")?.textContent.trim() || "Película";
  const destino = new URL("PeliculasTrailersyMas.html", window.location.href);
  destino.searchParams.set("titulo", titulo);
  if (imagen.dataset.year) destino.searchParams.set("year", imagen.dataset.year);
  destino.searchParams.set("genero", genero);
  destino.searchParams.set("poster", imagen.getAttribute("src"));
  window.location.assign(destino.href);
}

function prepararInteraccionCarteles() {
  document.querySelectorAll(".genero-card .slider img").forEach((imagen) => {
    imagen.tabIndex = 0;
    imagen.setAttribute("role", "link");
    imagen.setAttribute("aria-label", `Ver ficha de ${tituloDeCartel(imagen)}`);
    imagen.addEventListener("click", () => abrirFicha(imagen));
    imagen.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrirFicha(imagen);
      }
    });
  });
}

function iniciarCarruseles() {
  document.querySelectorAll(".slider").forEach((slider) => {
    const imagenes = [...slider.querySelectorAll("img")];
    if (!imagenes.length) return;
    let indice = 0;
    imagenes[0].classList.add("activa");

    const mostrar = (nuevoIndice) => {
      imagenes[indice].classList.remove("activa");
      indice = (nuevoIndice + imagenes.length) % imagenes.length;
      imagenes[indice].classList.add("activa");
    };
    const anterior = slider.querySelector(".anterior");
    const siguiente = slider.querySelector(".siguiente");
    anterior?.addEventListener("click", () => mostrar(indice - 1));
    siguiente?.addEventListener("click", () => mostrar(indice + 1));
    window.setInterval(() => mostrar(indice + 1), 4000);
  });
}

function mostrarError(mensaje) {
  gridCatalogo.hidden = true;
  estadoCatalogo.hidden = false;
  estadoCatalogo.replaceChildren(document.createTextNode(`${mensaje} `));
  const enlace = document.createElement("a");
  enlace.href = "Salas.html";
  enlace.textContent = "Volver a las salas";
  estadoCatalogo.append(enlace);
}

async function cargarCatalogoGanador() {
  document.body.classList.add("catalogo-resultado");
  gridCatalogo.hidden = true;
  estadoCatalogo.hidden = false;
  estadoCatalogo.textContent = "Comprobando el resultado de la sala…";

  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SALA_ACTIVA) || "null");
    if (!guardada?.participanteId || guardada.codigo !== codigoSalaResultado) {
      throw new Error("Este catálogo solo está disponible para quienes siguen en la sala.");
    }

    const respuesta = await fetch(
      `/api/salas/${encodeURIComponent(codigoSalaResultado)}?participanteId=${encodeURIComponent(guardada.participanteId)}`,
      { cache: "no-store", credentials: "same-origin" },
    );
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.error || "No se pudo consultar el resultado de la sala.");
    if (datos.participante?.id !== guardada.participanteId) {
      throw new Error("Ya no formas parte de esta sala.");
    }
    if (!datos.votacion?.cerrada || !datos.votacion.generoGanador) {
      throw new Error("Todavía no han votado todos. Vuelve a la sala y espera a que termine la votación.");
    }

    const generoGanador = normalizar(datos.votacion.generoGanador);
    const tarjetas = [...document.querySelectorAll(".genero-card")];
    let tarjetaGanadora = null;
    for (const tarjeta of tarjetas) {
      const coincide = normalizar(tarjeta.querySelector("h2")?.textContent) === generoGanador;
      tarjeta.hidden = !coincide;
      if (coincide) tarjetaGanadora = tarjeta;
    }
    if (!tarjetaGanadora) throw new Error("No se encontró ese género en la cartelera.");

    tituloCatalogo.textContent = `Cartelera: ${datos.votacion.generoGanador}`;
    introduccionCatalogo.textContent = `Este género ganó en la sala ${datos.sala.codigo}. Elige un cartel para consultar su tráiler, sinopsis, dirección y reparto.`;
    document.title = `${datos.votacion.generoGanador} | Limoncio-Pelicular`;
    estadoCatalogo.hidden = true;
    gridCatalogo.hidden = false;
    sessionStorage.setItem(`limoncioCatalogoAbierto:${codigoSalaResultado}`, "1");
  } catch (error) {
    mostrarError(error.message);
  }
}

prepararInteraccionCarteles();
if (codigoSalaResultado) {
  cargarCatalogoGanador();
} else {
  iniciarCarruseles();
}
