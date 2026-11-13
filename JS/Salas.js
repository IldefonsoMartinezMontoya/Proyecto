// Mantiene separados los caracteres obligatorios y los adicionales del código.
const grupos = [
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!#$%&*_-"
];

// Conjunto completo que se usa para rellenar el resto del código.
const todosLosCaracteres = grupos.join("");

// Escoge un carácter usando el generador criptográfico del navegador.
function elegirCaracter(texto) {
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    return texto[numero[0] % texto.length];
}

// Crea ocho caracteres e incluye al menos uno de cada grupo definido arriba.
function generarCodigo() {
    const caracteres = grupos.map(elegirCaracter);

    while (caracteres.length < 8) {
        caracteres.push(elegirCaracter(todosLosCaracteres));
    }

    // Mezcla el orden para que los caracteres obligatorios no queden agrupados.
    for (let i = caracteres.length - 1; i > 0; i--) {
        const numero = new Uint32Array(1);
        crypto.getRandomValues(numero);
        const j = numero[0] % (i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }

    return caracteres.join("");
}

// Referencias a las zonas de la interfaz que se alternan al crear una sala.
const menu = document.getElementById("menuPrincipal");
const sala = document.getElementById("salaCreada");
const codigo = document.getElementById("codigoSala");

const unirSala = document.getElementById("unirSala");
const codigoEscrito = document.getElementById("codigoEscrito");
const mensajeUnion = document.getElementById("mensajeUnion");

// Genera y muestra un nuevo código al pulsar «Crear sala».
document.getElementById("crearSala").addEventListener("click", () => {
    codigo.textContent = generarCodigo();
    menu.hidden = true;
    sala.hidden = false;
});

// Vuelve al menú inicial desde el panel de sala creada.
document.getElementById("volverCrear").addEventListener("click", () => {
    sala.hidden = true;
    menu.hidden = false;
});

document.getElementById("unirseSala").addEventListener("click", () => {
    menu.hidden = true;
    unirSala.hidden = false;

    codigoEscrito.focus();
});

document.getElementById("confirmar").addEventListener("click", () => {
    const codigo = codigoEscrito.value.trim();

    if (codigo === "") {
        mensajeUnion.textContent = "Escribe el código para unise a una sala";
        return;
    }

    mensajeUnion.textContent = "Código introducido: " + codigo;
});

document.getElementById("volverUnir").addEventListener("click", () => {
    unirSala.hidden = true;
    menu.hidden = false;

    codigoEscrito.value = "";
    mensajeUnion.textContent = "";
});