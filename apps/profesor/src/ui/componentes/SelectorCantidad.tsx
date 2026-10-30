import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, radio } from '../tema';

type Props = {
  valor: number;
  onCambio: (valor: number) => void;
  min?: number;
  max?: number;
};

export function SelectorCantidad({ valor, onCambio, min = 1, max = 20 }: Props) {
  const puedeBajar = valor > min;
  const puedeSubir = valor < max;

  return (
    <View style={estilos.contenedor}>
      <Pressable style={estilos.boton} disabled={!puedeBajar} hitSlop={8} onPress={() => onCambio(valor - 1)}>
        <Ionicons name="remove" size={22} color={puedeBajar ? colores.primario : colores.borde} />
      </Pressable>
      <Text style={estilos.valor}>{valor}</Text>
      <Pressable style={estilos.boton} disabled={!puedeSubir} hitSlop={8} onPress={() => onCambio(valor + 1)}>
        <Ionicons name="add" size={22} color={puedeSubir ? colores.primario : colores.borde} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.primarioSuave,
    borderRadius: radio.m,
    padding: 4,
  },
  boton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  valor: { minWidth: 36, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colores.texto },
});
