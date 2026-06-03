const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario está autenticado mediante el Token JWT
const verificarToken = (req, res, next) => {
    // 1. Obtener el token del encabezado (Header) de la petición
    // Normalmente viene en el formato: "Bearer eyJhbGciOi..."
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Separamos "Bearer" del token real

    // Si no se envía ningún token, denegamos el acceso de inmediato
    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token de autenticación." });
    }

    try {
        // 2. Verificar y desempaquetar el token usando la firma secreta
        const verificado = jwt.verify(token, process.env.JWT_SECRET || "ClaveSecretaSuperSegura123");
        
        // 3. Inyectar los datos del usuario autenticado en la petición (req)
        // Ahora cualquier ruta que use este middleware tendrá acceso a req.usuario.id, req.usuario.rol, etc.
        req.usuario = verificado;

        // 4. Dar luz verde para pasar a la siguiente función (el controlador)
        next();
    } catch (error) {
        console.error("❌ Token inválido:", error);
        return res.status(403).json({ error: "Token inválido o expirado." });
    }
};

// Middleware para restringir accesos según el rol del usuario (Ej: Solo ADMIN)
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        // Asegurarnos de que el usuario ya pasó por el middleware de autenticación
        if (!req.usuario) {
            return res.status(501).json({ error: "Se requiere verificar el token primero." });
        }

        // Validar si el rol del usuario está dentro de los roles autorizados para esta ruta
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: "Acceso denegado. No tienes los permisos necesarios para realizar esta acción." });
        }

        next();
    };
};

module.exports = { verificarToken, verificarRol };