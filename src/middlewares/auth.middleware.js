import jwt from 'jsonwebtoken';

// Seguridad de Inventario (spec.md, sección 7).
// Los tokens los emite Pedidos (Django + simplejwt). Acá solo se VERIFICAN, con la misma
// clave compartida (JWT_SIGNING_KEY) y el mismo algoritmo (HS256).

export const verificarToken = (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: true, mensaje: 'Falta el token de autenticación' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SIGNING_KEY, { algorithms: ['HS256'] });

        // simplejwt emite dos tipos de token: solo el "access" sirve para usar la API
        if (payload.token_type !== 'access') {
            return res.status(401).json({ error: true, mensaje: 'El token no es de acceso' });
        }

        req.usuario = { id: payload.user_id, username: payload.username, rol: payload.rol };
        next();
    } catch (error) {
        // Firma inválida, token vencido o mal formado
        return res.status(401).json({ error: true, mensaje: 'Token inválido o vencido' });
    }
};

export const soloAdmin = (req, res, next) => {
    if (req.usuario?.rol !== 'ADMIN') {
        return res.status(403).json({ error: true, mensaje: 'Solo un administrador puede realizar esta acción' });
    }
    next();
};

// Para los endpoints que solo usa Pedidos (descontar y reponer stock): no los llama un usuario,
// sino otro servicio, que se identifica con una clave compartida en el header X-Service-Token.
export const soloServicio = (req, res, next) => {
    const claveEsperada = process.env.SERVICE_TOKEN;
    if (!claveEsperada || req.headers['x-service-token'] !== claveEsperada) {
        return res.status(403).json({ error: true, mensaje: 'Acceso reservado a servicios internos' });
    }
    next();
};
