package cl.decimas.backend.dominio;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Las décimas de un estudiante: su libro de movimientos y las reglas que lo protegen. */
public final class CuentaDecimas {

    private final String estudianteId;
    private final List<Movimiento> movimientos = new ArrayList<>();

    public CuentaDecimas(String estudianteId, List<Movimiento> historial) {
        this.estudianteId = Objects.requireNonNull(estudianteId, "estudianteId");
        historial.forEach(this::registrar);
    }

    public void registrar(Movimiento movimiento) {
        if (!movimiento.estudianteId().equals(estudianteId)) {
            throw new ErrorDominio(CodigoError.ESTUDIANTE_DISTINTO,
                    "El movimiento pertenece a otro estudiante: " + movimiento.estudianteId());
        }
        if (movimiento.tipo() == TipoMovimiento.CANJEAR) {
            int disponible = saldo(movimiento.asignatura());
            if (movimiento.cantidad() > disponible) {
                throw new ErrorDominio(CodigoError.SALDO_INSUFICIENTE,
                        "Saldo insuficiente en " + movimiento.asignatura()
                                + ": tiene " + disponible + ", intenta canjear " + movimiento.cantidad());
            }
        }
        movimientos.add(movimiento);
    }

    public int saldo(Asignatura asignatura) {
        return movimientos.stream()
                .filter(m -> m.asignatura() == asignatura)
                .mapToInt(Movimiento::efecto)
                .sum();
    }

    public Map<Asignatura, Integer> saldos() {
        Map<Asignatura, Integer> resultado = new EnumMap<>(Asignatura.class);
        for (Asignatura a : Asignatura.values()) {
            resultado.put(a, saldo(a));
        }
        return Collections.unmodifiableMap(resultado);
    }

    public List<Movimiento> movimientos() {
        return List.copyOf(movimientos);
    }

    public String estudianteId() {
        return estudianteId;
    }
}