package cl.decimas.backend.dominio;

import java.util.HashMap;
import java.util.List;

/** Reglas que involucran a varios cursos a la vez. */
public final class Cursos {

    private Cursos() {
    }

    /** Un estudiante pertenece a un solo curso: el mismo id no puede aparecer en cursos distintos. */
    public static void validar(List<Curso> cursos) {
        var cursoPorEstudiante = new HashMap<String, String>();
        for (var curso : cursos) {
            for (var estudiante : curso.estudiantes()) {
                var anterior = cursoPorEstudiante.putIfAbsent(estudiante.id(), curso.id());
                if (anterior != null && !anterior.equals(curso.id())) {
                    throw new ErrorDominio(CodigoError.ESTUDIANTE_EN_VARIOS_CURSOS,
                            "El estudiante " + estudiante.id() + " está en más de un curso");
                }
            }
        }
    }
}
