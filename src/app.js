import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proveedorRoutes from './routes/proveedor.routes.js';
import productoRoutes from './routes/producto.routes.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/error.middleware.js';

const app = express();

// CORS: solo los orígenes configurados (el frontend) pueden leer las respuestas desde el navegador
const origenesPermitidos = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .filter(Boolean);
app.use(cors({ origin: origenesPermitidos }));

// Logging de cada petición (en los tests no se muestra)
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}
app.use(express.json());

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'inventario' });
});

// Rutas de las dos colecciones
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/productos', productoRoutes);

// Cualquier otra ruta: 404 con el formato uniforme
app.use(rutaNoEncontrada);

// Middleware centralizado de errores (siempre al final)
app.use(manejadorErrores);

export default app;
