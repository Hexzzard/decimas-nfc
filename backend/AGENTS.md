# backend — API REST (Java 25 + Spring Boot 4)

## Estructura (`src/main/java/cl/decimas/backend/`)

| Paquete | Contenido | Puede depender de |
|---|---|---|
| `dominio/` | Records y clases puras: `Movimiento`, `CuentaDecimas`, `ErrorDominio` | Solo JDK |
| `aplicacion/` | Casos de uso (`RegistrarMovimiento`, `ConsultarSaldos`) y puertos (`aplicacion/puerto/`) | `dominio` |
| `infraestructura/` | Adaptadores: `web/` (controladores, DTO, errores), `persistencia/`, `seguridad/`, `config/` | Todo |

- `dominio` y `aplicacion` **no usan anotaciones de Spring**. Los beans se crean en `infraestructura/config/ConfiguracionCasosDeUso.java`.
- Los controladores son delgados: traducen HTTP ↔ caso de uso. Validación de formato en el DTO (Bean Validation); reglas de negocio en el dominio.
- Errores de dominio → `ManejadorErrores` → `ProblemDetail` (409 saldo insuficiente, 400 datos inválidos).

## Persistencia

- `JdbcClient` con **SQL explícito**. No uses JPA/Hibernate.
- Adaptador elegido por `decimas.persistencia` (`postgres` en ejecución, `memoria` en pruebas) con `@ConditionalOnProperty`.
- Migraciones Flyway en `src/main/resources/db/migration/V<n>__descripcion.sql`; toda tabla nueva en `public` lleva
  `ENABLE ROW LEVEL SECURITY` (Supabase expone una API REST pública sobre ese esquema).

## Seguridad

- Resource server OAuth2: valida JWT de Supabase Auth (ES256, JWKS). Toda ruta `/api/**` exige `ROLE_PROFESOR`,
  que se deriva del claim `app_metadata.rol == "profesor"` (nunca de `user_metadata`, que el usuario puede editar).
- Por defecto se niega todo lo que no esté permitido explícitamente.

## AWS Lambda

- `LambdaHandler` vive en `src/lambda/java` y solo se compila con el perfil Maven `lambda`.
- La dependencia `aws-serverless-java-container-springboot4` va **solo** dentro del perfil `lambda`:
  en las dependencias comunes reemplaza a Tomcat y el backend local deja de arrancar.
- En Lambda, Flyway está desactivado y se usa el transaction pooler de Supabase (puerto 6543, `prepareThreshold=0`).

## Pruebas

- JUnit 5 + AssertJ. Las pruebas de dominio y casos de uso son Java puro, sin levantar Spring; usa `RepositorioMovimientosEnMemoria` como fake.
- Las pruebas no se conectan a internet: `src/test/resources/application.properties` usa el adaptador en memoria
  y excluye DataSource/Flyway. Si agregas configuración que requiera red, dale un valor de prueba ahí.

## Comandos (desde `backend/`, en PowerShell)

```powershell
.\mvnw.cmd -B verify                       # compilar + pruebas (lo mismo que la CI)
.\mvnw.cmd -B -Plambda -DskipTests package # verificar el JAR de Lambda
.\mvnw.cmd spring-boot:run                 # ejecutar localmente (necesita backend/.env, que NO debes leer)
```

- Spring Boot 4 cambió nombres de starters y paquetes de autoconfiguración: verifica en la documentación oficial antes de agregarlos.
- No ejecutes `sam deploy` ni `sam delete`: los despliegues los hace el desarrollador.
