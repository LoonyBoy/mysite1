import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// --- Config / Env helpers ---
const toInt = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

// --- Static frontend (Vite build) ---
// Resolve dist directory relative to this file so it works when run via systemd
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '..', 'dist')

// Serve static assets if dist exists
app.use(express.static(distDir, { maxAge: '1h', index: false }))

const PORT = process.env.PORT || 4000
// Telegram bot config (for lead submissions)
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || 'REPLACE_WITH_TOKEN'
// Default chat id can be the same as bot owner if not provided by client
const TG_CHAT_ID = process.env.TG_CHAT_ID || process.env.TELEGRAM_CHAT_ID || ''
const LEAD_RATE_LIMIT_WINDOW_MS = toInt(process.env.LEAD_RATE_LIMIT_WINDOW_MS, 60_000) // 1 минута по умолчанию
const LEAD_RATE_LIMIT_MAX = toInt(process.env.LEAD_RATE_LIMIT_MAX, 5) // 5 заявок с одного IP в окно
const TELEGRAM_LEAD_ENABLED = (process.env.TELEGRAM_LEAD_ENABLED || 'true').toLowerCase() !== 'false'

// DB config
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT || 3306)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'space_invaders'

let pool

async function ensureDbAndTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name CHAR(3) NOT NULL,
      ship VARCHAR(32) NOT NULL,
      score INT NOT NULL,
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
  // First, ensure database exists by connecting without DB selected
  const admin = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  })
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } finally {
    await admin.end()
  }

  // Now create the pool to the specific DB
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  const conn = await pool.getConnection()
  try {
    await conn.query(sql)
  } finally {
    conn.release()
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Quick diagnostics for Telegram bot configuration
app.get('/api/lead/ping', async (req, res) => {
  const info = {
    hasToken: Boolean(TG_BOT_TOKEN && TG_BOT_TOKEN !== 'REPLACE_WITH_TOKEN'),
    hasChatId: Boolean(TG_CHAT_ID),
    botOk: false,
    error: null
  }
  if (!info.hasToken) {
    return res.status(500).json({ ...info, error: 'BOT_TOKEN_NOT_CONFIGURED' })
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getMe`)
    const j = await r.json().catch(()=>null)
    if (j && j.ok) {
      info.botOk = true
      info.botUser = j.result?.username
    } else {
      info.error = 'GET_ME_FAILED'
      info.raw = j
    }
  } catch (e) {
    info.error = e.message
  }
  res.status(info.error ? 500 : 200).json(info)
})

// Get top N scores (default 10)
app.get('/api/scores/top', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'DB_UNAVAILABLE', items: [] })
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50)
  try {
    const [rows] = await pool.query(
      'SELECT name, ship, score, date FROM scores ORDER BY score DESC, date ASC LIMIT ?',[limit]
    )
    res.json({ items: rows })
  } catch (err) {
    console.error('GET /api/scores/top error', err)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Save score
app.post('/api/scores', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'DB_UNAVAILABLE' })
  }
  let { name, ship, score, date } = req.body || {}
  if (typeof name !== 'string' || name.length !== 3) {
    return res.status(400).json({ error: 'INVALID_NAME' })
  }
  name = name.toUpperCase().replace(/[^A-Z]/g, '')
  if (name.length !== 3) return res.status(400).json({ error: 'INVALID_NAME' })
  // Block offensive/undesired initials
  const forbidden = new Set(['HUY','HUI','XUI','XUY','XYI','BLY','EBA','LOH','LOX'])
  if (forbidden.has(name)) {
    return res.status(400).json({ error: 'FORBIDDEN_NAME' })
  }
  if (typeof ship !== 'string' || ship.length === 0) return res.status(400).json({ error: 'INVALID_SHIP' })
  const scoreNum = Number(score)
  if (!Number.isFinite(scoreNum) || scoreNum < 0) return res.status(400).json({ error: 'INVALID_SCORE' })

  const when = date ? new Date(date) : new Date()
  const mysqlDate = new Date(when.getTime() - when.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T',' ')
  try {
    await pool.query('INSERT INTO scores (name, ship, score, date) VALUES (?,?,?,?)', [name, ship, scoreNum, mysqlDate])
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('POST /api/scores error', err)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Accept project/application lead and forward to Telegram bot
// Body: { name, phone, description, category, options }
// Простейший in-memory rate limit (перезапускается при рестарте процесса). Для продакшена можно вынести в Redis.
const leadBuckets = new Map() // key: ip, value: { count, ts }

function checkLeadRateLimit(ip) {
  const now = Date.now()
  let b = leadBuckets.get(ip)
  if (!b || (now - b.ts) > LEAD_RATE_LIMIT_WINDOW_MS) {
    b = { count: 0, ts: now }
    leadBuckets.set(ip, b)
  }
  b.count += 1
  return b.count <= LEAD_RATE_LIMIT_MAX
}

app.post('/api/lead', async (req, res) => {
  try {
    if (!TELEGRAM_LEAD_ENABLED) {
      return res.status(503).json({ error: 'LEAD_DISABLED' })
    }
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
    if (!checkLeadRateLimit(ip)) {
      return res.status(429).json({ error: 'RATE_LIMIT', retryAfterMs: LEAD_RATE_LIMIT_WINDOW_MS })
    }
    const { name = '', phone = '', description = '', category = '', options = [] } = req.body || {}
    if (!TG_BOT_TOKEN || TG_BOT_TOKEN === 'REPLACE_WITH_TOKEN') {
      return res.status(500).json({ error: 'BOT_TOKEN_NOT_CONFIGURED' })
    }
    const safe = (v) => String(v || '').trim().slice(0, 500)
    const msgLines = []
    msgLines.push('🆕 Новая заявка с сайта')
    if (safe(name)) msgLines.push(`👤 Имя: ${safe(name)}`)
    if (safe(phone)) msgLines.push(`📞 Телефон: ${safe(phone)}`)
    if (safe(category)) msgLines.push(`📂 Категория: ${safe(category)}`)
    if (Array.isArray(options) && options.length) msgLines.push(`⚙️ Опции: ${options.map(o=>safe(o)).join(', ')}`)
    if (safe(description)) msgLines.push('📝 '+safe(description))
    const text = msgLines.join('\n')

    // Allow client to override chat id (optional, validated as number)
    let chatId = req.body.chatId || TG_CHAT_ID
    if (!chatId) {
      return res.status(500).json({ error: 'CHAT_ID_NOT_CONFIGURED' })
    }
    console.log('[lead] incoming', { name, phone, category, optionsCount: Array.isArray(options)?options.length:0 })
    console.log('[lead] sending to Telegram chat', chatId)
    // Send to Telegram
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`
    const tgResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })
    let tgJson = null
    try { tgJson = await tgResp.json() } catch { /* ignore */ }
    if (!tgResp.ok || !(tgJson && tgJson.ok)) {
      console.error('Telegram sendMessage failed', tgResp.status, tgJson)
      return res.status(502).json({ error: 'TELEGRAM_SEND_FAILED', status: tgResp.status, tg: tgJson })
    }
    console.log('[lead] sent ok: message_id', tgJson.result && tgJson.result.message_id)
    res.json({ ok: true, message_id: tgJson.result && tgJson.result.message_id })
  } catch (err) {
    console.error('POST /api/lead error', err)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// SPA fallback: any non-API GET request returns index.html so client router handles it
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  // Serve index.html
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next(err)
  })
})

ensureDbAndTable()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`Scores API listening on 0.0.0.0:${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to initialize database connection.')
    console.error(`Host: ${DB_HOST}:${DB_PORT}`)
    console.error(`User: ${DB_USER}`)
    console.error('Tip: set DB_USER/DB_PASSWORD/DB_NAME in .env (copy from .env.example) and ensure MySQL is running.')
    console.error(err)
    console.error('Starting server WITHOUT database (score endpoints return 503).')
    pool = null
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running without DB on 0.0.0.0:${PORT}`))
  })
