import type { Movimiento } from '../dominio/movimiento';
import { crearRepositorioEnMemoria } from './__fakes__/repositorioEnMemoria';
import { crearSincronizador, ErrorEnvio, type ClienteDecimas } from './sincronizacion';

const mov = (id: string): Movimiento => ({
  id,
  estudianteId: 'e1',
  asignatura: 'MAT',
  tipo: 'OTORGAR',
  cantidad: 1,
  fecha: '2026-10-28T12:00:00Z',
});

/** Servidor falso: registra lo que recibe y puede "caerse" en un movimiento específico. */
function crearServidorFalso() {
  const recibidos: string[] = [];
  let caeEn: string | null = null;
  const cliente: ClienteDecimas = {
    async enviar(m) {
      if (m.id === caeEn) throw new ErrorEnvio('SIN_CONEXION', 'No se pudo conectar con el servidor');
      recibidos.push(m.id);
    },
  };
  return { cliente, recibidos, caerEn: (id: string | null) => (caeEn = id) };
}

describe('Sincronizador', () => {
  it('envía los pendientes en orden y los marca como sincronizados', async () => {
    const repositorio = crearRepositorioEnMemoria();
    await repositorio.insertar([mov('a'), mov('b'), mov('c')]);
    const servidor = crearServidorFalso();

    const resultado = await crearSincronizador(repositorio, servidor.cliente).sincronizar();

    expect(resultado).toEqual({ enviados: 3, pendientes: 0 });
    expect(servidor.recibidos).toEqual(['a', 'b', 'c']);
    expect(await repositorio.contarPendientes()).toBe(0);
  });

  it('se detiene en el primer fallo y retoma después, sin duplicar ni saltarse ninguno', async () => {
    const repositorio = crearRepositorioEnMemoria();
    await repositorio.insertar([mov('a'), mov('b'), mov('c')]);
    const servidor = crearServidorFalso();
    const sincronizador = crearSincronizador(repositorio, servidor.cliente);

    servidor.caerEn('b');
    expect(await sincronizador.sincronizar()).toEqual({
      enviados: 1,
      pendientes: 2,
      error: 'No se pudo conectar con el servidor',
    });

    servidor.caerEn(null);
    expect(await sincronizador.sincronizar()).toEqual({ enviados: 2, pendientes: 0 });
    expect(servidor.recibidos).toEqual(['a', 'b', 'c']);
  });

  it('dos toques seguidos en "Sincronizar" hacen una sola sincronización', async () => {
    const repositorio = crearRepositorioEnMemoria();
    await repositorio.insertar([mov('a')]);
    const servidor = crearServidorFalso();
    const sincronizador = crearSincronizador(repositorio, servidor.cliente);

    const [primera, segunda] = await Promise.all([sincronizador.sincronizar(), sincronizador.sincronizar()]);

    expect(primera).toBe(segunda);
    expect(servidor.recibidos).toEqual(['a']);
  });
});
