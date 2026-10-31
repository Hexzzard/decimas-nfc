import { cursoDelEstudiante, type Curso } from './curso';
import type { Estudiante } from './estudiante';
import type { Movimiento } from './movimiento';

export interface FilaUltimoMovimiento {
  readonly movimiento: Movimiento;
  readonly estudianteNombre: string;
  readonly cursoId: string;
  readonly cursoNombre: string;
}

export const LIMITE_ULTIMOS_MOVIMIENTOS = 10;

/**
 * Movimientos más recientes (por `fecha`, como instante) de estudiantes que existen y tienen curso.
 * Empate de fecha: primero el registrado después (más tarde en `movimientos`, que viene en orden de secuencia).
 */
export function ultimosMovimientos(
  movimientos: readonly Movimiento[],
  estudiantes: readonly Estudiante[],
  cursos: readonly Curso[],
  limite: number = LIMITE_ULTIMOS_MOVIMIENTOS,
): FilaUltimoMovimiento[] {
  if (limite <= 0) return [];
  const porId = new Map<string, Estudiante>();
  for (const e of estudiantes) {
    if (!porId.has(e.id)) porId.set(e.id, e);
  }

  const candidatos: { fila: FilaUltimoMovimiento; instante: number; posicion: number }[] = [];
  movimientos.forEach((movimiento, posicion) => {
    const estudiante = porId.get(movimiento.estudianteId);
    if (estudiante === undefined) return;
    const curso = cursoDelEstudiante(cursos, estudiante.id);
    if (curso === undefined) return;
    candidatos.push({
      fila: { movimiento, estudianteNombre: estudiante.nombre, cursoId: curso.id, cursoNombre: curso.nombre },
      instante: Date.parse(movimiento.fecha),
      posicion,
    });
  });

  candidatos.sort((a, b) => b.instante - a.instante || b.posicion - a.posicion);
  return candidatos.slice(0, limite).map((c) => c.fila);
}
