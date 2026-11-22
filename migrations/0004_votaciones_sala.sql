-- Migration number: 0004	2026-11-22
ALTER TABLE sala ADD COLUMN genero_ganador TEXT;
ALTER TABLE sala ADD COLUMN votacion_cerrada_en TEXT;

CREATE TABLE IF NOT EXISTS voto_sala (
  codigo_sala TEXT NOT NULL,
  participante_id TEXT NOT NULL,
  genero TEXT NOT NULL CHECK (genero IN (
    'Acción', 'Miedo', 'Comedia', 'Aventura', 'Thriller', 'Romance', 'Drama',
    'Animada', 'Sci-fi', 'Fantasía', 'Documental', 'Bélica', 'Histórica',
    'Musical', 'Western', 'Psicológica', 'Clásica'
  )),
  votado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (codigo_sala, participante_id),
  FOREIGN KEY (codigo_sala) REFERENCES sala(codigo) ON DELETE CASCADE,
  FOREIGN KEY (participante_id) REFERENCES participante_sala(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS voto_sala_codigo_idx
  ON voto_sala(codigo_sala);
