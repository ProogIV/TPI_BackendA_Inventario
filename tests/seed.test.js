import { Producto } from '../src/models/Producto.js';
import { Proveedor } from '../src/models/Proveedor.js';
import { sembrarDatosSiVacio } from '../src/config/seed.js';
import { conectarBDTest, desconectarBDTest } from './helpers/db.js';

beforeAll(conectarBDTest, 30000);
afterAll(desconectarBDTest, 30000);

describe('Seed de datos de demostración', () => {
    beforeEach(async () => {
        await Producto.deleteMany({});
        await Proveedor.deleteMany({});
    });

    test('con la base vacía crea un proveedor y los productos', async () => {
        expect(await sembrarDatosSiVacio()).toBe(true);
        expect(await Proveedor.countDocuments()).toBe(1);
        expect(await Producto.countDocuments()).toBe(4);
        expect(await Producto.findOne({ codigoSKU: 'SRV-001' })).not.toBeNull();
    });

    test('si ya hay productos no duplica nada', async () => {
        await sembrarDatosSiVacio();
        expect(await sembrarDatosSiVacio()).toBe(false);
        expect(await Producto.countDocuments()).toBe(4);
    });
});
