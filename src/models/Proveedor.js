import mongoose from 'mongoose';

export const CATEGORIAS = ['HARDWARE', 'SOFTWARE', 'INSUMOS', 'SERVICIOS'];

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
            lowercase: true,
            trim: true
        },
        telefono: String
    },
    categorias: {
        type: [{
            type: String,
            enum: {
                values: CATEGORIAS,
                message: 'Categoría no válida: {VALUE}'
            }
        }],
        validate: {
            validator: (lista) => Array.isArray(lista) && lista.length > 0,
            message: 'El proveedor debe tener al menos una categoría'
        }
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Índice para acelerar búsquedas por categoría y estado activo
proveedorSchema.index({ categorias: 1, activo: 1 });

export const Proveedor = mongoose.model('Proveedor', proveedorSchema);
