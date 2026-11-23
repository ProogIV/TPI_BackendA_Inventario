import jwt from 'jsonwebtoken';

// Claves fijas SOLO para los tests: así no dependen del .env de cada integrante.
process.env.JWT_SIGNING_KEY = 'clave-solo-para-los-tests-de-inventario-1234567890';
process.env.SERVICE_TOKEN = 'token-de-servicio-solo-para-los-tests';

// Genera un token con la misma forma que los que emite Pedidos (simplejwt)
export const generarToken = ({
    rol = 'ADMIN',
    tipo = 'access',
    clave = process.env.JWT_SIGNING_KEY,
    expiraEn = '30m'
} = {}) => jwt.sign(
    { token_type: tipo, user_id: '1', username: 'usuario-test', rol },
    clave,
    { algorithm: 'HS256', expiresIn: expiraEn }
);

export const comoAdmin = () => ({ Authorization: `Bearer ${generarToken()}` });
export const comoCliente = () => ({ Authorization: `Bearer ${generarToken({ rol: 'CLIENTE' })}` });
export const comoServicio = () => ({ 'X-Service-Token': process.env.SERVICE_TOKEN });
