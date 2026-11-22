import 'dotenv/config';
import mongoose from 'mongoose';

// Los tests BORRAN colecciones: por eso usan una base propia y nunca la de desarrollo.
export const conectarBDTest = async () => {
    const uri = process.env.MONGO_URI_TEST;
    if (!uri) {
        throw new Error('Falta MONGO_URI_TEST en el .env: los tests necesitan una base de datos propia');
    }
    if (uri === process.env.MONGO_URI) {
        throw new Error('MONGO_URI_TEST no puede ser igual a MONGO_URI: los tests borrarían los datos de desarrollo');
    }
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
};

export const desconectarBDTest = async () => {
    await mongoose.connection.close();
};
