import { ErrorDominio } from './errores';
import { crearOtorgamientoMasivo, yaRecibioEnLote } from './lote';

function generadorDeIds() {
  let n = 0;
  return () => `id${++n}`;
}

describe('crearOtorgamientoMasivo', () => {
  it('crea un movimiento por estudiante, todos con el mismo loteId', () => {
    const movimientos = crearOtorgamientoMasivo(
      { estudianteIds: ['e1', 'e2'], asignatura: 'MAT', cantidad: 2, motivo: 'Tarea' },
      generadorDeIds(),
      new Date('2026-10-28T12:00:00Z'),
    );

    expect(movimientos).toHaveLength(2);
    expect(new Set(movimientos.map((m) => m.loteId)).size).toBe(1);
    expect(movimientos.every((m) => m.tipo === 'OTORGAR' && m.cantidad === 2 && m.motivo === 'Tarea')).toBe(true);
  });

  it('nadie recibe dos veces en el mismo lote', () => {
    const movimientos = crearOtorgamientoMasivo(
      { estudianteIds: ['e1', 'e1', 'e2'], asignatura: 'MAT', cantidad: 1 },
      generadorDeIds(),
    );
    expect(movimientos.map((m) => m.estudianteId)).toEqual(['e1', 'e2']);
  });

  it('exige al menos un estudiante y una cantidad válida', () => {
    expect(() => crearOtorgamientoMasivo({ estudianteIds: [], asignatura: 'MAT', cantidad: 1 }, generadorDeIds())).toThrow(
      ErrorDominio,
    );
    expect(() => crearOtorgamientoMasivo({ estudianteIds: ['e1'], asignatura: 'MAT', cantidad: 0 }, generadorDeIds())).toThrow(
      ErrorDominio,
    );
  });

  it('yaRecibioEnLote detecta quién ya recibió (para el futuro modo ráfaga)', () => {
    const movimientos = crearOtorgamientoMasivo({ estudianteIds: ['e1'], asignatura: 'MAT', cantidad: 1 }, generadorDeIds());
    const loteId = movimientos[0]!.loteId!;
    expect(yaRecibioEnLote(movimientos, loteId, 'e1')).toBe(true);
    expect(yaRecibioEnLote(movimientos, loteId, 'e2')).toBe(false);
  });
});
