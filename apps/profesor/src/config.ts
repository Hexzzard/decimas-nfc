import { NOMBRES_ASIGNATURA, type Asignatura } from './dominio/asignatura';

/** Por ahora la app trabaja con una sola asignatura. */
export const ASIGNATURA_ACTUAL: Asignatura = 'MAT';
export const NOMBRE_ASIGNATURA_ACTUAL = NOMBRES_ASIGNATURA[ASIGNATURA_ACTUAL];

export const MOTIVOS_RAPIDOS = ['Participación', 'Tarea', 'Buen comportamiento', 'Desafío'] as const;
export const URL_API = process.env.EXPO_PUBLIC_API_URL;

/** Supabase Auth. Ambos valores son públicos por diseño (viajan dentro de la app). */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;