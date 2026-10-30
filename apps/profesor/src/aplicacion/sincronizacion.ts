import type { Movimiento } from '../dominio/movimiento';

/** Puerto: qué movimientos faltan por enviar al servidor. */
export interface RegistroPendientes {
  /** Los no enviados, en el orden en que se registraron. */
  pendientes(): Promise<Movimiento[]>;
  marcarSincronizados(ids: readonly string[]): Promise<void>;
  contarPendientes(): Promise<number>;
}

/** Puerto: cómo se envía un movimiento al servidor. Lanza ErrorEnvio si no lo logra. */
export interface ClienteDecimas {
  enviar(movimiento: Movimiento): Promise<void>;
}

export type MotivoErrorEnvio = 'SIN_CONFIGURACION' | 'SIN_CONEXION' | 'RECHAZADO';

export class ErrorEnvio extends Error {
  readonly motivo: MotivoErrorEnvio;

  constructor(motivo: MotivoErrorEnvio, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorEnvio';
    this.motivo = motivo;
    Object.setPrototypeOf(this, ErrorEnvio.prototype);
  }
}

export type ResultadoSincronizacion = {
  enviados: number;
  pendientes: number;
  error?: string;
};

/**
 * Envía los pendientes de a uno y EN ORDEN. Si uno falla, se detiene:
 * el servidor valida cada canje con su propio historial, así que no podemos saltarnos ninguno.
 */
export function crearSincronizador(registro: RegistroPendientes, cliente: ClienteDecimas) {
  let enCurso: Promise<ResultadoSincronizacion> | null = null;

  async function ejecutar(): Promise<ResultadoSincronizacion> {
    const pendientes = await registro.pendientes();
    let enviados = 0;
    for (const movimiento of pendientes) {
      try {
        await cliente.enviar(movimiento);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        return { enviados, pendientes: pendientes.length - enviados, error: mensaje };
      }
      // Se marca apenas el servidor confirma: si la app se cierra a la mitad, no se pierde el avance.
      await registro.marcarSincronizados([movimiento.id]);
      enviados += 1;
    }
    return { enviados, pendientes: 0 };
  }

  return {
    /** Si ya hay una sincronización en curso, devuelve esa misma en vez de empezar otra. */
    sincronizar(): Promise<ResultadoSincronizacion> {
      enCurso ??= ejecutar().finally(() => {
        enCurso = null;
      });
      return enCurso;
    },
    contarPendientes: () => registro.contarPendientes(),
  };
}

export type Sincronizador = ReturnType<typeof crearSincronizador>;