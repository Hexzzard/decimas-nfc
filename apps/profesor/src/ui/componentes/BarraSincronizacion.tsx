import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LibroDecimas } from '../../estado/useLibroDecimas';
import { colores, radio } from '../tema';

export function BarraSincronizacion({ sincronizacion }: { sincronizacion: LibroDecimas['sincronizacion'] }) {
  const { pendientes, sincronizando, ultima, sincronizar } = sincronizacion;
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
        <Text style={estilos.texto}>
          {alDia ? 'Todo sincronizado' : `${pendientes} sin sincronizar`}
        </Text>
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
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
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
});
