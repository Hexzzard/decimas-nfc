import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MOTIVOS_RAPIDOS } from '../../config';
import { colores } from '../tema';

type Props = {
  valor: string | undefined;
  onCambio: (motivo: string | undefined) => void;
};

export function SelectorMotivo({ valor, onCambio }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
      {MOTIVOS_RAPIDOS.map((motivo) => {
        const activo = motivo === valor;
        return (
          <Pressable
            key={motivo}
            onPress={() => onCambio(activo ? undefined : motivo)}
            style={[estilos.chip, activo && estilos.chipActivo]}>
            <Text style={[estilos.texto, activo && estilos.textoActivo]}>{motivo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: { gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActivo: { borderColor: colores.primario, backgroundColor: colores.primario },
  texto: { color: colores.texto, fontWeight: '600' },
  textoActivo: { color: '#FFFFFF' },
});
