// Formato uniforme de errores: { error: true, mensaje, detalles? } (spec.md, sección 3)

export const rutaNoEncontrada = (req, res) => {
    res.status(404).json({
        error: true,
        mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
};

export const manejadorErrores = (err, req, res, next) => {
    console.error(`[⚠️ Error]: ${err.message}`);

    // JSON mal formado en el cuerpo de la petición
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: true,
            mensaje: 'El cuerpo de la petición no es un JSON válido'
        });
    }

    // Error de validación de Mongoose (campos faltantes o formato inválido)
    if (err.name === 'ValidationError') {
        const detalles = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            error: true,
            mensaje: 'Error de validación en los datos enviados',
            detalles
        });
    }

    // Clave duplicada en MongoDB (CUIT o SKU repetido)
    if (err.code === 11000) {
        return res.status(400).json({
            error: true,
            mensaje: 'Ya existe un registro con ese identificador único (CUIT o SKU)'
        });
    }

    // ID con formato inválido de MongoDB
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
