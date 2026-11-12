# Manual de Limoncio-Pelicular en Linux

Guía para continuar el proyecto desde otro ordenador Linux usando Visual Studio Code, Wrangler y la misma cuenta de Cloudflare.

## Qué se conserva y qué hay que preparar

- **Cloudflare conserva** la base D1 `proyecto`, el Worker publicado y el subdominio `limoncio-pelicular-proyecto-2026.workers.dev`.
- **El proyecto contiene** el código, `wrangler.toml`, las migraciones y la configuración de Wrangler.
- **Cada ordenador necesita** Git, Node.js 22.12.0, las dependencias del proyecto y una sesión propia de Wrangler.
- La base D1 local de pruebas vive en `.wrangler/`; no se copia al otro ordenador. Las cuentas creadas en local tampoco se transfieren a la base remota.

La URL pública actual es [Limoncio-Pelicular](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/Home). Cloudflare redirige la ruta `.html` a su versión sin extensión.

## 1. Guarda la versión actualizada antes de cambiar de ordenador

En el ordenador actual, abre la terminal integrada de VS Code y ejecuta:

```bash
cd ~/Documentos/Proyecto/Proyecto
git status
git add .gitignore .assetsignore index.html wrangler.toml package.json package-lock.json src migrations manuales CSS/IniciarSesion.css HTML/index.html HTML/Home.html HTML/IniciarSesion.html HTML/Registrarse.html JS/IniciarSesion.js JS/Registrarse.js
git commit -m "Conectar registro e inicio de sesión con Cloudflare D1"
git push origin main
```

Si `git commit` dice que no hay cambios que confirmar, ya están guardados en Git. Si no tienes GitHub configurado en ese ordenador, puedes copiar la carpeta del proyecto completa a una memoria USB; no hace falta copiar `node_modules/` ni `.wrangler/`.

## 2. Instala las herramientas

Abre VS Code en el otro ordenador y selecciona **Terminal → Nueva terminal**. Los comandos de esta guía son para Bash.

Instala Git y curl si todavía no están:

```bash
sudo apt update
sudo apt install -y git curl
```

Instala NVM y Node.js 22.12.0:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install 22.12.0
nvm use 22.12.0
node --version
npm --version
```

`node --version` debe mostrar `v22.12.0`. Si acabas de instalar NVM y `nvm` no aparece, ejecuta `source "$HOME/.nvm/nvm.sh"` en esa terminal.

## 3. Descarga y abre el proyecto

Clona el repositorio actualizado:

```bash
cd ~/Documentos
git clone https://github.com/IldefonsoMartinezMontoya/Proyecto.git
cd Proyecto
code .
```

Si ya copiaste la carpeta por USB, abre esa carpeta con VS Code y continúa desde ella.

Instala las dependencias fijadas por el proyecto:

```bash
npm ci
npx wrangler --version
```

## 4. Conecta Wrangler a la misma cuenta de Cloudflare

Inicia sesión con la cuenta Cloudflare donde están la base `proyecto` y el Worker publicado:

```bash
npx wrangler login
npx wrangler whoami
```

Se abrirá el navegador para autorizar Wrangler. Comprueba que `whoami` muestra la cuenta correcta. No crees otra base D1 ni registres otro subdominio: el archivo `wrangler.toml` ya apunta a la base existente (`proyecto`, ID `c406822b-fbc9-44f5-bf3b-741b17cc3efc`).

## 5. Comprueba y aplica las migraciones

Lista las migraciones remotas pendientes:

```bash
npx wrangler d1 migrations list proyecto --remote
```

Si Wrangler muestra migraciones pendientes, aplícalas a Cloudflare:

```bash
npx wrangler d1 migrations apply proyecto --remote
```

Para preparar la base local de pruebas del ordenador nuevo, ejecuta:

```bash
npx wrangler d1 migrations apply proyecto --local
```

La base local y la remota son distintas. `--local` no modifica los datos de Cloudflare; `--remote` sí trabaja con la base de Cloudflare.

## 6. Prueba el proyecto localmente

Inicia el servidor de desarrollo:

```bash
npx wrangler dev
```

Abre esta dirección en el navegador:

```text
http://localhost:8787/HTML/Home.html
```

Prueba el registro y el inicio de sesión desde esa web. Mantén abierta la terminal mientras pruebas; para detener el servidor, pulsa `Ctrl+C`.

Las cuentas creadas en esta prueba se guardan en la D1 local de ese ordenador. No aparecerán en Cloudflare ni en otro ordenador.

## 7. Publica cambios en Cloudflare

Cuando quieras subir la versión nueva:

```bash
npx wrangler deploy
```

Wrangler mostrará la URL del Worker. La URL pública actual es [limoncio-api en Cloudflare](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/Home). Las cuentas creadas desde esa versión se guardan en la D1 remota `proyecto`.

## Archivos que deben estar en Git o en la copia

Comprueba que el proyecto incluye:

- `wrangler.toml`, `.assetsignore` y `.gitignore`
- `index.html` (raíz) redirige a `HTML/index.html`; este abre `HTML/Home.html`
- `package.json` y `package-lock.json`
- `src/index.js`
- `migrations/0001_initial.sql` y `migrations/0002_auth.sql`
- `manuales/Manual-Limoncio-Linux.md` y `manuales/Manual-Limoncio-Windows.md`
- Cambios de autenticación: `CSS/IniciarSesion.css`, `HTML/Home.html`, `HTML/IniciarSesion.html`, `HTML/Registrarse.html`, `JS/IniciarSesion.js` y `JS/Registrarse.js`
- `HTML/`, `CSS/`, `JS/`, `Imagenes/` y `Cartelera/`

No copies ni publiques `.wrangler/` o `node_modules/`. `.wrangler/` contiene estado local de desarrollo; ambos directorios se regeneran cuando hacen falta.

## Si algo falla

- **Wrangler pide iniciar sesión:** ejecuta `npx wrangler login` y autoriza la cuenta correcta.
- **Wrangler no encuentra Node o dice que la versión es antigua:** ejecuta `source "$HOME/.nvm/nvm.sh"` y `nvm use 22.12.0`.
- **Falta una tabla al probar localmente:** ejecuta `npx wrangler d1 migrations apply proyecto --local`.
- **Falta una tabla en Cloudflare:** consulta primero `npx wrangler d1 migrations list proyecto --remote`; no crees una base nueva.
- **El navegador no conecta con la API:** abre la web desde la URL de Wrangler (`localhost:8787`) y no directamente desde un archivo HTML ni desde Live Server.

## Referencias oficiales

- [Node.js 22.12.0](https://nodejs.org/en/download/archive/v22.12.0)
- [Instalar y autenticar Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) · [Inicio de sesión](https://developers.cloudflare.com/workers/wrangler/commands/general/)
- [Migraciones D1](https://developers.cloudflare.com/d1/wrangler-commands/) · [Desarrollo local D1](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [Assets estáticos en Workers](https://developers.cloudflare.com/workers/static-assets/binding/)
