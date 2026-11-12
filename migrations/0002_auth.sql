-- Impide crear dos cuentas con el mismo correo.
CREATE UNIQUE INDEX IF NOT EXISTS usuario_correo_unique
  ON usuario(correo);

-- Hace que el nombre de usuario no se repita, ignorando mayúsculas y minúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS usuario_nombreUsu_unique
  ON usuario(lower(nombreUsu));

-- Conserva sesiones con el hash del token, usuario asociado y fecha de caducidad.
CREATE TABLE IF NOT EXISTS sesion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permite localizar y limpiar más rápido las sesiones caducadas.
CREATE INDEX IF NOT EXISTS sesion_expires_at_idx ON sesion(expires_at);
