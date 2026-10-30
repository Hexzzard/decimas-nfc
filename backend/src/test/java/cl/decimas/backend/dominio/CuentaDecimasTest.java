package cl.decimas.backend.dominio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CuentaDecimasTest {

    private static Movimiento mov(String estudiante, Asignatura asignatura, TipoMovimiento tipo, int cantidad) {
        return new Movimiento(UUID.randomUUID(), estudiante, asignatura, tipo, cantidad,
                Instant.parse("2026-10-28T12:00:00Z"));
    }

    private static Movimiento mov(Asignatura asignatura, TipoMovimiento tipo, int cantidad) {
        return mov("e1", asignatura, tipo, cantidad);
    }

    @Test
    void cuentaNuevaTieneTodasLasAsignaturasEnCero() {
        var cuenta = new CuentaDecimas("e1", List.of());

        assertThat(cuenta.saldos()).hasSize(4);
        assertThat(cuenta.saldos().values()).containsOnly(0);
    }

    @Test
    void sumaLoOtorgadoYRestaLoCanjeadoPorAsignatura() {
        var cuenta = new CuentaDecimas("e1", List.of(
                mov(Asignatura.MAT, TipoMovimiento.OTORGAR, 5),
                mov(Asignatura.MAT, TipoMovimiento.CANJEAR, 2),
                mov(Asignatura.HIS, TipoMovimiento.OTORGAR, 3)));

        assertThat(cuenta.saldo(Asignatura.MAT)).isEqualTo(3);
        assertThat(cuenta.saldo(Asignatura.HIS)).isEqualTo(3);
        assertThat(cuenta.saldo(Asignatura.LEN)).isZero();
    }

    @Test
    void rechazaCanjearMasQueElSaldoYNoRegistraNada() {
        var cuenta = new CuentaDecimas("e1", List.of(mov(Asignatura.MAT, TipoMovimiento.OTORGAR, 2)));

        assertThatThrownBy(() -> cuenta.registrar(mov(Asignatura.MAT, TipoMovimiento.CANJEAR, 3)))
                .isInstanceOfSatisfying(ErrorDominio.class,
                        e -> assertThat(e.codigo()).isEqualTo(CodigoError.SALDO_INSUFICIENTE));
        assertThat(cuenta.movimientos()).hasSize(1);
    }

    @Test
    void permiteCanjearExactamenteElSaldo() {
        var cuenta = new CuentaDecimas("e1", List.of(mov(Asignatura.MAT, TipoMovimiento.OTORGAR, 2)));

        cuenta.registrar(mov(Asignatura.MAT, TipoMovimiento.CANJEAR, 2));

        assertThat(cuenta.saldo(Asignatura.MAT)).isZero();
    }

    @Test
    void noPermiteCrearMovimientosConCantidadNoPositiva() {
        assertThatThrownBy(() -> mov(Asignatura.MAT, TipoMovimiento.OTORGAR, 0))
                .isInstanceOf(ErrorDominio.class);
    }

    @Test
    void rechazaMovimientosDeOtroEstudiante() {
        var cuenta = new CuentaDecimas("e1", List.of());

        assertThatThrownBy(() -> cuenta.registrar(mov("e2", Asignatura.MAT, TipoMovimiento.OTORGAR, 1)))
                .isInstanceOfSatisfying(ErrorDominio.class,
                        e -> assertThat(e.codigo()).isEqualTo(CodigoError.ESTUDIANTE_DISTINTO));
    }
}