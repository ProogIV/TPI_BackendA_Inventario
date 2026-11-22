import { Producto } from '../models/Producto.js';

// Campos que se devuelven al descontar o reponer stock (contrato con Pedidos, spec.md 4.1)
const CAMPOS_STOCK = 'nombre precio stock';

export class ProductoRepository {
    static async crear(datos) {
        const nuevo = new Producto(datos);
        return await nuevo.save();
    }

    static async obtenerTodos({ pagina = 1, limite = 10, buscar = '' }) {
        const filtro = { activo: true };

        // Búsqueda por texto parcial en nombre o descripción
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
                .populate('proveedor', 'razonSocial cuit')
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
        return await Producto.findOneAndUpdate(
            { _id: id, activo: true },
            datos,
            { returnDocument: 'after', runValidators: true }
        );
    }

    static async descontarStock(id, cantidad) {
        // Operación ATÓMICA: la condición (stock >= cantidad) y el descuento ($inc) se ejecutan
        // en una sola instrucción de MongoDB. Si dos pedidos llegan al mismo tiempo, MongoDB los
        // aplica de a uno y el stock nunca queda negativo (spec.md, regla 2).
        const actualizado = await Producto.findOneAndUpdate(
            { _id: id, activo: true, stock: { $gte: cantidad } },
            { $inc: { stock: -cantidad } },
            { returnDocument: 'after' }
        ).select(CAMPOS_STOCK);

        if (actualizado) return { producto: actualizado };

        // No se actualizó: averiguamos si fue porque no existe o porque no alcanza el stock
        const existente = await Producto.findOne({ _id: id, activo: true }).select('stock');
        if (!existente) return { error: 'NO_ENCONTRADO' };
        return { error: 'STOCK_INSUFICIENTE', stockActual: existente.stock };
    }

    static async reponerStock(id, cantidad) {
        // Compensación: devuelve el stock de un pedido cuyo pago falló (spec.md, sección 5)
        return await Producto.findOneAndUpdate(
            { _id: id, activo: true },
            { $inc: { stock: cantidad } },
            { returnDocument: 'after' }
        ).select(CAMPOS_STOCK);
    }

    static async eliminarLogico(id) {
        return await Producto.findOneAndUpdate(
            { _id: id, activo: true },
            { activo: false },
            { returnDocument: 'after' }
        );
    }
}
