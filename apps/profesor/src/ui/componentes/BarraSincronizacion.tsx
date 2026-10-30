import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LibroDecimas } from '../../estado/useLibroDecimas';
import type { SesionUI } from '../../estado/useSesion';
import { colores, radio } from '../tema';
import { ModalInicioSesion } from './ModalInicioSesion';

type Props = {
  sincronizacion: LibroDecimas['sincronizacion'];
  sesion: SesionUI;
};

export function BarraSincronizacion({ sincronizacion, sesion }: Props) {
  const { pendientes, sincronizando, ultima, sincronizar } = sincronizacion;
  const [pidiendoSesion, setPidiendoSesion] = useState(false);
  const alDia = pendientes === 0;
  const error = ultima?.error;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.fila}>
        <Ionicons
          name={alDia ? 'cloud-done' : 'cloud-upload'}
          size={22}
          color={alDia ? colores.exito : colores.primario}
        />
        <Text style={estilos.texto}>{alDia ? 'Todo sincronizado' : `${pendientes} sin sincronizar`}</Text>

        {sesion.activa ? (
          <Pressable
            style={[estilos.boton, (alDia || sincronizando) && estilos.deshabilitado]}
            disabled={alDia || sincronizando}
            onPress={() => void sincronizar()}>
            {sincronizando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={estilos.textoBoton}>Sincronizar</Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={estilos.boton} onPress={() => setPidiendoSesion(true)}>
            <Text style={estilos.textoBoton}>Iniciar sesión</Text>
          </Pressable>
        )}
      </View>

      {error && sesion.activa ? <Text style={estilos.error}>{error}</Text> : null}

      {sesion.activa ? (
        <View style={estilos.filaSesion}>
          <Ionicons name="person-circle" size={16} color={colores.textoSuave} />
          <Text style={estilos.correo} numberOfLines={1}>
            {sesion.correo}
          </Text>
          <Pressable hitSlop={8} onPress={() => void sesion.cerrarSesion()}>
            <Text style={estilos.enlace}>Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={estilos.ayuda}>Inicia sesión para respaldar tus registros en el servidor.</Text>
      )}

      <ModalInicioSesion
        visible={pidiendoSesion}
        onIniciarSesion={sesion.iniciarSesion}
        onCerrar={() => setPidiendoSesion(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    padding: 12,
    gap: 6,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texto: { flex: 1, color: colores.texto, fontWeight: '600' },
  boton: {
    minWidth: 112,
    alignItems: 'center',
    backgroundColor: colores.primario,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: '#FFFFFF', fontWeight: '700' },
  error: { color: colores.canje, fontSize: 13 },
  filaSesion: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  correo: { flex: 1, color: colores.textoSuave, fontSize: 13 },
  enlace: { color: colores.primario, fontWeight: '700', fontSize: 13 },
  ayuda: { color: colores.textoSuave, fontSize: 13 },
});
