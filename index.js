import 'dotenv/config';
import app from './src/app.js';
import { conectarBD } from './src/config/db.js';
import { sembrarDatosSiVacio } from './src/config/seed.js';

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
    await conectarBD();

    // En Docker se activa con SEED_DATA=true para tener datos de prueba desde el primer arranque
    if (process.env.SEED_DATA === 'true') {
        await sembrarDatosSiVacio();
    }

    app.listen(PORT, () => {
        console.log(`[🚀] Backend Node corriendo en http://localhost:${PORT}`);
    });
};

iniciar();
