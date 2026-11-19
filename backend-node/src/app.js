import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proveedorRoutes from './routes/proveedor.routes.js';
import productoRoutes from './routes/producto.routes.js';
import { manejadorErrores } from './middlewares/error.middleware.js';

const app = express();

// Middlewares de entrada y logging (Requisito TP 1)
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend-node' });
});

// Rutas de las dos colecciones
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/productos', productoRoutes);

// Middleware centralizado de errores (Siempre va al final de las rutas)
app.use(manejadorErrores);

export default app;