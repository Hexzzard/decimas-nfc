package cl.decimas.backend.infraestructura.persistencia;

import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.dominio.Asignatura;
import cl.decimas.backend.dominio.Movimiento;
import cl.decimas.backend.dominio.TipoMovimiento;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Adaptador PostgreSQL. Funciona con cualquier proveedor: Supabase, Neon, RDS o Docker local. */
public class RepositorioMovimientosPostgres implements RepositorioMovimientos {

    private final JdbcClient jdbc;

    public RepositorioMovimientosPostgres(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Movimiento> buscarPorEstudiante(String estudianteId) {
        return jdbc.sql("""
                        SELECT id, estudiante_id, asignatura, tipo, cantidad, fecha, motivo, lote_id
                          FROM movimientos
                         WHERE estudiante_id = :estudianteId
                         ORDER BY secuencia
                        """)
                .param("estudianteId", estudianteId)
                .query(RepositorioMovimientosPostgres::aMovimiento)
                .list();
    }

    @Override
    public boolean existe(UUID movimientoId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM movimientos WHERE id = :id)")
                .param("id", movimientoId)
                .query(Boolean.class)
                .single();
    }

    @Override
    public void guardar(Movimiento m) {
        jdbc.sql("""
                        INSERT INTO movimientos
                            (id, estudiante_id, asignatura, tipo, cantidad, fecha, motivo, lote_id)
                        VALUES
                            (:id, :estudianteId, :asignatura, :tipo, :cantidad, :fecha, :motivo, :loteId)
                        ON CONFLICT (id) DO NOTHING
                        """)
                .param("id", m.id())
                .param("estudianteId", m.estudianteId())
                .param("asignatura", m.asignatura().name())
                .param("tipo", m.tipo().name())
                .param("cantidad", m.cantidad())
                .param("fecha", OffsetDateTime.ofInstant(m.fecha(), ZoneOffset.UTC))
                .param("motivo", m.motivo())
                .param("loteId", m.loteId())
                .update();
    }

    /** Mapper: convierte una fila de la tabla en un objeto del dominio. */
    private static Movimiento aMovimiento(ResultSet rs, int numeroFila) throws SQLException {
        return new Movimiento(
                rs.getObject("id", UUID.class),
                rs.getString("estudiante_id"),
                Asignatura.valueOf(rs.getString("asignatura")),
                TipoMovimiento.valueOf(rs.getString("tipo")),
                rs.getInt("cantidad"),
                rs.getObject("fecha", OffsetDateTime.class).toInstant(),
                rs.getString("motivo"),
                rs.getObject("lote_id", UUID.class));
    }
}