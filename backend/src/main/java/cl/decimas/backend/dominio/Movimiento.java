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
        Instant fecha) {

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

    /** Cuánto cambia el saldo: positivo al otorgar, negativo al canjear. */
    public int efecto() {
        return switch (tipo) {
            case OTORGAR -> cantidad;
            case CANJEAR -> -cantidad;
        };
    }
}