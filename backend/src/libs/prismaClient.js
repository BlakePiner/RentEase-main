// file: prismaClient.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Create a more robust singleton pattern
let prisma;

// Modify DATABASE_URL to disable prepared statements and configure connection pooling
const databaseUrl = process.env.DATABASE_URL;
const modifiedDatabaseUrl = databaseUrl.includes('?') 
  ? `${databaseUrl}&prepared_statements=false&connection_limit=1&pool_timeout=20&sslmode=require`
  : `${databaseUrl}?prepared_statements=false&connection_limit=1&pool_timeout=20&sslmode=require`;

const prismaConfig = {
  log: ['error'],
  datasources: {
    db: {
      url: modifiedDatabaseUrl,
    },
  },
  // Additional configuration to prevent connection issues
  errorFormat: 'pretty',
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  // In development, use global to prevent multiple instances
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaConfig);
  }
  prisma = globalForPrisma.prisma;
}

// Ensure proper cleanup on process exit
const cleanup = async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting Prisma:', error);
    }
  }
};

// Handle process termination
process.on('beforeExit', cleanup);
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});

// Add error handling for connection issues
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

// Add connection event handling
prisma.$on('info', (e) => {
  console.log('Prisma info:', e);
});

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database');
  })
  .catch((error) => {
    console.error('❌ Prisma connection failed:', error);
  });

// Add a function to reset connection if needed
export const resetPrismaConnection = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
    
    // Wait a moment before recreating
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Recreate the client with fresh configuration
    if (process.env.NODE_ENV === 'production') {
      prisma = new PrismaClient(prismaConfig);
    } else {
      globalForPrisma.prisma = new PrismaClient(prismaConfig);
      prisma = globalForPrisma.prisma;
    }
    
    await prisma.$connect();
    console.log('✅ Prisma connection reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset Prisma connection:', error);
    // If reset fails, try to create a completely new instance
    try {
      if (process.env.NODE_ENV === 'production') {
        prisma = new PrismaClient(prismaConfig);
      } else {
        globalForPrisma.prisma = new PrismaClient(prismaConfig);
        prisma = globalForPrisma.prisma;
      }
      console.log('✅ Prisma client recreated after reset failure');
    } catch (recreateError) {
      console.error('❌ Failed to recreate Prisma client:', recreateError);
    }
  }
};

export default prisma;
