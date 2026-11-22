import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Producto } from '../src/models/Producto.js';
import { Proveedor } from '../src/models/Proveedor.js';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
}, 30000); // <-- 30 segundos de margen para conectar a MongoDB Atlas

afterAll(async () => {
    await mongoose.connection.close();
}, 30000);

describe('Pruebas de Reglas de Negocio - Backend Node (Inventario)', () => {

    let proveedorId;

    beforeEach(async () => {
        await Producto.deleteMany({});
        await Proveedor.deleteMany({});

        const proveedorProvisorio = await Proveedor.create({
            razonSocial: 'TEST PROVEEDOR S.A.',
            cuit: '20333444551',
            contacto: { email: 'test@proveedor.com', telefono: '3777123456' },
            categoria: 'HARDWARE'
        });
        proveedorId = proveedorProvisorio._id;
    }, 30000);

    test('1. Debe rechazar la creación de un producto con SKU inválido (Regla de Formato SKU)', async () => {
        const productoInvalido = {
            codigoSKU: 'INVALIDO',
            nombre: 'Placa de Video',
            precio: 150000,
            stock: 10,
            proveedor: proveedorId
        };

        const respuesta = await request(app)
            .post('/api/productos')
            .send(productoInvalido);

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe(true);
    }, 15000);

    test('2. Debe crear un producto correctamente si cumple todas las validaciones', async () => {
        const productoValido = {
            codigoSKU: 'TEC-001',
            nombre: 'Memoria RAM 8GB',
            precio: 45000,
            stock: 20,
            proveedor: proveedorId
        };

        const respuesta = await request(app)
            .post('/api/productos')
            .send(productoValido);

        expect(respuesta.status).toBe(201);
        expect(respuesta.body.codigoSKU).toBe('TEC-001');
        expect(respuesta.body.stock).toBe(20);
    }, 15000);

    test('3. Debe rechazar el descuento de stock si la cantidad solicitada supera al stock disponible', async () => {
        const producto = await Producto.create({
            codigoSKU: 'DIS-002',
            nombre: 'Disco SSD 480GB',
            precio: 60000,
            stock: 5,
            proveedor: proveedorId
        });

        const respuesta = await request(app)
            .patch(`/api/productos/${producto._id}/descontar-stock`)
            .send({ cantidad: 10 });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe(true);
        expect(respuesta.body.mensaje).toContain('Stock insuficiente');
    }, 15000);

    test('4. Debe descontar stock con éxito y actualizar la base de datos si hay disponibilidad', async () => {
        const producto = await Producto.create({
            codigoSKU: 'PRO-003',
            nombre: 'Procesador Intel',
            precio: 200000,
            stock: 10,
            proveedor: proveedorId
        });

        const respuesta = await request(app)
            .patch(`/api/productos/${producto._id}/descontar-stock`)
            .send({ cantidad: 3 });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.stock).toBe(7);
    }, 15000);

});