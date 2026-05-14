export function analyzeTaiwanStock(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('沒有取得 FinMind 資料')
  }

  const cleanRows = rows.filter(
    (item) =>
      Number.isFinite(item.open) &&
      Number.isFinite(item.high) &&
      Number.isFinite(item.low) &&
      Number.isFinite(item.close)
  )

  if (cleanRows.length === 0) {
    throw new Error('沒有有效 K 線資料')
  }

  const latest = cleanRows[cleanRows.length - 1]
  const recent = cleanRows.slice(-20)

  const close = latest.close
  const support = Math.min(...recent.map((item) => item.low))
  const resistance = Math.max(...recent.map((item) => item.high))

  const upside = resistance - close
  const downside = close - support

  const riskReward =
    downside > 0 && upside > 0 ? Number((upside / downside).toFixed(2)) : null

  let status = '中性震盪'
  let pattern = '區間整理'
  let suggestion = '等待突破壓力或跌破支撐後再判斷'

  if (close > resistance * 0.98) {
    status = '偏多觀察'
    pattern = '接近壓力區'
    suggestion = '等待放量突破後再評估追價'
  }

  if (close < support * 1.02) {
    status = '偏弱觀察'
    pattern = '接近支撐區'
    suggestion = '先觀察支撐是否有效，不急著進場'
  }

  return {
    date: latest.date,
    price: close.toString(),
    support: support.toFixed(2),
    resistance: resistance.toFixed(2),
    riskReward: riskReward ? riskReward.toString() : '計算中',
    status,
    pattern,
    rsi: '簡化版暫不計算',
    macd: '簡化版暫不計算',
    suggestion,
  }
}