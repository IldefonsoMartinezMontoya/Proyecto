// Comprueba la sesión antes de dejar que el usuario empiece a crear una sala.
const startLink = document.querySelector("#empiezaYa");

startLink?.addEventListener("click", async (event) => {
  event.preventDefault();

  if (startLink.dataset.checking === "true") return;
  startLink.dataset.checking = "true";
  startLink.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("No se pudo consultar la sesión.");

    const { user } = await response.json();
    window.location.assign(user ? "Salas.html" : "IniciarSesion.html?returnTo=Salas.html");
  } catch {
    startLink.removeAttribute("aria-busy");
    delete startLink.dataset.checking;
    window.alert("No se pudo comprobar la sesión. Comprueba que Wrangler esté ejecutándose e inténtalo de nuevo.");
  }
});
