package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.dominio.ErrorDominio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Traduce los errores del dominio a respuestas HTTP con el formato estándar RFC 9457. */
@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(ErrorDominio.class)
    public ProblemDetail manejarErrorDominio(ErrorDominio error) {
        var estado = switch (error.codigo()) {
            case SALDO_INSUFICIENTE -> HttpStatus.CONFLICT;
            case CANTIDAD_INVALIDA, ESTUDIANTE_DISTINTO -> HttpStatus.BAD_REQUEST;
        };
        var problema = ProblemDetail.forStatusAndDetail(estado, error.getMessage());
        problema.setProperty("codigo", error.codigo().name());
        return problema;
    }
}