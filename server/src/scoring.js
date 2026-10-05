import { getRole } from './roles.js'

const LEVEL_SCORE = { 'Not yet': 0, Beginner: 1, Intermediate: 2, Advanced: 3 }
const LEVEL_LABEL = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }

export function assessReadiness(profile, candidate = {}) {
  const role = getRole(profile.role)
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const normalizedSkills = new Map(skills.map((skill) => [skill.name.trim().toLowerCase(), skill]))
  const matched = role.skills.map((name) => {
    const skill = normalizedSkills.get(name.toLowerCase())
    const level = skill ? (LEVEL_SCORE[skill.level] ?? 1) : 0
    return { name, level, present: Boolean(skill) }
  })
  const skillCoverage = matched.reduce((sum, skill) => sum + skill.level / 3, 0) / role.skills.length
  const projectScore = Math.min((profile.projects?.length || 0) / 3, 1)
  const certificationScore = Math.min((profile.certifications?.length || 0) / 2, 1)
  const components = [
    { value: skillCoverage, weight: 0.65 },
    { value: projectScore, weight: 0.15 },
    { value: certificationScore, weight: 0.1 },
  ]
  if (Number.isFinite(profile.mockTestScore)) components.push({ value: profile.mockTestScore / 100, weight: 0.1 })
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0)
  const score = Math.round(components.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight * 100)
  const gaps = matched
    .filter((skill) => skill.level < 2)
    .map((skill) => ({
      name: skill.name,
      currentLevel: skill.level ? LEVEL_LABEL[skill.level] : skill.present ? 'Not yet' : 'Not added',
      requiredLevel: 'Intermediate',
      currentScore: Math.round(skill.level / 3 * 100),
    }))
  const strengths = matched.filter((skill) => skill.level >= 2).map((skill) => skill.name)
  const recommendations = gaps.slice(0, 4).map((gap) => ({
    title: `Build your ${gap.name} skills`,
    description: role.resources[gap.name] || `Add a practical ${gap.name} project to your learning plan.`,
    category: 'SKILL BUILDING',
  }))
  if ((profile.projects?.length || 0) < 3) {
    recommendations.push({
      title: 'Show what you can do',
      description: 'Add a project that demonstrates your skills and explains the impact of your work.',
      category: 'PORTFOLIO',
    })
  }
  if ((profile.certifications?.length || 0) < 2) {
    recommendations.push({
      title: 'Add a relevant credential',
      description: 'Consider a recognized course or certification that supports your target role.',
      category: 'CREDENTIALS',
    })
  }
  if (profile.mockTestScore == null) {
    recommendations.push({
      title: 'Try a mock assessment',
      description: 'A practice test can help identify what to review before your next interview.',
      category: 'PRACTICE',
    })
  }
  return {
    score,
    role: role.id,
    roleLabel: role.label,
    candidateName: candidate.name,
    qualification: candidate.qualification,
    strengths,
    gaps,
    recommendations: recommendations.slice(0, 6),
  }
}
