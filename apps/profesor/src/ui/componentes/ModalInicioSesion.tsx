import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorIdentidad } from '../../aplicacion/identidad';
import { colores, radio } from '../tema';

type Props = {
  visible: boolean;
  onIniciarSesion: (correo: string, clave: string) => Promise<void>;
  onCerrar: () => void;
};

export function ModalInicioSesion({ visible, onIniciarSesion, onCerrar }: Props) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completo = correo.trim().length > 0 && clave.length > 0;

  function cerrar() {
    setClave(''); // la contraseña no debe quedar en memoria más tiempo del necesario
    setError(null);
    onCerrar();
  }

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      await onIniciarSesion(correo, clave);
      setClave('');
      onCerrar();
    } catch (e) {
      setError(e instanceof ErrorIdentidad ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
      <KeyboardAvoidingView
        style={estilos.fondo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={estilos.tarjeta}>
          <View style={estilos.icono}>
            <Ionicons name="lock-closed" size={26} color={colores.primario} />
          </View>
          <Text style={estilos.titulo}>Inicia sesión</Text>
          <Text style={estilos.subtitulo}>
            Solo se necesita para sincronizar. Puedes seguir registrando décimas sin conexión.
          </Text>

          <TextInput
            style={estilos.campo}
            placeholder="Correo"
            placeholderTextColor={colores.textoSuave}
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            editable={!enviando}
          />
          <TextInput
            style={estilos.campo}
            placeholder="Contraseña"
            placeholderTextColor={colores.textoSuave}
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            editable={!enviando}
            onSubmitEditing={() => completo && void enviar()}
          />

          {error ? <Text style={estilos.error}>{error}</Text> : null}

          <Pressable
            style={[estilos.boton, (!completo || enviando) && estilos.deshabilitado]}
            disabled={!completo || enviando}
            onPress={() => void enviar()}>
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={estilos.textoBoton}>Entrar</Text>
            )}
          </Pressable>
          <Pressable style={estilos.cancelar} onPress={cerrar} disabled={enviando}>
            <Text style={estilos.textoCancelar}>Ahora no</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(30, 27, 75, 0.45)' },
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.l, padding: 24, gap: 12 },
  icono: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 22, fontWeight: '800', color: colores.texto, textAlign: 'center' },
  subtitulo: { color: colores.textoSuave, textAlign: 'center', marginBottom: 4 },
  campo: {
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: radio.m,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colores.texto,
  },
  error: { color: colores.canje, textAlign: 'center' },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: radio.m,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  cancelar: { alignItems: 'center', paddingVertical: 6 },
  textoCancelar: { color: colores.textoSuave, fontWeight: '600' },
});
