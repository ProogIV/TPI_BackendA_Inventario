import { Router } from 'express';
import {
    crearProducto,
    listarProductos,
    obtenerFichaCompletaProducto,
    descontarStockProducto,
    eliminarProducto
} from '../controllers/producto.controller.js';

const router = Router();

router.post('/', crearProducto);
router.get('/', listarProductos);
router.get('/:id', obtenerFichaCompletaProducto); // Incluye la integración S2S con Django
router.patch('/:id/descontar-stock', descontarStockProducto);
router.delete('/:id', eliminarProducto);

export default router;