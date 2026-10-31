import * as Crypto from 'expo-crypto';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crearServicioDecimas } from './src/aplicacion/servicioDecimas';
import { crearGestorSesion } from './src/aplicacion/sesion';
import { crearSincronizador } from './src/aplicacion/sincronizacion';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, URL_API } from './src/config';
import { CURSOS_DEMO, ESTUDIANTES_DEMO, MOVIMIENTOS_DEMO } from './src/datos/demo';
import { estudiantesDelCurso, type Curso } from './src/dominio/curso';
import type { Estudiante } from './src/dominio/estudiante';
import { useLibroDecimas } from './src/estado/useLibroDecimas';
import { useSesion } from './src/estado/useSesion';
import { crearAlmacenSeguro } from './src/infraestructura/almacenSeguro';
import { crearClienteHttp } from './src/infraestructura/clienteHttp';
import { crearIdentidadSupabase } from './src/infraestructura/identidadSupabase';
import { crearRepositorioSqlite, prepararBaseDeDatos } from './src/infraestructura/repositorioSqlite';
import { ModalEstudiante } from './src/ui/pantallas/ModalEstudiante';
import { PantallaCurso } from './src/ui/pantallas/PantallaCurso';
import { PantallaInicio } from './src/ui/pantallas/PantallaInicio';
import { colores } from './src/ui/tema';

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="decimas.db" onInit={inicializar}>
        <Contenido />
      </SQLiteProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

/** Se ejecuta antes de mostrar la app: prepara el esquema y, la primera vez, carga los datos de ejemplo. */
async function inicializar(db: SQLiteDatabase) {
  await prepararBaseDeDatos(db);
  const repositorio = crearRepositorioSqlite(db);
  if ((await repositorio.todos()).length === 0) {
    await repositorio.insertar(MOVIMIENTOS_DEMO);
  }
}

function Contenido() {
  const db = useSQLiteContext();
  // "Raíz de composición": aquí se elige qué adaptador usa cada caso de uso.
  const { servicio, sincronizador, gestorSesion } = useMemo(() => {
    const repositorio = crearRepositorioSqlite(db);
    const gestorSesion = crearGestorSesion(
      crearIdentidadSupabase(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
      crearAlmacenSeguro(),
    );
    return {
      servicio: crearServicioDecimas(repositorio, () => Crypto.randomUUID()),
      sincronizador: crearSincronizador(
        repositorio,
        crearClienteHttp(URL_API, () => gestorSesion.obtenerTokenVigente()),
      ),
      gestorSesion,
    };
  }, [db]);
  const libro = useLibroDecimas(servicio, sincronizador);
  const sesion = useSesion(gestorSesion);
  const [abierto, setAbierto] = useState<Estudiante | null>(null);
  // null = pantalla de inicio; un curso = PantallaCurso de ese curso. No se recuerda entre aperturas.
  const [cursoAbierto, setCursoAbierto] = useState<Curso | null>(null);
  const estudiantesCurso = useMemo(
    () => (cursoAbierto ? estudiantesDelCurso(cursoAbierto, ESTUDIANTES_DEMO) : []),
    [cursoAbierto],
  );

  // Android: el botón atrás del sistema vuelve al inicio mientras se ve un curso y no hay modal abierto
  // (con el modal abierto, lo maneja su onRequestClose).
  useEffect(() => {
    if (cursoAbierto === null || abierto !== null) return;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setCursoAbierto(null);
      return true;
    });
    return () => suscripcion.remove();
  }, [cursoAbierto, abierto]);

  if (libro.cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <>
      {cursoAbierto ? (
        <PantallaCurso
          // key: al cambiar de curso se descarta cualquier selección masiva a medias.
          key={cursoAbierto.id}
          curso={cursoAbierto}
          estudiantes={estudiantesCurso}
          libro={libro}
          sesion={sesion}
          onAbrirEstudiante={setAbierto}
          onVolver={() => setCursoAbierto(null)}
        />
      ) : (
        <PantallaInicio
          cursos={CURSOS_DEMO}
          estudiantes={ESTUDIANTES_DEMO}
          libro={libro}
          sesion={sesion}
          onAbrirCurso={setCursoAbierto}
        />
      )}
      <ModalEstudiante estudiante={abierto} libro={libro} onCerrar={() => setAbierto(null)} />
    </>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
});