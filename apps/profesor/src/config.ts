import { NOMBRES_ASIGNATURA, type Asignatura } from './dominio/asignatura';

/** Por ahora la app trabaja con una sola asignatura. */
export const ASIGNATURA_ACTUAL: Asignatura = 'MAT';
export const NOMBRE_ASIGNATURA_ACTUAL = NOMBRES_ASIGNATURA[ASIGNATURA_ACTUAL];

export const MOTIVOS_RAPIDOS = ['Participación', 'Tarea', 'Buen comportamiento', 'Desafío'] as const;