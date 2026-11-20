import { Router } from 'express';
import {
    crearProveedor,
    listarProveedores,
    obtenerProveedor,
    actualizarProveedor,
    eliminarProveedor
} from '../controllers/proveedor.controller.js';

const router = Router();

router.post('/', crearProveedor);
router.get('/', listarProveedores);
router.get('/:id', obtenerProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

export default router;