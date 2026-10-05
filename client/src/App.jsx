import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Download, FileText,
  LogOut, ShieldCheck, Sparkles, Trash2, UserRound, Users, X,
} from 'lucide-react'
import { request } from './api.js'

const LEVELS = ['Not yet', 'Beginner', 'Intermediate', 'Advanced']
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']
const QUALIFICATIONS = ['High school', 'Diploma', 'BSc', 'BCA', 'BTech', 'BE', 'MSc', 'MCA', 'MTech', 'ME', 'MBA', 'PhD', 'Other']
const prettyDate = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('roleready-token'))
  const [user, setUser] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [candidate, setCandidate] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [roles, setRoles] = useState([])
  const [view, setView] = useState('home')
  const [step, setStep] = useState(0)
  const [authMode, setAuthMode] = useState('register')
  const [loading, setLoading] = useState(Boolean(token))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [candidateForm, setCandidateForm] = useState({ name: '', gender: '', qualification: '' })
  const [profile, setProfile] = useState(null)
  const [pendingAssessment, setPendingAssessment] = useState(null)
  const [assessmentSaved, setAssessmentSaved] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingCandidateId, setDeletingCandidateId] = useState(null)

  async function loadSelectedCandidate(candidateId) {
    const data = await request(`/dashboard?candidateId=${encodeURIComponent(candidateId)}`)
    setCandidate(data.candidate)
    setDashboard(data)
    setProfile({
      role: data.profile.role,
      skills: data.profile.skills,
      projects: data.profile.projects,
      certifications: data.profile.certifications,
      mockTestScore: data.profile.mockTestScore ?? '',
    })
    setPendingAssessment(null)
    setAssessmentSaved(true)
    return data
  }

  async function loadWorkspace() {
    const [account, candidateData, roleData] = await Promise.all([
      request('/auth/me'),
      request('/dashboard/candidates'),
      request('/roles'),
    ])
    setUser(account.user)
    setCandidates(candidateData.candidates)
    setRoles(roleData.roles)
    setCandidate(null)
    setDashboard(null)
    setProfile(null)
    setPendingAssessment(null)
    setAssessmentSaved(false)
    setView('home')
  }

  useEffect(() => {
    if (!token) return
    loadWorkspace()
      .catch((err) => {
        localStorage.removeItem('roleready-token')
        setToken(null)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await request(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(authForm),
      })
      localStorage.setItem('roleready-token', result.token)
      setToken(result.token)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function signOut() {
    localStorage.removeItem('roleready-token')
    setToken(null)
    setUser(null)
    setAuthForm({ name: '', email: '', password: '' })
    setCandidates([])
    setCandidate(null)
    setDashboard(null)
    setProfile(null)
    setError('')
  }

  async function addCandidate(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const result = await request('/dashboard/candidates', {
        method: 'POST',
        body: JSON.stringify({
          ...candidateForm,
          qualification: candidateForm.qualification === 'Other' ? candidateForm.customQualification : candidateForm.qualification,
        }),
      })
      setCandidates((current) => [...current, result.candidate])
      setCandidateForm({ name: '', gender: '', qualification: '' })
      await loadSelectedCandidate(result.candidate.id)
      setStep(0)
      setView('setup')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function openCandidate(item) {
    setError('')
    setSaving(true)
    try {
      const data = await loadSelectedCandidate(item.id)
      setView(data.assessment ? 'dashboard' : 'setup')
      setStep(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCandidate(item) {
    setError('')
    setDeletingCandidateId(item.id)
    try {
      await request(`/dashboard/candidates/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      setCandidates((current) => current.filter((candidateItem) => candidateItem.id !== item.id))
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingCandidateId(null)
    }
  }

  function chooseRole(roleId) {
    const role = roles.find((item) => item.id === roleId)
    setProfile((current) => ({
      ...current,
      role: roleId,
      skills: role.skills.map((name) => {
        const existing = current.skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase())
        return { name, level: existing?.level || 'Not yet' }
      }),
    }))
  }

  function updateSkill(index, level) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.map((skill, i) => i === index ? { ...skill, level } : skill),
    }))
  }

  async function calculateReadiness(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const result = await request('/dashboard/assessment/preview', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.id,
          profile: {
            ...profile,
            mockTestScore: profile.mockTestScore === '' ? null : Number(profile.mockTestScore),
          },
        }),
      })
      setPendingAssessment(result.assessment)
      setAssessmentSaved(false)
      setDashboard((current) => ({ ...current, assessment: result.assessment }))
      setView('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveAssessment() {
    setError('')
    setSaving(true)
    try {
      await request('/dashboard/assessment', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.id,
          profile: {
            ...profile,
            mockTestScore: profile.mockTestScore === '' ? null : Number(profile.mockTestScore),
          },
        }),
      })
      const data = await loadSelectedCandidate(candidate.id)
      setCandidates((current) => current.map((item) => item.id === candidate.id
        ? { ...item, completed: true, roleLabel: data.profile.roleLabel, score: data.assessment.score, updatedAt: data.assessment.createdAt }
        : item))
      setAssessmentSaved(true)
      setView('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function goHome() {
    setError('')
    setCandidate(null)
    setDashboard(null)
    setProfile(null)
    setPendingAssessment(null)
    setAssessmentSaved(false)
    setStep(0)
    setView('home')
  }

  async function downloadReport() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const assessment = pendingAssessment || dashboard.assessment
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFillColor(35, 47, 79)
    doc.rect(0, 0, pageWidth, 48, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(21)
    doc.text('RoleReady', 18, 21)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('JOB READINESS REPORT', 18, 34)
    doc.setTextColor(35, 45, 66)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(36)
    doc.text(`${assessment.score}%`, 18, 75)
    doc.setFontSize(12)
    doc.text(`${assessment.roleLabel} readiness`, 18, 86)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Candidate: ${candidate.name}`, 18, 96)
    doc.text(`Qualification: ${candidate.qualification}`, 18, 103)
    doc.text(`Prepared: ${prettyDate(assessment.createdAt || new Date())}`, 18, 110)
    let y = 129
    const section = (title, lines) => {
      if (!lines.length) return
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(title, 18, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      lines.forEach((line) => {
        const wrapped = doc.splitTextToSize(`• ${line}`, pageWidth - 38)
        if (y + wrapped.length * 6 > 272) {
          doc.addPage()
          y = 20
        }
        doc.text(wrapped, 20, y)
        y += wrapped.length * 6 + 2
      })
      y += 6
    }
    section('Strengths', assessment.strengths)
    section('Skills to develop', assessment.gaps.map((gap) => `${gap.name}: ${gap.currentLevel}; target ${gap.requiredLevel}`))
    section('Recommended next steps', assessment.recommendations.map((item) => `${item.title}: ${item.description}`))
    doc.setFontSize(9)
    doc.text('A planning aid based on self-reported information, not a hiring guarantee.', 18, 285)
    doc.save(`roleready-${candidate.name.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-report.pdf`)
  }

  if (!token) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} onSubmit={handleAuth} loading={loading} error={error} />
  }
  if (loading || !user || !candidates) {
    return <div className="loading-screen"><span className="brand-mark"><Sparkles size={19} /></span>Getting things ready...</div>
  }

  const selectedRole = roles.find((role) => role.id === profile?.role)
  const activeAssessment = pendingAssessment || dashboard?.assessment

  return (
    <main className="journey-page">
      <header className="journey-header">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>role<span className="brand-light">ready</span><small>CAREER COMPASS</small></span>
        </a>
        <div className="journey-account">
          <span>{user.name}</span>
          <button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      </header>

      {error && <div className="journey-error">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}

      {view === 'home' && <section className="journey-card home-card">
        <div className="journey-card-body">
          <p className="journey-eyebrow">CANDIDATE HOME</p>
          <h1>{candidates.length ? 'Choose a candidate' : 'Add your first candidate'}</h1>
          <p className="journey-description">{candidates.length ? 'Open a saved profile or add someone new to assess.' : 'Start by entering the candidate’s details, education, and target role.'}</p>
          {candidates.length > 0 && <div className="candidate-list">{candidates.map((item) => <div className="candidate-entry" key={item.id}>
            <article className="candidate-card">
              <span className="candidate-avatar"><UserRound size={19} /></span>
              <span className="candidate-summary"><b>{item.name}</b><small>{item.qualification} · {item.gender}</small><small>{item.completed ? `${item.roleLabel} · Latest score ${item.score}%` : 'Profile not assessed yet'}</small></span>
              <div className="candidate-actions">
                <button className="button button-quiet candidate-open" type="button" disabled={saving || deletingCandidateId === item.id} onClick={() => openCandidate(item)}>{item.completed ? 'View results' : 'Continue'} <ArrowRight size={14} /></button>
                <button className="candidate-delete" type="button" disabled={deletingCandidateId === item.id} aria-label={`Delete ${item.name}'s candidate profile`} title="Delete candidate" onClick={() => setConfirmDeleteId(confirmDeleteId === item.id ? null : item.id)}><Trash2 size={16} /></button>
              </div>
            </article>
            {confirmDeleteId === item.id && <div className="candidate-delete-confirm" role="group" aria-label={`Confirm deletion of ${item.name}'s profile`}>
              <span>Delete <b>{item.name}</b> and their assessment history?</span>
              <div><button className="delete-cancel" type="button" onClick={() => setConfirmDeleteId(null)}><X size={13} /> Cancel</button><button className="delete-confirm" type="button" disabled={deletingCandidateId === item.id} onClick={() => deleteCandidate(item)}><Trash2 size={13} /> {deletingCandidateId === item.id ? 'Deleting…' : 'Delete'}</button></div>
            </div>}
          </div>)}</div>}
          <div className="new-candidate-heading"><span className="candidate-add-icon"><Users size={17} /></span><div><b>{candidates.length ? 'Add another candidate' : 'Candidate details'}</b><small>Each candidate gets a separate assessment and history.</small></div></div>
          <form onSubmit={addCandidate} className="candidate-form">
            <label>FULL NAME<input required minLength="2" maxLength="80" placeholder="e.g. Alex Morgan" value={candidateForm.name} onChange={(event) => setCandidateForm({ ...candidateForm, name: event.target.value })} /></label>
            <div className="candidate-form-row">
              <label>GENDER<select required value={candidateForm.gender} onChange={(event) => setCandidateForm({ ...candidateForm, gender: event.target.value })}><option value="" disabled>Select gender</option>{GENDERS.map((gender) => <option key={gender}>{gender}</option>)}</select></label>
              <label>QUALIFICATION<select required value={candidateForm.qualification} onChange={(event) => setCandidateForm({ ...candidateForm, qualification: event.target.value })}><option value="" disabled>Select qualification</option>{QUALIFICATIONS.map((qualification) => <option key={qualification}>{qualification}</option>)}</select></label>
            </div>
            {candidateForm.qualification === 'Other' && <label>QUALIFICATION DETAILS<input required maxLength="100" placeholder="Enter degree or qualification" value={candidateForm.customQualification || ''} onChange={(event) => setCandidateForm({ ...candidateForm, customQualification: event.target.value })} /></label>}
            <button className="button button-primary candidate-submit" type="submit" disabled={saving}>{saving ? 'Saving details...' : 'Continue to role selection'} <ArrowRight size={16} /></button>
          </form>
        </div>
      </section>}

      {view === 'setup' && candidate && profile && <section className="journey-card">
        <div className="journey-progress">
          {['Choose a role', 'Skills & experience', 'Mock test'].map((label, index) => <div className={`journey-progress-step ${step === index ? 'current' : step > index ? 'done' : ''}`} key={label}>
            <span>{step > index ? <Check size={13} /> : index + 1}</span><b>{label}</b>
          </div>)}
        </div>
        <div className="journey-card-body">
          <div className="candidate-context"><UserRound size={14} /><span>{candidate.name}</span><span>·</span><span>{candidate.qualification}</span><button type="button" onClick={goHome}>Change</button></div>
          {step === 0 && <>
            <p className="journey-eyebrow">STEP 1 OF 3</p>
            <h1>Which role is {candidate.name.split(' ')[0]} interested in?</h1>
            <p className="journey-description">We’ll tailor the skills checklist and readiness score to this role.</p>
            <div className="role-options">{roles.map((role) => <button type="button" key={role.id} className={`role-option ${profile.role === role.id ? 'selected' : ''}`} onClick={() => chooseRole(role.id)}>
              <span className="role-option-icon"><BookOpen size={18} /></span><span><b>{role.label}</b><small>{role.skills.slice(0, 3).join(' · ')}</small></span><span className="role-option-check">{profile.role === role.id && <Check size={14} />}</span>
            </button>)}</div>
            <div className="journey-actions"><button className="button button-quiet" type="button" onClick={goHome}><ArrowLeft size={15} /> Home</button><button className="button button-primary" type="button" onClick={() => setStep(1)}>Continue <ArrowRight size={16} /></button></div>
          </>}

          {step === 1 && <>
            <p className="journey-eyebrow">STEP 2 OF 3 · {selectedRole?.label.toUpperCase()}</p>
            <h1>Tell us about {candidate.name.split(' ')[0]}’s experience</h1>
            <p className="journey-description">Choose a level for each language or skill. “Not yet” is a perfectly fine answer.</p>
            <div className="journey-field-title">ROLE-SPECIFIC LANGUAGES &amp; SKILLS</div>
            <div className="journey-skills">{profile.skills.map((skill, index) => <label className="journey-skill-row" key={skill.name}>
              <span><b>{skill.name}</b><small>{['JavaScript', 'Python', 'SQL', 'Node.js'].includes(skill.name) ? 'Language / runtime' : 'Role skill'}</small></span>
              <select value={skill.level} onChange={(event) => updateSkill(index, event.target.value)} aria-label={`${skill.name} proficiency`}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select>
            </label>)}</div>
            <div className="journey-profile-fields">
              <label>PROJECTS <small>Optional · one per line, up to 3</small><textarea rows="3" placeholder="What has the candidate built or worked on?" value={profile.projects.join('\n')} onChange={(event) => setProfile((current) => ({ ...current, projects: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3) }))} /></label>
              <label>CERTIFICATIONS <small>Optional · one per line, up to 5</small><textarea rows="3" placeholder="Relevant courses or certifications" value={profile.certifications.join('\n')} onChange={(event) => setProfile((current) => ({ ...current, certifications: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 5) }))} /></label>
            </div>
            <div className="journey-actions"><button className="button button-quiet" type="button" onClick={() => setStep(0)}><ArrowLeft size={15} /> Back</button><button className="button button-primary" type="button" onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></button></div>
          </>}

          {step === 2 && <form onSubmit={calculateReadiness}>
            <p className="journey-eyebrow">STEP 3 OF 3 · ALMOST THERE</p>
            <h1>Add a mock-test score</h1>
            <p className="journey-description">Have they taken a relevant practice test? Add the score, or skip this step.</p>
            <label className="mock-score-field">MOCK-TEST SCORE <span>OPTIONAL</span><div><input type="number" min="0" max="100" placeholder="Leave blank to skip" value={profile.mockTestScore} onChange={(event) => setProfile((current) => ({ ...current, mockTestScore: event.target.value }))} /><span>%</span></div></label>
            <div className="score-explainer"><ShieldCheck size={16} /> Their score is based on the details you shared. It’s a planning guide—not a hiring guarantee.</div>
            <div className="journey-actions"><button className="button button-quiet" type="button" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Calculating...' : 'Calculate readiness'} <ArrowRight size={16} /></button></div>
          </form>}
        </div>
      </section>}

      {view === 'dashboard' && candidate && activeAssessment && <section className="journey-card results-card">
        <div className="results-heading"><p className="journey-eyebrow">READINESS RESULTS · {candidate.name.toUpperCase()}</p><h1>{candidate.name}’s {activeAssessment.roleLabel} readiness</h1><p className="journey-description">{candidate.qualification} · A snapshot of current strengths and areas to develop.</p></div>
        <div className="readiness-result"><span>READINESS SCORE</span><strong>{activeAssessment.score}<small>%</small></strong><div className="result-meter"><i style={{ width: `${activeAssessment.score}%` }} /></div><p>Based on the skills and profile details provided.</p></div>
        <div className="result-columns">
          <section><h2>Skills to focus on</h2>{activeAssessment.gaps.length ? <ul className="result-list">{activeAssessment.gaps.map((gap) => <li key={gap.name}><span><b>{gap.name}</b><small>{gap.currentLevel} · target {gap.requiredLevel}</small></span><span className="result-gap-dot" /></li>)}</ul> : <p className="result-empty">They meet the suggested level for all skills in this role.</p>}</section>
          <section><h2>Suggested next steps</h2>{activeAssessment.recommendations.length ? <ul className="result-recommendations">{activeAssessment.recommendations.slice(0, 4).map((item) => <li key={item.title}><b>{item.title}</b><p>{item.description}</p></li>)}</ul> : <p className="result-empty">Keep practicing and update the profile as skills grow.</p>}</section>
        </div>
        <div className="results-footer"><span>{assessmentSaved ? `Saved · ${prettyDate(activeAssessment.createdAt)}` : 'Preview · save to add this assessment to history'}</span><div>
          {assessmentSaved ? <button className="button button-quiet" type="button" onClick={() => setView('history')}><FileText size={15} /> History</button> : <button className="button button-primary" type="button" onClick={saveAssessment} disabled={saving}>{saving ? 'Saving...' : 'Save assessment'} <Check size={15} /></button>}
          <button className="button button-quiet" type="button" onClick={downloadReport}><Download size={15} /> PDF report</button>
          {assessmentSaved && <button className="button button-quiet" type="button" onClick={() => { setPendingAssessment(null); setAssessmentSaved(false); setStep(0); setView('setup') }}>New assessment</button>}
          <button className="button button-quiet" type="button" onClick={goHome}>Go to home</button>
        </div></div>
      </section>}

      {view === 'history' && candidate && dashboard && <section className="journey-card history-card">
        <div className="history-heading"><div><p className="journey-eyebrow">CANDIDATE PROGRESS</p><h1>{candidate.name}’s history</h1><p className="journey-description">Saved readiness assessments for {candidate.qualification}.</p></div><button className="button button-quiet" type="button" onClick={() => setView('dashboard')}><ArrowLeft size={15} /> Back to results</button></div>
        {dashboard.history.length ? <div className="history-list">{[...dashboard.history].reverse().map((item, index) => <div className="history-entry" key={`${item.createdAt}-${index}`}><span className="history-score">{item.score}%</span><span><b>{item.roleLabel}</b><small>{prettyDate(item.createdAt)}</small></span><span className="history-status">Readiness score</span></div>)}</div> : <p className="result-empty">Saved assessments will appear here.</p>}
        <div className="results-footer"><span>{dashboard.history.length} saved assessment{dashboard.history.length === 1 ? '' : 's'}</span><div><button className="button button-quiet" type="button" onClick={goHome}>Go to home</button>{dashboard.assessment && <button className="button button-primary" type="button" onClick={downloadReport}><Download size={15} /> Download latest PDF</button>}</div></div>
      </section>}
      <footer className="journey-footer">RoleReady <span>·</span> A clearer path to your next role.</footer>
    </main>
  )
}

function AuthScreen({ mode, setMode, form, setForm, onSubmit, loading, error }) {
  return <div className="auth-shell"><div className="auth-right"><div className="auth-form-wrap">
    <a className="brand auth-brand" href="#"><span className="brand-mark"><Sparkles size={19} /></span><span>role<span className="brand-light">ready</span><small>CAREER COMPASS</small></span></a>
    <span className="form-eyebrow">{mode === 'register' ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</span>
    <h2>{mode === 'register' ? 'Create your account' : 'Good to have you back.'}</h2>
    <p className="auth-subtitle">{mode === 'register' ? 'Create an account to build personalized readiness plans.' : 'Sign in to continue your readiness journey.'}</p>
    <form onSubmit={onSubmit} className="auth-form">
      {mode === 'register' && <label>Your name<input required autoComplete="name" maxLength="80" placeholder="e.g. Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
      <label>Email address<input required type="email" autoComplete="email" maxLength="254" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label>Password<input required type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength="8" maxLength="72" placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
      {error && <div className="auth-error">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'One moment...' : mode === 'register' ? 'Create my account' : 'Sign in'} <ArrowRight size={16} /></button>
    </form>
    <div className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to RoleReady?'} <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button></div>
    <div className="auth-trust"><ShieldCheck size={15} /> Your candidate profiles are private to your account.</div>
  </div></div></div>
}

export default App
