// Comprueba la sesión del servidor antes de enviar al usuario a votar.
const startVotingLink = document.querySelector("#empiezaYa");

startVotingLink?.addEventListener("click", async (event) => {
  event.preventDefault();

  if (startVotingLink.dataset.checking === "true") return;
  startVotingLink.dataset.checking = "true";
  startVotingLink.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("No se pudo consultar la sesión.");

    const { user } = await response.json();
    window.location.assign(user ? "votar.html" : "IniciarSesion.html?returnTo=votar.html");
  } catch {
    startVotingLink.removeAttribute("aria-busy");
    delete startVotingLink.dataset.checking;
    window.alert("No se pudo comprobar la sesión. Comprueba que Wrangler esté ejecutándose e inténtalo de nuevo.");
  }
});
