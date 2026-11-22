import { Proveedor } from '../models/Proveedor.js';

export class ProveedorRepository {
    static async crear(datos) {
        const nuevo = new Proveedor(datos);
        return await nuevo.save();
    }

    static async obtenerTodos({ pagina = 1, limite = 10, buscar = '' }) {
        const filtro = { activo: true };

        // Si el usuario envía texto en ?buscar=..., filtramos por razón social sin importar mayúsculas ('i')
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

    static async actualizar(id, datos) {
        return await Proveedor.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    }

    static async eliminarLogico(id) {
        // Borrado lógico (Soft Delete): pasa activo a false sin destruir el registro
        return await Proveedor.findByIdAndUpdate(id, { activo: false }, { new: true });
    }
}