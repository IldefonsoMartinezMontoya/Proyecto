// Ajustes de autenticación compartidos por registro y acceso.
const PASSWORD_ITERATIONS = 100_000;
const SESSION_DAYS = 7;

// Punto de entrada del Worker: las rutas API se procesan aquí y el resto se sirve como archivo estático.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

// Enruta las operaciones de cuenta y convierte los errores imprevistos en una respuesta JSON.
async function handleApiRequest(request, env, url) {
  try {
    if (url.pathname === "/api/register" && request.method === "POST") {
      return await register(request, env);
    }
    if (url.pathname === "/api/login" && request.method === "POST") {
      return await login(request, env, url);
    }
    if (url.pathname === "/api/me" && request.method === "GET") {
      return await currentUser(request, env);
    }
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return await logout(request, env, url);
    }
    return json({ error: "Ruta no encontrada." }, 404, request);
  } catch (error) {
    console.error("Error de API:", error);
    return json({ error: "Ha ocurrido un error en el servidor." }, 500, request);
  }
}

// Valida y crea una cuenta en D1. La contraseña se convierte en hash antes de guardarse.
async function register(request, env) {
  // Normaliza los campos de texto para comparar identificadores de forma consistente.
  const body = await readJson(request);
  const accountName = cleanText(body.accountName);
  const username = cleanText(body.username);
  const email = cleanText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  // Comprueba límites y formato antes de consultar o escribir en la base.
  if (!accountName || accountName.length > 30) {
    return json({ error: "El nombre de cuenta es obligatorio y admite hasta 30 caracteres." }, 400, request);
  }
  if (username.length < 2 || username.length > 15 || !/^[\p{L}\p{N}_.-]+$/u.test(username)) {
    return json({ error: "El nombre de usuario debe tener entre 2 y 15 letras, números, puntos, guiones o guiones bajos." }, 400, request);
  }
  if (email.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Introduce un correo electrónico válido de hasta 50 caracteres." }, 400, request);
  }
  if (password.length < 8 || password.length > 256) {
    return json({ error: "La contraseña debe tener entre 8 y 256 caracteres." }, 400, request);
  }

  // Evita duplicados de correo o nombre de usuario antes de calcular el hash.
  const existing = await env.DB.prepare(
    "SELECT id FROM usuario WHERE lower(correo) = ? OR lower(nombreUsu) = ? LIMIT 1",
  ).bind(email, username.toLowerCase()).first();
  if (existing) {
    return json({ error: "Ese correo o nombre de usuario ya está registrado." }, 409, request);
  }

  // Usa una sal aleatoria y PBKDF2 en el servidor; el navegador nunca guarda la contraseña.
  const passwordHash = await hashPassword(password);
  try {
    // La consulta parametrizada evita insertar los datos como SQL ejecutable.
    await env.DB.prepare(
      "INSERT INTO usuario (nombreCuenta, nombreUsu, correo, password_hash, fechCreate) VALUES (?, ?, ?, ?, date('now'))",
    ).bind(accountName, username, email, passwordHash).run();
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      return json({ error: "Ese correo o nombre de usuario ya está registrado." }, 409, request);
    }
    throw error;
  }

  // Responde con éxito sin devolver el hash ni otros datos sensibles.
  return json({ message: "Cuenta creada. Ya puedes iniciar sesión." }, 201, request);
}

// Busca una cuenta por correo o nombre de usuario y crea una sesión autenticada.
async function login(request, env, url) {
  const body = await readJson(request);
  const identifier = cleanText(body.identifier).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password) {
    return json({ error: "Escribe tu correo o nombre de usuario y tu contraseña." }, 400, request);
  }

  // Solo recupera los campos necesarios para comprobar la contraseña y responder.
  const user = await env.DB.prepare(
    "SELECT id, nombreCuenta, nombreUsu, correo, password_hash FROM usuario WHERE lower(correo) = ? OR lower(nombreUsu) = ? LIMIT 1",
  ).bind(identifier, identifier).first();
  if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "El correo, nombre de usuario o contraseña no son correctos." }, 401, request);
  }

  // El navegador recibe un token aleatorio; D1 conserva únicamente su hash.
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // Borra sesiones vencidas antes de registrar la nueva sesión de siete días.
  await env.DB.prepare("DELETE FROM sesion WHERE expires_at <= ?").bind(new Date().toISOString()).run();
  await env.DB.prepare(
    "INSERT INTO sesion (usuario_id, token_hash, expires_at) VALUES (?, ?, ?)",
  ).bind(user.id, tokenHash, expiresAt).run();

  // La cookie no es accesible desde JavaScript y se asegura bajo HTTPS.
  const secure = url.protocol === "https:" ? "; Secure" : "";
  const headers = new Headers();
  headers.append("Set-Cookie", `lp_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
  return json({ user: publicUser(user) }, 200, request, headers);
}

// Devuelve los datos públicos del usuario si la cookie contiene una sesión vigente.
async function currentUser(request, env) {
  const token = cookieValue(request.headers.get("Cookie"), "lp_session");
  if (!token) return json({ user: null }, 200, request);

  // Compara en D1 el hash de la cookie con la sesión guardada y no devuelve secretos.
  const tokenHash = await sha256Hex(token);
  const user = await env.DB.prepare(
    "SELECT u.id, u.nombreCuenta, u.nombreUsu, u.correo FROM sesion s JOIN usuario u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1",
  ).bind(tokenHash, new Date().toISOString()).first();
  return json({ user: user ? publicUser(user) : null }, 200, request);
}

// Elimina la sesión del servidor y borra la cookie del navegador.
async function logout(request, env, url) {
  const token = cookieValue(request.headers.get("Cookie"), "lp_session");
  if (token) {
    await env.DB.prepare("DELETE FROM sesion WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  }
  const secure = url.protocol === "https:" ? "; Secure" : "";
  const headers = new Headers();
  headers.append("Set-Cookie", `lp_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
  return json({ message: "Sesión cerrada." }, 200, request, headers);
}

// Calcula un hash de contraseña PBKDF2 con una sal aleatoria única.
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}

// Comprueba un hash almacenado respetando el algoritmo y el número de iteraciones incluidos.
async function verifyPassword(password, stored) {
  const [algorithm, iterationsText, saltHex, expectedHex] = String(stored).split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== "pbkdf2_sha256" || !Number.isInteger(iterations) || iterations < 1 || iterations > 1_000_000) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
    key,
    256,
  );
  return constantTimeEqual(toHex(new Uint8Array(bits)), expectedHex);
}

// Genera el resumen SHA-256 usado para no almacenar tokens de sesión sin protección.
async function sha256Hex(value) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

// Crea un token de sesión aleatorio codificado para transportarlo en una cookie.
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

// Extrae el valor de una cookie concreta de la cabecera Cookie.
function cookieValue(header, name) {
  const item = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

// Devuelve texto recortado y evita tratar otros tipos de entrada como cadenas.
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Limita la respuesta al identificador y los datos de perfil que puede ver el cliente.
function publicUser(user) {
  return { id: user.id, accountName: user.nombreCuenta, username: user.nombreUsu, email: user.correo };
}

// Lee JSON y trata cuerpos vacíos o mal formados como un objeto sin campos.
function readJson(request) {
  return request.json().catch(() => ({}));
}

// Construye respuestas JSON sin caché para que los datos de sesión no queden almacenados.
function json(payload, status, _request, headers = new Headers()) {
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(payload), { status, headers });
}

// Convierte bytes a hexadecimal para almacenar hashes en formato de texto.
function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Convierte hexadecimal a bytes y rechaza cadenas con formato no válido.
function fromHex(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return new Uint8Array();
  return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

// Compara cadenas sin salir al detectar la primera diferencia.
function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
