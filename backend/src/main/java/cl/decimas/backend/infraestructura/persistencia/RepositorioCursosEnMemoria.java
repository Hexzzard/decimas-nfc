package cl.decimas.backend.infraestructura.persistencia;

import cl.decimas.backend.aplicacion.puerto.RepositorioCursos;
import cl.decimas.backend.dominio.Curso;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Adaptador en memoria, para pruebas y ejecución sin base de datos. */
public class RepositorioCursosEnMemoria implements RepositorioCursos {

    private final Map<String, List<Curso>> cursosPorProfesor = new HashMap<>();

    public void agregar(String profesorId, Curso curso) {
        cursosPorProfesor.computeIfAbsent(profesorId, k -> new ArrayList<>()).add(curso);
    }

    @Override
    public List<Curso> buscarPorProfesor(String profesorId) {
        return List.copyOf(cursosPorProfesor.getOrDefault(profesorId, List.of()));
    }
}
