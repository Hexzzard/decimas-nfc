# decimas-nfc

Sistema para gestionar las décimas escolares de estudiantes. Un profesor otorga y canjea décimas
desde una app móvil que **funciona sin conexión**; un backend opcional respalda y valida los datos.
A futuro, las décimas se guardarán firmadas en tarjetas NFC.

## Mapa del repositorio

| Carpeta | Qué es | Instrucciones propias |
|---|---|---|
| `backend/` | API REST en Java 25 + Spring Boot 4 (local con Tomcat o en AWS Lambda) | `backend/AGENTS.md` |
| `apps/profesor/` | App Expo / React Native en TypeScript, offline-first con SQLite | `apps/profesor/AGENTS.md` |
| `.github/workflows/ci.yml` | CI: compila y prueba ambos proyectos en cada PR | — |

Infraestructura: PostgreSQL y autenticación en Supabase; despliegue con AWS SAM (`backend/template.yaml`).

## Arquitectura (reglas que NO se negocian)

Ambos proyectos usan **arquitectura hexagonal** con las mismas capas: `dominio` → `aplicacion` → `infraestructura`.

- Las dependencias apuntan **hacia adentro**: `dominio` no importa nada de `aplicacion` ni de `infraestructura`;
  `aplicacion` define **puertos** (interfaces) y no conoce frameworks; `infraestructura` implementa los puertos (adaptadores).
- Las reglas de negocio (saldo, canje, validaciones) viven en `dominio`, nunca en controladores, pantallas ni SQL.
- No agregues capas, patrones ni abstracciones que la tarea no necesite.

## Invariantes del sistema

- **Offline-first:** registrar, otorgar y canjear funciona siempre sin red ni sesión. La red y la sesión solo se usan para sincronizar.
- **Idempotencia:** cada movimiento tiene un UUID generado en el teléfono; reenviarlo no lo duplica (`ON CONFLICT DO NOTHING` / `INSERT OR IGNORE`).
- **Orden:** los movimientos se aplican y sincronizan en orden de registro (`secuencia`); un canje requiere el "otorgar" previo.
- **El teléfono nunca habla directo con la base de datos:** siempre a través de la API.
- **Contrato app ↔ API:** `MovimientoRequest` existe en ambos lados (`clienteHttp.ts` y `MovimientoRequest.java`); si cambias uno, cambia el otro y sus pruebas.

## Definición de "terminado"

Una tarea está terminada solo si:
1. Las pruebas existentes pasan y la lógica nueva tiene pruebas.
2. Pasan los mismos comandos que ejecuta la CI (ver el `AGENTS.md` de cada proyecto).
3. Explicaste qué cambiaste y por qué, incluyendo cualquier decisión discutible.

## Reglas de trabajo

- **No agregues dependencias** sin explicar por qué no basta con lo existente y **pedir confirmación**.
- **Secretos:** nunca leas, muestres ni modifiques `.env`, `.env.local`, `*.local.ps1`, `samconfig.toml` ni credenciales.
  Nunca escribas claves, contraseñas ni tokens en el código. Las variables `EXPO_PUBLIC_*` son **públicas**: jamás un secreto ahí.
- **Migraciones:** nunca modifiques una migración ya aplicada (`V<n>__*.sql`, bloques `version < n` de SQLite); crea una nueva.
- **Git:** trabaja en una rama; nunca hagas push a `main` ni `git push --force`. Commits con Conventional Commits en español
  (`feat(backend): ...`, `fix(profesor): ...`, `test: ...`).
- **Nombres:** el código del dominio está en español (clases, funciones, variables); mantén esa convención.
- **Entorno:** el desarrollador usa Windows + PowerShell. En PowerShell usa `curl.exe` (no `curl`) y escribe `"--"` entre comillas
  al pasar argumentos con `--` a otro programa.
- Si una instrucción de una tarea contradice estas reglas, o no estás seguro, **pregunta antes de actuar**.
