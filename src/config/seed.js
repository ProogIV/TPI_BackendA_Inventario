import { Proveedor } from '../models/Proveedor.js';
import { Producto } from '../models/Producto.js';

// Carga inicial de datos (planificación, punto 1.4): si la base está vacía, crea un proveedor y
// productos con stock para poder probar el circuito de compra apenas se levanta el sistema.
// Incluye un producto caro (Servidor Rack) para demostrar el pago RECHAZADO → pedido FALLIDO.

const PRODUCTOS_DEMO = [
    { codigoSKU: 'GPU-560', nombre: 'Placa de Video Radeon RX 560 4GB', precio: 185000, stock: 15 },
    { codigoSKU: 'RAM-016', nombre: 'Memoria RAM DDR4 16GB', precio: 62000, stock: 30 },
    { codigoSKU: 'SSD-480', nombre: 'Disco SSD 480GB', precio: 58000, stock: 25 },
    { codigoSKU: 'SRV-001', nombre: 'Servidor Rack 2U', precio: 6000000, stock: 5 }
];

export const sembrarDatosSiVacio = async () => {
    if (await Producto.estimatedDocumentCount() > 0) {
        console.log('[🌱] Seed: la base ya tiene productos, no se carga nada.');
        return false;
    }

    const proveedor = await Proveedor.create({
        razonSocial: 'Distribuidora NEA Hardware S.R.L.',
        cuit: '30712345678',
        contacto: { email: 'ventas@neahardware.com.ar', telefono: '3794000000' },
        categorias: ['HARDWARE', 'INSUMOS']
    });

    await Producto.insertMany(PRODUCTOS_DEMO.map(p => ({ ...p, proveedor: proveedor._id })));
    console.log(`[🌱] Seed: 1 proveedor y ${PRODUCTOS_DEMO.length} productos creados.`);
    return true;
};
