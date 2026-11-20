import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    codigoSKU: {
        type: String,
        required: [true, 'El código SKU es obligatorio'],
        unique: true,
        uppercase: true,
        match: [/^[A-Z]{3}-\d{3}$/, 'El formato del SKU debe ser 3 letras, guion y 3 números (Ej: TEC-001)']
    },
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    precio: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    stock: {
        type: Number,
        required: [true, 'El stock inicial es obligatorio'],
        min: [0, 'El stock no puede ser negativo']
    },
    especificaciones: {
        type: Map,
        of: String,
        default: {}
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor',
        required: [true, 'El producto debe estar vinculado a un proveedor']
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Índice de texto para permitir la búsqueda por palabras en nombre y descripción (Requisito TP 1)
productoSchema.index({ nombre: 'text', descripcion: 'text' });

export const Producto = mongoose.model('Producto', productoSchema);