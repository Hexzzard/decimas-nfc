package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.dominio.Curso;
import java.util.List;

public record CursoResponse(String id, String nombre, List<EstudianteResponse> estudiantes) {

    public record EstudianteResponse(String id, String nombre) {
    }

    static CursoResponse desde(Curso curso) {
        return new CursoResponse(curso.id(), curso.nombre(),
                curso.estudiantes().stream().map(e -> new EstudianteResponse(e.id(), e.nombre())).toList());
    }
}
