import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CloudSun,
  Coins,
  Lock,
  PiggyBank,
  Sparkles,
  Star,
  SunMedium,
  Trophy,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DAILY_SYNC_MS = 1000 * 60 * 60 * 24
const STORAGE_KEY = 'pocket-money-dashboard-v1'
const PARENT_PIN = '20210907'

const formatMoney = (value: number) => `£${value.toFixed(2)}`

type JobEntry = {
  id: number
  title: string
  amount: number
  date: string
}

type SpendingEntry = {
  id: number
  title: string
  amount: number
  date: string
}

type Pot = {
  name: string
  current: number
  target: number
  color: string
}

type Task = {
  title: string
  reward: number
  due: string
}

type DashboardState = {
  balance: number
  lastSyncAt: number
  jobs: JobEntry[]
  spending: SpendingEntry[]
  pots: Pot[]
  tasks: Task[]
}

const starterState: DashboardState = {
  balance: 3.50,
  lastSyncAt: Date.now(),
  jobs: [
    { id: 1, title: 'Bedroom tidy', amount: 1, date: 'Today' },
    { id: 2, title: 'Living room tidy', amount: .5, date: 'Yesterday' },
    { id: 3, title: 'Garden Help', amount: 1, date: 'Mon' },
  ],
  spending: [
    { id: 1, title: 'Glowing Toy', amount: 5, date: 'Today' },
    { id: 2, title: 'Book fair', amount: 5, date: 'Sat' },
  ],
  pots: [
    { name: 'Main pot', current: 0, target: 50, color: 'bg-pink-500' },
    { name: 'Squishmellow Cat fund', current: 3.5, target: 7, color: 'bg-sky-500' },
    { name: 'Treasure chest', current: 0, target: 25, color: 'bg-emerald-500' },
  ],
  tasks: [
    { title: 'Tidy Room', reward: 1, due: 'Wed' },
    { title: 'Help in the garden', reward: 1, due: 'Fri' },
    { title: 'Sort toys', reward: .5, due: 'Sun' },
  ],
}

function App() {
  const [data, setData] = useState<DashboardState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return starterState
    }

    try {
      return { ...starterState, ...JSON.parse(saved) }
    } catch {
      return starterState
    }
  })
  const [isParentMode, setIsParentMode] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [jobInput, setJobInput] = useState({ title: '', amount: '5' })
  const [topUpInput, setTopUpInput] = useState({ amount: '5', note: 'Birthday boost' })
  const [spendInput, setSpendInput] = useState({ title: 'Treat', amount: '3' })
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setData((current) => ({
        ...current,
        lastSyncAt: Date.now(),
      }))
    }, DAILY_SYNC_MS)

    return () => window.clearInterval(timer)
  }, [])

  const nextSyncLabel = useMemo(() => {
    const next = data.lastSyncAt + DAILY_SYNC_MS
    return new Date(next).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [data.lastSyncAt])

  const refreshData = () => {
    setIsRefreshing(true)

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setIsRefreshing(false)
      return
    }

    try {
      const latestData = JSON.parse(saved) as DashboardState
      setData({ ...starterState, ...latestData, lastSyncAt: Date.now() })
    } catch {
      // Ignore malformed cached data and leave current state intact.
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const unlockParentMode = () => {
    if (pin === PARENT_PIN) {
      setIsParentMode(true)
      setPin('')
      setPinError('')
      return
    }

    setPinError('That pin is not quite right. Try DOB.')
  }

  const addJob = () => {
    const amount = Number(jobInput.amount) || 0
    if (!jobInput.title.trim() || amount <= 0) return

    setData((current) => ({
      ...current,
      balance: current.balance + amount,
      jobs: [{ id: Date.now(), title: jobInput.title, amount, date: 'Today' }, ...current.jobs].slice(0, 5),
    }))
    setJobInput({ title: '', amount: '5' })
  }

  const addTopUp = () => {
    const amount = Number(topUpInput.amount) || 0
    if (amount <= 0) return

    setData((current) => ({
      ...current,
      balance: current.balance + amount,
      spending: [{ id: Date.now(), title: topUpInput.note || 'Top up', amount: -amount, date: 'Today' }, ...current.spending].slice(0, 5),
    }))
    setTopUpInput({ amount: '5', note: 'Birthday boost' })
  }

  const addSpend = () => {
    const amount = Number(spendInput.amount) || 0
    if (!spendInput.title.trim() || amount <= 0) return

    setData((current) => ({
      ...current,
      balance: current.balance - amount,
      spending: [{ id: Date.now(), title: spendInput.title, amount: -amount, date: 'Today' }, ...current.spending].slice(0, 5),
    }))
    setSpendInput({ title: 'Treat', amount: '3' })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf5,_#fdf2f8_40%,_#eef6ff_100%)] px-5 py-6 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">Pocket money</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Finn's Savings</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
              <span className="flex items-center gap-2"><SunMedium className="h-4 w-4" /> 21°C</span>
            </div>
            <div className="rounded-2xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-pink-400 via-fuchsia-400 to-orange-300 text-white shadow-[0_24px_80px_rgba(236,72,153,0.28)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-pink-50">
                      <Sparkles className="h-3.5 w-3.5" /> Child mode
                    </div>
                    <p className="text-sm text-pink-50">Current balance</p>
                    <p className="mt-2 text-5xl font-black tracking-tight">{formatMoney(data.balance)}</p>
                  </div>
                  <div className="rounded-3xl bg-white/15 p-3">
                    <PiggyBank className="h-12 w-12" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-pink-50">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Daily sync: {nextSyncLabel}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Auto sync every day</span>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/15 text-white hover:bg-white/20"
                    onClick={refreshData}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Refreshing…' : 'Refresh data'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900"><Coins className="h-5 w-5 text-amber-400" /> Recent jobs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div>
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.date}</p>
                      </div>
                      <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700">+{formatMoney(job.amount)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900"><Star className="h-5 w-5 text-violet-400" /> Spending</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.spending.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.date}</p>
                      </div>
                      <div className="rounded-full bg-rose-100 px-2.5 py-1 text-sm font-bold text-rose-700">-{formatMoney(Math.abs(item.amount))}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900"><Trophy className="h-5 w-5 text-amber-400" /> Goal pots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.pots.map((pot) => (
                  <div key={pot.name}>
                    <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{pot.name}</span>
                      <span>{formatMoney(pot.current)}/{formatMoney(pot.target)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${pot.color}`}
                        style={{ width: `${Math.min((pot.current / pot.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900"><CloudSun className="h-5 w-5 text-sky-400" /> This week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.tasks.map((task) => (
                  <div key={task.title} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">Due {task.due}</p>
                    </div>
                    <div className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-700">{formatMoney(task.reward)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </main>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-900"><Sparkles className="h-5 w-5 text-pink-400" /> Child dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-yellow-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-700">Earned</p>
                  <p className="mt-2 text-3xl font-black text-yellow-900">{formatMoney(data.jobs.reduce((sum, job) => sum + job.amount, 0))}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">Spent</p>
                  <p className="mt-2 text-3xl font-black text-rose-900">{formatMoney(Math.abs(data.spending.reduce((sum, item) => sum + item.amount, 0)))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-900"><Lock className="h-5 w-5 text-slate-500" /> Parent mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isParentMode ? (
                <>
                  <input
                    type="password"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="Parent PIN"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:bg-white"
                  />
                  {pinError && <p className="text-sm text-red-600">{pinError}</p>}
                  <Button className="w-full" onClick={unlockParentMode}>Unlock</Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={jobInput.title}
                      onChange={(event) => setJobInput((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Job name"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                    <input
                      type="number"
                      value={jobInput.amount}
                      onChange={(event) => setJobInput((current) => ({ ...current, amount: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <Button className="w-full" onClick={addJob}>Add job</Button>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      value={topUpInput.amount}
                      onChange={(event) => setTopUpInput((current) => ({ ...current, amount: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                    <input
                      value={topUpInput.note}
                      onChange={(event) => setTopUpInput((current) => ({ ...current, note: event.target.value }))}
                      placeholder="Bonus note"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <Button className="w-full" variant="secondary" onClick={addTopUp}>Add top up</Button>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={spendInput.title}
                      onChange={(event) => setSpendInput((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Spend item"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                    <input
                      type="number"
                      value={spendInput.amount}
                      onChange={(event) => setSpendInput((current) => ({ ...current, amount: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <Button className="w-full" variant="outline" onClick={addSpend}>Record spend</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
