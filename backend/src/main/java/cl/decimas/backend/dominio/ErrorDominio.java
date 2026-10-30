package cl.decimas.backend.dominio;

public class ErrorDominio extends RuntimeException {

    private final CodigoError codigo;

    public ErrorDominio(CodigoError codigo, String mensaje) {
        super(mensaje);
        this.codigo = codigo;
    }

    public CodigoError codigo() {
        return codigo;
    }
}