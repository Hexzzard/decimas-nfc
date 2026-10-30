import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { Movimiento } from '../../dominio/movimiento';
import { formatearFecha } from '../formato';
import { colores, radio } from '../tema';

export function ItemMovimiento({ movimiento }: { movimiento: Movimiento }) {
  const esOtorgar = movimiento.tipo === 'OTORGAR';
  const color = esOtorgar ? colores.exito : colores.canje;
  const titulo = movimiento.motivo ?? (esOtorgar ? 'Décimas otorgadas' : 'Canje de décimas');

  return (
    <View style={estilos.item}>
      <View style={[estilos.icono, { backgroundColor: esOtorgar ? colores.exitoSuave : colores.canjeSuave }]}>
        <Ionicons name={esOtorgar ? 'arrow-up' : 'arrow-down'} size={18} color={color} />
      </View>

      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <View style={estilos.filaDetalle}>
          <Text style={estilos.fecha}>{formatearFecha(movimiento.fecha)}</Text>
          {movimiento.loteId ? (
            <View style={estilos.chipLote}>
              <Text style={estilos.textoLote}>Masivo</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[estilos.cantidad, { color }]}>
        {esOtorgar ? '+' : '−'}
        {movimiento.cantidad}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: 8,
  },
  icono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1 },
  titulo: { color: colores.texto, fontWeight: '600', fontSize: 15 },
  filaDetalle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  fecha: { color: colores.textoSuave, fontSize: 13 },
  chipLote: { backgroundColor: colores.primarioSuave, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  textoLote: { color: colores.primario, fontSize: 11, fontWeight: '700' },
  cantidad: { fontSize: 18, fontWeight: '800' },
});
