const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db'); // Nuestro cliente de Prisma

const router = express.Router();

// ==========================================
// ENDPOINT: POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // 1. Validar que lleguen los campos obligatorios
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Todos los campos (nombre, email, password) son obligatorios." });
        }

        // 2. Verificar si el usuario ya existe en Supabase
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(409).json({ error: "El correo electrónico ya está registrado." });
        }

        // 3. Hashear la contraseña (Seguridad irreversible con bcrypt)
        const salt = await bcrypt.genSalt(10);
        const passwordHasheado = await bcrypt.hash(password, salt);

        // 4. Guardar el nuevo usuario en la base de datos
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: passwordHasheado,
                rol: rol || "ESTUDIANTE" // Si no se envía rol, por defecto es ESTUDIANTE
            }
        });

        // 5. Responder con éxito (sin exponer la contraseña hasheada)
        return res.status(201).json({
            mensaje: "Usuario registrado con éxito 🎉",
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error("❌ Error en el registro:", error);
        return res.status(500).json({ error: "Error interno del servidor al registrar usuario." });
    }
});
// ==========================================
// ENDPOINT: POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validar que lleguen ambos campos
        if (!email || !password) {
            return res.status(400).json({ error: "El email y la contraseña son obligatorios." });
        }

        // 2. Buscar al usuario en Supabase por su correo
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        // Si no existe el usuario, devolvemos un mensaje genérico por seguridad
        if (!usuario) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        // 3. Verificar si la contraseña coincide usando bcrypt
        // Compara el texto plano con el hash guardado en la base de datos
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecto) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        // 4. Generar el Token JWT si todo está bien
        // Guardamos el ID, email y rol dentro del token para usarlo después
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET || "ClaveSecretaSuperSegura123", // Llave para firmar el token
            { expiresIn: '8h' } // El token vencerá en 8 horas
        );

        // 5. Responder con éxito y entregar el token al cliente
        return res.status(200).json({
            mensaje: "¡Inicio de sesión exitoso! 🔑",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("❌ Error en el login:", error);
        return res.status(500).json({ error: "Error interno del servidor al iniciar sesión." });
    }
});
module.exports = router;