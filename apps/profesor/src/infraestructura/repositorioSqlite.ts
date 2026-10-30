import type { SQLiteDatabase } from 'expo-sqlite';
import type { RepositorioMovimientos } from '../aplicacion/repositorio';
import type { RegistroPendientes } from '../aplicacion/sincronizacion';
import type { Asignatura } from '../dominio/asignatura';
import type { Movimiento, TipoMovimiento } from '../dominio/movimiento';

/**
 * Crea o actualiza el esquema. Cada migración se ejecuta una sola vez:
 * SQLite guarda en `user_version` hasta qué versión se aplicó.
 */
export async function prepararBaseDeDatos(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS movimientos (
        secuencia     INTEGER PRIMARY KEY AUTOINCREMENT,
        id            TEXT    NOT NULL UNIQUE,
        estudiante_id TEXT    NOT NULL,
        asignatura    TEXT    NOT NULL CHECK (asignatura IN ('MAT', 'LEN', 'CIE', 'HIS')),
        tipo          TEXT    NOT NULL CHECK (tipo IN ('OTORGAR', 'CANJEAR')),
        cantidad      INTEGER NOT NULL CHECK (cantidad > 0),
        fecha         TEXT    NOT NULL,
        motivo        TEXT,
        lote_id       TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_movimientos_estudiante ON movimientos (estudiante_id, secuencia);
      PRAGMA user_version = 1;
    `);
  }

  if (version < 2) {
    // Migración 2: recordar qué movimientos ya llegaron al servidor.
    await db.execAsync(`
      ALTER TABLE movimientos ADD COLUMN sincronizado INTEGER NOT NULL DEFAULT 0;
      PRAGMA user_version = 2;
    `);
  }
}

/** Así llega cada fila desde SQLite: nombres en snake_case y null en vez de undefined. */
type Fila = {
  id: string;
  estudiante_id: string;
  asignatura: string;
  tipo: string;
  cantidad: number;
  fecha: string;
  motivo: string | null;
  lote_id: string | null;
};

const COLUMNAS = 'id, estudiante_id, asignatura, tipo, cantidad, fecha, motivo, lote_id';

/** Un mismo adaptador implementa los dos puertos: ambos usan la misma tabla. */
export function crearRepositorioSqlite(db: SQLiteDatabase): RepositorioMovimientos & RegistroPendientes {
  return {
    async todos() {
      const filas = await db.getAllAsync<Fila>(`SELECT ${COLUMNAS} FROM movimientos ORDER BY secuencia`);
      return filas.map(aMovimiento);
    },

    async insertar(movimientos) {
      await db.withTransactionAsync(async () => {
        for (const m of movimientos) {
          await db.runAsync(
            `INSERT OR IGNORE INTO movimientos
               (id, estudiante_id, asignatura, tipo, cantidad, fecha, motivo, lote_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [m.id, m.estudianteId, m.asignatura, m.tipo, m.cantidad, m.fecha, m.motivo ?? null, m.loteId ?? null],
          );
        }
      });
    },

    async pendientes() {
      const filas = await db.getAllAsync<Fila>(
        `SELECT ${COLUMNAS} FROM movimientos WHERE sincronizado = 0 ORDER BY secuencia`,
      );
      return filas.map(aMovimiento);
    },

    async marcarSincronizados(ids) {
      await db.withTransactionAsync(async () => {
        for (const id of ids) {
          await db.runAsync('UPDATE movimientos SET sincronizado = 1 WHERE id = ?', [id]);
        }
      });
    },

    async contarPendientes() {
      const fila = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM movimientos WHERE sincronizado = 0',
      );
      return fila?.total ?? 0;
    },
  };
}

function aMovimiento(fila: Fila): Movimiento {
  return {
    id: fila.id,
    estudianteId: fila.estudiante_id,
    // Los CHECK de la tabla garantizan que estos valores son válidos.
    asignatura: fila.asignatura as Asignatura,
    tipo: fila.tipo as TipoMovimiento,
    cantidad: fila.cantidad,
    fecha: fila.fecha,
    motivo: fila.motivo ?? undefined,
    loteId: fila.lote_id ?? undefined,
  };
}