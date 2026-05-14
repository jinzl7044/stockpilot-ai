function calculateRSI(prices, period = 14) {
  if (!Array.isArray(prices) || prices.length <= period) {
    return null
  }

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i += 1) {
    const change = prices[i] - prices[i - 1]

    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }

  let averageGain = gains / period
  let averageLoss = losses / period

  for (let i = period + 1; i < prices.length; i += 1) {
    const change = prices[i] - prices[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    averageGain = (averageGain * (period - 1) + gain) / period
    averageLoss = (averageLoss * (period - 1) + loss) / period
  }

  if (averageLoss === 0) {
    return 100
  }

  const rs = averageGain / averageLoss
  return Number((100 - 100 / (1 + rs)).toFixed(2))
}

function movingAverage(values, period) {
  if (!Array.isArray(values) || values.length < period) {
    return null
  }

  const recent = values.slice(-period)
  const total = recent.reduce((sum, value) => sum + value, 0)

  return Number((total / period).toFixed(2))
}

function calculateEMA(values, period) {
  if (!Array.isArray(values) || values.length < period) {
    return []
  }

  const multiplier = 2 / (period + 1)
  const ema = []

  const firstAverage =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) / period

  ema[period - 1] = firstAverage

  for (let i = period; i < values.length; i += 1) {
    ema[i] = (values[i] - ema[i - 1]) * multiplier + ema[i - 1]
  }

  return ema
}

function calculateMACD(closes) {
  if (!Array.isArray(closes) || closes.length < 35) {
    return {
      text: '資料不足',
      dif: null,
      dea: null,
      histogram: null,
    }
  }

  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)

  const difValues = closes.map((_, index) => {
    if (!Number.isFinite(ema12[index]) || !Number.isFinite(ema26[index])) {
      return null
    }

    return ema12[index] - ema26[index]
  })

  const validDif = difValues.filter((value) => Number.isFinite(value))
  const deaValues = calculateEMA(validDif, 9)

  if (validDif.length < 10 || deaValues.length < 2) {
    return {
      text: '資料不足',
      dif: null,
      dea: null,
      histogram: null,
    }
  }

  const latestDif = validDif[validDif.length - 1]
  const previousDif = validDif[validDif.length - 2]
  const latestDea = deaValues[deaValues.length - 1]
  const previousDea = deaValues[deaValues.length - 2]

  if (
    !Number.isFinite(latestDif) ||
    !Number.isFinite(previousDif) ||
    !Number.isFinite(latestDea) ||
    !Number.isFinite(previousDea)
  ) {
    return {
      text: '資料不足',
      dif: null,
      dea: null,
      histogram: null,
    }
  }

  const histogram = latestDif - latestDea
  const previousHistogram = previousDif - previousDea

  let text = '動能中性'

  if (previousDif <= previousDea && latestDif > latestDea) {
    text = '黃金交叉偏多'
  } else if (previousDif >= previousDea && latestDif < latestDea) {
    text = '死亡交叉偏弱'
  } else if (latestDif > latestDea && histogram > previousHistogram) {
    text = '多方動能擴大'
  } else if (latestDif > latestDea && histogram <= previousHistogram) {
    text = '多方動能收斂'
  } else if (latestDif < latestDea && histogram < previousHistogram) {
    text = '空方動能擴大'
  } else if (latestDif < latestDea && histogram >= previousHistogram) {
    text = '空方動能收斂'
  }

  return {
    text,
    dif: Number(latestDif.toFixed(2)),
    dea: Number(latestDea.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
  }
}

function getSupport(rows, lookback = 20) {
  const recent = rows.slice(-lookback)
  const lows = recent.map((item) => item.low).filter(Number.isFinite)

  if (lows.length === 0) return null

  return Number(Math.min(...lows).toFixed(2))
}

function getResistance(rows, lookback = 20) {
  const recent = rows.slice(-lookback)
  const highs = recent.map((item) => item.high).filter(Number.isFinite)

  if (highs.length === 0) return null

  return Number(Math.max(...highs).toFixed(2))
}

function getTrend(close, ma5, ma20, rsi, macd) {
  if (!close || !ma5 || !ma20 || !rsi) {
    return {
      status: '資料不足',
      pattern: '等待更多 K 線資料',
      suggestion: '先觀察，不急著進場',
    }
  }

  if (rsi >= 70) {
    return {
      status: '過熱風險',
      pattern: 'RSI 偏高，短線可能過熱',
      suggestion: '不建議追高，可等待拉回後再觀察',
    }
  }

  if (rsi <= 30) {
    return {
      status: '超跌反彈觀察',
      pattern: 'RSI 偏低，可能有反彈機會',
      suggestion: '仍需等待止跌型態或量能確認',
    }
  }

  if (close > ma5 && ma5 > ma20 && rsi >= 55) {
    if (macd?.text?.includes('多方')) {
      return {
        status: '偏多觀察',
        pattern: '均線多頭排列，MACD 多方動能配合',
        suggestion: '可等待回測支撐不破，再分批評估',
      }
    }

    return {
      status: '偏多觀察',
      pattern: '短線多頭排列',
      suggestion: '可等待回測支撐不破，再分批評估',
    }
  }

  if (close < ma5 && ma5 < ma20 && rsi <= 45) {
    if (macd?.text?.includes('空方') || macd?.text?.includes('死亡')) {
      return {
        status: '偏弱觀察',
        pattern: '均線空頭排列，MACD 空方動能配合',
        suggestion: '先不要追高，等待重新站回均線',
      }
    }

    return {
      status: '偏弱觀察',
      pattern: '短線空頭排列',
      suggestion: '先不要追高，等待重新站回均線',
    }
  }

  if (macd?.text === '黃金交叉偏多') {
    return {
      status: '轉強觀察',
      pattern: 'MACD 黃金交叉',
      suggestion: '可觀察是否同步突破壓力位與放量',
    }
  }

  if (macd?.text === '死亡交叉偏弱') {
    return {
      status: '轉弱觀察',
      pattern: 'MACD 死亡交叉',
      suggestion: '先降低追價意願，觀察支撐是否守住',
    }
  }

  return {
    status: '中性震盪',
    pattern: '區間整理',
    suggestion: '等待突破壓力或跌破支撐後再判斷',
  }
}

export function analyzeTaiwanStock(rows) {
  if (!Array.isArray(rows) || rows.length < 35) {
    throw new Error('資料不足，至少需要 35 筆日 K 資料')
  }

  const cleanRows = rows.filter(
    (item) =>
      Number.isFinite(item.open) &&
      Number.isFinite(item.high) &&
      Number.isFinite(item.low) &&
      Number.isFinite(item.close)
  )

  if (cleanRows.length < 35) {
    throw new Error('有效 K 線資料不足')
  }

  const closes = cleanRows.map((item) => item.close)
  const latest = cleanRows[cleanRows.length - 1]
  const previous = cleanRows[cleanRows.length - 2]

  const close = Number(latest.close.toFixed(2))
  const support = getSupport(cleanRows, 20)
  const resistance = getResistance(cleanRows, 20)
  const rsiValue = calculateRSI(closes, 14)
  const ma5 = movingAverage(closes, 5)
  const ma20 = movingAverage(closes, 20)
  const macd = calculateMACD(closes)

  const trend = getTrend(close, ma5, ma20, rsiValue, macd)

  const upside = resistance ? resistance - close : 0
  const downside = support ? close - support : 0

  const riskReward =
    downside > 0 && upside > 0 ? Number((upside / downside).toFixed(2)) : null

  const change = previous ? Number((close - previous.close).toFixed(2)) : 0

  const changePercent =
    previous && previous.close
      ? Number((((close - previous.close) / previous.close) * 100).toFixed(2))
      : 0

  return {
    date: latest.date,
    price: close.toString(),
    support: support ? support.toString() : '計算中',
    resistance: resistance ? resistance.toString() : '計算中',
    riskReward: riskReward ? riskReward.toString() : '計算中',
    status: trend.status,
    pattern: trend.pattern,
    rsi: rsiValue ? `${rsiValue}` : '計算中',
    macd:
      macd.dif !== null
        ? `${macd.text}｜DIF ${macd.dif} / DEA ${macd.dea} / 柱 ${macd.histogram}`
        : macd.text,
    suggestion: trend.suggestion,
    ma5,
    ma20,
    change,
    changePercent,
  }
}