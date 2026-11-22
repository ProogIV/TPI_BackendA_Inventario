import { ProveedorRepository } from '../repositories/proveedor.repository.js';

export const crearProveedor = async (req, res, next) => {
    try {
        const creado = await ProveedorRepository.crear(req.body);
        res.status(201).json(creado);
    } catch (error) {
        next(error);
    }
};

export const listarProveedores = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const respuesta = await ProveedorRepository.obtenerTodos({
            pagina: page,
            limite: limit,
            buscar: search
        });
        res.status(200).json(respuesta);
    } catch (error) {
        next(error);
    }
};

export const obtenerProveedor = async (req, res, next) => {
    try {
        const proveedor = await ProveedorRepository.obtenerPorId(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ error: true, mensaje: 'Proveedor no encontrado' });
        }
        res.status(200).json(proveedor);
    } catch (error) {
        next(error);
    }
};

export const actualizarProveedor = async (req, res, next) => {
    try {
        const actualizado = await ProveedorRepository.actualizar(req.params.id, req.body);
        if (!actualizado) {
            return res.status(404).json({ error: true, mensaje: 'Proveedor no encontrado' });
        }
        res.status(200).json(actualizado);
    } catch (error) {
        next(error);
    }
};

export const eliminarProveedor = async (req, res, next) => {
    try {
        const eliminado = await ProveedorRepository.eliminarLogico(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ error: true, mensaje: 'Proveedor no encontrado' });
        }
        res.status(200).json({ mensaje: 'Proveedor desactivado correctamente' });
    } catch (error) {
        next(error);
    }
};