import type { SQLiteDatabase } from 'expo-sqlite';
import type { RepositorioMovimientos } from '../aplicacion/repositorio';
import type { Asignatura } from '../dominio/asignatura';
import type { Movimiento, TipoMovimiento } from '../dominio/movimiento';

/** Crea la tabla si no existe. Se ejecuta cada vez que se abre la base de datos. */
export async function prepararBaseDeDatos(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
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
  `);
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

export function crearRepositorioSqlite(db: SQLiteDatabase): RepositorioMovimientos {
  return {
    async todos() {
      const filas = await db.getAllAsync<Fila>(
        `SELECT id, estudiante_id, asignatura, tipo, cantidad, fecha, motivo, lote_id
           FROM movimientos
          ORDER BY secuencia`,
      );
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