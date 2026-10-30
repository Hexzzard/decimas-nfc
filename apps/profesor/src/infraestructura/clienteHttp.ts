import { ErrorEnvio, type ClienteDecimas } from '../aplicacion/sincronizacion';
import type { Movimiento } from '../dominio/movimiento';

/** El JSON que espera la API de Spring Boot (MovimientoRequest.java). */
type MovimientoRequest = {
  id: string;
  asignatura: string;
  tipo: string;
  cantidad: number;
  fecha: string;
  motivo: string | null;
  loteId: string | null;
};

function aRequest(m: Movimiento): MovimientoRequest {
  return {
    id: m.id,
    asignatura: m.asignatura,
    tipo: m.tipo,
    cantidad: m.cantidad,
    fecha: m.fecha,
    motivo: m.motivo ?? null,
    loteId: m.loteId ?? null,
  };
}

/** Adaptador HTTP hacia el backend. */
export function crearClienteHttp(urlBase: string | undefined, tiempoLimiteMs = 8000): ClienteDecimas {
  return {
    async enviar(movimiento) {
      if (!urlBase) {
        throw new ErrorEnvio('SIN_CONFIGURACION', 'Falta configurar EXPO_PUBLIC_API_URL');
      }

      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), tiempoLimiteMs);
      let respuesta: Response;
      try {
        respuesta = await fetch(
          `${urlBase}/api/estudiantes/${encodeURIComponent(movimiento.estudianteId)}/movimientos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aRequest(movimiento)),
            signal: controlador.signal,
          },
        );
      } catch {
        throw new ErrorEnvio('SIN_CONEXION', 'No se pudo conectar con el servidor');
      } finally {
        clearTimeout(temporizador);
      }

      if (!respuesta.ok) {
        // Spring responde con ProblemDetail: { "detail": "...", "codigo": "..." }
        const detalle = await respuesta
          .json()
          .then((cuerpo: { detail?: string }) => cuerpo.detail)
          .catch(() => undefined);
        throw new ErrorEnvio(
          'RECHAZADO',
          `El servidor rechazó un movimiento (${respuesta.status})${detalle ? `: ${detalle}` : ''}`,
        );
      }
    },
  };
}