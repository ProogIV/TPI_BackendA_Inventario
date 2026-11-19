export const manejadorErrores = (err, req, res, next) => {
    console.error(`[⚠️ Error]: ${err.message}`);

    // Error de validación de Mongoose (campos faltantes o formato inválido)
    if (err.name === 'ValidationError') {
        const detalles = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            error: true,
            mensaje: 'Error de validación en los datos enviados',
            detalles
        });
    }

    // Error de clave duplicada en MongoDB (ej: CUIT o SKU repetido)
    if (err.code === 11000) {
        return res.status(400).json({
            error: true,
            mensaje: 'Ya existe un registro con ese identificador único (CUIT o SKU)'
        });
    }

    // Error de ID con formato inválido de MongoDB
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: true,
            mensaje: 'El formato del ID proporcionado no es válido'
        });
    }

    // Error genérico del servidor
    res.status(500).json({
        error: true,
        mensaje: 'Error interno del servidor'
    });
};