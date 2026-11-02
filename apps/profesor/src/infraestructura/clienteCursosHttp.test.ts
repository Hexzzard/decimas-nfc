import { ErrorIdentidad } from '../aplicacion/identidad';
import { crearClienteCursosHttp } from './clienteHttp';

const respuesta = [
  {
    id: 'c1',
    nombre: '1° Medio A',
    estudiantes: [
      { id: 'e2', nombre: 'Benjamín Soto' },
      { id: 'e3', nombre: 'Florencia Muñoz' },
      { id: 'e1', nombre: 'Martina Rojas' },
    ],
  },
  { id: 'c2', nombre: '1° Medio B', estudiantes: [{ id: 'e5', nombre: 'Josefa Contreras' }] },
];

const catalogo = {
  cursos: [
    { id: 'c1', nombre: '1° Medio A', estudianteIds: ['e2', 'e3', 'e1'] },
    { id: 'c2', nombre: '1° Medio B', estudianteIds: ['e5'] },
  ],
  estudiantes: [
    { id: 'e2', nombre: 'Benjamín Soto' },
    { id: 'e3', nombre: 'Florencia Muñoz' },
    { id: 'e1', nombre: 'Martina Rojas' },
    { id: 'e5', nombre: 'Josefa Contreras' },
  ],
};

type Peticion = { url: string; init: { method?: string; headers: Record<string, string>; body?: string } };

function simularServidor(status: number, cuerpo: unknown) {
  const peticiones: Peticion[] = [];
  globalThis.fetch = (async (url: string, init: Peticion['init']) => {
    peticiones.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => cuerpo,
      text: async () => JSON.stringify(cuerpo),
    };
  }) as unknown as typeof fetch;
  return peticiones;
}

const tokenFijo = async () => 'TOKEN';
const cliente = () => crearClienteCursosHttp('https://api.test', tokenFijo);

describe('clienteCursosHttp', () => {
  it('CA-1: hace GET /api/cursos con el token Bearer y convierte la respuesta conservando el orden', async () => {
    const peticiones = simularServidor(200, respuesta);

    const resultado = await cliente().descargar();

    expect(peticiones).toHaveLength(1);
    expect(peticiones[0]!.url).toBe('https://api.test/api/cursos');
    expect(peticiones[0]!.init.method).toBe('GET');
    expect(peticiones[0]!.init.headers.Authorization).toBe('Bearer TOKEN');
    expect(resultado).toEqual(catalogo);
  });

  it('CA-2: una lista vacía produce un catálogo vacío', async () => {
    simularServidor(200, []);
    expect(await cliente().descargar()).toEqual({ cursos: [], estudiantes: [] });
  });

  it('CA-2: un curso sin estudiantes produce estudianteIds vacío', async () => {
    simularServidor(200, [{ id: 'c5', nombre: 'Vacío', estudiantes: [] }]);
    expect(await cliente().descargar()).toEqual({
      cursos: [{ id: 'c5', nombre: 'Vacío', estudianteIds: [] }],
      estudiantes: [],
    });
  });

  it.each([
    [401, 'NO_AUTENTICADO'],
    [403, 'SIN_PERMISO'],
    [409, 'RECHAZADO'],
    [500, 'RECHAZADO'],
  ])('CA-3: traduce el código %p a %p', async (status, motivo) => {
    simularServidor(status, {});
    await expect(cliente().descargar()).rejects.toMatchObject({ name: 'ErrorEnvio', motivo });
  });

  it('CA-3: un 409 incluye el detail del servidor en el mensaje', async () => {
    simularServidor(409, { detail: 'El estudiante e2 está en más de un curso' });
    await expect(cliente().descargar()).rejects.toMatchObject({
      motivo: 'RECHAZADO',
      message: expect.stringContaining('e2'),
    });
  });

  it('CA-4: si fetch falla, el motivo es SIN_CONEXION', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(cliente().descargar()).rejects.toMatchObject({ motivo: 'SIN_CONEXION' });
  });

  it('CA-5: sin sesión, no llama al servidor y pide iniciar sesión', async () => {
    const peticiones = simularServidor(200, respuesta);
    const sinSesion = async () => {
      throw new ErrorIdentidad('SIN_SESION', 'Inicia sesión para sincronizar');
    };
    await expect(crearClienteCursosHttp('https://api.test', sinSesion).descargar()).rejects.toMatchObject({
      motivo: 'NO_AUTENTICADO',
      message: 'Inicia sesión para sincronizar',
    });
    expect(peticiones).toHaveLength(0);
  });

  it('CA-5: un ErrorIdentidad SIN_CONEXION se traduce a SIN_CONEXION sin llamar a fetch', async () => {
    const peticiones = simularServidor(200, respuesta);
    const sinRed = async () => {
      throw new ErrorIdentidad('SIN_CONEXION', 'No se pudo conectar');
    };
    await expect(crearClienteCursosHttp('https://api.test', sinRed).descargar()).rejects.toMatchObject({
      motivo: 'SIN_CONEXION',
    });
    expect(peticiones).toHaveLength(0);
  });

  it('CA-5: sin URL configurada rechaza con SIN_CONFIGURACION y no llama a fetch ni pide token', async () => {
    const peticiones = simularServidor(200, respuesta);
    let tokenPedido = false;
    const obtenerToken = async () => {
      tokenPedido = true;
      return 'TOKEN';
    };
    await expect(crearClienteCursosHttp(undefined, obtenerToken).descargar()).rejects.toMatchObject({
      motivo: 'SIN_CONFIGURACION',
    });
    expect(peticiones).toHaveLength(0);
    expect(tokenPedido).toBe(false);
  });

  it.each([
    ['cuerpo que no es un arreglo', {}],
    ['curso sin nombre', [{ id: 'c1', estudiantes: [] }]],
    ['estudiante sin nombre', [{ id: 'c1', nombre: 'A', estudiantes: [{ id: 'e1' }] }]],
    ['curso sin estudiantes', [{ id: 'c1', nombre: 'A' }]],
  ])('CA-6: respuesta inválida (%s) se rechaza', async (_caso, cuerpo) => {
    simularServidor(200, cuerpo);
    await expect(cliente().descargar()).rejects.toMatchObject({ name: 'ErrorEnvio', motivo: 'RECHAZADO' });
  });
});
