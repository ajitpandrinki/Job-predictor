import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 48 },
  level: { type: String, enum: ['Not yet', 'Beginner', 'Intermediate', 'Advanced'], default: 'Not yet' },
}, { _id: false })

const assessmentSchema = new mongoose.Schema({
  score: { type: Number, required: true, min: 0, max: 100 },
  role: { type: String, required: true },
  roleLabel: { type: String, required: true },
  candidateName: { type: String, maxlength: 80 },
  qualification: { type: String, maxlength: 100 },
  strengths: [{ type: String, maxlength: 100 }],
  gaps: [{
    name: { type: String, maxlength: 48 },
    currentLevel: { type: String, maxlength: 20 },
    requiredLevel: { type: String, maxlength: 20 },
    currentScore: { type: Number, min: 0, max: 100 },
  }],
  recommendations: [{
    title: { type: String, maxlength: 80 },
    description: { type: String, maxlength: 220 },
    category: { type: String, maxlength: 40 },
  }],
}, { timestamps: true })

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  gender: { type: String, enum: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], default: 'Prefer not to say' },
  qualification: { type: String, required: true, trim: true, maxlength: 100 },
  profile: {
    role: { type: String, default: 'frontend-developer' },
    completed: { type: Boolean, default: false },
    skills: { type: [skillSchema], default: [] },
    projects: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    certifications: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    mockTestScore: { type: Number, min: 0, max: 100, default: null },
  },
  assessments: { type: [assessmentSchema], default: [] },
}, { timestamps: true })

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, minlength: 8, select: false },
  candidates: { type: [candidateSchema], default: [] },
  profile: {
    role: { type: String, default: 'frontend-developer' },
    completed: { type: Boolean, default: false },
    skills: { type: [skillSchema], default: [] },
    projects: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    certifications: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    mockTestScore: { type: Number, min: 0, max: 100, default: null },
  },
  assessments: { type: [assessmentSchema], default: [] },
}, { timestamps: true })

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('User', userSchema)
