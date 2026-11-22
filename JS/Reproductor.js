// Cambia esta única dirección cuando Cloudflare Quick Tunnel genere otra URL.
const SERVIDOR_VIDEOS = "https://ver-plane-preceding-dir.trycloudflare.com/videos";

// Archivos de muestra que están guardados actualmente en el pendrive.
const CONTENIDO = [
  {
    id: "madmax",
    titulo: "Mad Max: Furia en la carretera",
    aliases: ["Mad Max: Fury Road", "Mad Max Fury Road", "Mad Max: Furia en la carretera"],
    tipo: "Película",
    archivo: "MadMax.mp4",
    mime: "video/mp4",
    trailerId: "madmax-trailer",
  },
  {
    id: "madmax-trailer",
    titulo: "Mad Max: tráiler",
    tipo: "Tráiler",
    archivo: "MadMaxTrailer.mp4",
    mime: "video/mp4",
    peliculaId: "madmax",
  },
  {
    id: "toystory",
    titulo: "Toy Story",
    aliases: ["Toy Story"],
    tipo: "Película",
    archivo: "ToyStory.mp4",
    mime: "video/mp4",
    trailerId: "toystory-trailer",
  },
  {
    id: "toystory-trailer",
    titulo: "Toy Story: tráiler",
    tipo: "Tráiler",
    archivo: "ToyStoryTrailer.mp4",
    mime: "video/mp4",
    peliculaId: "toystory",
  },
];

const parametros = new URLSearchParams(window.location.search);
const tituloCatalogo = parametros.get("titulo");
const yearCatalogo = parametros.get("year");
const generoCatalogo = parametros.get("genero") || "Película";

const video = document.querySelector("#reproductor-video");
const fuente = document.querySelector("#fuente-video");
const tituloVideo = document.querySelector("#titulo-video");
const detalleVideo = document.querySelector("#detalle-video");
const estadoReproductor = document.querySelector("#estado-reproductor");
const ficha = document.querySelector("#ficha-pelicula");
const reproductorLocal = document.querySelector("#reproductor-local");

function urlDelContenido(item) {
  return `${SERVIDOR_VIDEOS}/${encodeURIComponent(item.archivo)}`;
}

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cargarContenido(id) {
  const item = CONTENIDO.find((contenido) => contenido.id === id) || CONTENIDO[0];
  const url = urlDelContenido(item);

  tituloVideo.textContent = item.titulo;
  detalleVideo.textContent = `${item.tipo} · ${item.archivo}`;
  fuente.src = url;
  fuente.type = item.mime;
  estadoReproductor.textContent = "Pulsa reproducir cuando quieras empezar.";
  video.load();

  const nuevaUrl = new URL(window.location.href);
  nuevaUrl.searchParams.set("id", item.id);
  window.history.replaceState({}, "", nuevaUrl);
}

function buscarPeliculaEnPendrive(titulo) {
  const nombre = normalizar(titulo);
  return CONTENIDO.find((item) => {
    if (item.tipo !== "Película") return false;
    return [item.titulo, ...(item.aliases || [])].some((alias) => normalizar(alias) === nombre);
  });
}

function crearEnlace(texto, href) {
  const enlace = document.createElement("a");
  enlace.textContent = texto;
  enlace.href = href;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  return enlace;
}

function prepararTrailer(titulo, year, peliculaLocal) {
  const contenedor = document.querySelector("#trailer-contenido");
  const estadoTrailer = document.querySelector("#estado-trailer");
  contenedor.replaceChildren();
  estadoTrailer.replaceChildren();

  const trailerLocal = peliculaLocal?.trailerId
    ? CONTENIDO.find((item) => item.id === peliculaLocal.trailerId)
    : null;

  if (trailerLocal) {
    const videoTrailer = document.createElement("video");
    videoTrailer.controls = true;
    videoTrailer.playsInline = true;
    videoTrailer.preload = "metadata";
    videoTrailer.setAttribute("aria-label", `Tráiler de ${titulo}`);

    const source = document.createElement("source");
    source.src = urlDelContenido(trailerLocal);
    source.type = trailerLocal.mime;
    videoTrailer.append(source, "Tu navegador no puede reproducir este vídeo.");
    contenedor.append(videoTrailer);
    estadoTrailer.textContent = "Tráiler reproducido desde el pendrive conectado al servidor.";
    return;
  }

  const busqueda = new URL("https://www.youtube.com/results");
  busqueda.searchParams.set("search_query", `${titulo} ${year || ""} tráiler oficial`);
  estadoTrailer.append(crearEnlace(`Buscar tráiler de ${titulo} en YouTube ↗`, busqueda.href));
  estadoTrailer.append(" · Se abrirán los resultados de YouTube en otra pestaña.");
}

function extraerIds(claims, propiedad, limite = 6) {
  return (claims?.[propiedad] || [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)
    .slice(0, limite);
}

async function peticionWikipedia(base, params) {
  const url = new URL("/w/api.php", base);
  for (const [clave, valor] of Object.entries({ ...params, format: "json", origin: "*" })) {
    url.searchParams.set(clave, valor);
  }

  const respuesta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!respuesta.ok) throw new Error(`Wikipedia respondió ${respuesta.status}`);
  return respuesta.json();
}

async function buscarArticulo(titulo, year, idioma) {
  const base = idioma === "es" ? "https://es.wikipedia.org" : "https://en.wikipedia.org";
  const termino = idioma === "es"
    ? `${titulo} ${year || ""} película`
    : `${titulo} ${year || ""} film`;
  const busqueda = await peticionWikipedia(base, {
    action: "query",
    list: "search",
    srsearch: termino,
    srlimit: "5",
  });
  const resultados = busqueda.query?.search || [];
  if (!resultados.length) return null;

  const resultado = resultados.find((pagina) => normalizar(pagina.title).includes(normalizar(titulo))) || resultados[0];
  const datos = await peticionWikipedia(base, {
    action: "query",
    prop: "extracts|pageprops",
    exintro: "1",
    explaintext: "1",
    exchars: "1800",
    titles: resultado.title,
  });
  const paginas = Object.values(datos.query?.pages || {});
  const pagina = paginas.find((item) => !item.missing);
  if (!pagina) return null;
  return {
    extracto: pagina.extract || "",
    wikidataId: pagina.pageprops?.wikibase_item,
    titulo: pagina.title,
    idioma,
  };
}

async function obtenerArticulo(titulo, year) {
  for (const idioma of ["es", "en"]) {
    try {
      const pagina = await buscarArticulo(titulo, year, idioma);
      if (pagina?.extracto || pagina?.wikidataId) return pagina;
    } catch (error) {
      console.info(`No se pudo consultar Wikipedia (${idioma}):`, error);
    }
  }
  return null;
}

async function obtenerDatosWikidata(id) {
  if (!id) return null;
  const url = new URL("https://www.wikidata.org/w/api.php");
  const parametrosApi = {
    action: "wbgetentities",
    ids: id,
    props: "labels|claims",
    languages: "es|en",
    format: "json",
    origin: "*",
  };
  for (const [clave, valor] of Object.entries(parametrosApi)) url.searchParams.set(clave, valor);
  const respuesta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!respuesta.ok) throw new Error(`Wikidata respondió ${respuesta.status}`);
  const datos = await respuesta.json();
  return datos.entities?.[id] || null;
}

async function nombresWikidata(ids) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return [];

  const url = new URL("https://www.wikidata.org/w/api.php");
  const parametrosApi = {
    action: "wbgetentities",
    ids: unicos.join("|"),
    props: "labels",
    languages: "es|en",
    format: "json",
    origin: "*",
  };
  for (const [clave, valor] of Object.entries(parametrosApi)) url.searchParams.set(clave, valor);
  const respuesta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!respuesta.ok) throw new Error(`Wikidata respondió ${respuesta.status}`);
  const datos = await respuesta.json();
  return unicos.map((qid) => {
    const etiquetas = datos.entities?.[qid]?.labels || {};
    return etiquetas.es?.value || etiquetas.en?.value || qid;
  });
}

async function cargarFicha(titulo, year, genero) {
  const tituloPagina = document.querySelector("#titulo-pagina");
  const introduccion = document.querySelector("#introduccion-pagina");
  const poster = document.querySelector("#poster-pelicula");
  const tituloReparto = document.querySelector("#titulo-reparto");
  const sinopsis = document.querySelector("#sinopsis-pelicula");
  const director = document.querySelector("#director-pelicula");
  const reparto = document.querySelector("#reparto-pelicula");
  const disponibilidad = document.querySelector("#disponibilidad-pelicula");
  const botonReproductor = document.querySelector("#mostrar-reproductor");
  const fuenteInformacion = document.querySelector("#fuente-informacion");

  tituloPagina.textContent = titulo;
  document.title = `${titulo} | Limoncio-Pelicular`;
  introduccion.textContent = [genero, year].filter(Boolean).join(" · ");
  ficha.hidden = false;

  const rutaPoster = parametros.get("poster");
  if (rutaPoster) {
    try {
      const urlPoster = new URL(rutaPoster, window.location.href);
      if (urlPoster.origin === window.location.origin && urlPoster.pathname.includes("/Cartelera/")) {
        poster.src = urlPoster.href;
        poster.alt = `Cartel de ${titulo}`;
      }
    } catch {
      poster.hidden = true;
    }
  } else {
    poster.hidden = true;
  }

  const peliculaLocal = buscarPeliculaEnPendrive(titulo);
  prepararTrailer(titulo, year, peliculaLocal);

  if (peliculaLocal) {
    disponibilidad.textContent = `La película está disponible en el pendrive como ${peliculaLocal.archivo}.`;
    botonReproductor.disabled = false;
    botonReproductor.textContent = "Abrir reproductor de la película";
    botonReproductor.onclick = () => {
      reproductorLocal.hidden = false;
      cargarContenido(peliculaLocal.id);
      reproductorLocal.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  } else {
    disponibilidad.textContent = "Esta película no está entre los archivos del pendrive conectado. El botón de reproducción se activará cuando añadas su archivo al servidor.";
    botonReproductor.disabled = true;
    botonReproductor.textContent = "Película no disponible en el pendrive";
    botonReproductor.onclick = null;
  }

  sinopsis.textContent = "Buscando la ficha de la película…";
  director.textContent = "Buscando información…";
  reparto.textContent = "Buscando información…";
  tituloReparto.textContent = normalizar(genero).includes("anim") ? "Actores y actrices de voz" : "Reparto principal";

  try {
    const articulo = await obtenerArticulo(titulo, year);
    if (!articulo) throw new Error("No se encontró una ficha pública para esta película.");
    sinopsis.textContent = articulo.extracto || "La ficha pública no incluye una sinopsis breve.";
    fuenteInformacion.replaceChildren(
      document.createTextNode("Información: "),
      crearEnlace(`Wikipedia (${articulo.idioma.toUpperCase()})`, `https://${articulo.idioma}.wikipedia.org/wiki/${encodeURIComponent(articulo.titulo.replaceAll(" ", "_"))}`),
    );

    let entidad = null;
    try {
      entidad = await obtenerDatosWikidata(articulo.wikidataId);
    } catch (error) {
      console.info("No se pudo consultar Wikidata:", error);
    }
    const claims = entidad?.claims || {};
    const idsDirector = extraerIds(claims, "P57", 2);
    const esAnimacion = normalizar(genero).includes("anim")
      || extraerIds(claims, "P136", 30).includes("Q11631")
      || extraerIds(claims, "P31", 30).includes("Q202866");
    const idsReparto = esAnimacion
      ? [...extraerIds(claims, "P725", 6), ...extraerIds(claims, "P161", 6)]
      : extraerIds(claims, "P161", 6);

    tituloReparto.textContent = esAnimacion ? "Actores y actrices de voz" : "Reparto principal";
    try {
      const [nombresDirectores, nombresReparto] = await Promise.all([
        nombresWikidata(idsDirector),
        nombresWikidata(idsReparto),
      ]);
      director.textContent = nombresDirectores.join(", ") || "No aparece información de dirección en la ficha consultada.";
      reparto.textContent = [...new Set(nombresReparto)].slice(0, 8).join(", ")
        || "No aparece información del reparto en la ficha consultada.";
    } catch (error) {
      director.textContent = "No se pudo cargar la dirección.";
      reparto.textContent = "No se pudo cargar el reparto.";
      console.info("No se pudieron cargar los nombres del reparto:", error);
    }
  } catch (error) {
    sinopsis.textContent = "No se pudo cargar automáticamente la sinopsis. Comprueba la conexión a Internet o consulta el enlace del título en Wikipedia.";
    director.textContent = "Información no disponible.";
    reparto.textContent = "Información no disponible.";
    const tituloWikipedia = new URL("https://es.wikipedia.org/w/index.php");
    tituloWikipedia.searchParams.set("search", `${titulo} ${year || ""} película`);
    fuenteInformacion.replaceChildren(crearEnlace("Buscar esta película en Wikipedia ↗", tituloWikipedia.href));
    console.info("No se pudo cargar la ficha pública:", error);
  }
}

video.addEventListener("error", () => {
  estadoReproductor.textContent = "No se pudo reproducir. Comprueba que el servidor y el túnel siguen activos y que el vídeo MP4 H.264/AAC se haya copiado completo al pendrive.";
});

if (tituloCatalogo) {
  cargarFicha(tituloCatalogo, yearCatalogo, generoCatalogo);
  const peliculaSolicitada = buscarPeliculaEnPendrive(tituloCatalogo);
  if (peliculaSolicitada && parametros.get("id") === peliculaSolicitada.id) {
    reproductorLocal.hidden = false;
    cargarContenido(peliculaSolicitada.id);
    reproductorLocal.scrollIntoView({ behavior: "smooth", block: "start" });
  }
} else {
  reproductorLocal.hidden = false;
  const idInicial = parametros.get("id") || "madmax-trailer";
  cargarContenido(idInicial);
}
