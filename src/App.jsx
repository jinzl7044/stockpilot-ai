import { useEffect, useState } from 'react'
import { auth, db, firebaseReady } from './lib/firebase'
import TaiwanStockChart from './components/TaiwanStockChart'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const stockNames = {
  2330: '台積電',
  2317: '鴻海',
  2454: '聯發科',
  2377: '微星',
  2303: '聯電',
  2603: '長榮',
  2618: '長榮航',
  2881: '富邦金',
  2882: '國泰金',
}

const stockAnalysis = {
  2330: {
    price: '950.0',
    support: '910.00',
    resistance: '980.00',
    riskReward: '2.75',
    status: '偏多觀察',
    pattern: '高檔整理',
    rsi: '62，中性偏強',
    macd: '多方動能延續',
    suggestion: '等待突破壓力位後再加碼',
  },
  2317: {
    price: '185.5',
    support: '176.00',
    resistance: '193.00',
    riskReward: '1.79',
    status: '觀察中',
    pattern: '區間震盪',
    rsi: '48，中性',
    macd: '動能尚未明確',
    suggestion: '等站回短均線再評估',
  },
  2377: {
    price: '107.5',
    support: '96.75',
    resistance: '114.00',
    riskReward: '6.01',
    status: '相對安全',
    pattern: '多頭吞噬，底部反轉',
    rsi: '56，中性偏多',
    macd: '黃金交叉尚未失效',
    suggestion: '等待量能放大後續攻',
  },
  2454: {
    price: '1,250.0',
    support: '1,180.00',
    resistance: '1,310.00',
    riskReward: '1.86',
    status: '偏多觀察',
    pattern: '均線多頭排列',
    rsi: '59，中性偏多',
    macd: '多方動能延續',
    suggestion: '等待回測支撐不破再觀察',
  },
}

export default function App() {
  const [user, setUser] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stockInput, setStockInput] = useState('2377')
  const [selectedStock, setSelectedStock] = useState('2377')

  const watchlist = [
    { code: '2330', name: '台積電', signal: 'AI 看多' },
    { code: '2317', name: '鴻海', signal: '觀察中' },
    { code: '2454', name: '聯發科', signal: 'AI 看多' },
    { code: '2377', name: '微星', signal: '底部反轉' },
  ]

  const currentName = stockNames[selectedStock] || '台股'
  const analysis =
    stockAnalysis[selectedStock] || {
      price: '即時更新',
      support: '計算中',
      resistance: '計算中',
      riskReward: '計算中',
      status: 'AI 分析中',
      pattern: '等待資料同步',
      rsi: '等待資料同步',
      macd: '等待資料同步',
      suggestion: '目前先以 FinMind 台股 K 線觀察趨勢',
    }

  const notifications = [
    `${selectedStock} ${currentName} 已切換分析標的`,
    '2330 台積電突破短線壓力位',
    '2317 鴻海跌破防守位，建議觀察',
  ]

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser)

        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)

          if (!userSnap.exists()) {
            const newMember = {
              email: currentUser.email,
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

            await setDoc(userRef, newMember)
            setMember(newMember)
          } else {
            const oldMember = userSnap.data()

            await setDoc(
              userRef,
              {
                lastLoginAt: serverTimestamp(),
              },
              { merge: true }
            )

            setMember(oldMember)
          }
        } else {
          setMember(null)
        }
      } catch (error) {
        console.error('Firebase member sync error:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    if (!firebaseReady) {
      alert('Firebase 尚未設定完成，請確認 .env 設定。')
      return
    }

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Google login error:', error)
      alert('Google 登入失敗，請檢查 Firebase 設定。')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAnalyze = () => {
    const cleaned = stockInput.trim().replace(/\D/g, '')

    if (!cleaned) {
      alert('請輸入股票代號，例如 2330、2377。')
      return
    }

    setSelectedStock(cleaned)
  }

  const handleQuickSelect = (code) => {
    setStockInput(code)
    setSelectedStock(code)
  }

  const memberPlanText = member?.plan === 'pro' ? 'Pro 會員' : '免費會員'
  const memberBadgeText = member?.plan === 'pro' ? 'Pro' : 'Free'

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1115]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-400">
              6767sixseven
            </h1>
            <p className="text-sm text-zinc-400">
              AI 股票分析與交易提醒平台
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden text-right text-sm md:block">
                  <p className="font-semibold text-white">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-zinc-400">{memberPlanText}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
                >
                  登出
                </button>
              </>
            ) : (
              <button
                type="button"
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
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row">
              <input
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAnalyze()
                }}
                placeholder="輸入股票代號，例如 2330"
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-xl outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={handleAnalyze}
                className="rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-black hover:bg-emerald-400"
              >
                AI 分析
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {watchlist.map((stock) => (
                <button
                  type="button"
                  key={stock.code}
                  onClick={() => handleQuickSelect(stock.code)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedStock === stock.code
                      ? 'bg-emerald-500 text-black'
                      : 'border border-white/10 bg-black/30 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {stock.code} {stock.name}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-black">
                    {selectedStock} {currentName}
                  </h2>
                  <p className="mt-1 text-zinc-300">
                    FinMind：台股 {selectedStock}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-500 px-5 py-2 font-bold text-black">
                  {analysis.status}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ['現價', analysis.price],
                  ['支撐位', analysis.support],
                  ['壓力位', analysis.resistance],
                  ['風險報酬', analysis.riskReward],
                ].map((item) => (
                  <div
                    key={item[0]}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-sm text-zinc-400">{item[0]}</p>
                    <p className="mt-2 text-3xl font-black">{item[1]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-lg leading-relaxed text-zinc-200">
                <p>• AI 判斷：{analysis.status}</p>
                <p>• K 棒型態：{analysis.pattern}</p>
                <p>• RSI：{analysis.rsi}</p>
                <p>• MACD：{analysis.macd}</p>
                <p>• 建議：{analysis.suggestion}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold">會員方案</h3>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black">
                  {memberBadgeText}
                </span>
              </div>

              <div className="space-y-3 text-zinc-300">
                <p>✓ Google 登入</p>
                <p>✓ Firestore 會員資料同步</p>
                <p>✓ 免費會員自選股上限：{member?.watchlistLimit || 3} 檔</p>
                <p>✓ Pro 會員可解鎖無限自選股</p>
                <p>✓ 後續可接 LINE / Discord 通知</p>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-black text-black hover:bg-emerald-400"
              >
                升級 Pro 會員
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 text-2xl font-bold">自選股</h3>

              <div className="space-y-3">
                {watchlist.map((stock) => (
                  <button
                    type="button"
                    key={stock.code}
                    onClick={() => handleQuickSelect(stock.code)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:bg-white/10"
                  >
                    <div>
                      <p className="font-bold">{stock.code}</p>
                      <p className="text-sm text-zinc-400">{stock.name}</p>
                    </div>

                    <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
                      {stock.signal}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">台股 K 線圖</h3>

              <div className="flex gap-2">
                {['日K', '週K', '月K'].map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <TaiwanStockChart stockId={selectedStock} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 text-2xl font-bold">LINE 通知</h3>
              <p className="mb-4 text-zinc-400">
                股價到價、AI 訊號、停損提醒
              </p>

              <button
                type="button"
                className="w-full rounded-2xl bg-emerald-500 py-4 font-black text-black hover:bg-emerald-400"
              >
                綁定 LINE
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 text-2xl font-bold">Discord 通知</h3>
              <p className="mb-4 text-zinc-400">
                自動推播 AI 分析到 Discord
              </p>

              <button
                type="button"
                className="w-full rounded-2xl bg-indigo-500 py-4 font-black text-white hover:bg-indigo-400"
              >
                綁定 Discord
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">AI 即時通知中心</h3>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                即時同步
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">後台會員管理</h3>

              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-black"
              >
                新增會員
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <div>
                  <p className="font-bold">
                    {user?.displayName || 'DemoUser'}
                  </p>
                  <p className="text-sm text-zinc-400">{memberPlanText}</p>
                </div>

                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                  啟用中
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black">系統整合狀態</h3>
              <p className="mt-1 text-zinc-400">
                6767sixseven 雲端整合模組
              </p>
            </div>

            <div className="rounded-full bg-emerald-500 px-5 py-2 font-bold text-black">
              Online
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              'Firebase Auth',
              'Firestore DB',
              'FinMind API',
              'Lightweight Charts',
              'OpenAI AI Engine',
              'LINE / Discord',
            ].map((service) => (
              <div
                key={service}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-sm text-zinc-500">已規劃</p>
                <p className="mt-2 font-bold">{service}</p>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            正在同步會員資料...
          </p>
        )}
      </main>
    </div>
  )
}
