/** Una sesión iniciada. El access token vive solo en memoria; el refresh token, en almacenamiento seguro. */
export type Sesion = {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Momento de expiración del access token, en milisegundos desde 1970. */
  readonly expiraEn: number;
  readonly correo: string;
};

/** Puerto: quién verifica las credenciales y emite los tokens (hoy Supabase Auth). */
export interface ProveedorIdentidad {
  iniciarSesion(correo: string, clave: string): Promise<Sesion>;
  /** Pide tokens nuevos. Ojo: el refresh token ROTA, hay que guardar el que viene en la respuesta. */
  renovar(refreshToken: string): Promise<Sesion>;
  cerrarSesion(accessToken: string): Promise<void>;
}

/** Puerto: dónde se guarda el refresh token entre aperturas de la app (Keychain / Keystore). */
export interface AlmacenSeguro {
  leer(): Promise<string | null>;
  guardar(valor: string): Promise<void>;
  borrar(): Promise<void>;
}

export type MotivoErrorIdentidad = 'CREDENCIALES' | 'SESION_EXPIRADA' | 'SIN_SESION' | 'SIN_CONEXION' | 'SIN_CONFIGURACION';

export class ErrorIdentidad extends Error {
  readonly motivo: MotivoErrorIdentidad;

  constructor(motivo: MotivoErrorIdentidad, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorIdentidad';
    this.motivo = motivo;
    Object.setPrototypeOf(this, ErrorIdentidad.prototype);
  }
}