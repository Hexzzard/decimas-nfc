import { ErrorDominio } from '../dominio/errores';
import { calcularSaldos } from '../dominio/saldos';
import { crearRepositorioEnMemoria } from './__fakes__/repositorioEnMemoria';
import { crearServicioDecimas, type NuevoMovimiento } from './servicioDecimas';

const otorgar = (cantidad: number): NuevoMovimiento => ({ estudianteId: 'e1', asignatura: 'MAT', tipo: 'OTORGAR', cantidad });
const canjear = (cantidad: number): NuevoMovimiento => ({ estudianteId: 'e1', asignatura: 'MAT', tipo: 'CANJEAR', cantidad });

function crearServicio(pausaMs = 0) {
  let n = 0;
  const repositorio = crearRepositorioEnMemoria(pausaMs);
  return { repositorio, servicio: crearServicioDecimas(repositorio, () => `id${++n}`) };
}

describe('ServicioDecimas', () => {
  it('registra un movimiento válido', async () => {
    const { servicio } = crearServicio();
    await servicio.registrar(otorgar(3));
    expect(calcularSaldos(await servicio.listar(), 'e1').MAT).toBe(3);
  });

  it('no guarda un canje mayor al saldo', async () => {
    const { servicio } = crearServicio();
    await servicio.registrar(otorgar(1));
    await expect(servicio.registrar(canjear(2))).rejects.toThrow(ErrorDominio);
    expect(await servicio.listar()).toHaveLength(1);
  });

  it('dos canjes simultáneos no pueden dejar el saldo negativo (condición de carrera)', async () => {
    const { servicio } = crearServicio(5); // "disco lento": fuerza que las operaciones se intercalen
    await servicio.registrar(otorgar(1));

    const resultados = await Promise.allSettled([servicio.registrar(canjear(1)), servicio.registrar(canjear(1))]);

    expect(resultados.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
    expect(calcularSaldos(await servicio.listar(), 'e1').MAT).toBe(0);
  });

  it('un error no bloquea las operaciones siguientes de la cola', async () => {
    const { servicio } = crearServicio();
    await expect(servicio.registrar(canjear(1))).rejects.toThrow(ErrorDominio);
    await expect(
      servicio.otorgarMasivo({ estudianteIds: ['e1', 'e2'], asignatura: 'MAT', cantidad: 2 }),
    ).resolves.toBe(2);
  });
});
