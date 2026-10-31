import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estudiantesDelCurso, type Curso } from '../../dominio/curso';
import type { Estudiante } from '../../dominio/estudiante';
import type { FilaUltimoMovimiento } from '../../dominio/ultimosMovimientos';
import type { LibroDecimas } from '../../estado/useLibroDecimas';
import type { SesionUI } from '../../estado/useSesion';
import { BarraSincronizacion } from '../componentes/BarraSincronizacion';
import { formatearFecha } from '../formato';
import { colores, radio } from '../tema';

type Props = {
  cursos: readonly Curso[];
  estudiantes: readonly Estudiante[];
  libro: LibroDecimas;
  sesion: SesionUI;
  onAbrirCurso: (curso: Curso) => void;
};

export function PantallaInicio({ cursos, estudiantes, libro, sesion, onAbrirCurso }: Props) {
  const ultimos = libro.ultimosMovimientos(estudiantes, cursos);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Inicio</Text>
      </View>
      <BarraSincronizacion sincronizacion={libro.sincronizacion} sesion={sesion} />

      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.tituloSeccion}>Mis cursos</Text>
        {cursos.length === 0 ? <Text style={estilos.vacio}>Aún no tienes cursos.</Text> : null}
        {cursos.map((curso) => {
          const cuantos = estudiantesDelCurso(curso, estudiantes).length;
          return (
            <Pressable
              key={curso.id}
              style={({ pressed }) => [estilos.filaCurso, pressed && estilos.presionado]}
              onPress={() => onAbrirCurso(curso)}>
              <View style={estilos.iconoCurso}>
                <Ionicons name="school" size={20} color={colores.primario} />
              </View>
              <Text style={estilos.textoCurso} numberOfLines={1}>
                {curso.nombre} · {cuantos} {cuantos === 1 ? 'estudiante' : 'estudiantes'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colores.textoSuave} />
            </Pressable>
          );
        })}

        <Text style={estilos.tituloSeccion}>Últimos cambios</Text>
        {ultimos.length === 0 ? <Text style={estilos.vacio}>Aún no hay movimientos.</Text> : null}
        {ultimos.map((fila) => (
          <FilaUltimoCambio key={fila.movimiento.id} fila={fila} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Fila informativa (no tocable) de "Últimos cambios". */
function FilaUltimoCambio({ fila }: { fila: FilaUltimoMovimiento }) {
  const { movimiento } = fila;
  const esOtorgar = movimiento.tipo === 'OTORGAR';
  const color = esOtorgar ? colores.exito : colores.canje;

  return (
    <View style={estilos.item}>
      <View style={[estilos.icono, { backgroundColor: esOtorgar ? colores.exitoSuave : colores.canjeSuave }]}>
        <Ionicons name={esOtorgar ? 'arrow-up' : 'arrow-down'} size={18} color={color} />
      </View>
      <View style={estilos.textos}>
        <Text style={estilos.nombre} numberOfLines={1}>
          {fila.estudianteNombre}
        </Text>
        <Text style={estilos.detalle} numberOfLines={1}>
          {fila.cursoNombre} · {formatearFecha(movimiento.fecha)}
        </Text>
      </View>
      <Text style={[estilos.cantidad, { color }]}>
        {esOtorgar ? '+' : '−'}
        {movimiento.cantidad}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
  contenido: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  tituloSeccion: { fontSize: 18, fontWeight: '800', color: colores.texto, marginTop: 8, marginBottom: 4 },
  vacio: { color: colores.textoSuave, textAlign: 'center', paddingVertical: 16 },
  filaCurso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    padding: 14,
  },
  presionado: { opacity: 0.7 },
  iconoCurso: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.primarioSuave,
  },
  textoCurso: { flex: 1, color: colores.texto, fontWeight: '700', fontSize: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    padding: 14,
  },
  icono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1 },
  nombre: { color: colores.texto, fontWeight: '600', fontSize: 15 },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  cantidad: { fontSize: 18, fontWeight: '800' },
});
