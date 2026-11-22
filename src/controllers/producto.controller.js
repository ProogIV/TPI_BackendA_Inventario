import { ProductoRepository } from '../repositories/producto.repository.js';
import { ProveedorRepository } from '../repositories/proveedor.repository.js';

const TIMEOUT_SERVICIOS_MS = 5000; // spec.md, regla 7

const esCantidadValida = (cantidad) => Number.isInteger(cantidad) && cantidad > 0;

export const crearProducto = async (req, res, next) => {
    try {
        // Regla 4 del spec: el proveedor tiene que existir y estar activo
        const { activo, ...datos } = req.body ?? {};
        if (datos.proveedor && !(await ProveedorRepository.existeActivo(datos.proveedor))) {
            return res.status(400).json({ error: true, mensaje: 'El proveedor indicado no existe o está inactivo' });
        }

        const creado = await ProductoRepository.crear(datos);
        res.status(201).json(creado);
    } catch (error) {
        next(error);
    }
};

export const listarProductos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const respuesta = await ProductoRepository.obtenerTodos({
            pagina: page,
            limite: limit,
            buscar: search
        });
        res.status(200).json(respuesta);
    } catch (error) {
        next(error);
    }
};

// Integración con Pedidos: timeout y respuesta degradada (spec.md 4.1)
export const obtenerFichaCompletaProducto = async (req, res, next) => {
    try {
        const producto = await ProductoRepository.obtenerPorId(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }

        let pedidosRecientes = [];
        let estadoIntegracion = 'OK';

        try {
            // Llamada servidor a servidor hacia Pedidos, con tiempo máximo de espera
            const urlPedidos = `${process.env.PEDIDOS_API_URL}/orders/?producto_id=${producto._id}`;
            const respuesta = await fetch(urlPedidos, {
                signal: AbortSignal.timeout(TIMEOUT_SERVICIOS_MS)
            });

            if (!respuesta.ok) {
                throw new Error(`Pedidos respondió con status ${respuesta.status}`);
            }

            pedidosRecientes = await respuesta.json();
        } catch (errorRed) {
            // RESPUESTA DEGRADADA: si Pedidos está apagado o tarda, no rompemos esta API.
            // Entregamos igual el producto de MongoDB e informamos la degradación.
            estadoIntegracion = 'DEGRADADO: el servicio de Pedidos no está disponible temporalmente';
        }

        res.status(200).json({
            producto,
            integracionPedidos: {
                estado: estadoIntegracion,
                pedidosRecientes
            }
        });
    } catch (error) {
        next(error);
    }
};

export const actualizarProducto = async (req, res, next) => {
    try {
        // 'activo' no se modifica por PUT: las bajas van por DELETE (borrado lógico)
        const { activo, ...datos } = req.body ?? {};

        if (datos.proveedor && !(await ProveedorRepository.existeActivo(datos.proveedor))) {
            return res.status(400).json({ error: true, mensaje: 'El proveedor indicado no existe o está inactivo' });
        }

        const actualizado = await ProductoRepository.actualizar(req.params.id, datos);
        if (!actualizado) {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }
        res.status(200).json(actualizado);
    } catch (error) {
        next(error);
    }
};

export const descontarStockProducto = async (req, res, next) => {
    try {
        const { cantidad } = req.body ?? {};
        if (!esCantidadValida(cantidad)) {
            return res.status(400).json({ error: true, mensaje: 'La cantidad debe ser un número entero mayor a 0' });
        }

        const resultado = await ProductoRepository.descontarStock(req.params.id, cantidad);

        if (resultado.error === 'NO_ENCONTRADO') {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }
        if (resultado.error === 'STOCK_INSUFICIENTE') {
            return res.status(400).json({
                error: true,
                mensaje: `Stock insuficiente. Disponible: ${resultado.stockActual}`
            });
        }

        res.status(200).json(resultado.producto);
    } catch (error) {
        next(error);
    }
};

export const reponerStockProducto = async (req, res, next) => {
    try {
        const { cantidad } = req.body ?? {};
        if (!esCantidadValida(cantidad)) {
            return res.status(400).json({ error: true, mensaje: 'La cantidad debe ser un número entero mayor a 0' });
        }

        const producto = await ProductoRepository.reponerStock(req.params.id, cantidad);
        if (!producto) {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        next(error);
    }
};

export const eliminarProducto = async (req, res, next) => {
    try {
        const eliminado = await ProductoRepository.eliminarLogico(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }
        res.status(200).json({ mensaje: 'Producto desactivado correctamente' });
    } catch (error) {
        next(error);
    }
};
