import { ASIGNATURAS, type Asignatura } from './asignatura';
import { ErrorDominio } from './errores';
import type { Movimiento } from './movimiento';

export type Saldos = Record<Asignatura, number>;

export function calcularSaldos(movimientos: readonly Movimiento[], estudianteId: string): Saldos {
  const saldos = Object.fromEntries(ASIGNATURAS.map((a) => [a, 0])) as Saldos;
  for (const m of movimientos) {
    if (m.estudianteId !== estudianteId) continue;
    saldos[m.asignatura] += m.tipo === 'OTORGAR' ? m.cantidad : -m.cantidad;
  }
  return saldos;
}

export function validarCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDominio(
      'CANTIDAD_INVALIDA',
      `La cantidad debe ser un entero positivo (recibido: ${cantidad})`,
    );
  }
}

export function validarMovimiento(historial: readonly Movimiento[], nuevo: Movimiento): void {
  validarCantidad(nuevo.cantidad);
  if (nuevo.tipo === 'CANJEAR') {
    const saldo = calcularSaldos(historial, nuevo.estudianteId)[nuevo.asignatura];
    if (nuevo.cantidad > saldo) {
      throw new ErrorDominio(
        'SALDO_INSUFICIENTE',
        `Saldo insuficiente: tiene ${saldo}, intenta canjear ${nuevo.cantidad}`,
      );
    }
  }
}

/** Los movimientos más recientes primero. */
export function historialDe(
  movimientos: readonly Movimiento[],
  estudianteId: string,
  limite = 10,
): Movimiento[] {
  return movimientos
    .filter((m) => m.estudianteId === estudianteId)
    .slice(-limite)
    .reverse();
}