import type { CatalogoCursos, ClienteCursos } from '../aplicacion/catalogo';
import { ErrorIdentidad } from '../aplicacion/identidad';
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

/** Traduce los errores de identidad a errores de envío, para que el sincronizador los muestre. */
async function tokenOError(obtenerToken: () => Promise<string>): Promise<string> {
  try {
    return await obtenerToken();
  } catch (error) {
    if (error instanceof ErrorIdentidad) {
      const motivo = error.motivo === 'SIN_CONEXION' ? 'SIN_CONEXION' : 'NO_AUTENTICADO';
      throw new ErrorEnvio(motivo, error.message);
    }
    throw error;
  }
}

/** El JSON de GET /api/cursos (CursoResponse.java). */
type CursoResponse = { id: string; nombre: string; estudiantes: { id: string; nombre: string }[] };

const respuestaInvalida = () => new ErrorEnvio('RECHAZADO', 'El servidor devolvió una lista de cursos inválida');

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

function aCatalogo(cuerpo: unknown): CatalogoCursos {
  if (!Array.isArray(cuerpo)) throw respuestaInvalida();
  const catalogo: CatalogoCursos = { cursos: [], estudiantes: [] };
  for (const curso of cuerpo as Partial<CursoResponse>[]) {
    if (!curso || !esTexto(curso.id) || !esTexto(curso.nombre) || !Array.isArray(curso.estudiantes)) {
      throw respuestaInvalida();
    }
    for (const estudiante of curso.estudiantes) {
      if (!estudiante || !esTexto(estudiante.id) || !esTexto(estudiante.nombre)) throw respuestaInvalida();
      catalogo.estudiantes.push({ id: estudiante.id, nombre: estudiante.nombre });
    }
    catalogo.cursos.push({
      id: curso.id,
      nombre: curso.nombre,
      estudianteIds: curso.estudiantes.map((e) => e.id),
    });
  }
  return catalogo;
}

/** Adaptador HTTP para descargar los cursos del profesor (GET /api/cursos). */
export function crearClienteCursosHttp(
  urlBase: string | undefined,
  obtenerToken: () => Promise<string>,
  tiempoLimiteMs = 15000,
): ClienteCursos {
  return {
    async descargar() {
      if (!urlBase) {
        throw new ErrorEnvio('SIN_CONFIGURACION', 'Falta configurar EXPO_PUBLIC_API_URL');
      }
      const token = await tokenOError(obtenerToken);

      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), tiempoLimiteMs);
      let respuesta: Response;
      try {
        respuesta = await fetch(`${urlBase}/api/cursos`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal: controlador.signal,
        });
      } catch {
        throw new ErrorEnvio('SIN_CONEXION', 'No se pudo conectar con el servidor');
      } finally {
        clearTimeout(temporizador);
      }

      if (respuesta.status === 401) {
        throw new ErrorEnvio('NO_AUTENTICADO', 'El servidor no aceptó tu sesión. Vuelve a iniciar sesión');
      }
      if (respuesta.status === 403) {
        throw new ErrorEnvio('SIN_PERMISO', 'Tu usuario no tiene permiso de profesor');
      }
      if (!respuesta.ok) {
        const detalle = await respuesta
          .json()
          .then((cuerpo: { detail?: string }) => cuerpo.detail)
          .catch(() => undefined);
        throw new ErrorEnvio(
          'RECHAZADO',
          `El servidor rechazó la descarga de cursos (${respuesta.status})${detalle ? `: ${detalle}` : ''}`,
        );
      }
      let cuerpo: unknown;
      try {
        cuerpo = await respuesta.json();
      } catch {
        throw respuestaInvalida();
      }
      return aCatalogo(cuerpo);
    },
  };
}

/** Adaptador HTTP hacia el backend. Cada envío lleva "Authorization: Bearer <access token>". */
export function crearClienteHttp(
  urlBase: string | undefined,
  obtenerToken: () => Promise<string>,
  tiempoLimiteMs = 15000,
): ClienteDecimas {
  return {
    async enviar(movimiento) {
      if (!urlBase) {
        throw new ErrorEnvio('SIN_CONFIGURACION', 'Falta configurar EXPO_PUBLIC_API_URL');
      }
      const token = await tokenOError(obtenerToken);

      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), tiempoLimiteMs);
      let respuesta: Response;
      try {
        respuesta = await fetch(
          `${urlBase}/api/estudiantes/${encodeURIComponent(movimiento.estudianteId)}/movimientos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(aRequest(movimiento)),
            signal: controlador.signal,
          },
        );
      } catch {
        throw new ErrorEnvio('SIN_CONEXION', 'No se pudo conectar con el servidor');
      } finally {
        clearTimeout(temporizador);
      }

      if (respuesta.status === 401) {
        throw new ErrorEnvio('NO_AUTENTICADO', 'El servidor no aceptó tu sesión. Vuelve a iniciar sesión');
      }
      if (respuesta.status === 403) {
        throw new ErrorEnvio('SIN_PERMISO', 'Tu usuario no tiene permiso de profesor');
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