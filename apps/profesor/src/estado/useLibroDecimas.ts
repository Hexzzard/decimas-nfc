import { useEffect, useState } from 'react';
import type { ServicioDecimas } from '../aplicacion/servicioDecimas';
import { ASIGNATURA_ACTUAL } from '../config';
import type { Movimiento, TipoMovimiento } from '../dominio/movimiento';
import { calcularSaldos, historialDe } from '../dominio/saldos';

/**
 * Conecta los casos de uso con React.
 * Guarda una copia de los movimientos para dibujar la pantalla; la fuente de verdad es el repositorio.
 * Las acciones son async y lanzan ErrorDominio si una regla no se cumple.
 */
export function useLibroDecimas(servicio: ServicioDecimas) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    servicio
      .listar()
      .then(setMovimientos)
      .catch((error: unknown) => console.error('No se pudieron cargar los movimientos', error))
      .finally(() => setCargando(false));
  }, [servicio]);

  async function refrescar() {
    setMovimientos(await servicio.listar());
  }

  async function registrar(estudianteId: string, tipo: TipoMovimiento, cantidad: number, motivo?: string) {
    await servicio.registrar({ estudianteId, asignatura: ASIGNATURA_ACTUAL, tipo, cantidad, motivo });
    await refrescar();
  }

  /** Devuelve cuántos estudiantes recibieron décimas. */
  async function otorgarMasivo(estudianteIds: string[], cantidad: number, motivo?: string) {
    const cuantos = await servicio.otorgarMasivo({
      estudianteIds,
      asignatura: ASIGNATURA_ACTUAL,
      cantidad,
      motivo,
    });
    await refrescar();
    return cuantos;
  }

  return {
    cargando,
    registrar,
    otorgarMasivo,
    saldoDe: (estudianteId: string) => calcularSaldos(movimientos, estudianteId)[ASIGNATURA_ACTUAL],
    historialDe: (estudianteId: string, limite?: number) => historialDe(movimientos, estudianteId, limite),
  };
}

export type LibroDecimas = ReturnType<typeof useLibroDecimas>;