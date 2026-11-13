// Cambia el menú de acceso por opciones de cuenta cuando la sesión del servidor está activa.
document.addEventListener("DOMContentLoaded", async () => {
  const menu = document.querySelector(".opcionesUsuario");
  if (!menu) return;

  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return;

    const { user } = await response.json();
    if (!user) return;

    const navigation = menu.closest(".usuario");
    navigation?.setAttribute("aria-label", "Menú de usuario");

    const accountLink = document.createElement("a");
    accountLink.href = "PersonalizacionUsuario.html";
    accountLink.textContent = user.username ? `Mi cuenta (${user.username})` : "Mi cuenta";

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Cerrar sesión";
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        const logoutResponse = await fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!logoutResponse.ok) throw new Error("No se pudo cerrar la sesión.");
        window.location.assign("Home.html");
      } catch {
        window.alert("No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.");
      }
    });

    menu.replaceChildren(accountLink, logoutLink);
  } catch {
    // Si no hay conexión con la API, se mantienen los enlaces de acceso existentes.
  }
});
