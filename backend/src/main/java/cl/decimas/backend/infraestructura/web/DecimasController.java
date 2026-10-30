package cl.decimas.backend.infraestructura.web;

import cl.decimas.backend.aplicacion.ConsultarSaldos;
import cl.decimas.backend.aplicacion.RegistrarMovimiento;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estudiantes/{estudianteId}")
public class DecimasController {

    private final RegistrarMovimiento registrarMovimiento;
    private final ConsultarSaldos consultarSaldos;

    public DecimasController(RegistrarMovimiento registrarMovimiento, ConsultarSaldos consultarSaldos) {
        this.registrarMovimiento = registrarMovimiento;
        this.consultarSaldos = consultarSaldos;
    }

    @PostMapping("/movimientos")
    @ResponseStatus(HttpStatus.CREATED)
    public SaldosResponse registrar(@PathVariable String estudianteId,
                                    @Valid @RequestBody MovimientoRequest request) {
        var saldos = registrarMovimiento.ejecutar(request.aDominio(estudianteId));
        return new SaldosResponse(estudianteId, saldos);
    }

    @GetMapping("/saldos")
    public SaldosResponse saldos(@PathVariable String estudianteId) {
        return new SaldosResponse(estudianteId, consultarSaldos.ejecutar(estudianteId));
    }
}