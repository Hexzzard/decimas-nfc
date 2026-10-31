import { cursoDelEstudiante, estudiantesDelCurso, validarCursos } from './curso';
import type { Curso } from './curso';
import { ErrorDominio } from './errores';

const e1 = { id: 'e1', nombre: 'Martina Rojas' };
const e2 = { id: 'e2', nombre: 'Benjamín Soto' };
const e3 = { id: 'e3', nombre: 'Florencia Muñoz' };
const e5 = { id: 'e5', nombre: 'Josefa Contreras' };
const e9 = { id: 'e9', nombre: 'Sin Curso' };
const estudiantes = [e1, e2, e3, e5, e9];
const c1: Curso = { id: 'c1', nombre: '1° Medio A', estudianteIds: ['e1', 'e2', 'e3'] };
const c2: Curso = { id: 'c2', nombre: '1° Medio B', estudianteIds: ['e5'] };
const cursos = [c1, c2];

function curso(estudianteIds: string[]): Curso {
  return { id: 'c9', nombre: 'X', estudianteIds };
}

describe('estudiantesDelCurso', () => {
  it('CA-1: devuelve los estudiantes del curso (mismos objetos) sin los de otros cursos', () => {
    const r = estudiantesDelCurso(c1, estudiantes);
    expect(r).toHaveLength(3);
    expect(r[0]).toBe(e1);
    expect(r[1]).toBe(e2);
    expect(r[2]).toBe(e3);
    expect(r).not.toContain(e5);
    expect(r).not.toContain(e9);
  });

  it('CA-2: respeta el orden de estudianteIds del curso', () => {
    const r = estudiantesDelCurso(curso(['e3', 'e1']), estudiantes);
    expect(r).toEqual([e3, e1]);
  });

  it('CA-3: ignora ids inexistentes sin lanzar error', () => {
    expect(() => estudiantesDelCurso(curso(['e1', 'e99']), estudiantes)).not.toThrow();
    expect(estudiantesDelCurso(curso(['e1', 'e99']), estudiantes)).toEqual([e1]);
  });

  it('CA-4: no repite a un estudiante con id duplicado (primera aparición)', () => {
    const r = estudiantesDelCurso(curso(['e2', 'e1', 'e2']), estudiantes);
    expect(r).toHaveLength(2);
    expect(r).toEqual([e2, e1]);
  });

  it('CA-5: curso sin ids devuelve []', () => {
    expect(estudiantesDelCurso(curso([]), estudiantes)).toEqual([]);
  });

  it('CA-5: sin estudiantes devuelve []', () => {
    expect(estudiantesDelCurso(c1, [])).toEqual([]);
  });

  it('CA-6: no muta sus argumentos y devuelve un arreglo nuevo', () => {
    const r = estudiantesDelCurso(c1, estudiantes);
    expect(c1.estudianteIds).toEqual(['e1', 'e2', 'e3']);
    expect(estudiantes).toEqual([e1, e2, e3, e5, e9]);
    expect(r).not.toBe(estudiantes);
  });
});

describe('cursoDelEstudiante', () => {
  it('CA-7: devuelve el curso (mismo objeto) que contiene al estudiante', () => {
    expect(cursoDelEstudiante(cursos, 'e3')).toBe(c1);
    expect(cursoDelEstudiante(cursos, 'e5')).toBe(c2);
  });

  it('CA-8: devuelve undefined si el estudiante no tiene curso', () => {
    expect(cursoDelEstudiante(cursos, 'e9')).toBeUndefined();
  });

  it('CA-8: devuelve undefined si el estudiante no existe', () => {
    expect(cursoDelEstudiante(cursos, 'e99')).toBeUndefined();
  });

  it('CA-8: devuelve undefined con lista de cursos vacía', () => {
    expect(cursoDelEstudiante([], 'e1')).toBeUndefined();
  });
});

describe('validarCursos', () => {
  it('CA-9: no lanza con cursos sin estudiantes en común', () => {
    expect(() => validarCursos(cursos)).not.toThrow();
  });

  it('CA-9: una lista vacía es válida', () => {
    expect(() => validarCursos([])).not.toThrow();
  });

  it('CA-10: lanza ESTUDIANTE_EN_VARIOS_CURSOS con el id en el mensaje si un estudiante está en dos cursos', () => {
    const c3: Curso = { id: 'c3', nombre: 'Taller', estudianteIds: ['e5', 'e2'] };
    let error: unknown;
    try {
      validarCursos([c1, c3]);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ErrorDominio);
    expect((error as ErrorDominio).codigo).toBe('ESTUDIANTE_EN_VARIOS_CURSOS');
    expect((error as ErrorDominio).message).toContain('e2');
  });

  it('CA-11: un id repetido dentro del mismo curso no es error', () => {
    expect(() => validarCursos([curso(['e1', 'e1']), c2])).not.toThrow();
  });
});
