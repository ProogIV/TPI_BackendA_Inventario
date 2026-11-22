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

Verificar: `GET http://localhost:3000/api/health` → `{ "status": "ok", "service": "inventario" }`.

El archivo `peticiones.http` tiene ejemplos de todas las peticiones (extensión REST Client de VS Code).

## Tests

```bash
npm test
```

Usan la base indicada en `MONGO_URI_TEST`, que **se borra en cada ejecución**; por eso tiene que ser
distinta de `MONGO_URI`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/proveedores?page=&limit=&search=` | Proveedores activos (paginado) |
| GET / PUT / DELETE | `/api/proveedores/:id` | Ver, modificar, baja lógica |
| POST | `/api/proveedores` | Crear proveedor |
| GET | `/api/productos?page=&limit=&search=` | Catálogo de productos activos (paginado) |
| GET | `/api/productos/:id` | Producto + pedidos recientes (respuesta degradada si Pedidos no responde) |
| PUT / DELETE | `/api/productos/:id` | Modificar, baja lógica |
| POST | `/api/productos` | Crear producto |
| PATCH | `/api/productos/:id/descontar` | Descuento atómico de stock (uso interno de Pedidos) |
| PATCH | `/api/productos/:id/reponer` | Reposición de stock tras un pago fallido (uso interno de Pedidos) |

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
  middlewares/        → manejo centralizado de errores
tests/                → tests con Jest + Supertest
docs/                 → contrato de integración y pautas del equipo
```

## Decisiones fuera del contenido de la cátedra

| Decisión | Motivo |
|---|---|
| Tests con **Jest + Supertest** | Permiten probar los endpoints reales de Express sin levantar el servidor, verificando las reglas de negocio del spec (stock, borrado lógico, validaciones). |
