import request from 'supertest';
import app from '../src/app.js';
import { Proveedor } from '../src/models/Proveedor.js';
import { conectarBDTest, desconectarBDTest } from './helpers/db.js';
import { comoAdmin } from './helpers/auth.js';

beforeAll(conectarBDTest, 30000);
afterAll(desconectarBDTest, 30000);

describe('Proveedores - reglas de negocio (spec.md)', () => {
    const proveedorValido = {
        razonSocial: '  distribuidora nea s.r.l. ',
        cuit: '30712345678',
        contacto: { email: 'Ventas@NEA.com.ar' },
        categorias: ['HARDWARE', 'INSUMOS']
    };

    beforeEach(async () => {
        await Proveedor.deleteMany({});
    });

    test('crea un proveedor y normaliza razón social y email', async () => {
        const respuesta = await request(app).post('/api/proveedores').set(comoAdmin()).send(proveedorValido);

        expect(respuesta.status).toBe(201);
        expect(respuesta.body.razonSocial).toBe('DISTRIBUIDORA NEA S.R.L.');
        expect(respuesta.body.contacto.email).toBe('ventas@nea.com.ar');
        expect(respuesta.body.categorias).toEqual(['HARDWARE', 'INSUMOS']);
    });

    test('rechaza un CUIT que no tiene 11 dígitos', async () => {
        const respuesta = await request(app)
            .post('/api/proveedores').set(comoAdmin())
            .send({ ...proveedorValido, cuit: '30-71234567-8' });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe(true);
    });

    test('rechaza un CUIT duplicado', async () => {
        await request(app).post('/api/proveedores').set(comoAdmin()).send(proveedorValido);
        const respuesta = await request(app).post('/api/proveedores').set(comoAdmin()).send(proveedorValido);

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.mensaje).toContain('identificador único');
    });

    test('rechaza categorías vacías o fuera del enum', async () => {
        const sinCategorias = await request(app)
            .post('/api/proveedores').set(comoAdmin())
            .send({ ...proveedorValido, categorias: [] });
        expect(sinCategorias.status).toBe(400);

        const categoriaInvalida = await request(app)
            .post('/api/proveedores').set(comoAdmin())
            .send({ ...proveedorValido, cuit: '30712345679', categorias: ['ROPA'] });
        expect(categoriaInvalida.status).toBe(400);
    });

    test('el borrado es lógico y un proveedor dado de baja no se puede modificar', async () => {
        const creado = await request(app).post('/api/proveedores').set(comoAdmin()).send(proveedorValido);
        const id = creado.body._id;

        const baja = await request(app).delete(`/api/proveedores/${id}`).set(comoAdmin());
        expect(baja.status).toBe(200);

        const enBD = await Proveedor.findById(id);
        expect(enBD.activo).toBe(false);

        const modificacion = await request(app)
            .put(`/api/proveedores/${id}`).set(comoAdmin())
            .send({ razonSocial: 'OTRO NOMBRE' });
        expect(modificacion.status).toBe(404);
    });

    test('PUT ignora el campo activo (las bajas solo van por DELETE)', async () => {
        const creado = await request(app).post('/api/proveedores').set(comoAdmin()).send(proveedorValido);
        const id = creado.body._id;

        const respuesta = await request(app)
            .put(`/api/proveedores/${id}`).set(comoAdmin())
            .send({ activo: false, razonSocial: 'nuevo nombre' });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.activo).toBe(true);
        expect(respuesta.body.razonSocial).toBe('NUEVO NOMBRE');
    });
});
