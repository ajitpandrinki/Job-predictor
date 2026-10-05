import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Please enter a name between 2 and 80 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Please enter a valid email address.' })
    if (password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Your password must be between 8 and 72 characters.' })
    const user = new User({ name, email, password })
    await user.save()
    return res.status(201).json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' })
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    return res.json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } })
})

export default router
