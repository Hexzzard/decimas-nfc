package cl.decimas.backend.aplicacion.puerto;

import cl.decimas.backend.dominio.Movimiento;
import java.util.List;
import java.util.UUID;

/** Puerto de salida: lo que la aplicación necesita para guardar movimientos, sin decir cómo. */
public interface RepositorioMovimientos {

    /** Devuelve los movimientos en el orden en que se registraron. */
    List<Movimiento> buscarPorEstudiante(String estudianteId);

    boolean existe(UUID movimientoId);

    void guardar(Movimiento movimiento);
}