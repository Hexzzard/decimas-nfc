import { useEffect, useState } from 'react';
import type { GestorSesion } from '../aplicacion/sesion';

/** Conecta el GestorSesion con React: la pantalla se actualiza cuando la sesión cambia. */
export function useSesion(gestor: GestorSesion) {
  const [estado, setEstado] = useState(gestor.estado());

  useEffect(() => {
    const dejarDeEscuchar = gestor.suscribir(setEstado);
    gestor.restaurar().catch((error: unknown) => console.error('No se pudo restaurar la sesión', error));
    return dejarDeEscuchar;
  }, [gestor]);

  return {
    ...estado,
    iniciarSesion: gestor.iniciarSesion,
    cerrarSesion: gestor.cerrarSesion,
  };
}

export type SesionUI = ReturnType<typeof useSesion>;