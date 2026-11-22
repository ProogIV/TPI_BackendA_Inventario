import mongoose from 'mongoose';

export const conectarBD = async (uri = process.env.MONGO_URI) => {
    try {
        const conexion = await mongoose.connect(uri);
        console.log(`[📦] MongoDB conectado: ${conexion.connection.name}`);
    } catch (error) {
        console.error(`[❌] Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};
