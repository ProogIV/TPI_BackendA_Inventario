import { Router } from 'express';
import {
    crearProveedor,
    listarProveedores,
    obtenerProveedor,
    actualizarProveedor,
    eliminarProveedor
} from '../controllers/proveedor.controller.js';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Todo lo de proveedores es administración: solo ADMIN (spec.md 4.1)
router.use(verificarToken, soloAdmin);

router.post('/', crearProveedor);
router.get('/', listarProveedores);
router.get('/:id', obtenerProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

export default router;
