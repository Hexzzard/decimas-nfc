package cl.decimas.backend.aplicacion;

import cl.decimas.backend.aplicacion.puerto.RepositorioCursos;
import cl.decimas.backend.dominio.Curso;
import cl.decimas.backend.dominio.Cursos;
import cl.decimas.backend.dominio.Estudiante;
import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public class ConsultarCursos {

    private final RepositorioCursos repositorio;

    public ConsultarCursos(RepositorioCursos repositorio) {
        this.repositorio = repositorio;
    }

    /** Cursos del profesor ordenados por nombre (alfabeto español) y luego por id; estudiantes igual. */
    public List<Curso> ejecutar(String profesorId) {
        var cursos = repositorio.buscarPorProfesor(profesorId);
        Cursos.validar(cursos);

        var collator = Collator.getInstance(Locale.of("es", "CL"));
        Comparator<Curso> porCurso = Comparator.comparing(Curso::nombre, collator).thenComparing(Curso::id);
        Comparator<Estudiante> porEstudiante =
                Comparator.comparing(Estudiante::nombre, collator).thenComparing(Estudiante::id);

        return cursos.stream()
                .map(c -> new Curso(c.id(), c.nombre(), c.estudiantes().stream().sorted(porEstudiante).toList()))
                .sorted(porCurso)
                .toList();
    }
}
