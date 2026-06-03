const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

// Inicializar el cliente de Prisma para interactuar con la base de datos
const prisma = new PrismaClient();

module.exports = prisma;