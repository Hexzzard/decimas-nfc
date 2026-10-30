package cl.decimas.backend.dominio;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** Un movimiento del libro de décimas. La cantidad se mide en décimas (1 = 0,1 punto). */
public record Movimiento(
        UUID id,
        String estudianteId,
        Asignatura asignatura,
        TipoMovimiento tipo,
        int cantidad,
        Instant fecha,
        String motivo,   // opcional: puede ser null
        UUID loteId) {   // opcional: puede ser null

    /** Constructor compacto: valida los datos. Así no puede existir un movimiento inválido. */
    public Movimiento {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(estudianteId, "estudianteId");
        Objects.requireNonNull(asignatura, "asignatura");
        Objects.requireNonNull(tipo, "tipo");
        Objects.requireNonNull(fecha, "fecha");
        if (cantidad <= 0) {
            throw new ErrorDominio(CodigoError.CANTIDAD_INVALIDA,
                    "La cantidad debe ser positiva (recibido: " + cantidad + ")");
        }
    }

    /** Constructor de compatibilidad: movimientos sin motivo ni lote. */
    public Movimiento(UUID id, String estudianteId, Asignatura asignatura,
                      TipoMovimiento tipo, int cantidad, Instant fecha) {
        this(id, estudianteId, asignatura, tipo, cantidad, fecha, null, null);
    }

    /** Cuánto cambia el saldo: positivo al otorgar, negativo al canjear. */
    public int efecto() {
        return switch (tipo) {
            case OTORGAR -> cantidad;
            case CANJEAR -> -cantidad;
        };
    }
}