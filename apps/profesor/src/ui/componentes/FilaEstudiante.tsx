import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Estudiante } from '../../dominio/estudiante';
import { colorAvatar, iniciales } from '../formato';
import { colores, radio } from '../tema';

type Props = {
  estudiante: Estudiante;
  saldo: number;
  modoSeleccion: boolean;
  seleccionado: boolean;
  onPress: () => void;
};

export function FilaEstudiante({ estudiante, saldo, modoSeleccion, seleccionado, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [estilos.fila, seleccionado && estilos.seleccionada, pressed && estilos.presionada]}>
      <View style={[estilos.avatar, { backgroundColor: colorAvatar(estudiante.id) }]}>
        <Text style={estilos.iniciales}>{iniciales(estudiante.nombre)}</Text>
      </View>

      <Text style={estilos.nombre} numberOfLines={1}>
        {estudiante.nombre}
      </Text>

      {modoSeleccion ? (
        <Ionicons
          name={seleccionado ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={seleccionado ? colores.primario : colores.borde}
        />
      ) : (
        <View style={estilos.pildora}>
          <Text style={estilos.textoPildora}>{saldo}</Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seleccionada: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
  presionada: { opacity: 0.7 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iniciales: { fontWeight: '800', color: colores.texto },
  nombre: { flex: 1, fontSize: 16, fontWeight: '600', color: colores.texto },
  pildora: {
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: colores.primario,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoPildora: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
