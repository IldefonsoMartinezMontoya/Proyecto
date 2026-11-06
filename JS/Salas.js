const grupos = [
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!#$%&*_-"
];

const todosLosCaracteres = grupos.join("");

function elegirCaracter(texto) {
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    return texto[numero[0] % texto.length];
}

function generarCodigo() {
    const caracteres = grupos.map(elegirCaracter);

    while (caracteres.length < 8) {
        caracteres.push(elegirCaracter(todosLosCaracteres));
    }

    for (let i = caracteres.length - 1; i > 0; i--) {
        const numero = new Uint32Array(1);
        crypto.getRandomValues(numero);
        const j = numero[0] % (i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }

    return caracteres.join("");
}

const menu = document.getElementById("menuPrincipal");
const sala = document.getElementById("salaCreada");
const codigo = document.getElementById("codigoSala");

document.getElementById("crearSala").addEventListener("click", () => {
    codigo.textContent = generarCodigo();
    menu.hidden = true;
    sala.hidden = false;
});

document.getElementById("volver").addEventListener("click", () => {
    sala.hidden = true;
    menu.hidden = false;
});