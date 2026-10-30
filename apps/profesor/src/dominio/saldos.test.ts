import { ErrorDominio } from './errores';
import type { Movimiento } from './movimiento';
import { calcularSaldos, historialDe, validarMovimiento } from './saldos';

let contador = 0;
function mov(datos: Partial<Movimiento> = {}): Movimiento {
  contador += 1;
  return {
    id: `m${contador}`,
    estudianteId: 'e1',
    asignatura: 'MAT',
    tipo: 'OTORGAR',
    cantidad: 1,
    fecha: '2026-10-28T12:00:00Z',
    ...datos,
  };
}

describe('calcularSaldos', () => {
  it('sin movimientos, todas las asignaturas quedan en cero', () => {
    expect(calcularSaldos([], 'e1')).toEqual({ MAT: 0, LEN: 0, CIE: 0, HIS: 0 });
  });

  it('suma lo otorgado y resta lo canjeado, por asignatura', () => {
    const historial = [
      mov({ cantidad: 5 }),
      mov({ tipo: 'CANJEAR', cantidad: 2 }),
      mov({ asignatura: 'HIS', cantidad: 3 }),
    ];
    expect(calcularSaldos(historial, 'e1')).toEqual({ MAT: 3, LEN: 0, CIE: 0, HIS: 3 });
  });

  it('ignora los movimientos de otros estudiantes', () => {
    const historial = [mov({ cantidad: 4 }), mov({ estudianteId: 'e2', cantidad: 9 })];
    expect(calcularSaldos(historial, 'e1').MAT).toBe(4);
  });
});

describe('validarMovimiento', () => {
  it.each([0, -1, 1.5])('rechaza la cantidad %p', (cantidad) => {
    expect(() => validarMovimiento([], mov({ cantidad }))).toThrow(ErrorDominio);
  });

  it('rechaza canjear más que el saldo disponible', () => {
    expect(() => validarMovimiento([mov({ cantidad: 2 })], mov({ tipo: 'CANJEAR', cantidad: 3 }))).toThrow(
      /Saldo insuficiente/,
    );
  });

  it('permite canjear exactamente el saldo disponible', () => {
    expect(() => validarMovimiento([mov({ cantidad: 2 })], mov({ tipo: 'CANJEAR', cantidad: 2 }))).not.toThrow();
  });
});

describe('historialDe', () => {
  it('devuelve los más recientes primero, con límite', () => {
    const historial = [mov({ id: 'a' }), mov({ id: 'b' }), mov({ id: 'c' })];
    expect(historialDe(historial, 'e1', 2).map((m) => m.id)).toEqual(['c', 'b']);
  });
});
