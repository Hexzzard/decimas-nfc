import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NOMBRE_ASIGNATURA_ACTUAL } from '../../config';
import { ErrorDominio } from '../../dominio/errores';
import type { Estudiante } from '../../dominio/estudiante';
import type { LibroDecimas } from '../../estado/useLibroDecimas';
import { FilaEstudiante } from '../componentes/FilaEstudiante';
import { SelectorCantidad } from '../componentes/SelectorCantidad';
import { SelectorMotivo } from '../componentes/SelectorMotivo';
import { textoDecimas } from '../formato';
import { colores, radio } from '../tema';

type Props = {
  estudiantes: readonly Estudiante[];
  libro: LibroDecimas;
  onAbrirEstudiante: (estudiante: Estudiante) => void;
};

export function PantallaCurso({ estudiantes, libro, onAbrirEstudiante }: Props) {
  // null = modo normal; un Set (aunque esté vacío) = modo selección masiva
  const [seleccion, setSeleccion] = useState<Set<string> | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState<string | undefined>();

  const totalCurso = estudiantes.reduce((suma, e) => suma + libro.saldoDe(e.id), 0);

  function alternar(id: string) {
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
  }

  function salirDeSeleccion() {
    setSeleccion(null);
    setCantidad(1);
    setMotivo(undefined);
  }

  async function confirmarMasivo(ids: Set<string>) {
    try {
      const cuantos = await libro.otorgarMasivo([...ids], cantidad, motivo);
      Alert.alert('¡Listo!', `+${textoDecimas(cantidad)} para ${cuantos} estudiantes`);
      salirDeSeleccion();
    } catch (error) {
      if (error instanceof ErrorDominio) {
        Alert.alert('No se pudo otorgar', error.message);
        return;
      }
      throw error;
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <View style={estilos.encabezado}>
        <View style={estilos.textosEncabezado}>
          <Text style={estilos.titulo}>{seleccion ? `${seleccion.size} seleccionados` : 'Mi curso'}</Text>
          <Text style={estilos.subtitulo}>
            {NOMBRE_ASIGNATURA_ACTUAL} · {estudiantes.length} estudiantes · {textoDecimas(totalCurso)}
          </Text>
        </View>
        {seleccion ? (
          <Pressable hitSlop={8} onPress={() => setSeleccion(new Set(estudiantes.map((e) => e.id)))}>
            <Text style={estilos.enlace}>Todos</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={estudiantes}
        keyExtractor={(e) => e.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <FilaEstudiante
            estudiante={item}
            saldo={libro.saldoDe(item.id)}
            modoSeleccion={seleccion !== null}
            seleccionado={seleccion?.has(item.id) ?? false}
            onPress={() => (seleccion ? alternar(item.id) : onAbrirEstudiante(item))}
          />
        )}
      />

      {seleccion ? (
        <View style={estilos.panelMasivo}>
          <Text style={estilos.etiquetaPanel}>Motivo (opcional)</Text>
          <SelectorMotivo valor={motivo} onCambio={setMotivo} />
          <View style={estilos.filaPanel}>
            <SelectorCantidad valor={cantidad} onCambio={setCantidad} />
            <Pressable
              style={[estilos.botonPrimario, seleccion.size === 0 && estilos.deshabilitado]}
              disabled={seleccion.size === 0}
              onPress={() => confirmarMasivo(seleccion)}>
              <Text style={estilos.textoBoton}>Otorgar a {seleccion.size}</Text>
            </Pressable>
          </View>
          <Pressable style={estilos.cancelar} onPress={salirDeSeleccion}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={estilos.zonaFlotante}>
          <Pressable style={estilos.botonFlotante} onPress={() => setSeleccion(new Set())}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
            <Text style={estilos.textoBoton}>Otorgar a varios</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  textosEncabezado: { flex: 1 },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
  subtitulo: { marginTop: 4, color: colores.textoSuave },
  enlace: { color: colores.primario, fontWeight: '700', fontSize: 16 },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  panelMasivo: {
    backgroundColor: colores.superficie,
    borderTopLeftRadius: radio.l,
    borderTopRightRadius: radio.l,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  etiquetaPanel: { color: colores.textoSuave, fontWeight: '600' },
  filaPanel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botonPrimario: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colores.primario,
    borderRadius: radio.m,
    paddingVertical: 16,
  },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  cancelar: { alignItems: 'center', paddingVertical: 6 },
  textoCancelar: { color: colores.textoSuave, fontWeight: '600' },
  zonaFlotante: { paddingHorizontal: 16, paddingBottom: 8 },
  botonFlotante: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colores.primario,
    borderRadius: 999,
    paddingVertical: 16,
  },
});
