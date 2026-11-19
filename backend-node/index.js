import 'dotenv/config';
import app from './src/app.js';
import { conectarBD } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
    await conectarBD();
    app.listen(PORT, () => {
        console.log(`[🚀] Backend Node corriendo en http://localhost:${PORT}`);
    });
};

iniciar();