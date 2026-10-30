package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.dominio.Asignatura;
import java.util.Map;

public record SaldosResponse(String estudianteId, Map<Asignatura, Integer> saldos) {
}