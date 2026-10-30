package cl.decimas.backend.dominio;

public enum Asignatura {
    MAT("Matemáticas"),
    LEN("Lenguaje"),
    CIE("Ciencias"),
    HIS("Historia");

    private final String nombre;

    Asignatura(String nombre) {
        this.nombre = nombre;
    }

    public String nombre() {
        return nombre;
    }
}