package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.aplicacion.ConsultarCursos;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cursos")
public class CursosController {

    private final ConsultarCursos consultarCursos;

    public CursosController(ConsultarCursos consultarCursos) {
        this.consultarCursos = consultarCursos;
    }

    @GetMapping
    public List<CursoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return consultarCursos.ejecutar(jwt.getSubject()).stream().map(CursoResponse::desde).toList();
    }
}
