// Conecta el formulario de inicio de sesión con la API del Worker.
const form = document.querySelector("#loginForm");
const message = document.querySelector("#loginMensaje");

// Intercepta el envío HTML para mostrar la respuesta sin recargar la página.
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const values = new FormData(form);
  try {
    // Envía el correo o nombre de usuario y la contraseña al servidor.
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: values.get("identifier"),
        password: values.get("password"),
      }),
    });
    const result = await response.json();

    // Si la API rechaza el acceso, muestra el motivo al usuario.
    if (!response.ok) {
      message.textContent = result.error || "No se pudo iniciar sesión.";
      return;
    }

    //Almacena la información de forma local.
    localStorage.setItem("sesionIniciada", "true");
    
    if (result.user) {
      localStorage.setItem("usuarioNombre", result.user.username || result.user.name)
    }

    // La API ya creó la cookie de sesión; vuelve a la página principal.
    window.location.assign("Home.html");
  } catch {
    // Informa de errores de red o de un servidor de desarrollo detenido.
    message.textContent = "No se pudo conectar con el servidor. Comprueba que Wrangler esté ejecutándose.";
  }
});
