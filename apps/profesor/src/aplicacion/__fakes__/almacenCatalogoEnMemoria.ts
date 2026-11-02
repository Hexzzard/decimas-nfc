import type { AlmacenCatalogo, CatalogoCursos } from '../catalogo';

/** Almacén de catálogo en memoria para pruebas. Cuenta las llamadas a `reemplazar`. */
export function crearAlmacenCatalogoEnMemoria(inicial?: CatalogoCursos) {
  let guardado: CatalogoCursos = inicial ?? { cursos: [], estudiantes: [] };
  let reemplazos = 0;
  let falla: Error | null = null;
  const almacen: AlmacenCatalogo = {
    async leer() {
      return structuredClone(guardado);
    },
    async reemplazar(catalogo) {
      reemplazos += 1;
      if (falla) throw falla;
      guardado = structuredClone(catalogo);
    },
  };
  return {
    almacen,
    reemplazos: () => reemplazos,
    fallarAlReemplazar: (error: Error | null) => {
      falla = error;
    },
  };
}
