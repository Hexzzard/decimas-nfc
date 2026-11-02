import { useEffect, useState } from 'react';
import type { AlmacenCatalogo, CatalogoCursos } from '../aplicacion/catalogo';
import type { ResultadoSincronizacion } from '../aplicacion/sincronizacion';

const VACIO: CatalogoCursos = { cursos: [], estudiantes: [] };

/**
 * Lee cursos y estudiantes de la copia local. Se vuelve a leer al terminar cada sincronización
 * (si falló la descarga, la copia no cambió y se lee lo mismo). `cargado` es false hasta la primera lectura.
 */
export function useCatalogo(almacen: AlmacenCatalogo, ultimaSincronizacion: ResultadoSincronizacion | null) {
  const [catalogo, setCatalogo] = useState<CatalogoCursos>(VACIO);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    // Sin esta guarda, una lectura lenta podría pisar a una más nueva.
    let vigente = true;
    almacen
      .leer()
      .then((leido) => {
        if (vigente) setCatalogo(leido);
      })
      .catch((error: unknown) => console.error('No se pudo leer el catálogo de cursos', error))
      .finally(() => {
        if (vigente) setCargado(true);
      });
    return () => {
      vigente = false;
    };
  }, [almacen, ultimaSincronizacion]);

  return { ...catalogo, cargado };
}
