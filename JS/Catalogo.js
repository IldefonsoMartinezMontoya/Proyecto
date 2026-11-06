
  document.querySelectorAll(".slider").forEach((slider) => {
    const imagenes = slider.querySelectorAll("img");
    let indice = 0;

    function mostrar(nuevoIndice) {
      imagenes[indice].classList.remove("activa");
      indice = (nuevoIndice + imagenes.length) % imagenes.length;
      imagenes[indice].classList.add("activa");
    }

    imagenes[0].classList.add("activa");

    slider.querySelector(".anterior").onclick = () => mostrar(indice - 1);
    slider.querySelector(".siguiente").onclick = () => mostrar(indice + 1);

    setInterval(() => mostrar(indice + 1), 4000);
  });