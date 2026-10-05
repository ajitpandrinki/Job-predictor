import { Router } from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../middleware/auth.js'
import { ROLES, getRole } from '../roles.js'
import { assessReadiness } from '../scoring.js'

const router = Router()
router.use(requireAuth)

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']
const PROFICIENCY_LEVELS = ['Not yet', 'Beginner', 'Intermediate', 'Advanced']

class ProfileInputError extends Error {}

async function ensureLegacyCandidate(user) {
  if (user.candidates.length) return
  const hasLegacyData = user.assessments.length
    || user.profile.completed
    || user.profile.skills.length
    || user.profile.projects.length
    || user.profile.certifications.length
    || user.profile.mockTestScore != null
  if (!hasLegacyData) return
  user.candidates.push({
    name: user.name,
    gender: 'Prefer not to say',
    qualification: 'Not specified',
    profile: {
      role: user.profile.role,
      completed: Boolean(user.profile.completed || user.assessments.length),
      skills: user.profile.skills,
      projects: user.profile.projects,
      certifications: user.profile.certifications,
      mockTestScore: user.profile.mockTestScore,
    },
    assessments: user.assessments,
  })
  user.profile = {
    role: 'frontend-developer',
    completed: false,
    skills: [],
    projects: [],
    certifications: [],
    mockTestScore: null,
  }
  user.assessments = []
  await user.save()
}

function normalizeProfile(input) {
  const { role, skills, projects, certifications, mockTestScore } = input || {}
  if (typeof role !== 'string' || !ROLES.some((item) => item.id === role)) {
    throw new ProfileInputError('Choose a valid target role.')
  }
  if (!Array.isArray(skills) || skills.length > 30) throw new ProfileInputError('Add no more than 30 skills.')
  const cleanSkills = []
  const seen = new Set()
  for (const skill of skills) {
    if (!skill || typeof skill.name !== 'string' || typeof skill.level !== 'string') {
      throw new ProfileInputError('Each skill needs a name and proficiency level.')
    }
    const name = skill.name.trim()
    if (!name || name.length > 48) throw new ProfileInputError('Skill names must be between 1 and 48 characters.')
    if (!PROFICIENCY_LEVELS.includes(skill.level)) throw new ProfileInputError('Choose a valid skill proficiency level.')
    if (!seen.has(name.toLowerCase())) cleanSkills.push({ name, level: skill.level })
    seen.add(name.toLowerCase())
  }
  const cleanList = (list, label, maxItems) => {
    if (!Array.isArray(list) || list.length > maxItems) throw new ProfileInputError(`${label} must contain no more than ${maxItems} entries.`)
    return list.map((item) => {
      if (typeof item !== 'string' || !item.trim() || item.trim().length > 120) {
        throw new ProfileInputError(`${label} entries must be between 1 and 120 characters.`)
      }
      return item.trim()
    })
  }
  const parsedMock = mockTestScore === null || mockTestScore === '' || mockTestScore === undefined ? null : Number(mockTestScore)
  if (parsedMock !== null && (!Number.isFinite(parsedMock) || parsedMock < 0 || parsedMock > 100)) {
    throw new ProfileInputError('Mock test score must be between 0 and 100.')
  }
  return {
    role,
    completed: true,
    skills: cleanSkills,
    projects: cleanList(projects, 'Projects', 3),
    certifications: cleanList(certifications, 'Certifications', 5),
    mockTestScore: parsedMock,
  }
}

function getCandidate(user, candidateId) {
  if (!mongoose.Types.ObjectId.isValid(candidateId)) return null
  return user.candidates.id(candidateId)
}

router.get('/candidates', async (req, res, next) => {
  try {
    await ensureLegacyCandidate(req.user)
    return res.json({
      candidates: req.user.candidates.map((candidate) => {
        const role = getRole(candidate.profile.role)
        const latest = candidate.assessments.at(-1)
        return {
          id: candidate.id,
          name: candidate.name,
          gender: candidate.gender,
          qualification: candidate.qualification,
          completed: Boolean(candidate.profile.completed),
          roleLabel: role.label,
          score: latest?.score ?? null,
          updatedAt: latest?.createdAt ?? candidate.updatedAt,
        }
      }),
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/candidates', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const qualification = typeof req.body.qualification === 'string' ? req.body.qualification.trim() : ''
    const gender = req.body.gender
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Enter a name between 2 and 80 characters.' })
    if (!GENDERS.includes(gender)) return res.status(400).json({ message: 'Choose a gender option.' })
    if (!qualification || qualification.length > 100) return res.status(400).json({ message: 'Enter a qualification (up to 100 characters).' })
    if (req.user.candidates.length >= 50) return res.status(400).json({ message: 'This account has reached the limit of 50 candidate profiles.' })
    const candidate = req.user.candidates.create({
      name,
      gender,
      qualification,
      profile: { role: 'frontend-developer', completed: false },
    })
    req.user.candidates.push(candidate)
    await req.user.save()
    return res.status(201).json({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        qualification: candidate.qualification,
        completed: false,
        roleLabel: getRole(candidate.profile.role).label,
        score: null,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.delete('/candidates/:candidateId', async (req, res, next) => {
  try {
    await ensureLegacyCandidate(req.user)
    const candidate = getCandidate(req.user, req.params.candidateId)
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found.' })
    candidate.deleteOne()
    await req.user.save()
    return res.json({ message: 'Candidate profile deleted.' })
  } catch (error) {
    return next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    await ensureLegacyCandidate(req.user)
    const candidate = getCandidate(req.user, req.query.candidateId)
    if (!candidate) return res.status(404).json({ message: 'Choose a candidate profile to continue.' })
    const role = getRole(candidate.profile.role)
    return res.json({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        qualification: candidate.qualification,
      },
      profile: {
        role: candidate.profile.role,
        roleLabel: role.label,
        completed: Boolean(candidate.profile.completed),
        skills: candidate.profile.skills,
        projects: candidate.profile.projects,
        certifications: candidate.profile.certifications,
        mockTestScore: candidate.profile.mockTestScore,
      },
      assessment: candidate.assessments.at(-1) || null,
      history: candidate.assessments.slice(-100).map((item) => ({
        score: item.score,
        roleLabel: item.roleLabel,
        createdAt: item.createdAt,
      })),
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/assessment/preview', (req, res, next) => {
  const candidate = getCandidate(req.user, req.body.candidateId)
  if (!candidate) return res.status(404).json({ message: 'Choose a valid candidate profile.' })
  try {
    const profile = normalizeProfile(req.body.profile)
    return res.json({ assessment: assessReadiness(profile, candidate) })
  } catch (error) {
    if (error instanceof ProfileInputError) return res.status(400).json({ message: error.message })
    return next(error)
  }
})

router.post('/assessment', async (req, res, next) => {
  const candidate = getCandidate(req.user, req.body.candidateId)
  if (!candidate) return res.status(404).json({ message: 'Choose a valid candidate profile.' })
  try {
    candidate.profile = normalizeProfile(req.body.profile)
    const assessment = assessReadiness(candidate.profile, candidate)
    candidate.assessments.push(assessment)
    if (candidate.assessments.length > 100) candidate.assessments.splice(0, candidate.assessments.length - 100)
    await req.user.save()
    return res.status(201).json({ message: 'Assessment saved.', assessment })
  } catch (error) {
    if (error instanceof ProfileInputError) return res.status(400).json({ message: error.message })
    return next(error)
  }
})

export default router
