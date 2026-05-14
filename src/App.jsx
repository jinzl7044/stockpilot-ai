import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import {
  Bell,
  Bot,
  CandlestickChart,
  CheckCircle2,
  Crown,
  Database,
  LineChart,
  Lock,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { auth, db, googleProvider, isFirebaseConfigured } from './lib/firebase'

const notifications = [
  '2377 微星出現 AI 底部反轉訊號',
  '2330 台積電突破壓力位',
  '2317 鴻海跌破防守位',
]

const fallbackMembers = [
  {
    name: 'LinJG',
    plan: 'Pro',
    status: '啟用中',
  },
  {
    name: 'DemoUser',
    plan: '免費會員',
    status: '正常',
  },
]

const watchlist = [
  { code: '2330', name: '台積電', signal: 'AI 看多' },
  { code: '2317', name: '鴻海', signal: '觀望' },
  { code: '2454', name: '聯發科', signal: '偏多' },
  { code: '2377', name: '微星', signal: 'AI 看多' },
]

const metrics = [
  ['現價', '107.5'],
  ['支撐位', '96.75'],
  ['壓力位', '114.00'],
  ['風險報酬', '6.01'],
]

const services = [
  'Firebase Auth',
  'Firestore DB',
  'TradingView API',
  'FinMind API',
  'OpenAI AI Engine',
  'LINE Notify',
  'Discord Webhook',
]

function StatusBadge({ children, variant = 'success' }) {
  const styles =
    variant === 'success'
      ? 'bg-emerald-500/20 text-emerald-300'
      : variant === 'warning'
        ? 'bg-amber-500/20 text-amber-300'
        : 'bg-zinc-700 text-zinc-300'

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles}`}>
      {children}
    </span>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-xl ${className}`}>
      {children}
    </div>
  )
}

async function createOrLoadMemberProfile(currentUser) {
  if (!db || !currentUser) return null

  const userRef = doc(db, 'users', currentUser.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const existingData = userSnap.data()

    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      email: currentUser.email || existingData.email || '',
      displayName: currentUser.displayName || existingData.displayName || '',
      photoURL: currentUser.photoURL || existingData.photoURL || '',
    })

    return { id: currentUser.uid, ...existingData }
  }

  const newProfile = {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || '',
    photoURL: currentUser.photoURL || '',
    plan: 'free',
    role: 'user',
    watchlistLimit: 3,
    notifications: {
      line: false,
      discord: false,
    },
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }

  await setDoc(userRef, newProfile)
  return { id: currentUser.uid, ...newProfile }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [memberProfile, setMemberProfile] = useState(null)
  const [authError, setAuthError] = useState('')
  const [profileStatus, setProfileStatus] = useState('尚未登入')

  useEffect(() => {
    if (!auth) return undefined

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setAuthError('')

      if (!currentUser) {
        setMemberProfile(null)
        setProfileStatus('尚未登入')
        return
      }

      try {
        setProfileStatus('同步會員資料中')
        const profile = await createOrLoadMemberProfile(currentUser)
        setMemberProfile(profile)
        setProfileStatus('Firestore 已同步')
      } catch (error) {
        setMemberProfile(null)
        setProfileStatus('Firestore 同步失敗')
        setAuthError(error.message || '會員資料寫入 Firestore 失敗，請檢查資料庫規則。')
      }
    })

    return unsubscribe
  }, [])

  const handleGoogleLogin = async () => {
    setAuthError('')

    if (!isFirebaseConfigured || !auth) {
      setAuthError('Firebase 尚未設定。請先把 Firebase config 填入 .env。')
      return
    }

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setAuthError(error.message || 'Google 登入失敗，請檢查 Firebase 設定。')
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  const displayName = memberProfile?.displayName || user?.displayName || user?.email || '免費會員'
  const isLoggedIn = Boolean(user)
  const currentPlan = memberProfile?.plan === 'pro' ? 'Pro' : isLoggedIn ? 'Free' : 'Guest'
  const currentPlanLabel = memberProfile?.plan === 'pro' ? 'Pro 會員' : isLoggedIn ? '免費會員' : '訪客'
  const currentWatchlistLimit = memberProfile?.watchlistLimit ?? 3
  const memberRows = memberProfile
    ? [
        {
          name: memberProfile.displayName || memberProfile.email || '目前使用者',
          plan: memberProfile.plan === 'pro' ? 'Pro' : '免費會員',
          status: profileStatus,
        },
        ...fallbackMembers,
      ]
    : fallbackMembers

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1115]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-emerald-400">
              <Sparkles className="h-8 w-8" />
              StockPilot AI
            </h1>
            <p className="text-sm text-zinc-400">AI 幫你判斷現在該不該進場</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800">
              {isLoggedIn ? `${displayName}｜${currentPlanLabel}` : '免費會員'}
            </button>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900 px-5 py-2 font-semibold text-white hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" />
                登出
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="rounded-2xl bg-emerald-500 px-5 py-2 font-semibold text-black hover:bg-emerald-400"
              >
                Google 登入
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {authError && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-amber-200">
            {authError}
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-zinc-300">
            Firebase config 尚未填入。這是正常狀態；部署前請把 .env.example 複製成 .env 並填入 Firebase Console 的 Web App 設定。
          </div>
        )}

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <div className="mb-5 flex flex-col gap-4 md:flex-row">
              <input
                defaultValue="2377"
                aria-label="股票代號"
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-xl outline-none transition focus:border-emerald-400"
              />

              <button className="rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-black hover:bg-emerald-400">
                AI 分析
              </button>
            </div>

            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-4xl font-black">2377 微星</h2>
                  <p className="mt-1 text-zinc-300">即時股價更新中</p>
                </div>

                <div className="w-fit rounded-full bg-emerald-500 px-5 py-2 font-bold text-black">
                  相對安全
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {metrics.map((item) => (
                  <div key={item[0]} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-zinc-400">{item[0]}</p>
                    <p className="mt-2 text-3xl font-black">{item[1]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-lg leading-relaxed text-zinc-200">
                <p>• AI 判斷：適合分批進場</p>
                <p>• K 棒型態：多頭吞噬（底部反轉）</p>
                <p>• 均線排列：偏多排列</p>
                <p>• RSI：56（中性偏多）</p>
                <p>• MACD：黃金交叉尚未失效</p>
                <p>• 建議：等待量能放大後續攻</p>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-2xl font-bold">
                  <Crown className="h-6 w-6 text-emerald-400" />
                  會員方案
                </h3>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black">
                  {currentPlan}
                </span>
              </div>

              <div className="space-y-3 text-zinc-300">
                <p>✓ AI 即時分析</p>
                <p>✓ LINE 通知</p>
                <p>✓ Discord 通知</p>
                <p>✓ 免費會員 3 檔自選股</p>
                <p>✓ Pro 會員無限自選股</p>
                <p>✓ 目前方案：{currentPlanLabel}</p>
                <p>✓ 自選股上限：{currentWatchlistLimit} 檔</p>
                <p>✓ 會員資料：{profileStatus}</p>
              </div>

              <button className="mt-6 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-black text-black hover:bg-emerald-400">
                升級 Pro 會員
              </button>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <LineChart className="h-6 w-6 text-emerald-400" />
                自選股
              </h3>

              <div className="space-y-3">
                {watchlist.map((stock) => (
                  <div
                    key={stock.code}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-bold">{stock.code}</p>
                      <p className="text-sm text-zinc-400">{stock.name}</p>
                    </div>

                    <StatusBadge variant={stock.signal === '觀望' ? 'neutral' : 'success'}>
                      {stock.signal}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-bold">
                <CandlestickChart className="h-6 w-6 text-emerald-400" />
                TradingView K 線
              </h3>

              <div className="flex gap-2">
                {['1D', '1W', '1M'].map((tab) => (
                  <button key={tab} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm">
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 text-zinc-500">
              <CandlestickChart className="mb-4 h-12 w-12" />
              <p>TradingView 專業 K 線區塊</p>
              <p className="mt-2 text-sm">下一階段接入 TradingView Widget</p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <MessageCircle className="h-6 w-6 text-emerald-400" />
                LINE 通知
              </h3>
              <p className="mb-4 text-zinc-400">股價到價、AI 訊號、停損提醒</p>

              <button className="w-full rounded-2xl bg-emerald-500 py-4 font-black text-black hover:bg-emerald-400">
                綁定 LINE
              </button>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <Bell className="h-6 w-6 text-indigo-400" />
                Discord 通知
              </h3>
              <p className="mb-4 text-zinc-400">自動推播 AI 分析到 Discord</p>

              <button className="w-full rounded-2xl bg-indigo-500 py-4 font-black text-white hover:bg-indigo-400">
                綁定 Discord
              </button>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-bold">
                <Bot className="h-6 w-6 text-emerald-400" />
                AI 即時通知中心
              </h3>
              <StatusBadge>即時同步</StatusBadge>
            </div>

            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6 text-emerald-400" />
                後台會員管理
              </h3>

              <button className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-black">
                新增會員
              </button>
            </div>

            <div className="space-y-4">
              {memberRows.map((member) => (
                <div key={`${member.name}-${member.plan}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div>
                    <p className="font-bold">{member.name}</p>
                    <p className="text-sm text-zinc-400">{member.plan}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge>{member.status}</StatusBadge>
                    <button className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10">
                      管理
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-3xl font-black">
                <Database className="h-7 w-7 text-emerald-400" />
                系統整合狀態
              </h3>
              <p className="mt-1 text-zinc-400">StockPilot AI 雲端整合模組</p>
            </div>

            <div className="w-fit rounded-full bg-emerald-500 px-5 py-2 font-bold text-black">
              Online
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
            {services.map((service, index) => (
              <div key={service} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                {index === 0 || index === 1 ? (
                  isFirebaseConfigured ? (
                    <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="mb-3 h-5 w-5 text-amber-300" />
                  )
                ) : index < 5 ? (
                  <ShieldCheck className="mb-3 h-5 w-5 text-amber-300" />
                ) : (
                  <Lock className="mb-3 h-5 w-5 text-zinc-500" />
                )}
                <p className="text-sm text-zinc-500">
                  {index === 0 && isFirebaseConfigured
                    ? 'Auth 已設定'
                    : index === 1 && memberProfile
                      ? '會員資料已同步'
                      : '待正式串接'}
                </p>
                <p className="mt-2 font-bold">{service}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
