document.addEventListener("DOMContentLoaded", () => {
  const btnCuenta = document.querySelector("#btnCuenta"); // Vuestro botón principal
  const menuDesplegable = document.querySelector("#menuDesplegable"); // La lista con Login/Registro

  const estaLogueado = localStorage.getItem("sesionIniciada") === "true";

  if (estaLogueado) {
    // 1. Cambiamos la apariencia del botón (opcional: poner su nombre o icono de perfil)
    const nombre = localStorage.getItem("usuarioNombre");
    btnCuenta.textContent = nombre ? `Perfil (${nombre})` : "Mi Perfil";

    // 2. Nos aseguramos de que el desplegable antiguo nunca se abra
    if (menuDesplegable) menuDesplegable.style.display = "none";

    // 3. Asignamos la nueva lógica: ir directo a la página de perfil
    btnCuenta.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.assign("Perfil.html"); // Ruta a vuestra página de personalizar perfil
    });

  } else {
    // Lógica normal para usuarios sin sesión: abrir/cerrar el desplegable
    btnCuenta.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDesplegable.classList.toggle("activo"); // O el método que uséis para mostrarlo
    });
  }
});