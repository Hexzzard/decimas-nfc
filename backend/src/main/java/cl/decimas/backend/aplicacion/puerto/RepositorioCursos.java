package cl.decimas.backend.aplicacion.puerto;

import cl.decimas.backend.dominio.Curso;
import java.util.List;

public interface RepositorioCursos {

    List<Curso> buscarPorProfesor(String profesorId);
}
