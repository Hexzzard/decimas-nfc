import { crearOtorgamientoMasivo, type OtorgamientoMasivo } from '../dominio/lote';
import type { Movimiento } from '../dominio/movimiento';
import { validarMovimiento } from '../dominio/saldos';
import type { RepositorioMovimientos } from './repositorio';

/** Lo que la interfaz entrega al registrar: el servicio completa id y fecha. */
export type NuevoMovimiento = Omit<Movimiento, 'id' | 'fecha' | 'loteId'>;

/**
 * Casos de uso de la app del profesor.
 * Todas las operaciones pasan por una cola: se ejecutan de a una y en orden.
 * Así, dos toques rápidos en "Canjear" no pueden validarse con el mismo saldo.
 */
export function crearServicioDecimas(repositorio: RepositorioMovimientos, generarId: () => string) {
  let cola: Promise<unknown> = Promise.resolve();

  function enCola<T>(tarea: () => Promise<T>): Promise<T> {
    const resultado = cola.then(tarea);
    cola = resultado.catch(() => undefined); // un error no debe bloquear las tareas siguientes
    return resultado;
  }

  return {
    listar: () => enCola(() => repositorio.todos()),

    registrar: (datos: NuevoMovimiento, ahora: Date = new Date()) =>
      enCola(async () => {
        const nuevo: Movimiento = { ...datos, id: generarId(), fecha: ahora.toISOString() };
        const historial = await repositorio.todos();
        validarMovimiento(historial, nuevo); // lanza ErrorDominio si no corresponde
        await repositorio.insertar([nuevo]);
      }),

    otorgarMasivo: (datos: OtorgamientoMasivo) =>
      enCola(async () => {
        const nuevos = crearOtorgamientoMasivo(datos, generarId);
        await repositorio.insertar(nuevos);
        return nuevos.length;
      }),
  };
}

export type ServicioDecimas = ReturnType<typeof crearServicioDecimas>;