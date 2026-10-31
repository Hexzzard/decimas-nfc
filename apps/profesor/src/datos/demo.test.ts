import { cursoDelEstudiante, validarCursos } from '../dominio/curso';
import { ultimosMovimientos } from '../dominio/ultimosMovimientos';
import { CURSOS_DEMO, ESTUDIANTES_DEMO, MOVIMIENTOS_DEMO } from './demo';

describe('datos de ejemplo', () => {
  it('CA-17: CURSOS_DEMO es exactamente el contenido de la spec', () => {
    expect(CURSOS_DEMO).toEqual([
      { id: 'c1', nombre: '1° Medio A', estudianteIds: ['e1', 'e2', 'e3', 'e4'] },
      { id: 'c2', nombre: '1° Medio B', estudianteIds: ['e5', 'e6', 'e7', 'e8'] },
    ]);
  });

  it('CA-17: validarCursos(CURSOS_DEMO) no lanza', () => {
    expect(() => validarCursos(CURSOS_DEMO)).not.toThrow();
  });

  it('CA-17: ids de cursos únicos y todos los estudianteIds existen en ESTUDIANTES_DEMO', () => {
    const idsCursos = CURSOS_DEMO.map((c) => c.id);
    expect(new Set(idsCursos).size).toBe(idsCursos.length);
    const idsEstudiantes = new Set(ESTUDIANTES_DEMO.map((e) => e.id));
    for (const curso of CURSOS_DEMO) {
      for (const id of curso.estudianteIds) {
        expect(idsEstudiantes.has(id)).toBe(true);
      }
    }
  });

  it('CA-17: cada estudiante de ESTUDIANTES_DEMO tiene curso', () => {
    for (const e of ESTUDIANTES_DEMO) {
      expect(cursoDelEstudiante(CURSOS_DEMO, e.id)).toBeDefined();
    }
  });

  it('CA-17: ESTUDIANTES_DEMO y MOVIMIENTOS_DEMO no cambian (8 estudiantes e1..e8, 4 movimientos)', () => {
    expect(ESTUDIANTES_DEMO.map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8']);
    expect(MOVIMIENTOS_DEMO).toHaveLength(4);
  });

  it('CA-17: los últimos movimientos demo salen del más nuevo al más antiguo, todos de 1° Medio A', () => {
    const filas = ultimosMovimientos(MOVIMIENTOS_DEMO, ESTUDIANTES_DEMO, CURSOS_DEMO);
    expect(filas.map((f) => f.movimiento.id)).toEqual([
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
    ]);
    for (const f of filas) {
      expect(f.cursoNombre).toBe('1° Medio A');
    }
  });
});
