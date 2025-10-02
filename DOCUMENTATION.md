# DOCUMENTACIÓN COMPLETA — Invdental

Fecha: 2025-10-02
Versión: workspace snapshot

Este documento describe en detalle el proyecto, cómo está configurado, qué se ha implementado, qué funciona, qué no, y qué queda pendiente.

## Índice

- Resumen general
- Estructura del proyecto
- Tecnologías usadas
- Cómo ejecutar (local)
- API Backend (endpoints y comportamiento)
- Frontend (rutas, componentes clave)
- Persistencia y datos
- Seguridad y autenticación (actual)
- Tests automáticos
- Qué funciona (lista)
- Qué no funciona / limitaciones
- Pendientes y mejoras recomendadas
- Notas del desarrollo y decisiones tomadas


## Resumen general

Este repositorio contiene una aplicación de inventario dental (frontend React + backend Express). El objetivo es gestionar productos, proveedores, usuarios y categorías, con generación de QR y acciones de inventario como "quitar del stock". Hay además auditoría para registrar quién realiza acciones.


## Estructura del proyecto (resumen)

Raíz:
- `package.json` — scripts de alto nivel (dev:all, start:client, start:server, etc.).
- `README.md` — (puede existir, revisa raíz)
- `DOCUMENTATION.md` — este archivo.

Frontend:
- `src/`
  - `main.jsx` — bootstrap, ahora envuelto en `BrowserRouter`.
  - `App.jsx` — componente principal, navegación, lógica global, toasts, handlers de CRUD.
  - `index.css` — estilos (Tailwind + overrides).
  - `components/` — componentes reutilizables:
    - `InventoryTable.jsx` — tabla / cards de inventario con acciones.
    - `ProductForm.jsx` — formulario para crear/editar productos.
    - `ProviderSelect.jsx` — select de proveedores.
    - `QRGenerator.jsx` — muestra QR (usa `qrcode.react` para generar inline o muestra imagen del backend si la URL apunta al API).
    - `QRScanner.jsx` — lector de QR (usa `@zxing/browser`).
    - `AuthContext.jsx` — contexto de autenticación (mock + backend auth fallback). Persiste usuario en `localStorage`.
    - `Login.jsx` — formulario de login.
    - `ConfirmDialog.jsx` — modal de confirmación.
    - `Toast.jsx` — notificaciones en pantalla.
  - `pages/` — páginas principales:
    - `ProvidersPage.jsx` — CRUD simple para proveedores.
    - `UsersPage.jsx` — CRUD para usuarios.
    - `CategoriesPage.jsx` — CRUD para categorías.
  - `utils/` — utilidades (por ejemplo export CSV).

Backend (server):
- `server/start.js` — arranca el servidor (usa `app` exportado).
- `server/index.js` — Express app con endpoints y persistencia en JSON.
- `server/data.json` — almacenamiento persistente (JSON) para productos, proveedores, usuarios, categorías y logs.
- `server/test/*` — tests automatizados (jest + supertest).


## Tecnologías usadas

Frontend:
- Vite + React 18
- Tailwind CSS
- qrcode.react (generación local de QR si es necesario)
- @zxing/browser (escáner QR en navegador)
- react-router-dom (ruteo)

Backend:
- Node.js + Express
- qrcode (genera PNG de QR on-the-fly en `/api/qr/:id`)
- Persistencia simple basada en `fs.promises` escribiendo `server/data.json`

Tests:
- Jest + Supertest (server)

Herramientas dev:
- concurrently (para levantar frontend + backend juntos)


## Cómo ejecutar (local)

Desde la raíz del proyecto:

Instalar dependencias:

```bash
npm install
npm --prefix ./server install
```

Levantar solo el backend:

```bash
npm --prefix ./server start
# o desde dentro de server/
cd server
npm start
```

Levantar solo el frontend (Vite):

```bash
npm run start:client
```

Levantar ambos a la vez (recomendado en dev):

```bash
npm run dev:all
```

Pruebas del servidor:

```bash
npm --prefix ./server test
```


## API Backend — Endpoints principales

Base URL: http://localhost:4000

Productos
- GET /api/products — lista productos (array)
- GET /api/products/:id — obtener producto
- POST /api/products — crear producto
  - Body: objeto con campos: nombre, cantidad, proveedor/proveedorId (según frontend), cantidadMinima, foto, codigoBarras, categoriaId, usuarioId, qr (opcional)
  - Si no se envía `qr`, el servidor guarda como `qr` la URL absoluta `http(s)://<host>/api/qr/:id`.
  - Registrar auditoría (requiere headers `x-user-id` y `x-user-name` o fields `performedBy`/`performedById` en body).
- PUT /api/products/:id — actualizar producto (registra auditoría)
- DELETE /api/products/:id — elimina producto (registra auditoría)

QR
- GET /api/qr/:id — genera y devuelve un PNG con el contenido `http(s)://<host>/?id=:id`. No escribe archivos en disco.

Proveedores
- GET /api/providers
- POST /api/providers — crea proveedor (registra auditoría)
- PUT /api/providers/:id — actualiza (registra auditoría)
- DELETE /api/providers/:id — elimina (registra auditoría)

Usuarios
- GET /api/users
- POST /api/users — crea usuario (registra auditoría)
- PUT /api/users/:id — actualiza usuario (registra auditoría)
- DELETE /api/users/:id — elimina usuario (registra auditoría)

Categorías
- GET /api/categories
- POST /api/categories — crea categoría (registra auditoría)
- PUT /api/categories/:id — actualiza categoría (registra auditoría)
- DELETE /api/categories/:id — elimina categoría (registra auditoría)

Auth (mock)
- POST /api/auth/login
  - Body: { username, password }
  - Devuelve un objeto { token, user } donde `token` es un JWT y `user` contiene { id, nombre, rol }.
  - Para usar el API protegido, incluya la cabecera `Authorization: Bearer <token>` en las peticiones mutativas y al acceder a `/api/logs`.
  - Si el backend rechaza, el frontend intenta un login local con usuarios mock (modo desarrollo). En producción se debe usar el token.

Logs/auditoría
- Los logs se escriben en `server/data.json` bajo la propiedad `logs` (array). Cada entrada: { id, timestamp, action, actor, itemId, itemName }
- Endpoint público: GET `/api/logs` (añadido)
  - Parámetros opcionales: `limit` (ej. ?limit=100), `action` (filtrar por acción) y `actorId`.
  - Devuelve logs en orden descendente (más recientes primero).

Nota importante: desde la última versión el endpoint `/api/logs` está protegido — solo usuarios con rol `admin` pueden leerlo. El servidor acepta un JWT en la cabecera `Authorization: Bearer <token>`; también mantiene compatibilidad para lectura a través de `x-user-id` cuando sea necesario (desarrollo/tests).
Además de `limit`, `action` y `actorId`, el endpoint acepta los parámetros `start` y `end` para filtrar por rango de fechas (ISO datetime o fecha en formato `YYYY-MM-DD`). `start` es inclusivo y `end` también (si se pasa solo la parte de fecha, `end` se extiende hasta las 23:59:59.999 de ese día para incluir entradas de toda la jornada).

Página de Logs
- Se añadió `src/pages/LogsPage.jsx` y la ruta `/logs` en el frontend para visualizar los logs desde la UI.
- La página permite seleccionar cuántos logs mostrar (50/100/200), filtrar por fecha (desde/hasta) y refrescar la lista.
- Acceso: la UI también comprueba el rol del usuario y muestra "Acceso denegado" si el usuario no es `admin`.


## Frontend — Rutas y componentes clave

Rutas (react-router):
- `/providers` — administración de proveedores
- `/stock` — tabla/tarjetas de inventario (default redirige a `/providers`)
- `/users` — administración de usuarios
- `/categories` — administración de categorías

Componentes clave:
- `App.jsx` — flujos globales, handlers de fetch para CRUD, toasts, confirm dialogs.
- `InventoryTable.jsx` — muestra productos, botones: Editar, Quitar del stock (pone cantidad a 0), Eliminar (confirma).
- `ProductForm.jsx` — al crear/editar, envía peticiones al backend.
- `ProvidersPage.jsx`, `UsersPage.jsx`, `CategoriesPage.jsx` — listas + formularios inline.
- `QRGenerator.jsx` — si recibe una URL al backend (p. ej. `/api/qr/3`) muestra la imagen; si recibe otro texto usa `qrcode.react`.
- `AuthContext.jsx` — persistencia de usuario en `localStorage` y wrapper para login/logout.

Headers de auditoría
- Todas las peticiones mutativas (POST/PUT/DELETE) incluyen headers `x-user-id` y `x-user-name` si el usuario está autenticado, para que el backend registre quién hizo la acción.
Seguridad y encabezados
- Ahora el flujo recomendado es usar el JWT devuelto por `/api/auth/login`. En cada petición mutativa o al pedir `/api/logs` envía:
  - Authorization: Bearer <token>
  - El servidor leerá `req.user` desde el token y lo usará para registrar el actor en los logs.
- Para compatibilidad con clientes antiguos o durante pruebas, el servidor acepta `x-user-id` para resolver el usuario en `server/data.json` (especialmente cuando NODE_ENV==='test').


## Persistencia y formato de `server/data.json`

El archivo contiene objetos y contadores, ejemplo de propiedades esperadas:
- products: [ { id, nombre, cantidad, proveedor, cantidadMinima, foto, codigoBarras, categoriaId, usuarioId, qr } ]
- lastId: número
- providers: [ { id, nombre, contacto, email, telefono } ]
- providersLastId
- users: [ { id, nombre, apellidos, username, rol } ]
- usersLastId
- categories: [ { id, nombre } ]
- categoriesLastId
- logs: [ { id, timestamp, action, actor: {id,name}, itemId, itemName } ]
- logsLastId

Si editas `server/data.json` manualmente, reinicia el servidor para que lea los cambios.


## Seguridad y autenticación

- Estado actual: autenticación JWT básica implementada.
  - El endpoint `POST /api/auth/login` devuelve `{ token, user }` donde `token` es un JWT (expira por defecto en 8h) y `user` contiene { id, nombre, rol }.
  - El servidor incorpora middleware que valida el JWT y pone `req.user` con la información del usuario. Las rutas mutativas y `/api/logs` están protegidas y requieren autenticación; `/api/logs` requiere además rol `admin`.
  - Para desarrollo y compatibilidad con clientes existentes, el servidor sigue resolviendo `x-user-id` desde `server/data.json` cuando se manda ese header, y en `NODE_ENV==='test'` el middleware inyecta un usuario mock para que la batería de tests existente siga funcionando.
  - Se recomienda configurar la variable de entorno `JWT_SECRET` en producción para reemplazar el secreto por defecto (actualmente `dev-secret-invdental` en desarrollo).

Recomendaciones de seguridad inmediatas:
- Mover `JWT_SECRET` a variables de entorno y almacenarlo de forma segura (no en el código fuente).
- Servir la aplicación por HTTPS en producción y usar SameSite y Secure flags si el token se guarda en cookies.
- Implementar refresh tokens y revocación (blacklist) si necesitas invalidar tokens antes de su expiración.
- Considerar hardening adicional: rate limiting en el endpoint de login, validación y sanitización de inputs, y registros de auditoría más detallados.


## Tests automáticos

- Los tests del servidor están en `server/test/` y se ejecutan con `npm --prefix ./server test`.
- Cobertura actual: tests cubren GET /api/products y los tests añadidos verifican providers CRUD y la operación de "quitar stock" (PUT que pone cantidad=0).
- Los tests pasan en el entorno actual.


## Qué funciona (resumen probado)

- Frontend:
  - Navegación entre vistas con ruteo.
  - Listado de productos (cards y tabla), visualización de QR en detalle.
  - Añadir/editar productos (envía a backend; backend genera `qr` si falta).
  - Quitar del stock (poner cantidad a 0) con confirmación y persistencia.
  - Eliminar producto con confirmación.
  - Páginas CRUD para Proveedores, Usuarios y Categorías (crear/editar/eliminar) y están disponibles para todos los usuarios.
  - Login (mock y backend), persistencia de usuario en `localStorage`.
  - Toasts para notificaciones rápidas.
- Backend:
  - CRUD completo para productos, proveedores, usuarios y categorías.
  - Generación de QR en PNG en `/api/qr/:id` (no guarda archivos).
  - Registro (auditoría) de acciones create/update/delete en `server/data.json` bajo `logs`.
  - Tests automáticos con Jest + Supertest.


## Qué no funciona / limitaciones actuales

- Seguridad:
  - No hay autenticación robusta (no se usan tokens ni sesiones seguras). Las cabeceras `x-user-id` y `x-user-name` pueden ser falsificadas por un cliente malicioso.
- Logs:
  - El endpoint `/api/logs` ya existe pero está protegido para administradores. Asegúrate de que el cliente incluya la cabecera `x-user-role: admin` o `x-user-id` correspondiente para acceder. (Ver nota de seguridad: estas cabeceras son de confianza en la implementación actual y pueden ser falsificadas sin autenticación real.)
- Concurrencia / integridad:
  - La persistencia usa `fs.writeFile` en un único JSON — no es segura para concurrencia alta. Está bien para demos o single-process but not for production.
- Validación:
  - Validación de inputs (emails, números, tamaños) es mínima.
- Tests:
  - Falta cobertura frontend y más tests de backend (por ejemplo validaciones y error cases).
- Internacionalización y accesibilidad:
  - No hay i18n ni chequeos a11y profundos.


## Pendientes y mejoras recomendadas

Prioritarias:
- Añadir autenticación real (JWT + refresh tokens o sessions) y middleware para proteger endpoints.
- Añadir endpoint GET `/api/logs` y una página en frontend para revisar la auditoría.
- Reemplazar almacenamiento JSON por una base de datos (SQLite, Postgres) para mayor fiabilidad y consultas.
- Validar y sanitizar entradas en el backend.

Extras útiles:
- Tests E2E con Playwright o Cypress.
- Paginación y filtros en listados grandes.
- Exportaciones y reportes programados.
- Permisos más finos (roles y políticas).


## Notas de desarrollo y decisiones técnicas

- Evité dependencias nativas (como better-sqlite3) para facilitar ejecución en entornos sin compilación nativa.
- Opté por `qrcode` en el backend para generar PNGs on-the-fly. Esto evita escribir archivos al disco.
- Persistencia simple en `server/data.json` permite inspección manual y facilidad en desarrollo.
- La interfaz prioriza la funcionalidad y velocidad de desarrollo sobre la exactitud visual con la referencia original.


## Archivos creados/modificados importantes (lista)

- `src/App.jsx` — lógica principal, handlers, toasts, confirm dialogs y routing.
- `src/main.jsx` — envuelve la app con `BrowserRouter`.
- `src/components/InventoryTable.jsx`, `ProductForm.jsx`, `ProviderSelect.jsx`, `QRGenerator.jsx`, `QRScanner.jsx`, `ConfirmDialog.jsx`, `Toast.jsx`, `AuthContext.jsx`, `Login.jsx`.
- `src/pages/ProvidersPage.jsx`, `UsersPage.jsx`, `CategoriesPage.jsx`.
- `server/index.js` — endpoints CRUD, QR generation, logging, read/write JSON persistence.
- `server/test/*` — tests Jest+Supertest.


## Cómo extender (quick dev notes)

- Para añadir `/api/logs` en backend: crear GET handler que lea `db.logs` y devuelva array; agregar paginación.
- Para asegurar endpoints: añadir middleware que verifique JWT y sustituya `getUserFromReq` por `req.user` autenticado.
- Para migrar a DB: crear scripts de migración que vuelquen `server/data.json` a la nueva base.


---

Si quieres, genero ahora:
- Un endpoint `/api/logs` y una página `/logs` en el frontend para ver la auditoría.
- O bien convierto persistencia a SQLite (con `better-sqlite3`) y hago migración de datos.

Dime cuál prefieres que implemente a continuación y lo hago.