import type { Movimiento } from '../dominio/movimiento';
import { crearAlmacenCatalogoEnMemoria } from './__fakes__/almacenCatalogoEnMemoria';
import { crearRepositorioEnMemoria } from './__fakes__/repositorioEnMemoria';
import type { CatalogoCursos, ClienteCursos } from './catalogo';
import { crearSincronizador, ErrorEnvio, type ClienteDecimas } from './sincronizacion';

const mov = (id: string): Movimiento => ({
  id,
  estudianteId: 'e1',
  asignatura: 'MAT',
  tipo: 'OTORGAR',
  cantidad: 1,
  fecha: '2026-10-28T12:00:00Z',
});

const catalogo: CatalogoCursos = {
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

const catalogoViejo: CatalogoCursos = {
  cursos: [{ id: 'cv', nombre: 'Viejo', estudianteIds: [] }],
  estudiantes: [],
};

const SIN_RED = 'No se pudo conectar con el servidor';

function armar(opciones: { pendientes?: string[]; caeEn?: string; descarga?: () => Promise<CatalogoCursos> } = {}) {
  const llamadas: string[] = [];
  const cliente: ClienteDecimas = {
    async enviar(m) {
      llamadas.push(`enviar(${m.id})`);
      if (m.id === opciones.caeEn) throw new ErrorEnvio('SIN_CONEXION', SIN_RED);
    },
  };
  let descargas = 0;
  const clienteCursos: ClienteCursos = {
    async descargar() {
      descargas += 1;
      llamadas.push('descargar');
      return (opciones.descarga ?? (async () => catalogo))();
    },
  };
  const fake = crearAlmacenCatalogoEnMemoria(catalogoViejo);
  const repositorio = crearRepositorioEnMemoria();
  const preparar = async () => {
    await repositorio.insertar((opciones.pendientes ?? ['a', 'b']).map(mov));
    return crearSincronizador(repositorio, cliente, { cliente: clienteCursos, almacen: fake.almacen });
  };
  return { preparar, llamadas, fake, repositorio, descargas: () => descargas };
}

describe('Sincronizador con catálogo de cursos', () => {
  it('CA-7: envía los pendientes y después descarga y guarda el catálogo', async () => {
    const t = armar();
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado).toEqual({ enviados: 2, pendientes: 0, cursosActualizados: true });
    expect(await t.fake.almacen.leer()).toEqual(catalogo);
    expect(t.llamadas).toEqual(['enviar(a)', 'enviar(b)', 'descargar']);
  });

  it('CA-8: con cero pendientes también descarga', async () => {
    const t = armar({ pendientes: [] });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado).toEqual({ enviados: 0, pendientes: 0, cursosActualizados: true });
    expect(await t.fake.almacen.leer()).toEqual(catalogo);
  });

  it('CA-9: si falla un envío, igual descarga y guarda el catálogo', async () => {
    const t = armar({ caeEn: 'b' });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado).toEqual({ enviados: 1, pendientes: 1, error: SIN_RED, cursosActualizados: true });
    expect(resultado.errorCursos).toBeUndefined();
    expect(t.descargas()).toBe(1);
    expect(t.llamadas).toEqual(['enviar(a)', 'enviar(b)', 'descargar']);
    expect(await t.fake.almacen.leer()).toEqual(catalogo);
    expect(await t.repositorio.contarPendientes()).toBe(1);
  });

  it('CA-10: si falla la descarga conserva la copia anterior y no toca los campos de movimientos', async () => {
    const t = armar({
      descarga: async () => {
        throw new ErrorEnvio('SIN_CONEXION', SIN_RED);
      },
    });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado).toEqual({ enviados: 2, pendientes: 0, errorCursos: SIN_RED });
    expect(t.fake.reemplazos()).toBe(0);
    expect(await t.fake.almacen.leer()).toEqual(catalogoViejo);
    expect(await t.repositorio.contarPendientes()).toBe(0);
  });

  it('CA-10: un error NO_AUTENTICADO al descargar se informa en errorCursos', async () => {
    const t = armar({
      descarga: async () => {
        throw new ErrorEnvio('NO_AUTENTICADO', 'Inicia sesión para sincronizar');
      },
    });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado.errorCursos).toBe('Inicia sesión para sincronizar');
    expect(resultado.cursosActualizados).toBeUndefined();
    expect(await t.fake.almacen.leer()).toEqual(catalogoViejo);
  });

  it('CA-10: si fallan el envío y la descarga, conserva el error de envío y suma errorCursos', async () => {
    const t = armar({
      caeEn: 'b',
      descarga: async () => {
        throw new ErrorEnvio('NO_AUTENTICADO', 'Inicia sesión para sincronizar');
      },
    });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado).toEqual({
      enviados: 1,
      pendientes: 1,
      error: SIN_RED,
      errorCursos: 'Inicia sesión para sincronizar',
    });
  });

  it('CA-11: un catálogo con un estudiante en dos cursos no se guarda', async () => {
    const t = armar({
      descarga: async () => ({
        cursos: [
          { id: 'c1', nombre: 'A', estudianteIds: ['e2'] },
          { id: 'c3', nombre: 'C', estudianteIds: ['e2'] },
        ],
        estudiantes: [{ id: 'e2', nombre: 'Benjamín Soto' }],
      }),
    });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado.errorCursos).toContain('e2');
    expect(resultado.cursosActualizados).toBeUndefined();
    expect(t.fake.reemplazos()).toBe(0);
    expect(await t.fake.almacen.leer()).toEqual(catalogoViejo);
  });

  it('CA-12: un catálogo vacío del servidor reemplaza la copia', async () => {
    const t = armar({ descarga: async () => ({ cursos: [], estudiantes: [] }) });
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado.cursosActualizados).toBe(true);
    expect(await t.fake.almacen.leer()).toEqual({ cursos: [], estudiantes: [] });
  });

  it('CA-13: si falla guardar, no rechaza y lo informa en errorCursos', async () => {
    const t = armar();
    t.fake.fallarAlReemplazar(new Error('disco lleno'));
    const resultado = await (await t.preparar()).sincronizar();

    expect(resultado.errorCursos).toBe('disco lleno');
    expect(resultado.cursosActualizados).toBeUndefined();
  });

  it('CA-14: dos sincronizaciones simultáneas descargan una sola vez', async () => {
    const t = armar();
    const sincronizador = await t.preparar();

    const [primera, segunda] = await Promise.all([sincronizador.sincronizar(), sincronizador.sincronizar()]);

    expect(primera).toBe(segunda);
    expect(t.descargas()).toBe(1);
  });

  it('CA-15: sin tercer argumento no aparecen campos de cursos', async () => {
    const repositorio = crearRepositorioEnMemoria();
    await repositorio.insertar([mov('a')]);
    const cliente: ClienteDecimas = { async enviar() {} };

    const resultado = await crearSincronizador(repositorio, cliente).sincronizar();

    expect(resultado).toEqual({ enviados: 1, pendientes: 0 });
    expect('cursosActualizados' in resultado).toBe(false);
    expect('errorCursos' in resultado).toBe(false);
  });
});
