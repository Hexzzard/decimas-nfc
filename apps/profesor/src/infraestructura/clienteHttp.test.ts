import { ErrorIdentidad } from '../aplicacion/identidad';
import type { Movimiento } from '../dominio/movimiento';
import { crearClienteHttp } from './clienteHttp';

const movimiento: Movimiento = {
  id: '00000000-0000-4000-8000-000000000001',
  estudianteId: 'e1',
  asignatura: 'MAT',
  tipo: 'OTORGAR',
  cantidad: 1,
  fecha: '2026-10-28T12:00:00Z',
};

type Peticion = { url: string; init: { headers: Record<string, string>; body: string } };

/** Reemplaza fetch por un servidor falso que responde con el código indicado. */
function simularServidor(status: number) {
  const peticiones: Peticion[] = [];
  globalThis.fetch = (async (url: string, init: Peticion['init']) => {
    peticiones.push({ url, init });
    return { ok: status >= 200 && status < 300, status, json: async () => ({}) };
  }) as unknown as typeof fetch;
  return peticiones;
}

const tokenFijo = async () => 'TOKEN';

describe('clienteHttp', () => {
  it('envía el contrato que espera la API, con el token Bearer', async () => {
    const peticiones = simularServidor(201);
    await crearClienteHttp('https://api.test', tokenFijo).enviar(movimiento);

    expect(peticiones[0]!.url).toBe('https://api.test/api/estudiantes/e1/movimientos');
    expect(peticiones[0]!.init.headers.Authorization).toBe('Bearer TOKEN');
    expect(JSON.parse(peticiones[0]!.init.body)).toEqual({
      id: movimiento.id,
      asignatura: 'MAT',
      tipo: 'OTORGAR',
      cantidad: 1,
      fecha: '2026-10-28T12:00:00Z',
      motivo: null,
      loteId: null,
    });
  });

  it.each([
    [401, 'NO_AUTENTICADO'],
    [403, 'SIN_PERMISO'],
    [409, 'RECHAZADO'],
  ])('traduce el código %p a %p', async (status, motivo) => {
    simularServidor(status);
    await expect(crearClienteHttp('https://api.test', tokenFijo).enviar(movimiento)).rejects.toMatchObject({ motivo });
  });

  it('sin sesión, no llama al servidor y pide iniciar sesión', async () => {
    const peticiones = simularServidor(201);
    const sinSesion = async () => {
      throw new ErrorIdentidad('SIN_SESION', 'Inicia sesión para sincronizar');
    };

    await expect(crearClienteHttp('https://api.test', sinSesion).enviar(movimiento)).rejects.toMatchObject({
      motivo: 'NO_AUTENTICADO',
      message: 'Inicia sesión para sincronizar',
    });
    expect(peticiones).toHaveLength(0);
  });
});
