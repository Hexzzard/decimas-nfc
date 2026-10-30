package cl.decimas.backend.aplicacion;

import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.dominio.Asignatura;
import cl.decimas.backend.dominio.CuentaDecimas;
import cl.decimas.backend.dominio.Movimiento;
import java.util.Map;

/** Caso de uso: registrar un movimiento. Es idempotente: reenviar el mismo id no lo duplica. */
public class RegistrarMovimiento {

    private final RepositorioMovimientos repositorio;

    public RegistrarMovimiento(RepositorioMovimientos repositorio) {
        this.repositorio = repositorio;
    }

    public Map<Asignatura, Integer> ejecutar(Movimiento movimiento) {
        var historial = repositorio.buscarPorEstudiante(movimiento.estudianteId());
        var cuenta = new CuentaDecimas(movimiento.estudianteId(), historial);

        if (!repositorio.existe(movimiento.id())) {
            cuenta.registrar(movimiento);      // aquí se aplican las reglas del dominio
            repositorio.guardar(movimiento);   // solo se guarda si las reglas lo permiten
        }
        return cuenta.saldos();
    }
}