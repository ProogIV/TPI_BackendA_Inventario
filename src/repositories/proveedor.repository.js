import { Proveedor } from '../models/Proveedor.js';

export class ProveedorRepository {
    static async crear(datos) {
        const nuevo = new Proveedor(datos);
        return await nuevo.save();
    }

    static async obtenerTodos({ pagina = 1, limite = 10, buscar = '' }) {
        const filtro = { activo: true };

        // ?search=... filtra por razón social sin distinguir mayúsculas ('i')
        if (buscar) {
            filtro.razonSocial = { $regex: buscar, $options: 'i' };
        }

        const salto = (Number(pagina) - 1) * Number(limite);

        const [datos, total] = await Promise.all([
            Proveedor.find(filtro).skip(salto).limit(Number(limite)).sort({ createdAt: -1 }),
            Proveedor.countDocuments(filtro)
        ]);

        return {
            total,
            pagina: Number(pagina),
            paginasTotales: Math.ceil(total / Number(limite)),
            resultados: datos
        };
    }

    static async obtenerPorId(id) {
        return await Proveedor.findOne({ _id: id, activo: true });
    }

    static async existeActivo(id) {
        if (!id) return null; // sin id no hay nada que buscar (lo rechaza la validación del esquema)
        return await Proveedor.exists({ _id: id, activo: true });
    }

    static async actualizar(id, datos) {
        // Solo se modifican proveedores activos; runValidators aplica las reglas del esquema
        return await Proveedor.findOneAndUpdate(
            { _id: id, activo: true },
            datos,
            { returnDocument: 'after', runValidators: true }
        );
    }

    static async eliminarLogico(id) {
        // Borrado lógico (Soft Delete): pasa activo a false sin destruir el registro
        return await Proveedor.findOneAndUpdate(
            { _id: id, activo: true },
            { activo: false },
            { returnDocument: 'after' }
        );
    }
}
