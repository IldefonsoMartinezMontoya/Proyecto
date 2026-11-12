// Controla de forma independiente los carteles de cada carrusel del catálogo.
  document.querySelectorAll(".slider").forEach((slider) => {
    // El carrusel solo muestra una imagen activa a la vez.
    const imagenes = slider.querySelectorAll("img");
    let indice = 0;

    // Oculta la imagen actual y activa la siguiente, envolviendo los extremos.
    function mostrar(nuevoIndice) {
      imagenes[indice].classList.remove("activa");
      indice = (nuevoIndice + imagenes.length) % imagenes.length;
      imagenes[indice].classList.add("activa");
    }

    // Al cargar la página, el primer cartel de cada género queda visible.
    imagenes[0].classList.add("activa");

    // Las flechas permiten cambiar manualmente el cartel mostrado.
    slider.querySelector(".anterior").onclick = () => mostrar(indice - 1);
    slider.querySelector(".siguiente").onclick = () => mostrar(indice + 1);

    // Avanza automáticamente cada cuatro segundos.
    setInterval(() => mostrar(indice + 1), 4000);
  });
