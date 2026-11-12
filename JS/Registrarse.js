// Conecta el formulario de alta con el endpoint /api/register.
const form = document.querySelector("#registroForm");
const message = document.querySelector("#registroMensaje");

// Evita el envío tradicional y gestiona el resultado dentro de la página.
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  // Recoge los campos escritos en el formulario.
  const values = new FormData(form);
  const password = String(values.get("password"));
  const confirmation = String(values.get("password_confirm"));

  // Comprueba la confirmación antes de enviar la contraseña al Worker.
  if (password !== confirmation) {
    message.textContent = "Las contraseñas no coinciden.";
    document.querySelector("#password_confirm").focus();
    return;
  }

  try {
    // Envía los datos de perfil y la contraseña por HTTPS al backend.
    // El hash de la contraseña se calcula en el Worker, nunca en el navegador.
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountName: values.get("accountName"),
        username: values.get("username"),
        email: values.get("email"),
        password,
      }),
    });
    const result = await response.json();

    // Muestra errores de validación o duplicados que devuelve la API.
    if (!response.ok) {
      message.textContent = result.error || "No se pudo crear la cuenta.";
      return;
    }

    // Limpia el formulario y confirma que la cuenta ya está creada.
    form.reset();
    message.textContent = "¡Cuenta creada! Ya puedes iniciar sesión.";
  } catch {
    // Informa de errores de red o de un servidor de desarrollo detenido.
    message.textContent = "No se pudo conectar con el servidor. Comprueba que Wrangler esté ejecutándose.";
  }
});
