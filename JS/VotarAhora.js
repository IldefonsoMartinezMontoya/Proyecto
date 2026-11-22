// Valida la pertenencia a la sala, guarda un voto y espera al resultado compartido.
const CLAVE_SALA_ACTIVA = "limoncioSalaActiva";
const formulario = document.getElementById("formularioVotacion");
const estado = document.getElementById("estadoVoto");
const botonGuardar = document.getElementById("guardarVoto");
let salaActiva = null;
let temporizador = null;

async function solicitarApi(url, opciones = {}) {
  const respuesta = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    ...opciones,
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || "No se pudo consultar la sala.");
  return datos;
}

function abrirCatalogo(datos) {
  const claveVisto = `limoncioCatalogoAbierto:${salaActiva.codigo}`;
  sessionStorage.setItem(claveVisto, "1");
  const destino = new URL("Catalogo.html", window.location.href);
  destino.searchParams.set("sala", datos.sala.codigo);
  window.location.assign(destino.href);
}

function aplicarEstado(datos) {
  if (datos.participante?.id !== salaActiva.participanteId) {
    throw new Error("Este dispositivo ya no pertenece a la sala. Vuelve a unirte para votar.");
  }

  if (datos.votacion.cerrada) {
    estado.textContent = `La votación ha terminado. Ganó ${datos.votacion.generoGanador}; abriendo su catálogo…`;
    formulario.hidden = true;
    abrirCatalogo(datos);
    return;
  }

  formulario.hidden = false;
  estado.textContent = datos.participante.haVotado
    ? `Tu voto está guardado. ${datos.votacion.totalVotos} de ${datos.votacion.totalParticipantes} participantes han votado; puedes cambiarlo mientras la votación siga abierta.`
    : `${datos.votacion.totalVotos} de ${datos.votacion.totalParticipantes} participantes han votado.`;

  const opcionGuardada = [...formulario.elements.genero].find(
    (opcion) => opcion.value === datos.participante.generoVotado,
  );
  if (opcionGuardada) opcionGuardada.checked = true;
  botonGuardar.textContent = datos.participante.haVotado ? "Actualizar mi voto" : "Guardar mi voto";
}

async function actualizarEstado() {
  if (!salaActiva) return;
  const datos = await solicitarApi(
    `/api/salas/${salaActiva.codigo}?participanteId=${encodeURIComponent(salaActiva.participanteId)}`,
  );
  aplicarEstado(datos);
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const genero = new FormData(formulario).get("genero");
  if (!genero || !salaActiva) return;

  botonGuardar.disabled = true;
  estado.textContent = "Guardando tu voto…";
  try {
    const datos = await solicitarApi(`/api/salas/${salaActiva.codigo}/votar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participanteId: salaActiva.participanteId, genero }),
    });
    aplicarEstado(datos);
  } catch (error) {
    estado.textContent = error.message;
  } finally {
    botonGuardar.disabled = false;
  }
});

async function iniciarVotacion() {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SALA_ACTIVA) || "null");
    if (!guardada?.codigo || !guardada?.participanteId) {
      throw new Error("Para votar primero tienes que entrar en una sala. Abre Salas y crea una o únete con su código.");
    }
    salaActiva = guardada;
    await actualizarEstado();
    temporizador = window.setInterval(() => {
      actualizarEstado().catch((error) => {
        estado.textContent = error.message;
        if (error.message.includes("ya no pertenece")) window.clearInterval(temporizador);
      });
    }, 3000);
  } catch (error) {
    estado.textContent = error.message;
    formulario.hidden = true;
  }
}

iniciarVotacion();
