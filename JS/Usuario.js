document.addEventListener("DOMContentLoaded", () => {
  // --- 1. CAMBIO ENTRE SUBPÁGINAS LATERALES ---
  const botonesTab = document.querySelectorAll(".tab-btn[data-tab]");
  const subpaginas = document.querySelectorAll(".subpagina");

  botonesTab.forEach((boton) => {
    boton.addEventListener("click", () => {
      // Quita el estado activo de todos los botones y oculta las secciones
      botonesTab.forEach((b) => b.classList.remove("activo"));
      subpaginas.forEach((sec) => sec.classList.add("oculto"));

      // Activa el botón pulsado y muestra su subpágina correspondiente
      boton.classList.add("activo");
      const idDestino = boton.getAttribute("data-tab");
      document.getElementById(idDestino)?.classList.remove("oculto");
    });
  });

  // --- 2. PESTAÑA ESTÁTICA PARA ELEGIR IMAGEN DE PERFIL ---
  const btnAbrirAvatares = document.getElementById("btnAbrirAvatares");
  const selectorAvatares = document.getElementById("selectorAvatares");
  const avatarActual = document.getElementById("avatarActual");
  const opcionesAvatar = document.querySelectorAll(".avatar-opcion");

  // Abre o cierra el panel estático al hacer clic en la foto de perfil
  btnAbrirAvatares?.addEventListener("click", () => {
    selectorAvatares.classList.toggle("oculto");
  });

  // Cambia la imagen seleccionada al pulsar un avatar de la galería
  opcionesAvatar.forEach((opcion) => {
    opcion.addEventListener("click", () => {
      opcionesAvatar.forEach((op) => op.classList.remove("seleccionada"));
      opcion.classList.add("seleccionada");

      const nuevaRuta = opcion.getAttribute("data-src");
      avatarActual.src = nuevaRuta;
      selectorAvatares.classList.add("oculto"); // Cierra el selector tras elegir
    });
  });

  // --- 3. CONTADOR DE CARACTERES (MÁXIMO 500) ---
  const inputDescripcion = document.getElementById("inputDescripcion");
  const contadorCaracteres = document.getElementById("contadorCaracteres");

  inputDescripcion?.addEventListener("input", () => {
    const longitudActual = inputDescripcion.value.length;
    contadorCaracteres.textContent = `${longitudActual} / 500`;
  });

  // --- 4. CARGAR DATOS DE LA CUENTA Y GUARDAR PERSONALIZACIÓN ---
  const inputNombreVista = document.getElementById("inputNombreVista");
  const infoNombreCuenta = document.getElementById("infoNombreCuenta");
  const infoCorreo = document.getElementById("infoCorreo");
  const formPersonalizacion = document.getElementById("formPersonalizacion");
  const mensajeGuardado = document.getElementById("mensajeGuardado");

  // Carga inicial desde localStorage o desde vuestro Worker (/api/perfil)
  async function cargarDatosUsuario() {
    // Valores rápidos de respaldo desde localStorage
    inputNombreVista.value = localStorage.getItem("usuarioNombreVista") || localStorage.getItem("usuarioNombre") || "";
    inputDescripcion.value = localStorage.getItem("usuarioDescripcion") || "";
    contadorCaracteres.textContent = `${inputDescripcion.value.length} / 500`;

    const avatarGuardado = localStorage.getItem("usuarioAvatar");
    if (avatarGuardado) avatarActual.src = avatarGuardado;

    infoNombreCuenta.textContent = localStorage.getItem("usuarioNombre") || "No disponible";
    infoCorreo.textContent = localStorage.getItem("usuarioCorreo") || "No disponible";

    // Petición opcional al Worker para sincronizar datos reales de la base de datos
    try {
      const resp = await fetch("/api/perfil");
      if (resp.ok) {
        const datos = await resp.json();
        if (datos.displayName) inputNombreVista.value = datos.displayName;
        if (datos.bio) {
          inputDescripcion.value = datos.bio;
          contadorCaracteres.textContent = `${datos.bio.length} / 500`;
        }
        if (datos.avatar) avatarActual.src = datos.avatar;
        if (datos.username) infoNombreCuenta.textContent = datos.username;
        if (datos.email) infoCorreo.textContent = datos.email;
      }
    } catch {
      // Si aún no tenéis creado /api/perfil en el Worker, funcionará con localStorage
    }
  }

  cargarDatosUsuario();

  // Guardar cambios de personalización
  formPersonalizacion?.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensajeGuardado.textContent = "Guardando...";

    const payload = {
      displayName: inputNombreVista.value.trim(),
      bio: inputDescripcion.value.trim(),
      avatar: avatarActual.getAttribute("src"),
    };

    // Guarda en localStorage para reflejarlo al instante en la web
    localStorage.setItem("usuarioNombreVista", payload.displayName);
    localStorage.setItem("usuarioDescripcion", payload.bio);
    localStorage.setItem("usuarioAvatar", payload.avatar);

    try {
      // Envía los cambios a vuestro Worker para guardarlos en la base de datos
      const resp = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        mensajeGuardado.textContent = "Cambios guardados correctamente.";
      } else {
        mensajeGuardado.textContent = "Guardado localmente (pendiente conectar API).";
      }
    } catch {
      mensajeGuardado.textContent = "Cambios guardados localmente.";
    }

    setTimeout(() => {
      mensajeGuardado.textContent = "";
    }, 3500);
  });

  // --- 5. BOTÓN DE CERRAR SESIÓN CON CONFIRMACIÓN ---
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

  btnCerrarSesion?.addEventListener("click", async () => {
    const confirmar = window.confirm("¿Estás seguro de que quieres cerrar sesión?");

    if (!confirmar) return; // Si pulsa "Cancelar", no hace nada

    try {
      // Avisa al Worker para que invalide/borre la cookie de sesión en el servidor
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Ignora error de red si el endpoint aún no existe y limpia el navegador igualmente
    }

    // Limpia los datos de sesión del navegador y vuelve al inicio
    localStorage.removeItem("sesionIniciada");
    localStorage.removeItem("usuarioNombre");
    localStorage.removeItem("usuarioNombreVista");
    localStorage.removeItem("usuarioCorreo");
    localStorage.removeItem("usuarioDescripcion");
    localStorage.removeItem("usuarioAvatar");

    window.location.assign("Home.html");
  });
});