import { Router } from 'express';
import {
    crearProducto,
    listarProductos,
    obtenerFichaCompletaProducto,
    actualizarProducto,
    descontarStockProducto,
    reponerStockProducto,
    eliminarProducto
} from '../controllers/producto.controller.js';

const router = Router();

router.get('/', listarProductos);
router.get('/:id', obtenerFichaCompletaProducto); // Incluye la integración con Pedidos
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);

// Uso interno de Pedidos (spec.md 4.1). En el TP 2 se protegen con X-Service-Token.
router.patch('/:id/descontar', descontarStockProducto);
router.patch('/:id/reponer', reponerStockProducto);

export default router;
