package cl.decimas.backend.infraestructura.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import cl.decimas.backend.aplicacion.ConsultarCursos;
import cl.decimas.backend.dominio.Curso;
import cl.decimas.backend.dominio.ErrorDominio;
import cl.decimas.backend.dominio.Estudiante;
import cl.decimas.backend.infraestructura.persistencia.RepositorioCursosEnMemoria;
import cl.decimas.backend.infraestructura.web.CursoResponse.EstudianteResponse;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class CursosControllerTest {

    private final Estudiante e1 = new Estudiante("e1", "Martina Rojas");
    private final Estudiante e2 = new Estudiante("e2", "Benjamín Soto");
    private final Estudiante e3 = new Estudiante("e3", "Florencia Muñoz");
    private final Estudiante e5 = new Estudiante("e5", "Josefa Contreras");
    private final Curso c1 = new Curso("c1", "1° Medio A", List.of(e3, e1, e2));
    private final Curso c2 = new Curso("c2", "1° Medio B", List.of(e5));

    private final RepositorioCursosEnMemoria repositorio = new RepositorioCursosEnMemoria();
    private final CursosController controlador = new CursosController(new ConsultarCursos(repositorio));

    private static Jwt jwt(String sub) {
        return Jwt.withTokenValue("t").header("alg", "none").subject(sub).build();
    }

    @Test
    @DisplayName("CA-9: responde los cursos con sus estudiantes ordenados")
    void respondeLosCursos() {
        repositorio.agregar("prof-1", c1);
        repositorio.agregar("prof-1", c2);

        var respuesta = controlador.listar(jwt("prof-1"));

        assertThat(respuesta).isEqualTo(List.of(
                new CursoResponse("c1", "1° Medio A", List.of(
                        new EstudianteResponse("e2", "Benjamín Soto"),
                        new EstudianteResponse("e3", "Florencia Muñoz"),
                        new EstudianteResponse("e1", "Martina Rojas"))),
                new CursoResponse("c2", "1° Medio B", List.of(
                        new EstudianteResponse("e5", "Josefa Contreras")))));
    }

    @Test
    @DisplayName("CA-10: cada sub ve solo sus cursos")
    void aislamientoPorSub() {
        repositorio.agregar("prof-1", c1);
        repositorio.agregar("prof-1", c2);
        repositorio.agregar("prof-2", new Curso("c9", "Otro", List.of(new Estudiante("e9", "Ajeno"))));

        assertThat(controlador.listar(jwt("prof-2")))
                .extracting(CursoResponse::id).containsExactly("c9");
        assertThat(controlador.listar(jwt("prof-3"))).isEmpty();
    }

    @Test
    @DisplayName("CA-11: la regla violada se traduce a 409 con su código")
    void reglaVioladaEs409() {
        repositorio.agregar("prof-1", c1);
        repositorio.agregar("prof-1", new Curso("c3", "Taller", List.of(e2)));
        var error = catchThrowableOfType(ErrorDominio.class, () -> controlador.listar(jwt("prof-1")));
        assertThat(error).isNotNull();

        var problema = new ManejadorErrores().manejarErrorDominio(error);

        assertThat(problema.getStatus()).isEqualTo(409);
        assertThat(problema.getProperties()).containsEntry("codigo", "ESTUDIANTE_EN_VARIOS_CURSOS");
    }
}
