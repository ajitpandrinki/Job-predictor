import test from 'node:test'
import assert from 'node:assert/strict'
import { assessReadiness } from '../src/scoring.js'
import { ROLES } from '../src/roles.js'

test('scores an empty profile without treating a missing optional test as a zero', () => {
  const assessment = assessReadiness({ role: 'frontend-developer', skills: [], projects: [], certifications: [], mockTestScore: null })

  assert.equal(assessment.score, 0)
  assert.equal(assessment.gaps.length, ROLES[0].skills.length)
  assert.equal(assessment.roleLabel, 'Frontend Developer')
})

test('awards full readiness for advanced role skills and complete experience', () => {
  const role = ROLES.find((item) => item.id === 'data-analyst')
  const assessment = assessReadiness({
    role: role.id,
    skills: role.skills.map((name) => ({ name, level: 'Advanced' })),
    projects: ['Project one', 'Project two', 'Project three'],
    certifications: ['Credential one', 'Credential two'],
    mockTestScore: 100,
  })

  assert.equal(assessment.score, 100)
  assert.equal(assessment.gaps.length, 0)
  assert.equal(assessment.strengths.length, role.skills.length)
})

test('includes candidate name and qualification in the assessment', () => {
  const assessment = assessReadiness(
    { role: 'backend-developer', skills: [], projects: [], certifications: [] },
    { name: 'Alex Morgan', qualification: 'MTech' },
  )

  assert.equal(assessment.candidateName, 'Alex Morgan')
  assert.equal(assessment.qualification, 'MTech')
})

test('normalizes the score when no mock-test result is available', () => {
  const assessment = assessReadiness({
    role: 'frontend-developer',
    skills: ROLES[0].skills.map((name) => ({ name, level: 'Intermediate' })),
    projects: ['Project one', 'Project two', 'Project three'],
    certifications: ['Credential one', 'Credential two'],
    mockTestScore: null,
  })

  assert.equal(assessment.score, 76)
  assert.equal(assessment.gaps.length, 0)
})

test('treats explicitly not-yet-learned skills as zero proficiency', () => {
  const assessment = assessReadiness({
    role: 'frontend-developer',
    skills: ROLES[0].skills.map((name) => ({ name, level: 'Not yet' })),
    projects: [],
    certifications: [],
  })

  assert.equal(assessment.score, 0)
  assert.equal(assessment.gaps.length, ROLES[0].skills.length)
  assert.equal(assessment.gaps[0].currentLevel, 'Not yet')
})

test('does not allow an unknown role to break the scoring flow', () => {
  const assessment = assessReadiness({ role: 'unknown-role', skills: [], projects: [], certifications: [] })

  assert.equal(assessment.role, ROLES[0].id)
  assert.equal(assessment.roleLabel, ROLES[0].label)
})
