import { ErrorIdentidad, type AlmacenSeguro, type ProveedorIdentidad, type Sesion } from './identidad';

export type EstadoSesion = {
  /** true si hay un refresh token guardado (aunque el access token haya expirado). */
  readonly activa: boolean;
  readonly correo: string | null;
};

/** Se renueva un poco antes de que expire, para que no venza a mitad de una sincronización. */
const MARGEN_MS = 60_000;

/**
 * Caso de uso: mantener la sesión del profesor.
 * - El access token se guarda solo en memoria.
 * - En el almacén seguro solo se guarda { refreshToken, correo }.
 * - Si hay varias peticiones a la vez y el token expiró, se renueva UNA sola vez.
 */
export function crearGestorSesion(
  proveedor: ProveedorIdentidad,
  almacen: AlmacenSeguro,
  ahora: () => number = Date.now,
) {
  let sesion: Sesion | null = null;
  let renovando: Promise<Sesion> | null = null;
  const oyentes = new Set<(estado: EstadoSesion) => void>();

  function estado(): EstadoSesion {
    return { activa: sesion !== null, correo: sesion?.correo ?? null };
  }

  function notificar() {
    const actual = estado();
    oyentes.forEach((oyente) => oyente(actual));
  }

  async function guardar(nueva: Sesion) {
    sesion = nueva;
    await almacen.guardar(JSON.stringify({ refreshToken: nueva.refreshToken, correo: nueva.correo }));
    notificar();
  }

  async function olvidar() {
    sesion = null;
    await almacen.borrar();
    notificar();
  }

  return {
    estado,

    /** Para React: avisa cada vez que la sesión cambia. Devuelve la función para dejar de escuchar. */
    suscribir(oyente: (estado: EstadoSesion) => void): () => void {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },

    /** Al abrir la app: recupera la sesión guardada. No usa la red, así que funciona sin conexión. */
    async restaurar(): Promise<void> {
      const guardado = await almacen.leer();
      if (!guardado) return;
      try {
        const { refreshToken, correo } = JSON.parse(guardado) as { refreshToken: string; correo: string };
        // Sin access token: se pedirá uno nuevo recién cuando haga falta (al sincronizar).
        sesion = { accessToken: '', refreshToken, expiraEn: 0, correo };
        notificar();
      } catch {
        await olvidar(); // dato corrupto: mejor pedir inicio de sesión de nuevo
      }
    },

    async iniciarSesion(correo: string, clave: string): Promise<void> {
      await guardar(await proveedor.iniciarSesion(correo.trim(), clave));
    },

    async cerrarSesion(): Promise<void> {
      const anterior = sesion;
      await olvidar(); // primero localmente: cerrar sesión debe funcionar aunque no haya internet
      if (anterior && anterior.expiraEn > ahora()) {
        await proveedor.cerrarSesion(anterior.accessToken).catch(() => undefined);
      }
    },

    /** Lo usa el cliente HTTP antes de cada envío. Lanza ErrorIdentidad si no hay forma de obtener uno. */
    async obtenerTokenVigente(): Promise<string> {
      const actual = sesion;
      if (!actual) {
        throw new ErrorIdentidad('SIN_SESION', 'Inicia sesión para sincronizar');
      }
      if (actual.expiraEn - MARGEN_MS > ahora()) {
        return actual.accessToken;
      }
      renovando ??= proveedor
        .renovar(actual.refreshToken)
        .then(async (nueva) => {
          await guardar(nueva);
          return nueva;
        })
        .catch(async (error: unknown) => {
          // Solo se cierra la sesión si el proveedor la rechazó; sin internet, se conserva para reintentar.
          if (error instanceof ErrorIdentidad && error.motivo === 'SESION_EXPIRADA') {
            await olvidar();
          }
          throw error;
        })
        .finally(() => {
          renovando = null;
        });
      return (await renovando).accessToken;
    },
  };
}

export type GestorSesion = ReturnType<typeof crearGestorSesion>;