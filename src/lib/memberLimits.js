import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

export const FREE_DAILY_ANALYSIS_LIMIT = 5

function getTodayKey() {
  return new Date().toLocaleDateString('sv-SE')
}

export async function getMemberLimitStatus(db, user) {
  if (!db || !user) {
    return {
      allowed: false,
      plan: 'guest',
      count: 0,
      limit: FREE_DAILY_ANALYSIS_LIMIT,
      remaining: 0,
      message: '請先登入 Google 後再使用 AI 分析。',
    }
  }

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)
  const data = userSnap.exists() ? userSnap.data() : {}

  const plan = data.plan || 'free'

  if (plan === 'pro') {
    return {
      allowed: true,
      plan,
      count: 0,
      limit: 'unlimited',
      remaining: 'unlimited',
      message: 'Pro 會員不限分析次數。',
    }
  }

  const today = getTodayKey()
  const dailyAnalysisDate = data.dailyAnalysisDate || ''
  const dailyAnalysisCount =
    dailyAnalysisDate === today ? Number(data.dailyAnalysisCount || 0) : 0

  const remaining = Math.max(FREE_DAILY_ANALYSIS_LIMIT - dailyAnalysisCount, 0)

  return {
    allowed: dailyAnalysisCount < FREE_DAILY_ANALYSIS_LIMIT,
    plan,
    count: dailyAnalysisCount,
    limit: FREE_DAILY_ANALYSIS_LIMIT,
    remaining,
    message:
      dailyAnalysisCount >= FREE_DAILY_ANALYSIS_LIMIT
        ? '免費會員今日分析次數已用完，請升級 Pro 或明天再試。'
        : `免費會員今日剩餘 ${remaining} 次分析。`,
  }
}

export async function recordAnalysisUsage(db, user) {
  if (!db || !user) return null

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)
  const data = userSnap.exists() ? userSnap.data() : {}

  const plan = data.plan || 'free'

  if (plan === 'pro') {
    await setDoc(
      userRef,
      {
        lastAnalysisAt: serverTimestamp(),
      },
      { merge: true }
    )

    return {
      plan,
      count: 0,
      limit: 'unlimited',
      remaining: 'unlimited',
    }
  }

  const today = getTodayKey()
  const oldDate = data.dailyAnalysisDate || ''
  const oldCount = oldDate === today ? Number(data.dailyAnalysisCount || 0) : 0
  const newCount = oldCount + 1

  await setDoc(
    userRef,
    {
      dailyAnalysisDate: today,
      dailyAnalysisCount: newCount,
      lastAnalysisAt: serverTimestamp(),
    },
    { merge: true }
  )

  return {
    plan,
    count: newCount,
    limit: FREE_DAILY_ANALYSIS_LIMIT,
    remaining: Math.max(FREE_DAILY_ANALYSIS_LIMIT - newCount, 0),
  }
}