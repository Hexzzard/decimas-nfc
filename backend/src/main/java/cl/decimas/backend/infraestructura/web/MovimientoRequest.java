package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.dominio.Asignatura;
import cl.decimas.backend.dominio.Movimiento;
import cl.decimas.backend.dominio.TipoMovimiento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

/** DTO: el formato del JSON que recibe la API. Está separado del dominio a propósito. */
public record MovimientoRequest(
        @NotNull UUID id,
        @NotNull Asignatura asignatura,
        @NotNull TipoMovimiento tipo,
        @Positive int cantidad,
        @NotNull Instant fecha,
        @Size(max = 100) String motivo,
        UUID loteId) {

    Movimiento aDominio(String estudianteId) {
        return new Movimiento(id, estudianteId, asignatura, tipo, cantidad, fecha, motivo, loteId);
    }
}