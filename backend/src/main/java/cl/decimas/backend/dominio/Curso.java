package cl.decimas.backend.dominio;

import java.util.List;

public record Curso(String id, String nombre, List<Estudiante> estudiantes) {
}
