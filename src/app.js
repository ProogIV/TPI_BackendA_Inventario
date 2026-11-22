import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proveedorRoutes from './routes/proveedor.routes.js';
import productoRoutes from './routes/producto.routes.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/error.middleware.js';

const app = express();

// Middlewares de entrada y logging (en los tests no mostramos el log de cada petición)
app.use(cors());
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
