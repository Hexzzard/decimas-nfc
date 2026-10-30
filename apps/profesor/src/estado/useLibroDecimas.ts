import { useEffect, useState } from 'react';
import type { ServicioDecimas } from '../aplicacion/servicioDecimas';
import type { ResultadoSincronizacion, Sincronizador } from '../aplicacion/sincronizacion';
import { ASIGNATURA_ACTUAL } from '../config';
import type { Movimiento, TipoMovimiento } from '../dominio/movimiento';
import { calcularSaldos, historialDe } from '../dominio/saldos';

/**
 * Conecta los casos de uso con React.
 * Guarda una copia de los movimientos para dibujar la pantalla; la fuente de verdad es el repositorio.
 * Las acciones son async y lanzan ErrorDominio si una regla no se cumple.
 */
export function useLibroDecimas(servicio: ServicioDecimas, sincronizador: Sincronizador) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<ResultadoSincronizacion | null>(null);

  async function refrescar() {
    setMovimientos(await servicio.listar());
    setPendientes(await sincronizador.contarPendientes());
  }

  useEffect(() => {
    refrescar()
      .catch((error: unknown) => console.error('No se pudieron cargar los movimientos', error))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio, sincronizador]);

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

  async function sincronizar() {
    setSincronizando(true);
    try {
      setUltimaSincronizacion(await sincronizador.sincronizar());
      await refrescar();
    } finally {
      setSincronizando(false);
    }
  }

  return {
    cargando,
    registrar,
    otorgarMasivo,
    saldoDe: (estudianteId: string) => calcularSaldos(movimientos, estudianteId)[ASIGNATURA_ACTUAL],
    historialDe: (estudianteId: string, limite?: number) => historialDe(movimientos, estudianteId, limite),
    sincronizacion: { pendientes, sincronizando, ultima: ultimaSincronizacion, sincronizar },
  };
}

export type LibroDecimas = ReturnType<typeof useLibroDecimas>;