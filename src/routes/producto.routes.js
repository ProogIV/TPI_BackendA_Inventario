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
import { verificarToken, soloAdmin, soloServicio } from '../middlewares/auth.middleware.js';

const router = Router();

// Catálogo: público (spec.md 4.1)
router.get('/', listarProductos);
router.get('/:id', obtenerFichaCompletaProducto); // Incluye la integración con Pedidos

// Administración: solo ADMIN con token válido
router.post('/', verificarToken, soloAdmin, crearProducto);
router.put('/:id', verificarToken, soloAdmin, actualizarProducto);
router.delete('/:id', verificarToken, soloAdmin, eliminarProducto);

// Uso interno de Pedidos: solo con X-Service-Token
router.patch('/:id/descontar', soloServicio, descontarStockProducto);
router.patch('/:id/reponer', soloServicio, reponerStockProducto);

export default router;
