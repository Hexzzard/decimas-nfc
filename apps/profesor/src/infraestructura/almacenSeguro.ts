import * as SecureStore from 'expo-secure-store';
import type { AlmacenSeguro } from '../aplicacion/identidad';

const CLAVE = 'decimas.sesion';

/** Adaptador: Keychain (iOS) o Keystore (Android), a través de expo-secure-store. */
export function crearAlmacenSeguro(): AlmacenSeguro {
  return {
    leer: () => SecureStore.getItemAsync(CLAVE),
    guardar: (valor) => SecureStore.setItemAsync(CLAVE, valor),
    borrar: () => SecureStore.deleteItemAsync(CLAVE),
  };
}