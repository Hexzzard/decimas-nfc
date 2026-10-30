import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NOMBRE_ASIGNATURA_ACTUAL } from '../../config';
import { ErrorDominio } from '../../dominio/errores';
import type { Estudiante } from '../../dominio/estudiante';
import type { TipoMovimiento } from '../../dominio/movimiento';
import type { LibroDecimas } from '../../estado/useLibroDecimas';
import { ItemMovimiento } from '../componentes/ItemMovimiento';
import { SelectorCantidad } from '../componentes/SelectorCantidad';
import { SelectorMotivo } from '../componentes/SelectorMotivo';
import { TarjetaSaldo } from '../componentes/TarjetaSaldo';
import { colores, radio } from '../tema';

type Props = {
  estudiante: Estudiante | null;
  libro: LibroDecimas;
  onCerrar: () => void;
};

export function ModalEstudiante({ estudiante, libro, onCerrar }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState<string | undefined>();

  function cerrar() {
    setCantidad(1);
    setMotivo(undefined);
    onCerrar();
  }

  async function registrar(id: string, tipo: TipoMovimiento) {
    try {
       await libro.registrar(id, tipo, cantidad, tipo === 'OTORGAR' ? motivo : undefined);
      setMotivo(undefined);
    } catch (error) {
      if (error instanceof ErrorDominio) {
        Alert.alert('No se pudo registrar', error.message);
        return;
      }
      throw error;
    }
  }

  return (
    <Modal
      visible={estudiante !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={cerrar}>
      {estudiante ? (
        <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
          <View style={estilos.barraSuperior}>
            <Pressable style={estilos.cerrar} hitSlop={12} onPress={cerrar}>
              <Ionicons name="close" size={22} color={colores.texto} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={estilos.contenido}>
            <TarjetaSaldo
              nombre={estudiante.nombre}
              saldo={libro.saldoDe(estudiante.id)}
              asignatura={NOMBRE_ASIGNATURA_ACTUAL}
            />

            <View style={estilos.panel}>
              <Text style={estilos.tituloSeccion}>Registrar</Text>
              <SelectorMotivo valor={motivo} onCambio={setMotivo} />
              <View style={estilos.filaCantidad}>
                <Text style={estilos.etiqueta}>Cantidad</Text>
                <SelectorCantidad valor={cantidad} onCambio={setCantidad} />
              </View>
              <View style={estilos.filaAcciones}>
                <Pressable
                  style={[estilos.accion, { backgroundColor: colores.exito }]}
                  onPress={() => registrar(estudiante.id, 'OTORGAR')}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={estilos.textoAccion}>Otorgar</Text>
                </Pressable>
                <Pressable
                  style={[estilos.accion, { backgroundColor: colores.canje }]}
                  onPress={() => registrar(estudiante.id, 'CANJEAR')}>
                  <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
                  <Text style={estilos.textoAccion}>Canjear</Text>
                </Pressable>
              </View>
            </View>

            <Text style={estilos.tituloSeccion}>Últimos movimientos</Text>
            {libro.historialDe(estudiante.id, 10).map((m) => (
              <ItemMovimiento key={m.id} movimiento={m} />
            ))}
            {libro.historialDe(estudiante.id, 1).length === 0 ? (
              <Text style={estilos.vacio}>Aún no tiene movimientos.</Text>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barraSuperior: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { padding: 16, gap: 16, paddingBottom: 40 },
  panel: { backgroundColor: colores.superficie, borderRadius: radio.l, padding: 16, gap: 12 },
  tituloSeccion: { fontSize: 18, fontWeight: '800', color: colores.texto },
  filaCantidad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: { color: colores.textoSuave, fontWeight: '600' },
  filaAcciones: { flexDirection: 'row', gap: 12 },
  accion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radio.m,
    paddingVertical: 14,
  },
  textoAccion: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  vacio: { color: colores.textoSuave, textAlign: 'center', paddingVertical: 16 },
});
