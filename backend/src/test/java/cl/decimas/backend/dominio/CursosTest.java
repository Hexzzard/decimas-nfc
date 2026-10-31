package cl.decimas.backend.dominio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CursosTest {

    private final Estudiante e1 = new Estudiante("e1", "Martina Rojas");
    private final Estudiante e2 = new Estudiante("e2", "Benjamín Soto");
    private final Estudiante e3 = new Estudiante("e3", "Florencia Muñoz");
    private final Estudiante e5 = new Estudiante("e5", "Josefa Contreras");
    private final Curso c1 = new Curso("c1", "1° Medio A", List.of(e3, e1, e2));
    private final Curso c2 = new Curso("c2", "1° Medio B", List.of(e5));

    @Test
    @DisplayName("CA-1: acepta cursos sin estudiantes repetidos")
    void aceptaCursosValidos() {
        assertThatCode(() -> Cursos.validar(List.of(c1, c2))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("CA-1: acepta una lista vacía")
    void aceptaListaVacia() {
        assertThatCode(() -> Cursos.validar(List.of())).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("CA-2: rechaza un estudiante presente en dos cursos")
    void rechazaEstudianteEnDosCursos() {
        var c3 = new Curso("c3", "Taller", List.of(e5, e2));

        assertThatThrownBy(() -> Cursos.validar(List.of(c1, c3)))
                .isInstanceOfSatisfying(ErrorDominio.class, error -> {
                    assertThat(error.codigo()).isEqualTo(CodigoError.ESTUDIANTE_EN_VARIOS_CURSOS);
                    assertThat(error.getMessage()).contains("e2");
                });
    }
}
