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
import { estudiantesDelCurso, type Curso } from './src/dominio/curso';
import type { Estudiante } from './src/dominio/estudiante';
import { useCatalogo } from './src/estado/useCatalogo';
import { useLibroDecimas } from './src/estado/useLibroDecimas';
import { useSesion } from './src/estado/useSesion';
import { crearAlmacenSeguro } from './src/infraestructura/almacenSeguro';
import { crearClienteCursosHttp, crearClienteHttp } from './src/infraestructura/clienteHttp';
import { crearIdentidadSupabase } from './src/infraestructura/identidadSupabase';
import {
  crearAlmacenCatalogoSqlite,
  crearRepositorioSqlite,
  prepararBaseDeDatos,
} from './src/infraestructura/repositorioSqlite';
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

/** Se ejecuta antes de mostrar la app: prepara el esquema. */
async function inicializar(db: SQLiteDatabase) {
  await prepararBaseDeDatos(db);
}

function Contenido() {
  const db = useSQLiteContext();
  // "Raíz de composición": aquí se elige qué adaptador usa cada caso de uso.
  const { servicio, sincronizador, gestorSesion, almacenCatalogo } = useMemo(() => {
    const repositorio = crearRepositorioSqlite(db);
    const almacenCatalogo = crearAlmacenCatalogoSqlite(db);
    const gestorSesion = crearGestorSesion(
      crearIdentidadSupabase(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
      crearAlmacenSeguro(),
    );
    const obtenerToken = () => gestorSesion.obtenerTokenVigente();
    return {
      servicio: crearServicioDecimas(repositorio, () => Crypto.randomUUID()),
      sincronizador: crearSincronizador(repositorio, crearClienteHttp(URL_API, obtenerToken), {
        cliente: crearClienteCursosHttp(URL_API, obtenerToken),
        almacen: almacenCatalogo,
      }),
      gestorSesion,
      almacenCatalogo,
    };
  }, [db]);
  const libro = useLibroDecimas(servicio, sincronizador);
  const sesion = useSesion(gestorSesion);
  const catalogo = useCatalogo(almacenCatalogo, libro.sincronizacion.ultima);
  const [abierto, setAbierto] = useState<Estudiante | null>(null);
  // null = pantalla de inicio; un id = PantallaCurso de ese curso. No se recuerda entre aperturas.
  // Se guarda el id y no el curso para ver siempre los datos del catálogo vigente.
  const [cursoAbiertoId, setCursoAbiertoId] = useState<string | null>(null);
  // Si el curso ya no existe en el catálogo nuevo, es undefined y se muestra el inicio.
  const cursoAbierto: Curso | undefined = catalogo.cursos.find((c) => c.id === cursoAbiertoId);
  const estudiantesCurso = useMemo(
    () => (cursoAbierto ? estudiantesDelCurso(cursoAbierto, catalogo.estudiantes) : []),
    [cursoAbierto, catalogo.estudiantes],
  );

  // Android: el botón atrás del sistema vuelve al inicio mientras se ve un curso y no hay modal abierto
  // (con el modal abierto, lo maneja su onRequestClose).
  useEffect(() => {
    if (cursoAbierto === undefined || abierto !== null) return;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setCursoAbiertoId(null);
      return true;
    });
    return () => suscripcion.remove();
  }, [cursoAbierto, abierto]);

  if (libro.cargando || !catalogo.cargado) {
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
          onVolver={() => setCursoAbiertoId(null)}
        />
      ) : (
        <PantallaInicio
          cursos={catalogo.cursos}
          estudiantes={catalogo.estudiantes}
          libro={libro}
          sesion={sesion}
          onAbrirCurso={(curso) => setCursoAbiertoId(curso.id)}
        />
      )}
      <ModalEstudiante estudiante={abierto} libro={libro} onCerrar={() => setAbierto(null)} />
    </>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
});