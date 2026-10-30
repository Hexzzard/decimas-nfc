package cl.decimas.backend.infraestructura.persistencia;

import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.dominio.Movimiento;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

/** Adaptador temporal: los datos se pierden al reiniciar. Lo reemplazaremos en la etapa 5. */
public class RepositorioMovimientosEnMemoria implements RepositorioMovimientos {

    private final List<Movimiento> movimientos = new CopyOnWriteArrayList<>();

    @Override
    public List<Movimiento> buscarPorEstudiante(String estudianteId) {
        return movimientos.stream()
                .filter(m -> m.estudianteId().equals(estudianteId))
                .toList();
    }

    @Override
    public boolean existe(UUID movimientoId) {
        return movimientos.stream().anyMatch(m -> m.id().equals(movimientoId));
    }

    @Override
    public void guardar(Movimiento movimiento) {
        movimientos.add(movimiento);
    }
}