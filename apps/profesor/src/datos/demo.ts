import type { Curso } from '../dominio/curso';
import type { Estudiante } from '../dominio/estudiante';
import type { Movimiento } from '../dominio/movimiento';

export const ESTUDIANTES_DEMO: Estudiante[] = [
  { id: 'e1', nombre: 'Martina Rojas' },
  { id: 'e2', nombre: 'Benjamín Soto' },
  { id: 'e3', nombre: 'Florencia Muñoz' },
  { id: 'e4', nombre: 'Vicente Díaz' },
  { id: 'e5', nombre: 'Josefa Contreras' },
  { id: 'e6', nombre: 'Agustín Pérez' },
  { id: 'e7', nombre: 'Isidora Silva' },
  { id: 'e8', nombre: 'Tomás Morales' },
];

export const MOVIMIENTOS_DEMO: Movimiento[] = [
  { id: '00000000-0000-4000-8000-000000000001', estudianteId: 'e1', asignatura: 'MAT', tipo: 'OTORGAR', cantidad: 3, fecha: '2026-10-20T14:10:00Z', motivo: 'Participación' },
  { id: '00000000-0000-4000-8000-000000000002', estudianteId: 'e1', asignatura: 'MAT', tipo: 'OTORGAR', cantidad: 2, fecha: '2026-10-23T15:30:00Z', motivo: 'Tarea' },
  { id: '00000000-0000-4000-8000-000000000003', estudianteId: 'e1', asignatura: 'MAT', tipo: 'CANJEAR', cantidad: 4, fecha: '2026-10-27T13:00:00Z' },
  { id: '00000000-0000-4000-8000-000000000004', estudianteId: 'e3', asignatura: 'MAT', tipo: 'OTORGAR', cantidad: 5, fecha: '2026-10-27T13:05:00Z', motivo: 'Buen comportamiento' },
];

export const CURSOS_DEMO: Curso[] = [
  { id: 'c1', nombre: '1° Medio A', estudianteIds: ['e1', 'e2', 'e3', 'e4'] },
  { id: 'c2', nombre: '1° Medio B', estudianteIds: ['e5', 'e6', 'e7', 'e8'] },
];
