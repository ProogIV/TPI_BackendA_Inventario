import mongoose from 'mongoose';

export const conectarBD = async () => {
    try {
        const conexion = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[📦] MongoDB conectado: ${conexion.connection.name}`);
    } catch (error) {
        console.error(`[❌] Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};