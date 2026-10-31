import type { Movimiento } from './movimiento';
import { calcularSaldos } from './saldos';

describe('sin regresiones por la introducción de cursos', () => {
  it('CA-18: calcularSaldos mantiene su firma (movimientos, estudianteId) y no depende de cursos', () => {
    const m: Movimiento = {
      id: 'm1',
      estudianteId: 'e1',
      asignatura: 'MAT',
      tipo: 'OTORGAR',
      cantidad: 5,
      fecha: '2026-10-20T14:10:00Z',
    };
    expect(calcularSaldos([m], 'e1').MAT).toBe(5);
  });
});
