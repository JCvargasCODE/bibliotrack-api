const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importamos los middlewares de seguridad que creamos antes
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// ======================================================================
// 1. POST /api/libros -> Registrar un libro (Solo ADMIN o BIBLIOTECARIO)
// ======================================================================
router.post('/', verificarToken, verificarRol(['ADMIN', 'BIBLIOTECARIO']), async (req, res) => {
    try {
        const { titulo, autor, isbn, stock } = req.body;

        // Validar que lleguen los campos obligatorios
        if (!titulo || !autor || !isbn) {
            return res.status(400).json({ error: "Título, autor e ISBN son obligatorios." });
        }

        // Verificar si el ISBN ya existe en la base de datos de Supabase
        const libroExiste = await prisma.libro.findUnique({ where: { isbn } });
        if (libroExiste) {
            return res.status(400).json({ error: "Ya existe un libro registrado con ese código ISBN." });
        }

        // Crear el registro del libro
        const nuevoLibro = await prisma.libro.create({
            data: {
                titulo,
                autor,
                isbn,
                stock: stock || 1,
                disponibles: stock || 1 // Al inicio, todos están disponibles para préstamo
            }
        });

        return res.status(201).json({
            mensaje: "Libro añadido exitosamente al catálogo 📚",
            libro: nuevoLibro
        });

    } catch (error) {
        console.error("❌ Error al crear libro:", error);
        return res.status(500).json({ error: "Error interno al registrar el libro." });
    }
});

// ======================================================================
// 2. GET /api/libros -> Ver catálogo completo (Público / Cualquier Rol)
// ======================================================================
router.get('/', async (req, res) => {
    try {
        const libros = await prisma.libro.findMany();
        return res.status(200).json(libros);
    } catch (error) {
        console.error("❌ Error al obtener libros:", error);
        return res.status(500).json({ error: "Error al obtener el catálogo." });
    }
});
// ======================================================================
// 3. PUT /api/libros/:id -> Actualizar datos de un libro (Solo ADMIN o BIBLIOTECARIO)
// ======================================================================
router.put('/:id', verificarToken, verificarRol(['ADMIN', 'BIBLIOTECARIO']), async (req, res) => {
    try {
        const libroId = req.params.id;
        const { titulo, autor, isbn, stock, disponibles } = req.body;

        // Verificar si el libro existe
        const libroExiste = await prisma.libro.findUnique({ where: { id: libroId } });
        if (!libroExiste) {
            return res.status(404).json({ error: "El libro que intentas editar no existe." });
        }

        // Actualizar el libro con los datos que vengan en el body
        const libroActualizado = await prisma.libro.update({
            where: { id: libroId },
            data: {
                titulo: titulo || libroExiste.titulo,
                autor: autor || libroExiste.autor,
                isbn: isbn || libroExiste.isbn,
                stock: stock !== undefined ? stock : libroExiste.stock,
                disponibles: disponibles !== undefined ? disponibles : libroExiste.disponibles
            }
        });

        return res.status(200).json({
            mensaje: "Libro actualizado con éxito 📝✨",
            libro: libroActualizado
        });

    } catch (error) {
        console.error("❌ Error al editar libro:", error);
        return res.status(500).json({ error: "Error interno al editar el libro." });
    }
});

// ======================================================================
// 4. DELETE /api/libros/:id -> Eliminar un libro permanentemente (Solo ADMIN)
// ======================================================================
router.delete('/:id', verificarToken, verificarRol(['ADMIN']), async (req, res) => {
    try {
        const libroId = req.params.id;

        // Verificar si existe el libro
        const libro = await prisma.libro.findUnique({ where: { id: libroId } });
        if (!libro) {
            return res.status(404).json({ error: "El libro no existe." });
        }

        // REGLA DE SEGURIDAD EXTREMA: Verificar si el libro tiene préstamos activos antes de borrarlo
        const prestamosActivos = await prisma.prestamo.findFirst({
            where: { libroId: libroId, estado: "ACTIVO" }
        });

        if (prestamosActivos) {
            return res.status(400).json({ 
                error: "No se puede eliminar el libro porque un alumno lo tiene en un préstamo ACTIVO actualmente. 🛑" 
            });
        }

        // Si no hay problemas, se elimina de Supabase
        await prisma.libro.delete({ where: { id: libroId } });

        return res.status(200).json({ mensaje: "El libro ha sido eliminado del catálogo permanentemente. 🗑️" });

    } catch (error) {
        console.error("❌ Error al eliminar libro:", error);
        return res.status(500).json({ error: "Error interno al intentar eliminar el libro." });
    }
});
module.exports = router;