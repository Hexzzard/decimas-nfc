import { ErrorDominio } from './errores';
import type { Estudiante } from './estudiante';

/** Grupo con nombre de estudiantes. Cada estudiante pertenece a un solo curso. */
export interface Curso {
  readonly id: string;
  readonly nombre: string;
  /** Ids de los estudiantes, en el orden en que se muestran. */
  readonly estudianteIds: readonly string[];
}

/**
 * Estudiantes del curso, en el orden de `curso.estudianteIds`.
 * Ignora ids inexistentes y no repite ids duplicados (primera aparición).
 */
export function estudiantesDelCurso(curso: Curso, estudiantes: readonly Estudiante[]): Estudiante[] {
  const porId = new Map<string, Estudiante>();
  for (const e of estudiantes) {
    if (!porId.has(e.id)) porId.set(e.id, e);
  }
  const vistos = new Set<string>();
  const resultado: Estudiante[] = [];
  for (const id of curso.estudianteIds) {
    const estudiante = porId.get(id);
    if (estudiante === undefined || vistos.has(id)) continue;
    vistos.add(id);
    resultado.push(estudiante);
  }
  return resultado;
}

/** Primer curso (en el orden de `cursos`) que contiene al estudiante, o `undefined`. */
export function cursoDelEstudiante(cursos: readonly Curso[], estudianteId: string): Curso | undefined {
  return cursos.find((c) => c.estudianteIds.includes(estudianteId));
}

/** Regla "un estudiante, un solo curso". Un id repetido dentro del mismo curso no la viola. */
export function validarCursos(cursos: readonly Curso[]): void {
  const cursoDe = new Map<string, string>();
  for (const curso of cursos) {
    for (const id of new Set(curso.estudianteIds)) {
      if (cursoDe.has(id)) {
        throw new ErrorDominio('ESTUDIANTE_EN_VARIOS_CURSOS', `El estudiante ${id} está en más de un curso`);
      }
      cursoDe.set(id, curso.id);
    }
  }
}
