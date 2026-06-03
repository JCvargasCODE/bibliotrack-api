const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// ======================================================================
// 1. GET /api/prestamos -> LISTA GLOBAL (ADMIN/BIBLIOTECARIO) - ¡DEBE IR ARRIBA!
// ======================================================================
router.get('/', verificarToken, verificarRol(['ADMIN', 'BIBLIOTECARIO']), async (req, res) => {
    try {
        const todosLosPrestamos = await prisma.prestamo.findMany({
            include: {
                usuario: {
                    select: { nombre: true, email: true, rol: true }
                },
                libro: {
                    select: { titulo: true, autor: true }
                }
            },
            orderBy: { fechaPrestamo: 'desc' }
        });
        return res.status(200).json(todosLosPrestamos);
    } catch (error) {
        console.error("❌ Error al obtener todos los préstamos:", error);
        return res.status(500).json({ error: "Error al obtener la lista global de préstamos." });
    }
});

// ======================================================================
// 2. GET /api/prestamos/mis-prestamos -> HISTORIAL PERSONAL (CUALQUIER ROL)
// ======================================================================
router.get('/mis-prestamos', verificarToken, async (req, res) => {
    try {
        const misPrestamos = await prisma.prestamo.findMany({
            where: { usuarioId: req.usuario.id },
            include: {
                libro: { select: { titulo: true, autor: true } }
            }
        });
        return res.status(200).json(misPrestamos);
    } catch (error) {
        console.error("❌ Error al obtener préstamos:", error);
        return res.status(500).json({ error: "Error al obtener el historial." });
    }
});

// ======================================================================
// 3. POST /api/prestamos -> CREAR PRÉSTAMO (CON LÍMITE DE 3)
// ======================================================================
router.post('/', verificarToken, async (req, res) => {
    try {
        const { libroId } = req.body;
        const usuarioId = req.usuario.id; 

        if (!libroId) return res.status(400).json({ error: "El ID del libro es obligatorio." });

        const prestamosActivosDelUsuario = await prisma.prestamo.count({
            where: { usuarioId, estado: "ACTIVO" }
        });

        if (prestamosActivosDelUsuario >= 3) {
            return res.status(400).json({ 
                error: "Límite excedido. No puedes tener más de 3 préstamos ACTIVOS simultáneamente. 📚🚫" 
            });
        }

        const libro = await prisma.libro.findUnique({ where: { id: libroId } });
        if (!libro) return res.status(404).json({ error: "El libro solicitado no existe." });
        if (libro.disponibles <= 0) return res.status(400).json({ error: "Lo sentimos, no quedan unidades disponibles." });

        const prestamoDuplicado = await prisma.prestamo.findFirst({
            where: { usuarioId, libroId, estado: "ACTIVO" }
        });
        if (prestamoDuplicado) return res.status(400).json({ error: "Ya tienes un préstamo ACTIVO de este mismo libro." });

        const [nuevoPrestamo, libroActualizado] = await prisma.$transaction([
            prisma.prestamo.create({ data: { usuarioId, libroId, estado: "ACTIVO" } }),
            prisma.libro.update({ where: { id: libroId }, data: { disponibles: libro.disponibles - 1 } })
        ]);

        return res.status(201).json({
            mensaje: "¡Préstamo realizado con éxito! 📖✨",
            prestamo: nuevoPrestamo,
            unidadesRestantes: libroActualizado.disponibles
        });
    } catch (error) {
        console.error("❌ Error al procesar préstamo:", error);
        return res.status(500).json({ error: "Error interno al procesar el préstamo." });
    }
});

// ======================================================================
// 4. PATCH /api/prestamos/devolver/:id -> DEVOLUCIÓN (CON :id AL FINAL)
// ======================================================================
router.patch('/devolver/:id', verificarToken, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        const prestamo = await prisma.prestamo.findUnique({ where: { id: prestamoId } });

        if (!prestamo) return res.status(404).json({ error: "El registro de préstamo no existe." });
        if (prestamo.estado === "DEVUELTO") return res.status(400).json({ error: "Este libro ya fue devuelto." });

        const [prestamoActualizado, libroActualizado] = await prisma.$transaction([
            prisma.prestamo.update({ where: { id: prestamoId }, data: { estado: "DEVUELTO", fechaDevolucion: new Date() } }),
            prisma.libro.update({ where: { id: prestamo.libroId }, data: { disponibles: { increment: 1 } } })
        ]);

        return res.status(200).json({
            mensaje: "¡Libro devuelto con éxito! 📚👏",
            prestamo: prestamoActualizado,
            nuevosDisponibles: libroActualizado.disponibles
        });
    } catch (error) {
        console.error("❌ Error al devolver libro:", error);
        return res.status(500).json({ error: "Error interno al procesar la devolución." });
    }
});

module.exports = router;