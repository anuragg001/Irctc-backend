const {PrismClient} = require('@prisma/client');   
const {config} = require('.');

const globalForPrisma = global;

const prisma = 
globalForPrisma.prisma ??
new PrismaClient({});

if(config.NODE_ENV !== 'production'){
    globalForPrisma.prisma = prisma;
}

module.exports = prisma;