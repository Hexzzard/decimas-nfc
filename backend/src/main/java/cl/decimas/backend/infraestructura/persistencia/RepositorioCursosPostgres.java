package cl.decimas.backend.infraestructura.persistencia;

import cl.decimas.backend.aplicacion.puerto.RepositorioCursos;
import cl.decimas.backend.dominio.Curso;
import cl.decimas.backend.dominio.Estudiante;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Adaptador PostgreSQL de solo lectura. */
public class RepositorioCursosPostgres implements RepositorioCursos {

    private final JdbcClient jdbc;

    public RepositorioCursosPostgres(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Curso> buscarPorProfesor(String profesorId) {
        var nombres = new LinkedHashMap<String, String>();
        var estudiantes = new LinkedHashMap<String, List<Estudiante>>();

        jdbc.sql("""
                        SELECT c.id AS curso_id, c.nombre AS curso_nombre,
                               e.id AS estudiante_id, e.nombre AS estudiante_nombre
                          FROM cursos c
                          LEFT JOIN estudiantes e ON e.curso_id = c.id
                         WHERE c.id IN (SELECT curso_id FROM clases WHERE profesor_id = :profesorId)
                         ORDER BY c.id, e.id
                        """)
                .param("profesorId", profesorId)
                .query((rs, numeroFila) -> {
                    var cursoId = rs.getString("curso_id");
                    nombres.putIfAbsent(cursoId, rs.getString("curso_nombre"));
                    var lista = estudiantes.computeIfAbsent(cursoId, k -> new ArrayList<>());
                    var estudianteId = rs.getString("estudiante_id");
                    if (estudianteId != null) {
                        lista.add(new Estudiante(estudianteId, rs.getString("estudiante_nombre")));
                    }
                    return cursoId;
                })
                .list();

        return nombres.entrySet().stream()
                .map(e -> new Curso(e.getKey(), e.getValue(), List.copyOf(estudiantes.get(e.getKey()))))
                .toList();
    }
}
