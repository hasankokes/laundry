import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, always check if the cached client has all models.
// Schema migrations can add new models that the cached client doesn't know about.
let shouldCreateFresh = false
if (globalForPrisma.prisma) {
  try {
    // Test if Payment model exists on the cached client
    if (typeof (globalForPrisma.prisma as Record<string, unknown>).payment === 'undefined') {
      shouldCreateFresh = true
    }
  } catch {
    shouldCreateFresh = true
  }
}

if (shouldCreateFresh) {
  try { globalForPrisma.prisma?.$disconnect() } catch {}
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db