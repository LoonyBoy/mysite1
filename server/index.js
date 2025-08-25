import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000

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

// Get top N scores (default 10)
app.get('/api/scores/top', async (req, res) => {
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
    process.exit(1)
  })
