import { promises as fs } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export type ShortUrlRecord = {
  shortCode: string
  originalUrl: string
  clicks: number
  createdAt: string
}

type CreateShortUrlInput = {
  shortCode: string
  originalUrl: string
  createdAt: string
}

let prismaClient: PrismaClient | null = null

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL)
}

function getPrismaClient() {
  if (!prismaClient) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('DATABASE_URL is required when using the PostgreSQL storage path')
    }

    const adapter = new PrismaPg({ connectionString })
    prismaClient = new PrismaClient({ adapter })
  }

  return prismaClient
}

function getDataFilePath() {
  return process.env.DATA_FILE_PATH ?? path.resolve(process.cwd(), 'data', 'urls.json')
}

async function ensureDataFile() {
  const dataFilePath = getDataFilePath()
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true })

  try {
    await fs.access(dataFilePath)
  } catch {
    await fs.writeFile(dataFilePath, '[]', 'utf8')
  }
}

export async function readUrls(): Promise<ShortUrlRecord[]> {
  if (hasDatabaseUrl()) {
    const records = await getPrismaClient().shortUrl.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return records.map((record) => ({
      shortCode: record.shortCode,
      originalUrl: record.originalUrl,
      clicks: record.clicks,
      createdAt: record.createdAt.toISOString(),
    }))
  }

  const dataFilePath = getDataFilePath()
  await ensureDataFile()
  const raw = await fs.readFile(dataFilePath, 'utf8')
  return JSON.parse(raw) as ShortUrlRecord[]
}

export async function createUrl(record: CreateShortUrlInput) {
  if (hasDatabaseUrl()) {
    return getPrismaClient().shortUrl.create({
      data: {
        shortCode: record.shortCode,
        originalUrl: record.originalUrl,
        createdAt: new Date(record.createdAt),
      },
    })
  }

  const records = await readUrls()
  records.unshift({ ...record, clicks: 0 })
  await writeUrls(records)
}

export async function updateClicks(shortCode: string) {
  if (hasDatabaseUrl()) {
    await getPrismaClient().shortUrl.update({
      where: { shortCode },
      data: { clicks: { increment: 1 } },
    })
    return
  }

  const records = await readUrls()
  const record = records.find((item) => item.shortCode === shortCode)

  if (!record) {
    return
  }

  record.clicks += 1
  await writeUrls(records)
}

export async function findUrlByShortCode(shortCode: string) {
  if (hasDatabaseUrl()) {
    const record = await getPrismaClient().shortUrl.findUnique({
      where: { shortCode },
    })

    if (!record) {
      return null
    }

    return {
      shortCode: record.shortCode,
      originalUrl: record.originalUrl,
      clicks: record.clicks,
      createdAt: record.createdAt.toISOString(),
    } satisfies ShortUrlRecord
  }

  const records = await readUrls()
  return records.find((item) => item.shortCode === shortCode) ?? null
}

export async function shortCodeExists(shortCode: string) {
  if (hasDatabaseUrl()) {
    const record = await getPrismaClient().shortUrl.findUnique({
      where: { shortCode },
      select: { shortCode: true },
    })

    return Boolean(record)
  }

  const records = await readUrls()
  return records.some((item) => item.shortCode === shortCode)
}

export async function writeUrls(records: ShortUrlRecord[]) {
  const dataFilePath = getDataFilePath()
  await ensureDataFile()
  await fs.writeFile(dataFilePath, JSON.stringify(records, null, 2), 'utf8')
}
