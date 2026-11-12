-- Tabla de cuentas de usuario; password_hash guarda el hash calculado por el Worker.
-- contrsenya se conserva por compatibilidad con la estructura original, pero la API no la utiliza.
CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombreCuenta VARCHAR(30) NOT NULL,
  nombreUsu VARCHAR(15) NOT NULL,
  correo VARCHAR(50) NOT NULL,
  contrsenya VARCHAR(18) NOT NULL DEFAULT '',
  fechCreate DATE NOT NULL DEFAULT CURRENT_DATE,
  password_hash TEXT
);
