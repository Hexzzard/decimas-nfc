# apps/profesor — App del profesor (Expo + React Native + TypeScript)

App offline-first: el profesor registra décimas en SQLite local y sincroniza con la API cuando hay conexión y sesión.

## Expo cambia rápido: no confíes en tu memoria

Antes de usar una API de Expo o React Native, revisa la versión de `expo` en `package.json` y consulta la documentación
de esa versión (`https://docs.expo.dev/versions/v<major>.0.0/` o el índice `https://docs.expo.dev/llms.txt`).
- Instala paquetes con `npx expo install <paquete>` (elige versiones compatibles con el SDK). Para pasar flags a npm
  en PowerShell: `npx expo install <paquete> "--" --save-dev`.
- La app se prueba en **Expo Go**: no agregues librerías con código nativo fuera de Expo Go sin preguntar (requieren un development build).
- **No uses Expo Router**: la navegación actual son modales sobre una pantalla. No crees `src/app/`.

## Estructura (`src/`)

| Carpeta | Contenido | Puede importar |
|---|---|---|
| `dominio/` | Tipos y funciones puras: saldos, validaciones, lotes | Nada externo (ni React, ni Expo) |
| `aplicacion/` | Puertos (`repositorio.ts`, `identidad.ts`, `sincronizacion.ts`) y casos de uso (`servicioDecimas.ts`, `sesion.ts`) | `dominio` |
| `infraestructura/` | Adaptadores: SQLite, HTTP hacia la API, Supabase Auth, `expo-secure-store` | `aplicacion`, `dominio` |
| `estado/` | Hooks que conectan casos de uso con React (`useLibroDecimas`, `useSesion`) | Todo lo anterior |
| `ui/` | Componentes y pantallas; estilos desde `ui/tema.ts` | `estado`, `dominio`, `config` y las clases de error de `aplicacion` (nunca adaptadores de `infraestructura`) |

- `App.tsx` es la **raíz de composición**: el único lugar donde se eligen los adaptadores.
- Los casos de uso reciben dependencias por parámetro (p. ej. `generarId`, `ahora`) para poder probarse.
- Errores esperados se modelan como clases con `motivo`/`codigo` (`ErrorDominio`, `ErrorEnvio`, `ErrorIdentidad`)
  y llevan `Object.setPrototypeOf(this, X.prototype)` para que `instanceof` funcione.

## Reglas específicas

- **SQLite:** el esquema se versiona con `PRAGMA user_version` en `repositorioSqlite.ts`; agrega un bloque `if (version < n)` nuevo, nunca edites uno existente.
- **Concurrencia:** las operaciones que leen y luego escriben pasan por la cola de `servicioDecimas.ts`; no la rodees.
- **Sesión:** el access token vive solo en memoria; en `expo-secure-store` se guarda solo `{ refreshToken, correo }`.
  Nunca uses AsyncStorage para tokens. El inicio de sesión **no bloquea** la app: solo se requiere para sincronizar.
- La contraseña va directo a Supabase Auth; nunca la envíes a nuestra API ni la registres en logs.

## Pruebas

- Jest (`jest-expo`). Pruebas junto al archivo: `algo.ts` → `algo.test.ts`.
- Prueba la lógica (dominio, casos de uso, adaptadores HTTP) sin red: usa los fakes de `src/aplicacion/__fakes__/`
  y reemplaza `globalThis.fetch` en las pruebas de adaptadores.

## Comandos (desde `apps/profesor/`)

```powershell
npm run typecheck   # tsc --noEmit (la CI lo ejecuta)
npm test            # Jest (la CI lo ejecuta con --ci)
npx expo start      # servidor de desarrollo
```
