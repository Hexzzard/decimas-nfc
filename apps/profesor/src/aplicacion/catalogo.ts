import type { Curso } from '../dominio/curso';
import type { Estudiante } from '../dominio/estudiante';

/** Cursos del profesor y sus estudiantes. El orden de ambas listas es el orden de presentación. */
export type CatalogoCursos = { cursos: Curso[]; estudiantes: Estudiante[] };

/** Puerto: descarga el catálogo desde el servidor. Lanza ErrorEnvio si no lo logra. */
export interface ClienteCursos {
  descargar(): Promise<CatalogoCursos>;
}

/** Puerto: copia local del último catálogo descargado. */
export interface AlmacenCatalogo {
  /** Devuelve un catálogo vacío si nunca se guardó nada. */
  leer(): Promise<CatalogoCursos>;
  /** Reemplaza todo por completo (todo o nada) conservando el orden recibido. */
  reemplazar(catalogo: CatalogoCursos): Promise<void>;
}
