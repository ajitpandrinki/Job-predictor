import 'dotenv/config'
import dns from 'node:dns'
import { isIP } from 'node:net'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import { ROLES } from './roles.js'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '32kb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/api/roles', (_req, res) => res.json({ roles: ROLES.map(({ id, label, skills }) => ({ id, label, skills })) }))
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }))
app.use((error, _req, res, _next) => {
  console.error(error)
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Some profile details are invalid. Please review your entries.' })
  return res.status(500).json({ message: 'The server could not complete your request. Please try again.' })
})

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required. Configure it in server/.env before starting the API.')
  process.exit(1)
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random value of at least 32 characters.')
  process.exit(1)
}

const configuredDnsServers = (process.env.MONGODB_DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean)
if (configuredDnsServers.some((server) => !isIP(server))) {
  console.error('MONGODB_DNS_SERVERS must be a comma-separated list of DNS server IP addresses.')
  process.exit(1)
}
if (configuredDnsServers.length) dns.setServers(configuredDnsServers)

try {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB.')
  app.listen(port, () => console.log(`RoleReady API listening on http://localhost:${port}`))
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message)
  process.exit(1)
}
