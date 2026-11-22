import { Producto } from '../models/Producto.js';

export class ProductoRepository {
    static async crear(datos) {
        const nuevo = new Producto(datos);
        return await nuevo.save();
    }

    static async obtenerTodos({ pagina = 1, limite = 10, buscar = '' }) {
        const filtro = { activo: true };

        // Búsqueda por texto parcial en nombre o descripción (Requisito TP 1)
        if (buscar) {
            filtro.$or = [
                { nombre: { $regex: buscar, $options: 'i' } },
                { descripcion: { $regex: buscar, $options: 'i' } }
            ];
        }

        // Fórmula de paginación: cuántos registros saltar según la página pedida
        const salto = (Number(pagina) - 1) * Number(limite);

        const [datos, total] = await Promise.all([
            Producto.find(filtro)
                .populate('proveedor', 'razonSocial cuit categoria')
                .skip(salto)
                .limit(Number(limite))
                .sort({ createdAt: -1 }),
            Producto.countDocuments(filtro)
        ]);

        return {
            total,
            pagina: Number(pagina),
            paginasTotales: Math.ceil(total / Number(limite)),
            resultados: datos
        };
    }

    static async obtenerPorId(id) {
        return await Producto.findOne({ _id: id, activo: true })
            .populate('proveedor', 'razonSocial cuit contacto');
    }

    static async actualizar(id, datos) {
        return await Producto.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    }

    static async descontarStock(id, cantidad) {
        const producto = await Producto.findOne({ _id: id, activo: true });
        if (!producto) return { error: 'NO_ENCONTRADO' };
        if (producto.stock < cantidad) return { error: 'STOCK_INSUFICIENTE', stockActual: producto.stock };

        producto.stock -= Number(cantidad);
        await producto.save();
        return { producto };
    }

    static async eliminarLogico(id) {
        return await Producto.findByIdAndUpdate(id, { activo: false }, { new: true });
    }
}