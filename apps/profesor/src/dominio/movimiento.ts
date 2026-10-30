import type { Asignatura } from './asignatura';

export type TipoMovimiento = 'OTORGAR' | 'CANJEAR';

export interface Movimiento {
  readonly id: string;
  readonly estudianteId: string;
  readonly asignatura: Asignatura;
  readonly tipo: TipoMovimiento;
  /** Entero positivo, medido en décimas (1 = 0,1 punto). */
  readonly cantidad: number;
  /** Fecha en formato ISO 8601. */
  readonly fecha: string;
    /** Texto opcional, por ejemplo "Participación". */
  readonly motivo?: string;
  /** Agrupa los movimientos creados en una misma operación masiva. */
  readonly loteId?: string;
}