# TPI — Microservicio de Inventario

Controla el catálogo de productos, sus proveedores y el stock disponible.
**Node.js + Express + MongoDB (Mongoose)** · Puerto **3000**

Forma parte del TPI de Programación IV (Equipo 12). La especificación completa del sistema
(`spec.md`) y las reglas técnicas (`agent.md`) están en el repositorio orquestador
[TPI_Ecommerce](https://github.com/ProogIV/TPI_Ecommerce). Las pautas de trabajo del equipo están
en [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

## Requisitos

- Node.js 20 o superior
- MongoDB. Recomendado con Docker:
  ```bash
  docker run -d --name mongo-tpi -p 27017:27017 -v mongo-tpi-data:/data/db mongo:7
  ```

## Puesta en marcha

```bash
npm install
cp .env.example .env      # en Windows (PowerShell): Copy-Item .env.example .env
npm run dev               # desarrollo, con reinicio automático (nodemon)
npm start                 # producción
```

Con `SEED_DATA=true` en el `.env`, al arrancar con la base vacía se cargan un proveedor y 4 productos de prueba (en Docker está activado).

Verificar: `GET http://localhost:3000/api/health` → `{ "status": "ok", "service": "inventario" }`.

El archivo `peticiones.http` tiene ejemplos de todas las peticiones (extensión REST Client de VS Code).

## Tests

```bash
npm test
```

Usan la base indicada en `MONGO_URI_TEST`, que **se borra en cada ejecución**; por eso tiene que ser
distinta de `MONGO_URI`.

## Endpoints

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/health` | Estado del servicio | Público |
| GET | `/api/productos?page=&limit=&search=` | Catálogo de productos activos (paginado) | Público |
| GET | `/api/productos/:id` | Producto + pedidos recientes (respuesta degradada si Pedidos no responde) | Público |
| POST | `/api/productos` | Crear producto | ADMIN |
| PUT / DELETE | `/api/productos/:id` | Modificar, baja lógica | ADMIN |
| PATCH | `/api/productos/:id/descontar` | Descuento atómico de stock | Servicio (Pedidos) |
| PATCH | `/api/productos/:id/reponer` | Reposición de stock tras un pago fallido | Servicio (Pedidos) |
| GET / POST | `/api/proveedores` | Listar (paginado) y crear proveedores | ADMIN |
| GET / PUT / DELETE | `/api/proveedores/:id` | Ver, modificar, baja lógica | ADMIN |

## Seguridad

- **ADMIN:** header `Authorization: Bearer <access>` con un token emitido por **Pedidos** (`POST /api/token/`).
  Inventario no tiene login propio: valida el token con la misma clave (`JWT_SIGNING_KEY`, HS256) y lee el `rol`.
- **Servicio:** `descontar` y `reponer` solo los usa Pedidos, con el header `X-Service-Token` (clave `SERVICE_TOKEN`, compartida entre ambos servicios). Inventario usa la misma clave al consultar los pedidos de un producto.
- **CORS:** solo los orígenes de `CORS_ALLOWED_ORIGINS` (el frontend).

`JWT_SIGNING_KEY` y `SERVICE_TOKEN` tienen que ser **iguales** en el `.env` de Inventario y en el de Pedidos.

## Estructura

```
index.js              → arranque: carga .env, conecta a MongoDB y levanta el servidor
src/
  app.js              → configuración de Express (middlewares y rutas)
  config/db.js        → conexión a MongoDB
  models/             → esquemas de Mongoose con las validaciones del spec
  repositories/       → consultas a la base
  controllers/        → lógica de cada endpoint
  routes/             → definición de rutas
  middlewares/        → manejo centralizado de errores y autenticación (JWT, roles, X-Service-Token)
tests/                → tests con Jest + Supertest
docs/                 → contrato de integración y pautas del equipo
```

## Decisiones fuera del contenido de la cátedra

| Decisión | Motivo |
|---|---|
| Tests con **Jest + Supertest** | Permiten probar los endpoints reales de Express sin levantar el servidor, verificando las reglas de negocio del spec (stock, borrado lógico, validaciones). |
