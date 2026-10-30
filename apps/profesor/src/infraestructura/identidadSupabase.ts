import { ErrorIdentidad, type ProveedorIdentidad, type Sesion } from '../aplicacion/identidad';

/** Lo que responde Supabase Auth en /auth/v1/token. */
type RespuestaToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // segundos
  user?: { email?: string };
};

/**
 * Adaptador: Supabase Auth por HTTP, sin librerías extra.
 * La contraseña va directo de la app a Supabase (HTTPS); nunca pasa por nuestro backend.
 */
export function crearIdentidadSupabase(
  urlProyecto: string | undefined,
  clavePublica: string | undefined,
  ahora: () => number = Date.now,
): ProveedorIdentidad {
  function verificarConfiguracion(): { url: string; clave: string } {
    if (!urlProyecto || !clavePublica) {
      throw new ErrorIdentidad(
        'SIN_CONFIGURACION',
        'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      );
    }
    return { url: urlProyecto, clave: clavePublica };
  }

  async function pedirToken(tipo: 'password' | 'refresh_token', cuerpo: object, correoConocido?: string) {
    const { url, clave } = verificarConfiguracion();
    let respuesta: Response;
    try {
      respuesta = await fetch(`${url}/auth/v1/token?grant_type=${tipo}`, {
        method: 'POST',
        headers: { apikey: clave, 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
    } catch {
      throw new ErrorIdentidad('SIN_CONEXION', 'No se pudo conectar con el servicio de inicio de sesión');
    }

    if (!respuesta.ok) {
      // 400/401: credenciales malas o refresh token inválido, usado o revocado
      if (respuesta.status === 400 || respuesta.status === 401) {
        throw tipo === 'password'
          ? new ErrorIdentidad('CREDENCIALES', 'Correo o contraseña incorrectos')
          : new ErrorIdentidad('SESION_EXPIRADA', 'Tu sesión expiró. Vuelve a iniciar sesión');
      }
      throw new ErrorIdentidad('SIN_CONEXION', `El servicio de inicio de sesión respondió ${respuesta.status}`);
    }

    const datos = (await respuesta.json()) as RespuestaToken;
    const sesion: Sesion = {
      accessToken: datos.access_token,
      refreshToken: datos.refresh_token, // ¡nuevo! el anterior ya no sirve (rotación)
      expiraEn: ahora() + datos.expires_in * 1000,
      correo: datos.user?.email ?? correoConocido ?? '',
    };
    return sesion;
  }

  return {
    iniciarSesion: (correo, clave) => pedirToken('password', { email: correo, password: clave }, correo),

    renovar: (refreshToken) => pedirToken('refresh_token', { refresh_token: refreshToken }),

    async cerrarSesion(accessToken) {
      const { url, clave } = verificarConfiguracion();
      // Revoca los refresh tokens en el servidor. Si falla, el GestorSesion ya borró todo localmente.
      await fetch(`${url}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: clave, Authorization: `Bearer ${accessToken}` },
      });
    },
  };
}