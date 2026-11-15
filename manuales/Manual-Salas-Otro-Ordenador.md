# Manual: usar y habilitar las salas desde otro ordenador

Esta guía explica dos cosas distintas: **usar la web publicada desde otro dispositivo** y **preparar otro ordenador para desarrollar o publicar el proyecto**. Para unirse a una sala desde el móvil o el ordenador de un amigo solo hace falta la primera parte; no hay que instalar nada.

## Opción A: entrar en la web publicada

La web ya está desplegada en Cloudflare y utiliza la base de datos D1 remota `proyecto`. Abre uno de estos enlaces:

- [Página principal](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/Home)
- [Salas](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/Salas)
- [Registrarse](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/Registrarse)
- [Iniciar sesión](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/HTML/IniciarSesion)

Para jugar con otra persona:

1. Ambos abrís la misma web publicada. Cada persona se registra si aún no tiene cuenta e inicia sesión en su propio dispositivo.
2. Una persona abre **Salas**, escribe su nombre y pulsa **Crear sala**.
3. Comparte el código que aparece.
4. La otra persona abre **Salas**, pulsa **Unirse a sala**, escribe su nombre y el código, y pulsa **Entrar**.
5. La lista de participantes se actualiza automáticamente cada pocos segundos. La sala caduca a las 24 horas.

No hace falta que los dispositivos estén en la misma Wi-Fi. Las cuentas y las salas creadas en la web publicada se guardan en Cloudflare. La sesión de inicio de sesión es propia de cada navegador. Las cuentas creadas únicamente en las pruebas locales no existen en la base remota; en ese caso, hay que registrarse de nuevo en la web publicada.

## Opción B: preparar otro ordenador para desarrollar el proyecto

### 1. Guarda la versión actual en GitHub

Haz este paso en el ordenador donde tienes los cambios. Guarda y sube a GitHub el código de las salas y este manual antes de descargar el proyecto en el otro equipo. GitHub solo entrega los cambios que se hayan subido.

En la terminal, desde la carpeta raíz del proyecto, revisa los cambios:

```bash
git status
```

Cuando quieras guardarlos y publicarlos en GitHub:

```bash
git add CSS/Salas.css HTML/Salas.html JS/IniciarSesion.js JS/Salas.js src/index.js migrations/0003_salas.sql manuales/Manual-Salas-Otro-Ordenador.md
git commit -m "Añade salas compartidas y su manual"
git push origin main
```

Si trabajas en otra rama, sustituye `main` por el nombre de esa rama. No copies `node_modules/` ni `.wrangler/`; son carpetas locales y se regeneran.

### 2. Instala los requisitos

Necesitas Git, Node.js **22.12.0** y acceso a Internet. `npm ci` instalará Wrangler y el resto de dependencias usando el archivo de bloqueo del proyecto.

#### Linux (Ubuntu/Debian, terminal Bash)

Comprueba primero si ya tienes las herramientas:

```bash
git --version
node --version
npm --version
```

Si falta Git:

```bash
sudo apt update
sudo apt install -y git curl
```

Si falta NVM o Node 22.12.0, instala y activa esa versión:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install 22.12.0
nvm use 22.12.0
```

Si NVM ya está instalado, basta con:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22.12.0
```

`node --version` debe mostrar `v22.12.0`.

#### Windows (PowerShell)

Instala Git si falta:

```powershell
winget install --id Git.Git -e
```

Instala Node.js 22.12.0 x64 desde el instalador oficial:

```powershell
$msi = Join-Path $env:TEMP "node-v22.12.0-x64.msi"
Invoke-WebRequest "https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi" -OutFile $msi
Start-Process msiexec.exe -Wait -ArgumentList @("/i", $msi, "/passive", "/norestart")
```

Si el ordenador usa ARM64, descarga el instalador ARM64 en el [archivo oficial de Node.js 22.12.0](https://nodejs.org/en/download/archive/v22.12.0). Después de instalar, cierra y vuelve a abrir PowerShell. `node --version` debe mostrar `v22.12.0`.

### 3. Descarga el proyecto desde GitHub

Clona el repositorio una sola vez en tu carpeta personal. Los comandos sirven en Linux/Bash:

```bash
cd "$HOME"
git clone https://github.com/IldefonsoMartinezMontoya/Proyecto.git
cd Proyecto
npm ci
npx wrangler --version
```

En Windows/PowerShell:

```powershell
Set-Location $HOME
git clone https://github.com/IldefonsoMartinezMontoya/Proyecto.git
Set-Location .\Proyecto
npm ci
npx wrangler --version
```

Si el repositorio ya estaba clonado, no lo clones otra vez: entra en su carpeta, ejecuta `git pull origin main` y luego `npm ci`.

### 4. Autoriza Wrangler con la cuenta correcta de Cloudflare

El archivo `wrangler.toml` ya apunta al Worker `limoncio-api` y a la base D1 remota `proyecto`. Inicia sesión con la misma cuenta de Cloudflare donde están esos recursos:

```bash
npx wrangler login
npx wrangler whoami
```

En PowerShell se usan los mismos comandos. Autoriza Wrangler en la ventana del navegador y comprueba que `whoami` indica la cuenta correcta. **No crees otra base D1 ni cambies el `database_id` de `wrangler.toml`.** Si otra persona va a desarrollar o desplegar desde su ordenador, su cuenta debe tener acceso a los recursos de Cloudflare.

### 5. Comprueba las migraciones de salas

Consulta el estado de la base remota:

```bash
npx wrangler d1 migrations list proyecto --remote
```

Si aparecen migraciones pendientes, aplícalas:

```bash
npx wrangler d1 migrations apply proyecto --remote
```

Si aparece `No migrations to apply!`, la base remota ya está al día. La migración `migrations/0003_salas.sql` crea las tablas de salas y participantes; Wrangler registra las migraciones para evitar volver a aplicar las que ya están instaladas.

### 6. Ejecuta el proyecto en local (opcional)

En la carpeta raíz del proyecto:

```bash
npx wrangler d1 migrations apply proyecto --local
npx wrangler dev
```

Abre `http://localhost:8787/HTML/Home.html`. Mantén la terminal abierta; para parar el servidor pulsa `Ctrl+C`. El modo normal de `wrangler dev` usa una D1 local en `.wrangler/`. Sus cuentas y salas son independientes de Cloudflare y no se comparten con la web publicada.

#### Probar desde otro dispositivo en la misma Wi-Fi

En el ordenador que ejecuta Wrangler, detén el servidor con `Ctrl+C` y arráncalo escuchando en la red local:

```bash
npx wrangler dev --ip 0.0.0.0
```

En Linux, consulta la IP local con:

```bash
hostname -I
```

En Windows, consulta `Dirección IPv4` con:

```powershell
ipconfig
```

Desde el otro dispositivo, abre `http://IP-DEL-ORDENADOR:8787/HTML/Salas.html`, sustituyendo `IP-DEL-ORDENADOR` por la IP encontrada. Ambos dispositivos deben estar en la misma Wi-Fi; si el sistema pregunta, permite conexiones de Node/Wrangler en la red privada. Esta prueba sigue usando la base D1 local del ordenador que ejecuta Wrangler.

### 7. Publica cambios nuevos (solo cuando los haya)

Para usar la versión que ya está publicada no hace falta desplegar de nuevo. Si has modificado el proyecto y quieres subir esa versión a Cloudflare, primero confirma que la base remota está al día y luego despliega:

```bash
npx wrangler d1 migrations list proyecto --remote
npx wrangler d1 migrations apply proyecto --remote
npx wrangler deploy
```

El último comando mostrará la URL pública. La URL actual es [limoncio-api en Cloudflare](https://limoncio-api.limoncio-pelicular-proyecto-2026.workers.dev/). Al publicar, la web servirá las páginas estáticas y las rutas `/api/` del Worker utilizarán la base D1 indicada en `wrangler.toml`.

## Problemas habituales

- **`npx` o Wrangler no funciona:** comprueba `node --version`; debe ser `v22.12.0`. En Linux, activa NVM con `source "$HOME/.nvm/nvm.sh"` y `nvm use 22.12.0`.
- **`wrangler whoami` muestra otra cuenta o no hay sesión:** ejecuta `npx wrangler login` y autoriza la cuenta que tiene el Worker y D1.
- **Falta una tabla al probar en local:** ejecuta `npx wrangler d1 migrations apply proyecto --local`.
- **Falta una tabla en producción:** comprueba `npx wrangler d1 migrations list proyecto --remote` y aplica las pendientes con `--remote`.
- **El otro dispositivo no abre el servidor local:** confirma que ambos están en la misma Wi-Fi, que Wrangler se inició con `--ip 0.0.0.0`, que usas la IP correcta y que el firewall permite el puerto `8787`.
- **El código de sala no funciona:** confirma que ambos dispositivos abrieron el mismo entorno (la URL pública o el mismo servidor local), revisa el código y comprueba que la sala no haya caducado.
