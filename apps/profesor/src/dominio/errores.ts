export type CodigoError =
  | 'CANTIDAD_INVALIDA'
  | 'SALDO_INSUFICIENTE'
  | 'SIN_ESTUDIANTES'
  | 'ESTUDIANTE_EN_VARIOS_CURSOS';

export class ErrorDominio extends Error {
  readonly codigo: CodigoError;

  constructor(codigo: CodigoError, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDominio';
    this.codigo = codigo;
    // Al extender Error, algunos transpiladores rompen `instanceof`. Esta línea lo corrige.
    Object.setPrototypeOf(this, ErrorDominio.prototype);
  }
}

