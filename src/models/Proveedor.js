import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema({
    razonSocial: {
        type: String,
        required: [true, 'La razón social es obligatoria'],
        trim: true,
        uppercase: true
    },
    cuit: {
        type: String,
        required: [true, 'El CUIT es obligatorio'],
        unique: true,
        match: [/^\d{11}$/, 'El CUIT debe tener exactamente 11 números sin guiones']
    },
    contacto: {
        email: {
            type: String,
            required: [true, 'El email de contacto es obligatorio'],
            lowercase: true
        },
        telefono: String
    },
    categoria: {
        type: String,
        required: true,
        enum: {
            values: ['HARDWARE', 'SOFTWARE', 'INSUMOS', 'SERVICIOS'],
            message: 'Categoría no válida'
        }
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Índice para acelerar búsquedas por categoría y estado activo (Requisito TP 1)
proveedorSchema.index({ categoria: 1, activo: 1 });

export const Proveedor = mongoose.model('Proveedor', proveedorSchema);