-- Migration number: 0003 	 2026-11-15T19:54:00.354Z
CREATE TABLE IF NOT EXISTS sala (
  codigo TEXT PRIMARY KEY,
  creada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participante_sala (
  id TEXT PRIMARY KEY,
  codigo_sala TEXT NOT NULL,
  nombre TEXT NOT NULL COLLATE NOCASE,
  es_anfitrion INTEGER NOT NULL DEFAULT 0 CHECK (es_anfitrion IN (0, 1)),
  unido_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (codigo_sala) REFERENCES sala(codigo) ON DELETE CASCADE,
  UNIQUE (codigo_sala, nombre)
);

CREATE INDEX IF NOT EXISTS participante_sala_codigo_idx
  ON participante_sala(codigo_sala);