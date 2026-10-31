import { ErrorIdentidad } from '../aplicacion/identidad';
import { crearIdentidadSupabase } from './identidadSupabase';

type Peticion = { url: string; init: { method: string; headers: Record<string, string>; body?: string } };

const fetchOriginal = globalThis.fetch;

/** Reemplaza fetch por un Supabase falso que responde con el código y el cuerpo indicados. */
function simularSupabase(status: number, cuerpo: unknown = {}) {
  const peticiones: Peticion[] = [];
  globalThis.fetch = (async (url: string, init: Peticion['init']) => {
    peticiones.push({ url, init });
    return { ok: status >= 200 && status < 300, status, json: async () => cuerpo };
  }) as unknown as typeof fetch;
  return peticiones;
}

/** Reemplaza fetch por uno que falla como cuando no hay red. */
function simularSinRed() {
  let llamadas = 0;
  globalThis.fetch = (async () => {
    llamadas++;
    throw new TypeError('Network request failed');
  }) as unknown as typeof fetch;
  return () => llamadas;
}

/** Reemplaza fetch por uno que responde 200 pero con un cuerpo que no es JSON (p. ej. una página de un proxy). */
function simularCuerpoNoJson() {
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  })) as unknown as typeof fetch;
}

const URL_PROYECTO = 'https://proyecto.supabase.co';
const CLAVE = 'clave-publica-de-prueba';
const AHORA = 1_800_000_000_000;
const relojFijo = () => AHORA;

const respuestaToken = {
  access_token: 'ACCESS',
  refresh_token: 'REFRESH-NUEVO',
  expires_in: 3600,
  user: { email: 'profe@colegio.cl' },
};

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

describe('identidadSupabase', () => {
  describe('respuesta exitosa', () => {
    it('al iniciar sesión convierte un 200 en una Sesion que expira en ahora + expires_in (en ms)', async () => {
      const peticiones = simularSupabase(200, respuestaToken);

      const sesion = await crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).iniciarSesion(
        'profe@colegio.cl',
        'secreta',
      );

      expect(sesion).toEqual({
        accessToken: 'ACCESS',
        refreshToken: 'REFRESH-NUEVO',
        expiraEn: AHORA + 3600 * 1000,
        correo: 'profe@colegio.cl',
      });
      expect(peticiones).toHaveLength(1);
      expect(peticiones[0]!.url).toBe(`${URL_PROYECTO}/auth/v1/token?grant_type=password`);
      expect(peticiones[0]!.init.method).toBe('POST');
      expect(peticiones[0]!.init.headers.apikey).toBe(CLAVE);
      expect(JSON.parse(peticiones[0]!.init.body!)).toEqual({ email: 'profe@colegio.cl', password: 'secreta' });
    });

    it('al renovar convierte un 200 en una Sesion con el refresh token rotado y la expiración calculada', async () => {
      const peticiones = simularSupabase(200, { ...respuestaToken, expires_in: 60 });

      const sesion = await crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).renovar('REFRESH-VIEJO');

      expect(sesion.refreshToken).toBe('REFRESH-NUEVO');
      expect(sesion.expiraEn).toBe(AHORA + 60_000);
      expect(peticiones[0]!.url).toBe(`${URL_PROYECTO}/auth/v1/token?grant_type=refresh_token`);
      expect(JSON.parse(peticiones[0]!.init.body!)).toEqual({ refresh_token: 'REFRESH-VIEJO' });
    });

    it('si Supabase no devuelve el correo, usa el que escribió el profesor', async () => {
      simularSupabase(200, { access_token: 'A', refresh_token: 'R', expires_in: 3600 });

      const sesion = await crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).iniciarSesion('otro@colegio.cl', 'x');

      expect(sesion.correo).toBe('otro@colegio.cl');
    });
  });

  describe('errores', () => {
    it('un 400 al iniciar sesión da CREDENCIALES', async () => {
      simularSupabase(400, { error: 'invalid_grant' });

      const intento = crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).iniciarSesion('profe@colegio.cl', 'mala');

      await expect(intento).rejects.toBeInstanceOf(ErrorIdentidad);
      await expect(intento).rejects.toMatchObject({ motivo: 'CREDENCIALES' });
    });

    it('un 400 al renovar la sesión da SESION_EXPIRADA', async () => {
      simularSupabase(400, { error: 'invalid_grant' });

      const intento = crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).renovar('REFRESH-REVOCADO');

      await expect(intento).rejects.toBeInstanceOf(ErrorIdentidad);
      await expect(intento).rejects.toMatchObject({ motivo: 'SESION_EXPIRADA' });
    });

    it.each([
      ['sin URL', undefined, CLAVE],
      ['con URL vacía', '', CLAVE],
      ['sin clave', URL_PROYECTO, undefined],
      ['con clave vacía', URL_PROYECTO, ''],
    ])('%s da SIN_CONFIGURACION y no llama a la red', async (_caso, url, clave) => {
      const peticiones = simularSupabase(200, respuestaToken);
      const identidad = crearIdentidadSupabase(url, clave, relojFijo);

      await expect(identidad.iniciarSesion('profe@colegio.cl', 'secreta')).rejects.toMatchObject({
        motivo: 'SIN_CONFIGURACION',
      });
      await expect(identidad.renovar('REFRESH')).rejects.toMatchObject({ motivo: 'SIN_CONFIGURACION' });
      expect(peticiones).toHaveLength(0);
    });

    it('si fetch lanza un error (sin red) al iniciar sesión da SIN_CONEXION', async () => {
      const llamadas = simularSinRed();

      await expect(
        crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).iniciarSesion('profe@colegio.cl', 'secreta'),
      ).rejects.toMatchObject({ motivo: 'SIN_CONEXION' });
      expect(llamadas()).toBe(1);
    });

    it('si fetch lanza un error (sin red) al renovar da SIN_CONEXION, no SESION_EXPIRADA', async () => {
      simularSinRed();

      await expect(crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).renovar('REFRESH')).rejects.toMatchObject({
        motivo: 'SIN_CONEXION',
      });
    });
  });

  // Un 200 no garantiza un cuerpo bien formado. Si dejáramos pasar campos faltantes,
  // expiraEn quedaría NaN y el GestorSesion renovaría en cada envío y nunca revocaría al cerrar sesión.
  describe('respuesta 200 con un cuerpo inválido', () => {
    const { expires_in: _sinExpiracion, ...sinExpiracion } = respuestaToken;
    const { access_token: _sinAccess, ...sinAccess } = respuestaToken;
    const { refresh_token: _sinRefresh, ...sinRefresh } = respuestaToken;

    it.each([
      ['sin expires_in', sinExpiracion],
      ['con expires_in como texto', { ...respuestaToken, expires_in: '3600' }],
      ['con expires_in en 0', { ...respuestaToken, expires_in: 0 }],
      ['con expires_in negativo', { ...respuestaToken, expires_in: -60 }],
      ['sin access_token', sinAccess],
      ['con access_token vacío', { ...respuestaToken, access_token: '' }],
      ['sin refresh_token', sinRefresh],
      ['con un cuerpo que no es un objeto', null],
    ])('%s da RESPUESTA_INVALIDA al iniciar sesión y al renovar', async (_caso, cuerpo) => {
      simularSupabase(200, cuerpo);
      const identidad = crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo);

      await expect(identidad.iniciarSesion('profe@colegio.cl', 'secreta')).rejects.toMatchObject({
        motivo: 'RESPUESTA_INVALIDA',
      });
      await expect(identidad.renovar('REFRESH')).rejects.toMatchObject({ motivo: 'RESPUESTA_INVALIDA' });
    });

    it('un cuerpo que no es JSON da RESPUESTA_INVALIDA, no un SyntaxError suelto', async () => {
      simularCuerpoNoJson();

      const intento = crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).iniciarSesion('profe@colegio.cl', 'x');

      await expect(intento).rejects.toBeInstanceOf(ErrorIdentidad);
      await expect(intento).rejects.toMatchObject({ motivo: 'RESPUESTA_INVALIDA' });
    });
  });

  // El puerto ProveedorIdentidad promete errores ErrorIdentidad. cerrarSesion también debe cumplirlo,
  // aunque hoy el GestorSesion ignore el error (la sesión local ya se borró antes).
  describe('cerrarSesion', () => {
    it('revoca la sesión en Supabase con POST /auth/v1/logout y el access token', async () => {
      const peticiones = simularSupabase(204);

      await crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).cerrarSesion('ACCESS');

      expect(peticiones).toHaveLength(1);
      expect(peticiones[0]!.url).toBe(`${URL_PROYECTO}/auth/v1/logout`);
      expect(peticiones[0]!.init.method).toBe('POST');
      expect(peticiones[0]!.init.headers.apikey).toBe(CLAVE);
      expect(peticiones[0]!.init.headers.Authorization).toBe('Bearer ACCESS');
    });

    it('sin red da SIN_CONEXION como ErrorIdentidad, no un TypeError suelto', async () => {
      simularSinRed();

      const intento = crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).cerrarSesion('ACCESS');

      await expect(intento).rejects.toBeInstanceOf(ErrorIdentidad);
      await expect(intento).rejects.toMatchObject({ motivo: 'SIN_CONEXION' });
    });

    it('si Supabase responde un error (500) no lo da por revocado: rechaza con SIN_CONEXION', async () => {
      simularSupabase(500);

      await expect(crearIdentidadSupabase(URL_PROYECTO, CLAVE, relojFijo).cerrarSesion('ACCESS')).rejects.toMatchObject({
        motivo: 'SIN_CONEXION',
      });
    });

    it('sin configuración da SIN_CONFIGURACION y no llama a la red', async () => {
      const peticiones = simularSupabase(204);

      await expect(crearIdentidadSupabase(undefined, CLAVE, relojFijo).cerrarSesion('ACCESS')).rejects.toMatchObject({
        motivo: 'SIN_CONFIGURACION',
      });
      expect(peticiones).toHaveLength(0);
    });
  });
});
