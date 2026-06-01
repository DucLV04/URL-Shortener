import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { nanoid } from 'nanoid'
import {
  createUrl,
  findUrlByShortCode,
  readUrls,
  shortCodeExists,
  updateClicks,
  type ShortUrlRecord,
} from './store.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3001)
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`

app.use(cors())
app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/urls', async (_request, response) => {
  const urls = await readUrls()
  response.json({ urls: urls.sort((left, right) => right.createdAt.localeCompare(left.createdAt)) })
})

app.post('/api/shorten', async (request, response) => {
  const { originalUrl } = request.body as { originalUrl?: string }

  if (!originalUrl) {
    response.status(400).json({ message: 'originalUrl is required' })
    return
  }

  let normalizedUrl: URL

  try {
    normalizedUrl = new URL(originalUrl)
  } catch {
    response.status(400).json({ message: 'originalUrl must be a valid URL' })
    return
  }

  let shortCode = nanoid(7)

  while (await shortCodeExists(shortCode)) {
    shortCode = nanoid(7)
  }

  const record: ShortUrlRecord = {
    shortCode,
    originalUrl: normalizedUrl.toString(),
    clicks: 0,
    createdAt: new Date().toISOString(),
  }

  await createUrl(record)

  response.status(201).json({
    record,
    shortUrl: `${baseUrl}/${shortCode}`,
  })
})

app.get('/:shortCode', async (request, response, next) => {
  if (request.params.shortCode === 'health') {
    next()
    return
  }

  const record = await findUrlByShortCode(request.params.shortCode)

  if (!record) {
    response.status(404).json({ message: 'Short code not found' })
    return
  }

  await updateClicks(record.shortCode)

  response.redirect(302, record.originalUrl)
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
