import * as Crypto from 'expo-crypto';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crearServicioDecimas } from './src/aplicacion/servicioDecimas';
import { crearGestorSesion } from './src/aplicacion/sesion';
import { crearSincronizador } from './src/aplicacion/sincronizacion';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, URL_API } from './src/config';
import { ESTUDIANTES_DEMO, MOVIMIENTOS_DEMO } from './src/datos/demo';
import type { Estudiante } from './src/dominio/estudiante';
import { useLibroDecimas } from './src/estado/useLibroDecimas';
import { useSesion } from './src/estado/useSesion';
import { crearAlmacenSeguro } from './src/infraestructura/almacenSeguro';
import { crearClienteHttp } from './src/infraestructura/clienteHttp';
import { crearIdentidadSupabase } from './src/infraestructura/identidadSupabase';
import { crearRepositorioSqlite, prepararBaseDeDatos } from './src/infraestructura/repositorioSqlite';
import { ModalEstudiante } from './src/ui/pantallas/ModalEstudiante';
import { PantallaCurso } from './src/ui/pantallas/PantallaCurso';
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

  if (libro.cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <>
      <PantallaCurso
        estudiantes={ESTUDIANTES_DEMO}
        libro={libro}
        sesion={sesion}
        onAbrirEstudiante={setAbierto}
      />
      <ModalEstudiante estudiante={abierto} libro={libro} onCerrar={() => setAbierto(null)} />
    </>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
});