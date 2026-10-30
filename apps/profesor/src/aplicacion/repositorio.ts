import type { Movimiento } from '../dominio/movimiento';

/** Puerto: lo que la app necesita para guardar movimientos, sin decir dónde ni cómo. */
export interface RepositorioMovimientos {
  /** Todos los movimientos, en el orden en que se registraron. */
  todos(): Promise<Movimiento[]>;
  /** Guarda todos o ninguno. Si un id ya existe, lo ignora (idempotencia). */
  insertar(movimientos: readonly Movimiento[]): Promise<void>;
}