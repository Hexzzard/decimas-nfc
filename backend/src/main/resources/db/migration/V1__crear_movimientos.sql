CREATE TABLE movimientos (
    secuencia     BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id            UUID         NOT NULL UNIQUE,
    estudiante_id TEXT         NOT NULL,
    asignatura    TEXT         NOT NULL CHECK (asignatura IN ('MAT', 'LEN', 'CIE', 'HIS')),
    tipo          TEXT         NOT NULL CHECK (tipo IN ('OTORGAR', 'CANJEAR')),
    cantidad      INTEGER      NOT NULL CHECK (cantidad > 0),
    fecha         TIMESTAMPTZ  NOT NULL,
    motivo        VARCHAR(100),
    lote_id       UUID,
    recibido_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimientos_estudiante ON movimientos (estudiante_id, secuencia);

-- Supabase expone automáticamente una API REST pública sobre las tablas del esquema "public".
-- Activar RLS sin crear políticas bloquea ese acceso. Nuestro backend se conecta como dueño
-- de la tabla y no se ve afectado.
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;