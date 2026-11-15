// Conecta la página de salas con la API del Worker.
const CODIGO_SALA_VALIDO = /^[A-HJ-NP-Z2-9]{8}$/;
const CLAVE_SALA_ACTIVA = "limoncioSalaActiva";
const INTERVALO_ACTUALIZACION = 3000;

const menu = document.getElementById("menuPrincipal");
const formularioUnirse = document.getElementById("unirSala");
const panelSala = document.getElementById("salaCreada");
const campoNombreCrear = document.getElementById("nombreCrear");
const campoNombreUnirse = document.getElementById("nombreUnirse");
const campoCodigo = document.getElementById("codigoEscrito");
const codigoSala = document.getElementById("codigoSala");
const listaParticipantes = document.getElementById("participantesSala");
const mensajeInicio = document.getElementById("mensajeInicio");
const mensajeUnion = document.getElementById("mensajeUnion");
const estadoSala = document.getElementById("estadoSala");
const botonCrear = document.getElementById("crearSala");
const botonUnirse = document.getElementById("unirseSala");
const botonConfirmar = document.getElementById("confirmar");
const botonSalir = document.getElementById("salirSala");

let salaActiva = null;
let temporizadorSala = null;

// Envía una petición a la API y convierte sus errores en mensajes legibles.
async function solicitarApi(url, opciones = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    ...opciones,
  });
  const resultado = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(resultado.error || "No se pudo completar la operación.");
    error.status = response.status;
    throw error;
  }

  return resultado;
}

function mostrarVista(vista) {
  menu.hidden = vista !== "menu";
  formularioUnirse.hidden = vista !== "unirse";
  panelSala.hidden = vista !== "sala";
}

function mostrarParticipantes(participantes) {
  listaParticipantes.replaceChildren();

  for (const participante of participantes) {
    const elemento = document.createElement("li");
    elemento.textContent = participante.es_anfitrion
      ? `${participante.nombre} (anfitrión)`
      : participante.nombre;
    listaParticipantes.append(elemento);
  }
}

function actualizarSala(datos) {
  codigoSala.textContent = datos.sala.codigo;
  mostrarParticipantes(datos.participantes);
}

function guardarSalaActiva() {
  sessionStorage.setItem(CLAVE_SALA_ACTIVA, JSON.stringify(salaActiva));
}

function abrirSala(datos, nombre, participanteId) {
  salaActiva = {
    codigo: datos.sala.codigo,
    nombre,
    participanteId,
  };
  guardarSalaActiva();
  actualizarSala(datos);
  mensajeInicio.textContent = "";
  mensajeUnion.textContent = "";
  estadoSala.textContent = "La lista se actualiza automáticamente.";
  mostrarVista("sala");
  iniciarActualizaciones();
}

async function crearSala() {
  const nombre = campoNombreCrear.value.trim();
  if (nombre.length < 2 || nombre.length > 20) {
    mensajeInicio.textContent = "Escribe un nombre de entre 2 y 20 caracteres.";
    campoNombreCrear.focus();
    return;
  }

  botonCrear.disabled = true;
  mensajeInicio.textContent = "Creando sala…";

  try {
    const datos = await solicitarApi("/api/salas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    abrirSala(datos, nombre, datos.participanteId);
  } catch (error) {
    mensajeInicio.textContent = error.message;
  } finally {
    botonCrear.disabled = false;
  }
}

async function unirseASala() {
  const nombre = campoNombreUnirse.value.trim();
  const codigo = campoCodigo.value.trim().toUpperCase();

  if (nombre.length < 2 || nombre.length > 20) {
    mensajeUnion.textContent = "Escribe un nombre de entre 2 y 20 caracteres.";
    campoNombreUnirse.focus();
    return;
  }
  if (!CODIGO_SALA_VALIDO.test(codigo)) {
    mensajeUnion.textContent = "El código debe tener ocho letras o números válidos.";
    campoCodigo.focus();
    return;
  }

  botonConfirmar.disabled = true;
  mensajeUnion.textContent = "Buscando la sala…";

  try {
    const datos = await solicitarApi(`/api/salas/${codigo}/unirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    abrirSala(datos, nombre, datos.participanteId);
  } catch (error) {
    mensajeUnion.textContent = error.message;
  } finally {
    botonConfirmar.disabled = false;
  }
}

async function actualizarSalaDesdeServidor() {
  if (!salaActiva) return;

  try {
    const datos = await solicitarApi(`/api/salas/${salaActiva.codigo}`);
    actualizarSala(datos);
    estadoSala.textContent = "La lista se actualiza automáticamente.";
  } catch (error) {
    if (error.status === 404) {
      detenerActualizaciones();
      sessionStorage.removeItem(CLAVE_SALA_ACTIVA);
      salaActiva = null;
      mostrarVista("menu");
      mensajeInicio.textContent = "La sala ha caducado o ya no existe.";
      return;
    }

    estadoSala.textContent = "Sin conexión con el servidor. Volveremos a intentarlo.";
  }
}

function iniciarActualizaciones() {
  detenerActualizaciones();
  temporizadorSala = window.setInterval(actualizarSalaDesdeServidor, INTERVALO_ACTUALIZACION);
}

function detenerActualizaciones() {
  if (temporizadorSala !== null) {
    window.clearInterval(temporizadorSala);
    temporizadorSala = null;
  }
}

async function salirDeSala() {
  if (!salaActiva) return;

  botonSalir.disabled = true;
  try {
    await solicitarApi(`/api/salas/${salaActiva.codigo}/salir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participanteId: salaActiva.participanteId }),
    });
    detenerActualizaciones();
    sessionStorage.removeItem(CLAVE_SALA_ACTIVA);
    salaActiva = null;
    mostrarVista("menu");
    mensajeInicio.textContent = "Has salido de la sala.";
  } catch (error) {
    estadoSala.textContent = error.message;
  } finally {
    botonSalir.disabled = false;
  }
}

async function restaurarSalaActiva() {
  const guardada = sessionStorage.getItem(CLAVE_SALA_ACTIVA);
  if (!guardada) return;

  try {
    const salaGuardada = JSON.parse(guardada);
    if (!CODIGO_SALA_VALIDO.test(salaGuardada.codigo) || !salaGuardada.participanteId) {
      throw new Error("Datos de sala no válidos.");
    }

    const datos = await solicitarApi(`/api/salas/${salaGuardada.codigo}`);
    salaActiva = salaGuardada;
    actualizarSala(datos);
    estadoSala.textContent = "La lista se actualiza automáticamente.";
    mostrarVista("sala");
    iniciarActualizaciones();
  } catch {
    sessionStorage.removeItem(CLAVE_SALA_ACTIVA);
  }
}

botonCrear.addEventListener("click", crearSala);
botonUnirse.addEventListener("click", () => {
  campoNombreUnirse.value = campoNombreCrear.value.trim();
  mensajeInicio.textContent = "";
  mensajeUnion.textContent = "";
  mostrarVista("unirse");
  campoCodigo.focus();
});
botonConfirmar.addEventListener("click", unirseASala);
botonSalir.addEventListener("click", salirDeSala);

document.getElementById("volverUnir").addEventListener("click", () => {
  mensajeUnion.textContent = "";
  mostrarVista("menu");
});

campoCodigo.addEventListener("input", () => {
  campoCodigo.value = campoCodigo.value.toUpperCase();
});

restaurarSalaActiva();
