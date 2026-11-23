import request from 'supertest';
import app from '../src/app.js';
import { Producto } from '../src/models/Producto.js';
import { Proveedor } from '../src/models/Proveedor.js';
import { conectarBDTest, desconectarBDTest } from './helpers/db.js';
import { comoAdmin, comoCliente, comoServicio, generarToken } from './helpers/auth.js';

beforeAll(conectarBDTest, 30000);
afterAll(desconectarBDTest, 30000);

describe('Seguridad de Inventario - JWT, roles y X-Service-Token (spec.md sección 7)', () => {
    let proveedorId;
    let producto;

    const productoNuevo = () => ({
        codigoSKU: 'SEG-001',
        nombre: 'Monitor 24',
        precio: 90000,
        stock: 4,
        proveedor: proveedorId
    });

    beforeEach(async () => {
        await Producto.deleteMany({});
        await Proveedor.deleteMany({});
        const proveedor = await Proveedor.create({
            razonSocial: 'PROVEEDOR SEGURIDAD',
            cuit: '20111222333',
            contacto: { email: 'seg@test.com' },
            categorias: ['HARDWARE']
        });
        proveedorId = proveedor._id;
        producto = await Producto.create({ ...productoNuevo(), codigoSKU: 'SEG-000' });
    });

    test('el catálogo es público: se consulta sin token', async () => {
        expect((await request(app).get('/api/productos')).status).toBe(200);
        expect((await request(app).get(`/api/productos/${producto._id}`)).status).toBe(200);
    });

    test('crear un producto sin token responde 401', async () => {
        const r = await request(app).post('/api/productos').send(productoNuevo());
        expect(r.status).toBe(401);
        expect(r.body.error).toBe(true);
    });

    test('un CLIENTE no puede crear productos (403)', async () => {
        const r = await request(app).post('/api/productos').set(comoCliente()).send(productoNuevo());
        expect(r.status).toBe(403);
    });

    test('un ADMIN sí puede crear productos', async () => {
        const r = await request(app).post('/api/productos').set(comoAdmin()).send(productoNuevo());
        expect(r.status).toBe(201);
    });

    test('rechaza un token firmado con otra clave', async () => {
        const falso = generarToken({ clave: 'una-clave-que-no-es-la-de-pedidos-xxxxxxxx' });
        const r = await request(app).post('/api/productos')
            .set({ Authorization: `Bearer ${falso}` }).send(productoNuevo());
        expect(r.status).toBe(401);
    });

    test('rechaza un token vencido', async () => {
        const vencido = generarToken({ expiraEn: -10 });
        const r = await request(app).delete(`/api/productos/${producto._id}`)
            .set({ Authorization: `Bearer ${vencido}` });
        expect(r.status).toBe(401);
    });

    test('rechaza un refresh token: solo sirve el de acceso', async () => {
        const refresh = generarToken({ tipo: 'refresh' });
        const r = await request(app).delete(`/api/productos/${producto._id}`)
            .set({ Authorization: `Bearer ${refresh}` });
        expect(r.status).toBe(401);
    });

    test('los proveedores son solo para ADMIN', async () => {
        expect((await request(app).get('/api/proveedores')).status).toBe(401);
        expect((await request(app).get('/api/proveedores').set(comoCliente())).status).toBe(403);
        expect((await request(app).get('/api/proveedores').set(comoAdmin())).status).toBe(200);
    });

    test('descontar stock sin X-Service-Token responde 403, aunque se tenga un token de ADMIN', async () => {
        const url = `/api/productos/${producto._id}/descontar`;
        expect((await request(app).patch(url).send({ cantidad: 1 })).status).toBe(403);
        expect((await request(app).patch(url).set(comoAdmin()).send({ cantidad: 1 })).status).toBe(403);
        expect((await request(app).patch(url).set({ 'X-Service-Token': 'clave-incorrecta' })
            .send({ cantidad: 1 })).status).toBe(403);

        const enBD = await Producto.findById(producto._id);
        expect(enBD.stock).toBe(4); // no se tocó
    });

    test('con el X-Service-Token correcto se puede descontar y reponer', async () => {
        const base = `/api/productos/${producto._id}`;
        expect((await request(app).patch(`${base}/descontar`).set(comoServicio()).send({ cantidad: 1 })).status).toBe(200);
        expect((await request(app).patch(`${base}/reponer`).set(comoServicio()).send({ cantidad: 1 })).status).toBe(200);
    });
});

describe('CORS', () => {
    test('el frontend recibe permiso para leer las respuestas', async () => {
        const r = await request(app).get('/api/health').set('Origin', 'http://localhost:5500');
        expect(r.headers['access-control-allow-origin']).toBe('http://localhost:5500');
    });

    test('un sitio desconocido no recibe permiso', async () => {
        const r = await request(app).get('/api/health').set('Origin', 'http://sitio-malicioso.com');
        expect(r.headers['access-control-allow-origin']).toBeUndefined();
    });
});
