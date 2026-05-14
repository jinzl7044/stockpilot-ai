import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'

export async function saveAnalysisHistory(db, user, payload) {
  if (!db || !user || !payload) return

  const historyRef = collection(db, 'users', user.uid, 'analysisHistory')

  await addDoc(historyRef, {
    uid: user.uid,
    email: user.email || '',
    stockCode: payload.stockCode || '',
    stockName: payload.stockName || '',
    price: payload.analysis?.price || '',
    entryZone: payload.analysis?.entryZone || '',
    stopLoss: payload.analysis?.stopLoss || '',
    takeProfit1: payload.analysis?.takeProfit1 || '',
    takeProfit2: payload.analysis?.takeProfit2 || '',
    support: payload.analysis?.support || '',
    riskReward: payload.analysis?.riskReward || '',
    tradeAction:
      payload.analysis?.tradeAction || payload.analysis?.status || '',
    rsi: payload.analysis?.rsi || '',
    macd: payload.analysis?.macd || '',
    suggestion: payload.analysis?.suggestion || '',
    createdAt: serverTimestamp(),
  })
}

export async function fetchAnalysisHistory(db, user, maxCount = 8) {
  if (!db || !user) return []

  const historyRef = collection(db, 'users', user.uid, 'analysisHistory')

  const historyQuery = query(
    historyRef,
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  )

  const snapshot = await getDocs(historyQuery)

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }))
}