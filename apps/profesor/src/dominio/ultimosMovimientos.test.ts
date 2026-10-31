import type { Curso } from './curso';
import type { Movimiento } from './movimiento';
import { LIMITE_ULTIMOS_MOVIMIENTOS, ultimosMovimientos } from './ultimosMovimientos';

const e1 = { id: 'e1', nombre: 'Martina Rojas' };
const e2 = { id: 'e2', nombre: 'Benjamín Soto' };
const e3 = { id: 'e3', nombre: 'Florencia Muñoz' };
const e5 = { id: 'e5', nombre: 'Josefa Contreras' };
const e9 = { id: 'e9', nombre: 'Sin Curso' };
const estudiantes = [e1, e2, e3, e5, e9];
const c1: Curso = { id: 'c1', nombre: '1° Medio A', estudianteIds: ['e1', 'e2', 'e3'] };
const c2: Curso = { id: 'c2', nombre: '1° Medio B', estudianteIds: ['e5'] };
const cursos = [c1, c2];

function mov(
  id: string,
  estudianteId: string,
  tipo: 'OTORGAR' | 'CANJEAR',
  cantidad: number,
  fecha: string,
): Movimiento {
  return { id, estudianteId, asignatura: 'MAT', tipo, cantidad, fecha };
}

function crearMovs(): Movimiento[] {
  return [
    mov('m1', 'e1', 'OTORGAR', 3, '2026-10-20T14:10:00Z'),
    mov('m2', 'e5', 'OTORGAR', 2, '2026-10-22T10:00:00Z'),
    mov('m3', 'e1', 'CANJEAR', 1, '2026-10-25T09:00:00Z'),
    mov('m4', 'e9', 'OTORGAR', 4, '2026-10-26T09:00:00Z'),
    mov('m5', 'e404', 'OTORGAR', 1, '2026-10-26T10:00:00Z'),
    mov('m6', 'e3', 'OTORGAR', 2, '2026-10-25T09:00:00Z'),
    mov('m7', 'e5', 'CANJEAR', 1, '2026-10-21T08:00:00Z'),
  ];
}

const ids = (filas: { movimiento: Movimiento }[]) => filas.map((f) => f.movimiento.id);

describe('ultimosMovimientos', () => {
  it('CA-12: ordena por fecha descendente, desempata por registro posterior y omite sin curso/desconocidos', () => {
    const movs = crearMovs();
    const [m1, m2, m3, , , m6, m7] = movs;
    const filas = ultimosMovimientos(movs, estudiantes, cursos);
    expect(ids(filas)).toEqual(['m6', 'm3', 'm2', 'm7', 'm1']);
    expect(filas).toEqual([
      { movimiento: m6, estudianteNombre: 'Florencia Muñoz', cursoId: 'c1', cursoNombre: '1° Medio A' },
      { movimiento: m3, estudianteNombre: 'Martina Rojas', cursoId: 'c1', cursoNombre: '1° Medio A' },
      { movimiento: m2, estudianteNombre: 'Josefa Contreras', cursoId: 'c2', cursoNombre: '1° Medio B' },
      { movimiento: m7, estudianteNombre: 'Josefa Contreras', cursoId: 'c2', cursoNombre: '1° Medio B' },
      { movimiento: m1, estudianteNombre: 'Martina Rojas', cursoId: 'c1', cursoNombre: '1° Medio A' },
    ]);
    expect(filas[0].movimiento).toBe(m6);
  });

  it('CA-12: compara las fechas como instantes, no como texto', () => {
    const a = mov('a', 'e1', 'OTORGAR', 1, '2026-10-20T10:00:00+02:00'); // 08:00Z
    const b = mov('b', 'e1', 'OTORGAR', 1, '2026-10-20T09:00:00Z'); // más reciente
    expect(ids(ultimosMovimientos([a, b], estudiantes, cursos))).toEqual(['b', 'a']);
  });

  it('CA-13: respeta el límite indicado', () => {
    expect(ids(ultimosMovimientos(crearMovs(), estudiantes, cursos, 2))).toEqual(['m6', 'm3']);
  });

  it('CA-13: con límite 0 devuelve []', () => {
    expect(ultimosMovimientos(crearMovs(), estudiantes, cursos, 0)).toEqual([]);
  });

  it('CA-13: con un límite mayor al disponible devuelve las 5 filas', () => {
    expect(ids(ultimosMovimientos(crearMovs(), estudiantes, cursos, 50))).toEqual([
      'm6',
      'm3',
      'm2',
      'm7',
      'm1',
    ]);
  });

  it('CA-14: el límite por defecto es 10', () => {
    expect(LIMITE_ULTIMOS_MOVIMIENTOS).toBe(10);
    const movs: Movimiento[] = [];
    for (let k = 1; k <= 12; k++) {
      const dia = String(k).padStart(2, '0');
      movs.push(mov(`n${k}`, 'e1', 'OTORGAR', 1, `2026-10-${dia}T10:00:00Z`));
    }
    const filas = ultimosMovimientos(movs, estudiantes, cursos);
    expect(filas).toHaveLength(10);
    expect(ids(filas)).toEqual([
      'n12', 'n11', 'n10', 'n9', 'n8', 'n7', 'n6', 'n5', 'n4', 'n3',
    ]);
  });

  it('CA-15: sin movimientos devuelve []', () => {
    expect(ultimosMovimientos([], estudiantes, cursos)).toEqual([]);
  });

  it('CA-15: sin cursos devuelve [] (nadie tiene curso)', () => {
    expect(ultimosMovimientos(crearMovs(), estudiantes, [])).toEqual([]);
  });

  it('CA-15: sin estudiantes devuelve []', () => {
    expect(ultimosMovimientos(crearMovs(), [], cursos)).toEqual([]);
  });

  it('CA-15: un id en un curso pero ausente de estudiantes sigue omitido', () => {
    const c4: Curso = { id: 'c4', nombre: 'Z', estudianteIds: ['e404'] };
    expect(ids(ultimosMovimientos(crearMovs(), estudiantes, [...cursos, c4]))).toEqual([
      'm6',
      'm3',
      'm2',
      'm7',
      'm1',
    ]);
  });

  it('CA-16: no reordena ni muta el arreglo de movimientos', () => {
    const movs = crearMovs();
    ultimosMovimientos(movs, estudiantes, cursos);
    expect(movs.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']);
  });
});
