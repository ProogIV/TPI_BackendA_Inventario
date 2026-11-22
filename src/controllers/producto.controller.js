import { ProductoRepository } from '../repositories/producto.repository.js';

export const crearProducto = async (req, res, next) => {
    try {
        const creado = await ProductoRepository.crear(req.body);
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

// INTEGRACIÓN TP 1: Node consume a Django con timeout y respuesta degradada
export const obtenerFichaCompletaProducto = async (req, res, next) => {
    try {
        const producto = await ProductoRepository.obtenerPorId(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: true, mensaje: 'Producto no encontrado' });
        }

        let historialPedidosDjango = null;
        let estadoIntegracion = 'OK';

        try {
            // Llamada Server-to-Server hacia Django con timeout máximo de 3 segundos (3000 ms)
            const urlDjango = `${process.env.DJANGO_API_URL}/orders/?product_id=${producto._id}`;
            const respuesta = await fetch(urlDjango, {
                signal: AbortSignal.timeout(3000)
            });

            if (!respuesta.ok) {
                throw new Error(`Django respondió con status ${respuesta.status}`);
            }

            historialPedidosDjango = await respuesta.json();
        } catch (errorRed) {
            // RESPUESTA DEGRADADA: Si Django está apagado o tarda mucho, no rompemos la API de Node.
            // Entregamos igual el producto de MongoDB e informamos la degradación.
            estadoIntegracion = 'DEGRADADO: El servicio de Pedidos (Django) no está disponible temporalmente';
            historialPedidosDjango = [];
        }

        res.status(200).json({
            producto,
            integracionPedidos: {
                estado: estadoIntegracion,
                pedidosRecientes: historialPedidosDjango
            }
        });
    } catch (error) {
        next(error);
    }
};

export const descontarStockProducto = async (req, res, next) => {
    try {
        const { cantidad } = req.body;
        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({ error: true, mensaje: 'La cantidad debe ser mayor a 0' });
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