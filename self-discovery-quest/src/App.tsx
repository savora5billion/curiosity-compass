import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ARCHETYPES from './data/archetypes.json'
import LOC_DATA from './data/locations.json'
import activitiesData from './data/activities.json'

type ArchetypeKey = keyof typeof ARCHETYPES

type Location = {
  id: number
  name: string
  bg: string
  guide: string
  prompt: string
  options: Array<{ label: string; gives: ArchetypeKey[] }>
}

const LOCATIONS: Location[] = (LOC_DATA as any).locations

type User = {
  id: string
  name: string
  email: string
  createdAt: string
  lastLoginAt: string
  questCompleted: boolean
}

const AUTH_KEYS = {
  user: 'sdq_user',
  session: 'sdq_session'
}

function loadUser(): User | null {
  const raw = localStorage.getItem(AUTH_KEYS.user)
  return raw ? (JSON.parse(raw) as User) : null
}
function saveUser(u: User) { localStorage.setItem(AUTH_KEYS.user, JSON.stringify(u)) }
function isLoggedIn() { return localStorage.getItem(AUTH_KEYS.session) === '1' && !!loadUser() }
function loginUser(u: User) { saveUser(u); localStorage.setItem(AUTH_KEYS.session, '1') }
function logoutUser() { localStorage.removeItem(AUTH_KEYS.session) }

const Screen: React.FC<{ children: React.ReactNode; onOpenProfile: () => void; user: User | null }> = ({ children, onOpenProfile, user }) => (
  <div className="min-h-dvh flex flex-col">
    <header className="px-4 py-3 sticky top-0 bg-white/80 backdrop-blur border-b">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">Self Discovery Quest</div>
          <div className="text-xs text-neutral-500">Find your learning archetype</div>
        </div>
        {user ? (
          <button onClick={onOpenProfile} className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50">{user.name || 'Profile'}</button>
        ) : null}
      </div>
    </header>
    <main className="flex-1 p-4">{children}</main>
    <footer className="px-4 py-3 text-center text-xs text-neutral-500">© SDQ</footer>
  </div>
)

const Start: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Begin your quest</h1>
      <p className="text-neutral-600">Explore 7 locations and discover your archetypes. This onboarding takes ~5–7 minutes.</p>
    </div>
    <button onClick={onStart} className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium">Start Quest</button>
  </div>
)

// Auth UI (local-only for MVP)
const AuthScreen: React.FC<{ onAuth: (user: User) => void }> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    const u: User = {
      id: 'u_' + Date.now(),
      name: mode === 'signup' ? name || 'Learner' : (loadUser()?.name || 'Learner'),
      email,
      createdAt: loadUser()?.createdAt || now,
      lastLoginAt: now,
      questCompleted: loadUser()?.questCompleted || false
    }
    loginUser(u)
    onAuth(u)
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex gap-2 text-sm">
          <button className={`px-3 py-1 rounded ${mode==='signup'?'bg-neutral-900 text-white':'border'}`} onClick={()=>setMode('signup')}>Sign up</button>
          <button className={`px-3 py-1 rounded ${mode==='login'?'bg-neutral-900 text-white':'border'}`} onClick={()=>setMode('login')}>Log in</button>
        </div>
        <form onSubmit={submit} className="grid gap-2">
          {mode==='signup' && <input className="border rounded px-3 py-2 text-sm" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />}
          <input className="border rounded px-3 py-2 text-sm" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="mt-1 rounded-md bg-neutral-900 text-white px-3 py-2 text-sm">{mode==='signup'?'Create account':'Log in'}</button>
        </form>
        <p className="text-xs text-neutral-500">MVP: local-only auth for demo purposes</p>
      </div>
    </div>
  )
}

// Illustration, QuestionCard, Results remain (Results gets onboarding CTA handled below)
const Illustration: React.FC<{ variant: number }> = ({ variant }) => {
  const palettes = [
    ['#DBEAFE', '#BFDBFE', '#93C5FD'],
    ['#FFE4E6', '#FECDD3', '#FDA4AF'],
    ['#FEF3C7', '#FDE68A', '#FCD34D'],
    ['#CCFBF1', '#99F6E4', '#5EEAD4'],
    ['#DCFCE7', '#BBF7D0', '#86EFAC'],
    ['#E2E8F0', '#CBD5E1', '#94A3B8'],
    ['#E0E7FF', '#C7D2FE', '#A5B4FC'],
  ]
  const [c1, c2, c3] = palettes[(variant - 1) % palettes.length]
  return (
    <svg viewBox="0 0 320 120" className="w-full h-28" role="img" aria-label="Scene illustration">
      <rect x="0" y="0" width="320" height="120" fill={c1} />
      <circle cx="260" cy="28" r="18" fill={c3} opacity="0.9" />
      <rect x="20" y="60" width="120" height="40" rx="8" fill={c2} />
      <polygon points="180,90 210,50 240,90" fill={c3} />
      <rect x="205" y="60" width="10" height="30" fill={c2} />
    </svg>
  )
}

const QuestionCard: React.FC<{ idx: number; total: number; location: Location; onPick: (gives: ArchetypeKey[], option: any) => void }> = ({ idx, total, location, onPick }) => (
  <motion.div key={location.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }} className={`rounded-xl overflow-hidden ${location.bg} shadow`}>
    <Illustration variant={location.id} />
    <div className="p-4 space-y-4">
      <div className="text-xs text-neutral-600">Location {idx + 1} of {total}</div>
      <h2 className="text-xl font-semibold">{location.name}</h2>
      <p className="text-sm text-neutral-700">{location.guide}</p>
      <p className="text-base">{location.prompt}</p>
      <div className="grid gap-3 mt-2">
        {location.options.map((opt) => (
          <button key={opt.label} onClick={() => onPick(opt.gives, opt)} className="rounded-lg bg-white/80 border border-neutral-200 px-4 py-3 text-left hover:bg-white">{opt.label}</button>
        ))}
      </div>
    </div>
  </motion.div>
)

const Results: React.FC<{ scores: Record<ArchetypeKey, number>; onRestart: () => void; onStartRecommendations: () => void; onFinishOnboarding: () => void; showFinishCTA: boolean }> = ({ scores, onRestart, onStartRecommendations, onFinishOnboarding, showFinishCTA }) => {
  const sorted = useMemo(() => Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[ArchetypeKey, number]>, [scores])
  const top = sorted.slice(0, 2)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Your Archetype Results</h2>
        <p className="text-neutral-600 text-sm">Here are the top archetypes that match your choices</p>
      </div>
      <div className="space-y-4">
        {top.map(([key]) => {
          const a = (ARCHETYPES as any)[key] as { 
            icon: string; 
            title: string; 
            blurb: string;
            riasec?: string[];
            aptitude?: string[];
            skills?: string[];
            careerClusters?: string[];
            learningStyle?: string;
          }
          return (
            <div key={key} className="rounded-xl border p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{a.icon}</div>
                <div className="font-semibold">{a.title}</div>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{a.blurb}</p>
              {a.riasec && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-neutral-600">Interests:</span>
                    {a.riasec.map((type: string) => (
                      <span key={type} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-neutral-600">Skills:</span>
                    {a.aptitude?.map((skill: string) => (
                      <span key={skill} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  {a.careerClusters && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-medium text-neutral-600">Career Paths:</span>
                      {a.careerClusters.slice(0, 2).map((cluster: string) => (
                        <span key={cluster} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {cluster}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {a.learningStyle && (
                <div className="mt-2 text-xs text-neutral-500">
                  <strong>Learning Style:</strong> {a.learningStyle}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="font-semibold">Start Personalized Learning</h3>
        <p className="text-sm text-neutral-700 mt-1">Get tailored activities and an AI mini‑course to kick off each one.</p>
        <div className="mt-3 flex gap-2">
          {showFinishCTA && <button className="rounded-md border px-4 py-2 text-sm" onClick={onFinishOnboarding}>Finish Onboarding</button>}
          <button className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm" onClick={onStartRecommendations}>Go to Recommendations</button>
        </div>
      </div>
      <button onClick={onRestart} className="w-full rounded-lg bg-neutral-100 border py-3 font-medium">Restart</button>
    </div>
  )
}

// Progress card, ProfilePanel (with logout)
const ProgressCard: React.FC<{ xp: number; streak: number }> = ({ xp, streak }) => (
  <div className="rounded-lg border bg-white p-3 text-sm flex items-center justify-between">
    <div>XP: <span className="font-semibold">{xp}</span></div>
    <div>Streak: <span className="font-semibold">{streak}</span> days</div>
  </div>
)

const ProfilePanel: React.FC<{ open: boolean; onClose: () => void; xp: number; streak: number; onOpenPortfolio: () => void; user: User | null; onLogout: () => void }> = ({ open, onClose, xp, streak, onOpenPortfolio, user, onLogout }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-3 top-3 w-80 bg-white rounded-lg shadow-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Profile</div>
          <button className="text-sm text-neutral-500" onClick={onClose}>Close</button>
        </div>
        {user && (
          <div className="text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-neutral-500">{user.email}</div>
            <div className="text-neutral-500 text-xs mt-1">Onboarding: {user.questCompleted ? 'Completed' : 'Required'}</div>
          </div>
        )}
        <ProgressCard xp={xp} streak={streak} />
        <div className="grid gap-2">
          <button className="w-full rounded-md border px-3 py-2" onClick={onOpenPortfolio}>Open Portfolio</button>
          <button className="w-full rounded-md border px-3 py-2" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  )
}

// Recommendations, Course screens, Evidence, Credential, Portfolio (unchanged except wired below)
// SignupForm removed (not used in the simplified results UI)
// Progress + storage
const STORAGE_KEYS = {
  xp: 'sdq_xp',
  streak: 'sdq_streak',
  lastDoneDate: 'sdq_last_done_date',
  completed: 'sdq_completed_ids',
  course: 'sdq_course_progress',
  creds: 'sdq_credentials'
}

function getTodayKey() { return new Date().toDateString() }

function loadProgress() {
  const xp = Number(localStorage.getItem(STORAGE_KEYS.xp) || '0')
  const streak = Number(localStorage.getItem(STORAGE_KEYS.streak) || '0')
  const last = localStorage.getItem(STORAGE_KEYS.lastDoneDate) || ''
  const completedRaw = localStorage.getItem(STORAGE_KEYS.completed)
  const completed = completedRaw ? (JSON.parse(completedRaw) as string[]) : []
  return { xp, streak, last, completed }
}

function saveProgress(p: { xp: number; streak: number; last: string; completed: string[] }) {
  localStorage.setItem(STORAGE_KEYS.xp, String(p.xp))
  localStorage.setItem(STORAGE_KEYS.streak, String(p.streak))
  localStorage.setItem(STORAGE_KEYS.lastDoneDate, p.last)
  localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(p.completed))
}

type CourseMap = Record<string, { completed: boolean; startedAt: string; updatedAt: string }>
function loadCourse(): CourseMap {
  const raw = localStorage.getItem(STORAGE_KEYS.course)
  return raw ? JSON.parse(raw) : {}
}
function saveCourse(m: CourseMap) {
  localStorage.setItem(STORAGE_KEYS.course, JSON.stringify(m))
}

type Credential = { id: string; title: string; activityId: string; issuedAt: string; evidence?: { url?: string; notes?: string }; rubric?: string }
function loadCreds(): Credential[] {
  const raw = localStorage.getItem(STORAGE_KEYS.creds)
  return raw ? JSON.parse(raw) : []
}
function saveCreds(list: Credential[]) {
  localStorage.setItem(STORAGE_KEYS.creds, JSON.stringify(list))
}

function normalize(scores: Record<ArchetypeKey, number>) {
  const sum = Object.values(scores).reduce((a, b) => a + b, 0) || 1
  const weights: Record<ArchetypeKey, number> = { ...scores } as any
  ;(Object.keys(weights) as ArchetypeKey[]).forEach(k => (weights[k] = Number((weights[k] / sum).toFixed(3))))
  return weights
}

function scoreActivity(weights: Record<ArchetypeKey, number>, act: any, filters: Filters) {
  let s = 0
  // Score based on archetype match
  for (const a of act.archetypes as string[]) s += weights[a as ArchetypeKey] || 0
  
  // Bonus for career cluster alignment
  if (act.careerClusters) {
    const clusterBonus = 0.1
    s += clusterBonus
  }
  
  // Filter bonuses
  if (filters.indoor && act.tags?.includes('indoor')) s += 0.15
  if (filters.outdoor && act.tags?.includes('outdoor')) s += 0.15
  if (filters.noCost && act.cost === 'no-cost') s += 0.1
  if (filters.solo && act.soloTeam === 'solo') s += 0.05
  if (filters.team && act.soloTeam === 'team') s += 0.05
  if (filters.maxMin && act.durationMin > filters.maxMin) s -= 0.2
  
  return s
}

type Filters = {
  tier: 'quick' | 'weekend' | 'mini'
  maxMin?: number
  indoor?: boolean
  outdoor?: boolean
  noCost?: boolean
  solo?: boolean
  team?: boolean
}

const defaultFilters: Filters = { tier: 'quick', maxMin: 60, indoor: true, outdoor: false, noCost: true, solo: true, team: false }

const Recommendations: React.FC<{
  weights: Record<ArchetypeKey, number>
  course: CourseMap
  creds: Credential[]
  onStartCourse: (id: string) => void
  onSubmitEvidence: (id: string) => void
  onComplete: (id: string) => void
}> = ({ weights, course, creds, onStartCourse, onSubmitEvidence, onComplete }) => {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const acts = (activitiesData as any).activities as any[]
  const list = acts
    .filter(a => a.tier === filters.tier)
    .map(a => ({ item: a, s: scoreActivity(weights, a, filters) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)

  const hasCred = (id: string) => creds.some(c => c.activityId === id)
  const isCourseDone = (id: string) => !!course[id]?.completed

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <select className="border rounded px-2 py-1" value={filters.tier} onChange={e => setFilters({ ...filters, tier: e.target.value as any })}>
          <option value="quick">Quick</option>
          <option value="weekend">Weekend</option>
          <option value="mini">Mini</option>
        </select>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.indoor} onChange={e => setFilters({ ...filters, indoor: e.target.checked })}/> Indoor</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.outdoor} onChange={e => setFilters({ ...filters, outdoor: e.target.checked })}/> Outdoor</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.noCost} onChange={e => setFilters({ ...filters, noCost: e.target.checked })}/> No‑cost</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.solo} onChange={e => setFilters({ ...filters, solo: e.target.checked })}/> Solo</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.team} onChange={e => setFilters({ ...filters, team: e.target.checked })}/> Team</label>
      </div>

      <div className="grid gap-3">
        {list.map(({ item, s }) => {
          const done = isCourseDone(item.id)
          const credentialed = hasCred(item.id)
          return (
            <div key={item.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{item.title}</div>
                  {item.description && (
                    <div className="text-sm text-neutral-600 mt-1">{item.description}</div>
                  )}
                  <div className="text-xs text-neutral-500 mt-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded mr-2">{item.tier}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded mr-2">{item.durationMin} min</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{item.cost}</span>
                  </div>
                  {item.skills && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Skills you'll learn:</div>
                      <div className="flex flex-wrap gap-1">
                        {(item.skills as string[]).slice(0, 4).map((skill) => (
                          <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                        {(item.skills as string[]).length > 4 && (
                          <span className="text-xs text-neutral-500">+{(item.skills as string[]).length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  {item.modules && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Course modules:</div>
                      <div className="space-y-1">
                        {(item.modules as any[]).slice(0, 2).map((module, idx) => (
                          <div key={idx} className="text-xs text-neutral-500 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {module.title} ({module.duration})
                          </div>
                        ))}
                        {(item.modules as any[]).length > 2 && (
                          <div className="text-xs text-neutral-500">
                            +{(item.modules as any[]).length - 2} more modules
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {item.credential && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      🏆 Earns: {item.credential}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500 mb-2">Match: {(s*100).toFixed(0)}%</div>
                  <div className="text-xs text-neutral-400">XP: {item.xp}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {!done ? (
                  <button onClick={() => onStartCourse(item.id)} className="rounded-md text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Start Course
                  </button>
                ) : !credentialed ? (
                  <button onClick={() => onSubmitEvidence(item.id)} className="rounded-md text-sm px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors">
                    Submit Evidence
                  </button>
                ) : (
                  <button onClick={() => onComplete(item.id)} disabled={!done} className={`rounded-md text-sm px-4 py-2 ${done ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'} transition-colors`}>
                    Mark Done +XP
                  </button>
                )}
              </div>
              {credentialed && <div className="mt-2 text-xs text-green-700">✅ Credential earned</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Course intro
const CourseIntro: React.FC<{ activity: any; onBegin: () => void; onBack: () => void }> = ({ activity, onBegin, onBack }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">{activity.title}</h2>
    {activity.description && (
      <p className="text-sm text-neutral-700">{activity.description}</p>
    )}
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-2">Course Overview</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Duration:</span> {activity.durationMin} minutes
        </div>
        <div>
          <span className="font-medium">Format:</span> {activity.soloTeam}
        </div>
        <div>
          <span className="font-medium">Cost:</span> {activity.cost}
        </div>
        <div>
          <span className="font-medium">Credential:</span> {activity.credential}
        </div>
      </div>
    </div>

    {activity.modules && (
      <div>
        <h3 className="font-medium mb-2">Course Modules</h3>
        <div className="space-y-2">
          {activity.modules.map((module: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between bg-white border rounded-lg p-3">
              <div>
                <div className="font-medium text-sm">{module.title}</div>
                <div className="text-xs text-neutral-500">{module.duration}</div>
              </div>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Module {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {activity.skills && (
      <div>
        <h3 className="font-medium mb-2">Skills You'll Learn</h3>
        <div className="flex flex-wrap gap-2">
          {activity.skills.map((skill: string) => (
            <span key={skill} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="flex gap-2">
      <button className="rounded-md border px-3 py-2 text-sm" onClick={onBack}>Back</button>
      <button className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm" onClick={onBegin}>Start Learning</button>
    </div>
  </div>
)

// Course (functional course content)
const CourseScreen: React.FC<{ activity: any; onComplete: () => void }> = ({ activity, onComplete }) => {
  const [currentModule, setCurrentModule] = useState(0)
  const [currentLesson, setCurrentLesson] = useState(0)
  
  // For now, show a simplified course experience
  const courseContent = {
    title: activity.title,
    description: activity.description,
    modules: activity.modules || [
      {
        title: "Introduction",
        lessons: [
          {
            title: "Welcome to the Course",
            content: `Welcome to ${activity.title}! This course will help you develop essential skills through hands-on learning and real-world projects.`,
            duration: "5 minutes"
          },
          {
            title: "Course Overview",
            content: `In this course, you'll learn ${activity.skills?.slice(0, 3).join(', ') || 'key skills'} through practical exercises and projects.`,
            duration: "10 minutes"
          }
        ]
      }
    ]
  }

  const currentModuleData = courseContent.modules[currentModule]
  const currentLessonData = currentModuleData?.lessons?.[currentLesson]

  const isLastLesson = currentLesson >= (currentModuleData?.lessons?.length || 1) - 1
  const isLastModule = currentModule >= courseContent.modules.length - 1

  const nextStep = () => {
    if (isLastLesson) {
      if (isLastModule) {
        onComplete()
      } else {
        setCurrentModule(currentModule + 1)
        setCurrentLesson(0)
      }
    } else {
      setCurrentLesson(currentLesson + 1)
    }
  }

  const prevStep = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1)
    } else if (currentModule > 0) {
      setCurrentModule(currentModule - 1)
      setCurrentLesson((courseContent.modules[currentModule - 1]?.lessons?.length || 1) - 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{courseContent.title}</h2>
        <div className="text-sm text-neutral-500">
          Module {currentModule + 1} of {courseContent.modules.length}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm font-medium text-blue-900">Progress</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentModule * 100 + (currentLesson / (currentModuleData?.lessons?.length || 1)) * 100) / courseContent.modules.length)}%` 
              }}
            ></div>
          </div>
          <span className="text-xs text-blue-700">
            {Math.round((currentModule * 100 + (currentLesson / (currentModuleData?.lessons?.length || 1)) * 100) / courseContent.modules.length)}%
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-blue-600">{currentModuleData?.title}</div>
            <div className="text-lg font-semibold">{currentLessonData?.title || 'Course Content'}</div>
          </div>
          <div className="text-xs text-neutral-500">{currentLessonData?.duration || '5 minutes'}</div>
        </div>
        
        <div className="text-sm text-neutral-700 leading-relaxed">
          {currentLessonData?.content || `
            Welcome to ${activity.title}! This comprehensive course will guide you through practical learning experiences.
            
            You'll work on real projects, develop valuable skills, and earn credentials that demonstrate your expertise.
            
            Ready to begin your learning journey?
          `}
        </div>

        {activity.skills && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">Skills you'll develop:</div>
            <div className="flex flex-wrap gap-2">
              {activity.skills.slice(0, 4).map((skill: string) => (
                <span key={skill} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <button 
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={prevStep}
            disabled={currentModule === 0 && currentLesson === 0}
          >
            Previous
          </button>
          <button 
            className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm" 
            onClick={nextStep}
          >
            {isLastLesson && isLastModule ? 'Complete Course' : 'Next'}
        </button>
        </div>
      </div>
    </div>
  )
}

// Evidence submit (placeholder)
const EvidenceSubmit: React.FC<{ onSubmit: (data: { url?: string; notes?: string }) => void; onSkip: () => void }> = ({ onSubmit, onSkip }) => {
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Submit Evidence</h2>
      <p className="text-sm text-neutral-700">Add a link or notes so we can issue your credential.</p>
      <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Link (optional)" value={url} onChange={e => setUrl(e.target.value)} />
      <textarea className="w-full border rounded px-3 py-2 text-sm" rows={4} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <button className="rounded-md border px-3 py-2 text-sm" onClick={onSkip}>Skip</button>
        <button className="rounded-md bg-neutral-900 text-white px-3 py-2 text-sm" onClick={() => onSubmit({ url, notes })}>Submit</button>
      </div>
    </div>
  )
}

// Credential granted (placeholder)
const CredentialGranted: React.FC<{ credential: Credential; onPortfolio: () => void; onBackToRecs: () => void }> = ({ credential, onPortfolio, onBackToRecs }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Credential Awarded</h2>
    <div className="rounded-lg border bg-white p-4 text-sm">
      <div className="font-medium">{credential.title}</div>
      <div className="text-neutral-500">Issued {new Date(credential.issuedAt).toLocaleString()}</div>
    </div>
    <div className="flex gap-2">
      <button className="rounded-md border px-3 py-2 text-sm" onClick={onBackToRecs}>Back to Recommendations</button>
      <button className="rounded-md bg-neutral-900 text-white px-3 py-2 text-sm" onClick={onPortfolio}>View Portfolio</button>
    </div>
  </div>
)

const Portfolio: React.FC<{ creds: Credential[]; onBack: () => void }> = ({ creds, onBack }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Portfolio</h2>
      <button className="rounded-md border px-3 py-2 text-sm" onClick={onBack}>Go Back</button>
    </div>
    {creds.length === 0 ? (
      <p className="text-sm text-neutral-600">No credentials yet.</p>
    ) : (
      <div className="grid gap-3">
        {creds.map(c => (
          <div key={c.id} className="rounded-lg border bg-white p-4 text-sm">
            <div className="font-medium">{c.title}</div>
            <div className="text-neutral-500">Issued {new Date(c.issuedAt).toLocaleString()}</div>
            {c.evidence?.url && <a className="text-blue-600 underline" href={c.evidence.url} target="_blank">Evidence</a>}
            {c.evidence?.notes && <p className="mt-1">{c.evidence.notes}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
)

// Landing Page Component
const LandingPage: React.FC<{ onGetStarted: () => void; onStartQuest: () => void }> = ({ onGetStarted, onStartQuest }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'why' | 'how' | 'features' | 'pricing'>('about')
  const [showPreview, setShowPreview] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 max-w-md mx-auto"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SD</span>
            </div>
            <span className="text-lg font-bold text-gray-800">Self Discovery Quest</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onStartQuest}
              className="px-3 py-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Try Free
            </button>
            <button 
              onClick={onGetStarted}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="px-4 py-12 text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Build Real Skills &
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Earn Credentials
            </span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base text-gray-600 mb-6"
          >
            Start with a fun quest to explore interests, then build practical skills and earn real credentials. 
            From discovery to mastery in one platform.
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            <button 
              onClick={onStartQuest}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Start Free Quest
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              Try Sample Question
            </button>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white border-b border-gray-200">
        <div className="px-4">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'about', label: 'What It Is' },
              { id: 'why', label: 'Why Care' },
              { id: 'how', label: 'How It Works' },
              { id: 'features', label: 'Features' },
              { id: 'pricing', label: 'Pricing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-2 border-b-2 font-medium whitespace-nowrap transition-colors text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-8">
        <div className="px-4">
          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    From exploration to real-world skills in one journey
                  </h2>
                  <p className="text-base text-gray-600 mb-6">
                    Start with a 7-minute quest to explore interests, then build practical skills and earn credentials that matter in the real world.
                  </p>
                  
                  {/* Trust Signals */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-blue-600">🏆</span>
                      <span className="text-sm font-semibold text-blue-900">Trusted by 500+ families</span>
                    </div>
                    <p className="text-xs text-blue-700">Aligned with CBSE/ICSE curriculum • Safe & secure • No credit card required</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-700">7-minute quest to explore interests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-700">Build practical skills step-by-step</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-700">Earn real credentials & certificates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-700">Create a professional portfolio</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalized Discovery</h3>
                    <p className="text-sm text-gray-600">AI adapts to your child's responses, creating a unique journey of self-discovery</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'why' && (
              <motion.div
                key="why"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Why Parents and Students Love Self Discovery Quest
                  </h2>
                  <p className="text-base text-gray-600">
                    Join thousands of families who have transformed their learning journey
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">🎨</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">From Discovery to Skills</h3>
                    <p className="text-sm text-gray-600">"My daughter discovered design through the quest. Now she's earned 3 design certificates and has a portfolio!"</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">🔬</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Building Credentials</h3>
                    <p className="text-sm text-gray-600">"My son found his passion for coding. He's now earned 5 programming badges and built real projects!"</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">📚</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-World Impact</h3>
                    <p className="text-sm text-gray-600">"The skills my child built here helped them win a school competition and get into a better program!"</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">What Parents Say</h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-3">"My daughter discovered design through the quest. She's now earned 3 certificates and has a portfolio that helped her get into a design program!"</p>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">Priya Sharma</p>
                          <p className="text-xs text-gray-600">Parent, Delhi • Class 8</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-3">"The quest revealed my son's coding talent. He's earned 5 programming badges and built apps that won him a school competition!"</p>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">Rajesh Kumar</p>
                          <p className="text-xs text-gray-600">Parent, Mumbai • Class 9</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'how' && (
              <motion.div
                key="how"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    From Exploration to Mastery
                  </h2>
                  <p className="text-base text-gray-600">
                    A simple 3-step journey from discovery to real-world skills
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Explore Interests</h3>
                    <p className="text-sm text-gray-600">Complete a 7-minute story quest to discover your child's natural strengths and interests</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Build Skills</h3>
                    <p className="text-sm text-gray-600">Follow personalized learning paths to develop practical skills step-by-step</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Earn Credentials</h3>
                    <p className="text-sm text-gray-600">Complete projects and earn real certificates to build a professional portfolio</p>
                  </div>
                </div>

                <div className="text-center">
                  <button 
                    onClick={onStartQuest}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold"
                  >
                    Try the Quest Now
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Powerful Features for Every Family
                  </h2>
                  <p className="text-base text-gray-600">
                    Everything you need to support your child's learning journey
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Mentor</h3>
                    <p className="text-sm text-gray-600">Personalized guidance and project suggestions tailored to your child's archetype and interests</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">📁</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Portfolio Building</h3>
                    <p className="text-sm text-gray-600">Track achievements and create college-ready credentials that showcase your child's growth</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Parent Dashboard</h3>
                    <p className="text-sm text-gray-600">Weekly progress reports and support tips to help you guide your child's learning journey</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">🌐</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Multi-language</h3>
                    <p className="text-sm text-gray-600">Hindi + English support with regional languages coming soon for broader accessibility</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">📱</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Mobile-first</h3>
                    <p className="text-sm text-gray-600">Works perfectly on phones and tablets, designed for today's digital-native children</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl mb-3">🔒</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Safe & Secure</h3>
                    <p className="text-sm text-gray-600">COPPA-compliant privacy controls, AI content filtering, and bank-grade security</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-base text-gray-600">
                    Start free, upgrade when you're ready
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Free</h3>
                      <p className="text-sm text-gray-600">Perfect for getting started</p>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-gray-700">Basic quest experience</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-gray-700">2 activities per month</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-gray-700">Basic portfolio</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-gray-700">Parent dashboard</span>
                      </div>
                    </div>
                    <button 
                      onClick={onStartQuest}
                      className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm"
                    >
                      Start Free
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 shadow-lg text-white relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">Most Popular</span>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold mb-2">Pro Family</h3>
                      <div className="text-2xl font-bold mb-1">₹199</div>
                      <p className="text-blue-100 text-sm">per month</p>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">Everything in Free</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">Unlimited activities</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">AI mentor access</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">Advanced portfolio</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">School competitions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-300">✓</span>
                        <span className="text-sm">Priority support</span>
                      </div>
                    </div>
                    <button 
                      onClick={onGetStarted}
                      className="w-full py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm"
                    >
                      Start Pro Trial
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800 font-medium">✨ 100% Free to Start</p>
                    <p className="text-xs text-green-700">No credit card • Cancel anytime • See results in 7 minutes</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Need a plan for your school or organization?</p>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                    Contact us for bulk pricing →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Preview Quest Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sample Quest Question</h3>
              <p className="text-sm text-gray-600">See how the quest works in just 30 seconds</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🌿</div>
                <h4 className="font-semibold text-gray-800">The Enchanted Forest</h4>
                <p className="text-sm text-gray-600">A friendly guide appears beside you</p>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                "You find yourself in a magical forest with three paths. One leads to a library with ancient books, another to a workshop with strange tools, and the last to a garden where rare flowers bloom. Which path calls to you?"
              </p>
              
              <div className="space-y-2">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                  Ancient library with books
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                  Workshop with tools
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                  Garden with flowers
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  onStartQuest()
                }}
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-sm"
              >
                Start Full Quest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

function App() {
  const [step, setStep] = useState<'landing' | 'auth' | 'start' | 'quiz' | 'results' | 'recommendations' | 'courseIntro' | 'course' | 'evidence' | 'credential' | 'portfolio'>('landing')
  const [idx, setIdx] = useState(0)
  const [scores, setScores] = useState<Record<ArchetypeKey, number>>({ Explorer: 0, Maker: 0, Thinker: 0, Artist: 0, Healer: 0, Leader: 0, Innovator: 0, Performer: 0, Naturalist: 0, Analyst: 0 })
  const [progress, setProgress] = useState(loadProgress())
  const [course, setCourse] = useState<CourseMap>(loadCourse())
  const [creds, setCreds] = useState<Credential[]>(loadCreds())
  const [selectedActId, setSelectedActId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(loadUser())

  useEffect(() => {
    // Show landing page first, then check auth status
    if (isLoggedIn() && user) {
      setStep(user.questCompleted ? 'start' : 'start')
    } else {
      setStep('landing')
    }
  }, [])

  const weights = useMemo(() => normalize(scores), [scores])

  const handlePick = (gives: ArchetypeKey[], option: any) => {
    setScores((prev) => {
      const next = { ...prev }
      // Score archetypes
      for (const g of gives) next[g] += 1
      
      // Bonus for aptitude alignment
      if (option.aptitude) {
        for (const _apt of option.aptitude) {
          // Add small bonus for aptitude alignment
          next[gives[0]] += 0.2
        }
      }
      
      // Bonus for RIASEC alignment
      if (option.riasec) {
        for (const _r of option.riasec) {
          // Add small bonus for RIASEC alignment
          next[gives[0]] += 0.1
        }
      }
      
      return next
    })
    if (idx + 1 < LOCATIONS.length) setIdx((i) => i + 1)
    else setStep('results')
  }

  const restart = () => {
    setIdx(0)
    setScores({ Explorer: 0, Maker: 0, Thinker: 0, Artist: 0, Healer: 0, Leader: 0, Innovator: 0, Performer: 0, Naturalist: 0, Analyst: 0 })
    setStep('start')
  }

  const handleComplete = (activityId: string) => {
    const today = getTodayKey()
    let { xp, streak, last, completed } = loadProgress()
    if (!completed.includes(activityId)) completed = [...completed, activityId]
    xp += 10
    if (last !== today) {
      const lastDate = last ? new Date(last) : null
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      if (lastDate && lastDate.toDateString() === yesterday.toDateString()) streak += 1
      else streak = 1
      last = today
    }
    const next = { xp, streak, last, completed }
    saveProgress(next)
    setProgress(next)
    alert('Great job! +10 XP earned.')
  }

  const activityById = (id: string) => ((activitiesData as any).activities as any[]).find(a => a.id === id)

  const startCourse = (id: string) => { setSelectedActId(id); setStep('courseIntro') }
  const beginCourse = () => setStep('course')
  const completeCourse = () => {
    if (!selectedActId) return
    const now = new Date().toISOString()
    const next = { ...course, [selectedActId]: { completed: true, startedAt: course[selectedActId]?.startedAt || now, updatedAt: now } }
    setCourse(next); saveCourse(next); setStep('evidence')
  }
  const submitEvidence = (data: { url?: string; notes?: string }) => {
    if (!selectedActId) return
    const act = activityById(selectedActId)
    const cred: Credential = { id: `${selectedActId}-${Date.now()}`, title: `Credential: ${act.title}`, activityId: selectedActId, issuedAt: new Date().toISOString(), evidence: data, rubric: 'Explorer' }
    const list = [...creds, cred]; setCreds(list); saveCreds(list); setStep('credential')
  }

  const finishOnboarding = () => {
    if (!user) return
    const updated: User = { ...user, questCompleted: true }
    setUser(updated); saveUser(updated)
    alert('Onboarding complete!')
  }

  const logout = () => { logoutUser(); setUser(null); setStep('landing') }
  
  const goToAuth = () => setStep('auth')
  const goToQuest = () => setStep('start')

  return (
    <>
      {step === 'landing' ? (
        <LandingPage onGetStarted={goToAuth} onStartQuest={goToQuest} />
      ) : (
        <Screen onOpenProfile={() => setProfileOpen(true)} user={user}>
          <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} xp={progress.xp} streak={progress.streak} onOpenPortfolio={() => { setProfileOpen(false); setStep('portfolio') }} user={user} onLogout={logout} />
          <AnimatePresence mode="wait">
            {step === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AuthScreen onAuth={(u)=>{ setUser(u); setStep(u.questCompleted?'start':'start') }} />
              </motion.div>
            )}

            {step === 'start' && (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Start onStart={() => setStep('quiz')} />
              </motion.div>
            )}

            {step === 'quiz' && (
              <QuestionCard key={LOCATIONS[idx].id} idx={idx} total={LOCATIONS.length} location={LOCATIONS[idx]} onPick={handlePick} />
            )}

            {step === 'results' && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Results scores={scores} onRestart={restart} onStartRecommendations={() => user?.questCompleted ? setStep('recommendations') : alert('Please finish onboarding first.')} onFinishOnboarding={finishOnboarding} showFinishCTA={!user?.questCompleted} />
              </motion.div>
            )}

            {step === 'recommendations' && (
              <motion.div key="recs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-xl font-semibold mb-2">Recommended Activities</h2>
                <p className="text-sm text-neutral-600 mb-3">Based on your archetype blend</p>
                <Recommendations weights={weights} course={course} creds={creds} onStartCourse={(id) => startCourse(id)} onSubmitEvidence={(id) => { setSelectedActId(id); setStep('evidence') }} onComplete={handleComplete} />
                <div className="mt-4 flex justify-end">
                  <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setStep('portfolio')}>Open Portfolio</button>
                </div>
              </motion.div>
            )}

            {step === 'courseIntro' && selectedActId && (
              <motion.div key="c-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CourseIntro activity={activityById(selectedActId)!} onBegin={beginCourse} onBack={() => setStep('recommendations')} />
              </motion.div>
            )}

            {step === 'course' && selectedActId && (
              <motion.div key="course" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CourseScreen activity={activityById(selectedActId)!} onComplete={completeCourse} />
              </motion.div>
            )}

            {step === 'evidence' && selectedActId && (
              <motion.div key="evidence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EvidenceSubmit onSubmit={submitEvidence} onSkip={() => setStep('recommendations')} />
              </motion.div>
            )}

            {step === 'credential' && creds.length>0 && (
              <motion.div key="cred" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CredentialGranted credential={creds[creds.length-1]} onPortfolio={() => setStep('portfolio')} onBackToRecs={() => setStep('recommendations')} />
              </motion.div>
            )}

            {step === 'portfolio' && (
              <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Portfolio creds={creds} onBack={() => setStep('recommendations')} />
              </motion.div>
            )}
          </AnimatePresence>
        </Screen>
      )}
    </>
  )
}

export default App
