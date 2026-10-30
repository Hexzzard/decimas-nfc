import { ErrorIdentidad, type AlmacenSeguro, type ProveedorIdentidad, type Sesion } from './identidad';
import { crearGestorSesion } from './sesion';

const UNA_HORA = 3_600_000;

/** Escenario de prueba: reloj controlable, almacén en memoria y un proveedor que rota refresh tokens. */
function crearEscenario() {
  const escenario = {
    reloj: 1_000_000,
    guardado: null as string | null,
    hayRed: true,
    renovaciones: 0,
    refreshValido: 'rt1',
  };
  const ahora = () => escenario.reloj;

  const almacen: AlmacenSeguro = {
    leer: async () => escenario.guardado,
    guardar: async (valor) => {
      escenario.guardado = valor;
    },
    borrar: async () => {
      escenario.guardado = null;
    },
  };

  const proveedor: ProveedorIdentidad = {
    async iniciarSesion(correo, clave): Promise<Sesion> {
      if (clave !== 'correcta') throw new ErrorIdentidad('CREDENCIALES', 'Correo o contraseña incorrectos');
      return { accessToken: 'at1', refreshToken: 'rt1', expiraEn: ahora() + UNA_HORA, correo };
    },
    async renovar(refreshToken): Promise<Sesion> {
      await new Promise((resolver) => setTimeout(resolver, 5));
      if (!escenario.hayRed) throw new ErrorIdentidad('SIN_CONEXION', 'Sin conexión');
      if (refreshToken !== escenario.refreshValido) throw new ErrorIdentidad('SESION_EXPIRADA', 'Tu sesión expiró');
      escenario.renovaciones += 1;
      escenario.refreshValido = `rt${escenario.renovaciones + 1}`; // rotación
      return {
        accessToken: `at${escenario.renovaciones + 1}`,
        refreshToken: escenario.refreshValido,
        expiraEn: ahora() + UNA_HORA,
        correo: 'profe@colegio.cl',
      };
    },
    async cerrarSesion() {},
  };

  return { escenario, crearGestor: () => crearGestorSesion(proveedor, almacen, ahora) };
}

describe('GestorSesion', () => {
  it('sin sesión, no entrega token', async () => {
    const { crearGestor } = crearEscenario();
    await expect(crearGestor().obtenerTokenVigente()).rejects.toMatchObject({ motivo: 'SIN_SESION' });
  });

  it('nunca guarda el access token: solo el refresh token y el correo', async () => {
    const { escenario, crearGestor } = crearEscenario();
    await crearGestor().iniciarSesion(' profe@colegio.cl ', 'correcta');

    expect(escenario.guardado).not.toContain('at1');
    expect(JSON.parse(escenario.guardado!)).toEqual({ refreshToken: 'rt1', correo: 'profe@colegio.cl' });
  });

  it('con el token vencido y tres envíos a la vez, renueva una sola vez y guarda el refresh token rotado', async () => {
    const { escenario, crearGestor } = crearEscenario();
    const gestor = crearGestor();
    await gestor.iniciarSesion('profe@colegio.cl', 'correcta');
    escenario.reloj += UNA_HORA;

    const tokens = await Promise.all([
      gestor.obtenerTokenVigente(),
      gestor.obtenerTokenVigente(),
      gestor.obtenerTokenVigente(),
    ]);

    expect(tokens).toEqual(['at2', 'at2', 'at2']);
    expect(escenario.renovaciones).toBe(1);
    expect(escenario.guardado).toContain('rt2');
  });

  it('al reabrir la app sin internet, la sesión sigue activa y no se pierde', async () => {
    const { escenario, crearGestor } = crearEscenario();
    await crearGestor().iniciarSesion('profe@colegio.cl', 'correcta');

    const reabierta = crearGestor();
    escenario.hayRed = false;
    await reabierta.restaurar();

    expect(reabierta.estado().activa).toBe(true);
    await expect(reabierta.obtenerTokenVigente()).rejects.toMatchObject({ motivo: 'SIN_CONEXION' });
    expect(reabierta.estado().activa).toBe(true);
  });

  it('si el refresh token fue revocado, cierra la sesión y la borra del almacén', async () => {
    const { escenario, crearGestor } = crearEscenario();
    escenario.guardado = JSON.stringify({ refreshToken: 'revocado', correo: 'profe@colegio.cl' });
    const gestor = crearGestor();
    await gestor.restaurar();

    await expect(gestor.obtenerTokenVigente()).rejects.toMatchObject({ motivo: 'SESION_EXPIRADA' });
    expect(gestor.estado().activa).toBe(false);
    expect(escenario.guardado).toBeNull();
  });
});
