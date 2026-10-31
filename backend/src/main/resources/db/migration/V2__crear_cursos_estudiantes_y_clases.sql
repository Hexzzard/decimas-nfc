CREATE TABLE cursos (
    id     TEXT PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE estudiantes (
    id       TEXT PRIMARY KEY,
    curso_id TEXT NOT NULL REFERENCES cursos (id),
    nombre   TEXT NOT NULL
);

CREATE INDEX idx_estudiantes_curso ON estudiantes (curso_id);

CREATE TABLE clases (
    profesor_id TEXT NOT NULL,
    curso_id    TEXT NOT NULL REFERENCES cursos (id),
    asignatura  TEXT NOT NULL CHECK (asignatura IN ('MAT', 'LEN', 'CIE', 'HIS')),
    PRIMARY KEY (profesor_id, curso_id, asignatura)
);

CREATE INDEX idx_clases_curso ON clases (curso_id);
CREATE INDEX idx_clases_profesor ON clases (profesor_id);

-- Igual que en V1: RLS sin políticas bloquea la API REST pública de Supabase.
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
