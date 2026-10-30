import { StyleSheet, Text, View } from 'react-native';
import { colores, radio } from '../tema';

type Props = {
  nombre: string;
  saldo: number;
  asignatura: string;
};

export function TarjetaSaldo({ nombre, saldo, asignatura }: Props) {
  const puntos = (saldo / 10).toFixed(1).replace('.', ',');

  return (
    <View style={estilos.tarjeta}>
      {/* Círculos decorativos: solo Views con bordes redondeados y transparencia */}
      <View style={[estilos.circulo, estilos.circuloGrande]} />
      <View style={[estilos.circulo, estilos.circuloChico]} />

      <View style={estilos.etiqueta}>
        <Text style={estilos.textoEtiqueta}>{asignatura}</Text>
      </View>
      <Text style={estilos.nombre}>{nombre}</Text>

      <View style={estilos.filaNumero}>
        <Text style={estilos.numero}>{saldo}</Text>
        <Text style={estilos.unidad}>{saldo === 1 ? 'décima' : 'décimas'}</Text>
      </View>
      <Text style={estilos.equivalencia}>Equivale a +{puntos} en la nota</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.primario,
    borderRadius: radio.l,
    padding: 24,
    overflow: 'hidden',
  },
  circulo: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF' },
  circuloGrande: { width: 220, height: 220, top: -90, right: -70, opacity: 0.12 },
  circuloChico: { width: 120, height: 120, bottom: -50, right: 60, opacity: 0.08 },
  etiqueta: {
    alignSelf: 'flex-start',
    backgroundColor: colores.acento,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textoEtiqueta: { color: colores.texto, fontWeight: '700', fontSize: 12 },
  nombre: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 14 },
  filaNumero: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  numero: { color: '#FFFFFF', fontSize: 72, fontWeight: '800', lineHeight: 80 },
  unidad: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 14, opacity: 0.85 },
  equivalencia: { color: '#FFFFFF', opacity: 0.75, marginTop: 4 },
});
