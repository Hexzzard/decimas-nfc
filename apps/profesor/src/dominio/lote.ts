import type { Asignatura } from './asignatura';
import { ErrorDominio } from './errores';
import type { Movimiento } from './movimiento';
import { validarCantidad } from './saldos';

export interface OtorgamientoMasivo {
  readonly estudianteIds: readonly string[];
  readonly asignatura: Asignatura;
  readonly cantidad: number;
  readonly motivo?: string;
}

/**
 * Crea un movimiento OTORGAR por estudiante, todos con el mismo loteId.
 * Los IDs repetidos se ignoran: nadie recibe dos veces en el mismo lote.
 */
export function crearOtorgamientoMasivo(
  datos: OtorgamientoMasivo,
  generarId: () => string,
  ahora: Date = new Date(),
): Movimiento[] {
  const unicos = [...new Set(datos.estudianteIds)];
  if (unicos.length === 0) {
    throw new ErrorDominio('SIN_ESTUDIANTES', 'Selecciona al menos un estudiante');
  }
  validarCantidad(datos.cantidad);

  const loteId = generarId();
  const fecha = ahora.toISOString();
  return unicos.map(
    (estudianteId): Movimiento => ({
      id: generarId(),
      estudianteId,
      asignatura: datos.asignatura,
      tipo: 'OTORGAR',
      cantidad: datos.cantidad,
      fecha,
      motivo: datos.motivo,
      loteId,
    }),
  );
}

/** Para el futuro "modo ráfaga" con tarjetas: evita aplicar el lote dos veces a la misma tarjeta. */
export function yaRecibioEnLote(
  movimientos: readonly Movimiento[],
  loteId: string,
  estudianteId: string,
): boolean {
  return movimientos.some((m) => m.loteId === loteId && m.estudianteId === estudianteId);
}