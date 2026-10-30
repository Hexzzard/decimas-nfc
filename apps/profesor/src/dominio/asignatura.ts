export const ASIGNATURAS = ['MAT', 'LEN', 'CIE', 'HIS'] as const;

export type Asignatura = (typeof ASIGNATURAS)[number];

export const NOMBRES_ASIGNATURA: Record<Asignatura, string> = {
  MAT: 'Matemáticas',
  LEN: 'Lenguaje',
  CIE: 'Ciencias',
  HIS: 'Historia',
};