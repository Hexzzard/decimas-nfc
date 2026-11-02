package cl.decimas.backend.aplicacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import cl.decimas.backend.dominio.CodigoError;
import cl.decimas.backend.dominio.Curso;
import cl.decimas.backend.dominio.ErrorDominio;
import cl.decimas.backend.dominio.Estudiante;
import cl.decimas.backend.infraestructura.persistencia.RepositorioCursosEnMemoria;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ConsultarCursosTest {

    private final Estudiante e1 = new Estudiante("e1", "Martina Rojas");
    private final Estudiante e2 = new Estudiante("e2", "Benjamín Soto");
    private final Estudiante e3 = new Estudiante("e3", "Florencia Muñoz");
    private final Estudiante e5 = new Estudiante("e5", "Josefa Contreras");
    private final Curso c1 = new Curso("c1", "1° Medio A", List.of(e3, e1, e2));
    private final Curso c2 = new Curso("c2", "1° Medio B", List.of(e5));

    private final RepositorioCursosEnMemoria repositorio = new RepositorioCursosEnMemoria();
    private final ConsultarCursos consultar = new ConsultarCursos(repositorio);

    private static List<String> ids(List<Curso> cursos) {
        return cursos.stream().map(Curso::id).toList();
    }

    private static List<String> idsEstudiantes(Curso curso) {
        return curso.estudiantes().stream().map(Estudiante::id).toList();
    }

    @Test
    @DisplayName("CA-3: devuelve solo los cursos del profesor")
    void soloLosCursosDelProfesor() {
        var c9 = new Curso("c9", "Otro", List.of(new Estudiante("e9", "Ajeno")));
        repositorio.agregar("prof-1", c1);
        repositorio.agregar("prof-1", c2);
        repositorio.agregar("prof-2", c9);

        var cursos = consultar.ejecutar("prof-1");

        assertThat(ids(cursos)).containsExactly("c1", "c2");
        assertThat(cursos.stream().flatMap(c -> c.estudiantes().stream()).map(Estudiante::id))
                .doesNotContain("e9");
        assertThat(ids(consultar.ejecutar("prof-2"))).containsExactly("c9");
    }

    @Test
    @DisplayName("CA-4: ordena cursos por nombre y estudiantes por nombre")
    void ordenaPorNombre() {
        repositorio.agregar("prof-1", c2);
        repositorio.agregar("prof-1", c1);

        var cursos = consultar.ejecutar("prof-1");

        assertThat(ids(cursos)).containsExactly("c1", "c2");
        assertThat(cursos.get(0).estudiantes().stream().map(Estudiante::nombre))
                .containsExactly("Benjamín Soto", "Florencia Muñoz", "Martina Rojas");
        assertThat(idsEstudiantes(cursos.get(0))).containsExactly("e2", "e3", "e1");
    }

    @Test
    @DisplayName("CA-4: con nombres iguales desempata por id")
    void desempataPorId() {
        repositorio.agregar("prof-1", new Curso("b", "Igual", List.of()));
        repositorio.agregar("prof-1", new Curso("a", "Igual", List.of()));

        assertThat(ids(consultar.ejecutar("prof-1"))).containsExactly("a", "b");
    }

    @Test
    @DisplayName("CA-4: estudiantes con nombres iguales desempatan por id")
    void desempataEstudiantesPorId() {
        repositorio.agregar("prof-1", new Curso("c1", "Curso",
                List.of(new Estudiante("y", "Igual"), new Estudiante("x", "Igual"))));

        assertThat(idsEstudiantes(consultar.ejecutar("prof-1").get(0))).containsExactly("x", "y");
    }

    @Test
    @DisplayName("CA-4: la tilde inicial ordena alfabéticamente en español")
    void ordenaConTilde() {
        repositorio.agregar("prof-1", new Curso("c1", "Curso", List.of(
                new Estudiante("z1", "Zoe"),
                new Estudiante("b1", "Benjamín"),
                new Estudiante("a1", "Ángela"))));

        assertThat(idsEstudiantes(consultar.ejecutar("prof-1").get(0))).containsExactly("a1", "b1", "z1");
    }

    @Test
    @DisplayName("CA-5: repositorio vacío devuelve lista vacía")
    void repositorioVacio() {
        assertThat(consultar.ejecutar("prof-1")).isEmpty();
    }

    @Test
    @DisplayName("CA-5: profesor sin cursos devuelve lista vacía")
    void profesorSinCursos() {
        repositorio.agregar("prof-2", c1);

        assertThat(consultar.ejecutar("prof-1")).isEmpty();
    }

    @Test
    @DisplayName("CA-6: un curso sin estudiantes se devuelve con lista vacía")
    void cursoSinEstudiantes() {
        repositorio.agregar("prof-1", new Curso("c5", "Vacío", List.of()));

        var cursos = consultar.ejecutar("prof-1");

        assertThat(ids(cursos)).containsExactly("c5");
        assertThat(cursos.get(0).estudiantes()).isEmpty();
    }

    @Test
    @DisplayName("CA-7: lanza error si un estudiante está en dos cursos")
    void reglaViolada() {
        repositorio.agregar("prof-1", c1);
        repositorio.agregar("prof-1", new Curso("c3", "Taller", List.of(e2)));

        assertThatThrownBy(() -> consultar.ejecutar("prof-1"))
                .isInstanceOfSatisfying(ErrorDominio.class, error -> {
                    assertThat(error.codigo()).isEqualTo(CodigoError.ESTUDIANTE_EN_VARIOS_CURSOS);
                    assertThat(error.getMessage()).contains("e2");
                });
    }

    @Test
    @DisplayName("CA-8: no reordena la lista de estudiantes que entrega el repositorio")
    void noMutaLaListaOriginal() {
        var estudiantes = new ArrayList<>(List.of(e3, e1, e2));
        var original = new Curso("c1", "1° Medio A", estudiantes);
        repositorio.agregar("prof-1", original);

        consultar.ejecutar("prof-1");

        assertThat(original.estudiantes()).containsExactly(e3, e1, e2);
        assertThat(estudiantes).containsExactly(e3, e1, e2);
    }
}
