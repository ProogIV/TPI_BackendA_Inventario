import request from 'supertest';
import app from '../src/app.js';
import { Producto } from '../src/models/Producto.js';
import { Proveedor } from '../src/models/Proveedor.js';
import { conectarBDTest, desconectarBDTest } from './helpers/db.js';
import { comoAdmin, comoServicio } from './helpers/auth.js';

beforeAll(conectarBDTest, 30000);
afterAll(desconectarBDTest, 30000);

describe('Productos y stock - reglas de negocio (spec.md)', () => {
    let proveedorId;

    const crearProductoEnBD = (datos = {}) => Producto.create({
        codigoSKU: 'DIS-002',
        nombre: 'Disco SSD 480GB',
        precio: 60000,
        stock: 10,
        proveedor: proveedorId,
        ...datos
    });

    beforeEach(async () => {
        await Producto.deleteMany({});
        await Proveedor.deleteMany({});

        const proveedor = await Proveedor.create({
            razonSocial: 'TEST PROVEEDOR S.A.',
            cuit: '20333444551',
            contacto: { email: 'test@proveedor.com', telefono: '3777123456' },
            categorias: ['HARDWARE']
        });
        proveedorId = proveedor._id;
    });

    test('rechaza un producto con SKU inválido (400 con formato uniforme)', async () => {
        const respuesta = await request(app).post('/api/productos').set(comoAdmin()).send({
            codigoSKU: 'INVALIDO',
            nombre: 'Placa de Video',
            precio: 150000,
            stock: 10,
            proveedor: proveedorId
        });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe(true);
        expect(respuesta.body.mensaje).toBeDefined();
    });

    test('crea un producto válido', async () => {
        const respuesta = await request(app).post('/api/productos').set(comoAdmin()).send({
            codigoSKU: 'tec-001',
            nombre: 'Memoria RAM 8GB',
            precio: 45000,
            stock: 20,
            proveedor: proveedorId
        });

        expect(respuesta.status).toBe(201);
        expect(respuesta.body.codigoSKU).toBe('TEC-001');
        expect(respuesta.body.stock).toBe(20);
    });

    test('regla 4: rechaza un producto con proveedor inactivo', async () => {
        await Proveedor.findByIdAndUpdate(proveedorId, { activo: false });

        const respuesta = await request(app).post('/api/productos').set(comoAdmin()).send({
            codigoSKU: 'TEC-002',
            nombre: 'Teclado',
            precio: 20000,
            stock: 5,
            proveedor: proveedorId
        });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.mensaje).toContain('proveedor');
    });

    test('regla 1: rechaza el descuento si no alcanza el stock', async () => {
        const producto = await crearProductoEnBD({ stock: 5 });

        const respuesta = await request(app)
            .patch(`/api/productos/${producto._id}/descontar`).set(comoServicio())
            .send({ cantidad: 10 });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe(true);
        expect(respuesta.body.mensaje).toContain('Stock insuficiente');
    });

    test('descuenta stock y devuelve el precio unitario', async () => {
        const producto = await crearProductoEnBD({ stock: 10, precio: 200000 });

        const respuesta = await request(app)
            .patch(`/api/productos/${producto._id}/descontar`).set(comoServicio())
            .send({ cantidad: 3 });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.stock).toBe(7);
        expect(respuesta.body.precio).toBe(200000);
    });

    test('rechaza cantidades que no son enteros positivos', async () => {
        const producto = await crearProductoEnBD();

        for (const cantidad of [0, -2, 1.5, '3']) {
            const respuesta = await request(app)
                .patch(`/api/productos/${producto._id}/descontar`).set(comoServicio())
                .send({ cantidad });
            expect(respuesta.status).toBe(400);
        }
    });

    test('regla 2: dos descuentos simultáneos nunca dejan stock negativo', async () => {
        const producto = await crearProductoEnBD({ stock: 10 });
        const url = `/api/productos/${producto._id}/descontar`;

        // Dos pedidos de 6 unidades al mismo tiempo: solo uno puede concretarse
        const respuestas = await Promise.all([
            request(app).patch(url).set(comoServicio()).send({ cantidad: 6 }),
            request(app).patch(url).set(comoServicio()).send({ cantidad: 6 })
        ]);

        const codigos = respuestas.map(r => r.status).sort();
        expect(codigos).toEqual([200, 400]);

        const enBD = await Producto.findById(producto._id);
        expect(enBD.stock).toBe(4);
    });

    test('repone stock (compensación de un pago fallido)', async () => {
        const producto = await crearProductoEnBD({ stock: 4 });

        const respuesta = await request(app)
            .patch(`/api/productos/${producto._id}/reponer`).set(comoServicio())
            .send({ cantidad: 6 });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.stock).toBe(10);
    });

    test('regla 3: el borrado es lógico y el producto deja de listarse', async () => {
        const producto = await crearProductoEnBD();

        const baja = await request(app).delete(`/api/productos/${producto._id}`).set(comoAdmin());
        expect(baja.status).toBe(200);

        const enBD = await Producto.findById(producto._id);
        expect(enBD).not.toBeNull();
        expect(enBD.activo).toBe(false);

        const listado = await request(app).get('/api/productos');
        expect(listado.body.total).toBe(0);

        const descuento = await request(app)
            .patch(`/api/productos/${producto._id}/descontar`).set(comoServicio())
            .send({ cantidad: 1 });
        expect(descuento.status).toBe(404);
    });

    test('GET de un producto responde degradado si Pedidos no está disponible', async () => {
        const anterior = process.env.PEDIDOS_API_URL;
        process.env.PEDIDOS_API_URL = 'http://127.0.0.1:9/api'; // puerto donde no hay nada
        const producto = await crearProductoEnBD();

        const respuesta = await request(app).get(`/api/productos/${producto._id}`);
        process.env.PEDIDOS_API_URL = anterior;

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.producto.codigoSKU).toBe('DIS-002');
        expect(respuesta.body.integracionPedidos.estado).toContain('DEGRADADO');
    });

    test('una ruta inexistente responde 404 con el formato uniforme', async () => {
        const respuesta = await request(app).get('/api/no-existe');
        expect(respuesta.status).toBe(404);
        expect(respuesta.body.error).toBe(true);
    });
});
