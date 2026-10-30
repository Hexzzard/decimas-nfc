package cl.decimas.backend.aplicacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.dominio.Asignatura;
import cl.decimas.backend.dominio.ErrorDominio;
import cl.decimas.backend.dominio.Movimiento;
import cl.decimas.backend.dominio.TipoMovimiento;
import cl.decimas.backend.infraestructura.persistencia.RepositorioMovimientosEnMemoria;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RegistrarMovimientoTest {

    private final RepositorioMovimientos repositorio = new RepositorioMovimientosEnMemoria();
    private final RegistrarMovimiento registrar = new RegistrarMovimiento(repositorio);

    private static Movimiento mov(UUID id, TipoMovimiento tipo, int cantidad) {
        return new Movimiento(id, "e1", Asignatura.MAT, tipo, cantidad, Instant.parse("2026-10-28T12:00:00Z"));
    }

    @Test
    void guardaElMovimientoYDevuelveLosSaldos() {
        var saldos = registrar.ejecutar(mov(UUID.randomUUID(), TipoMovimiento.OTORGAR, 5));

        assertThat(saldos.get(Asignatura.MAT)).isEqualTo(5);
        assertThat(repositorio.buscarPorEstudiante("e1")).hasSize(1);
    }

    @Test
    void reenviarElMismoMovimientoNoLoDuplica() {
        var id = UUID.randomUUID();
        registrar.ejecutar(mov(id, TipoMovimiento.OTORGAR, 5));

        var saldos = registrar.ejecutar(mov(id, TipoMovimiento.OTORGAR, 5));

        assertThat(saldos.get(Asignatura.MAT)).isEqualTo(5);
        assertThat(repositorio.buscarPorEstudiante("e1")).hasSize(1);
    }

    @Test
    void unCanjeRechazadoNoSeGuarda() {
        registrar.ejecutar(mov(UUID.randomUUID(), TipoMovimiento.OTORGAR, 2));

        assertThatThrownBy(() -> registrar.ejecutar(mov(UUID.randomUUID(), TipoMovimiento.CANJEAR, 3)))
                .isInstanceOf(ErrorDominio.class);
        assertThat(repositorio.buscarPorEstudiante("e1")).hasSize(1);
    }
}