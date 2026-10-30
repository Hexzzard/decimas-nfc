import type { Movimiento } from '../../dominio/movimiento';
import type { RepositorioMovimientos } from '../repositorio';
import type { RegistroPendientes } from '../sincronizacion';

/**
 * Fake para pruebas: implementa los mismos puertos que el adaptador SQLite, pero en memoria.
 * `pausaMs` simula un disco lento, para poder probar condiciones de carrera.
 */
export function crearRepositorioEnMemoria(pausaMs = 0) {
  const filas: { movimiento: Movimiento; sincronizado: boolean }[] = [];
  const pausa = () => new Promise((resolver) => setTimeout(resolver, pausaMs));

  const repositorio: RepositorioMovimientos & RegistroPendientes = {
    async todos() {
      await pausa();
      return filas.map((f) => f.movimiento);
    },
    async insertar(movimientos) {
      await pausa();
      for (const m of movimientos) {
        if (!filas.some((f) => f.movimiento.id === m.id)) filas.push({ movimiento: m, sincronizado: false });
      }
    },
    async pendientes() {
      return filas.filter((f) => !f.sincronizado).map((f) => f.movimiento);
    },
    async marcarSincronizados(ids) {
      for (const f of filas) if (ids.includes(f.movimiento.id)) f.sincronizado = true;
    },
    async contarPendientes() {
      return filas.filter((f) => !f.sincronizado).length;
    },
  };
  return repositorio;
}
