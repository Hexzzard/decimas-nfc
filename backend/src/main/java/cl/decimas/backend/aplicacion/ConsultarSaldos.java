package cl.decimas.backend.aplicacion;

import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.dominio.Asignatura;
import cl.decimas.backend.dominio.CuentaDecimas;
import java.util.Map;

public class ConsultarSaldos {

    private final RepositorioMovimientos repositorio;

    public ConsultarSaldos(RepositorioMovimientos repositorio) {
        this.repositorio = repositorio;
    }

    public Map<Asignatura, Integer> ejecutar(String estudianteId) {
        return new CuentaDecimas(estudianteId, repositorio.buscarPorEstudiante(estudianteId)).saldos();
    }
}