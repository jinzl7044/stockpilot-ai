import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'

export async function createUpgradeRequest(db, user) {
  if (!db || !user) {
    throw new Error('請先登入 Google 後再申請升級 Pro。')
  }

  const requestRef = collection(db, 'upgradeRequests')

  await addDoc(requestRef, {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    status: 'pending',
    plan: 'pro',
    message: '使用者申請升級 Pro 會員',
    createdAt: serverTimestamp(),
  })
}