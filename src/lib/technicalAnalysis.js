function calculateRSI(prices, period = 14) {
  if (!Array.isArray(prices) || prices.length <= period) return null

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i += 1) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
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

  if (averageLoss === 0) return 100

  const rs = averageGain / averageLoss
  return Number((100 - 100 / (1 + rs)).toFixed(2))
}

function movingAverage(values, period) {
  if (!Array.isArray(values) || values.length < period) return null

  const recent = values.slice(-period)
  const total = recent.reduce((sum, value) => sum + value, 0)

  return Number((total / period).toFixed(2))
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

function calculateEMA(values, period) {
  if (!Array.isArray(values) || values.length < period) return []

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

  const difValues = closes
    .map((_, index) => {
      if (!Number.isFinite(ema12[index]) || !Number.isFinite(ema26[index])) {
        return null
      }

      return ema12[index] - ema26[index]
    })
    .filter(Number.isFinite)

  const deaValues = calculateEMA(difValues, 9)

  if (difValues.length < 10 || deaValues.length < 2) {
    return {
      text: '資料不足',
      dif: null,
      dea: null,
      histogram: null,
    }
  }

  const latestDif = difValues[difValues.length - 1]
  const previousDif = difValues[difValues.length - 2]
  const latestDea = deaValues[deaValues.length - 1]
  const previousDea = deaValues[deaValues.length - 2]

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

  const entryLow = support ? Number((support * 1.01).toFixed(2)) : close
  const entryHigh = support ? Number((support * 1.05).toFixed(2)) : close
  const stopLoss = support ? Number((support * 0.97).toFixed(2)) : Number((close * 0.95).toFixed(2))
  const takeProfit1 = resistance ? Number(resistance.toFixed(2)) : Number((close * 1.05).toFixed(2))
  const takeProfit2 = resistance ? Number((resistance * 1.05).toFixed(2)) : Number((close * 1.1).toFixed(2))

  const upside = takeProfit1 - close
  const downside = close - stopLoss

  const riskReward =
    downside > 0 && upside > 0 ? Number((upside / downside).toFixed(2)) : null

  let tradeAction = '先觀察'
  let pattern = '區間整理'
  let suggestion = '目前價格位於區間中段，建議等待靠近支撐或突破壓力。'

  const nearSupport = support ? close <= support * 1.06 : false
  const nearResistance = resistance ? close >= resistance * 0.96 : false
  const trendBullish = close > ma5 && ma5 > ma20
  const trendBearish = close < ma5 && ma5 < ma20
  const macdBullish =
    macd.text.includes('多方') || macd.text.includes('黃金')
  const macdBearish =
    macd.text.includes('空方') || macd.text.includes('死亡')

  if (nearSupport && rsiValue >= 35 && rsiValue <= 65 && !macdBearish) {
    tradeAction = '可分批進場'
    pattern = '接近支撐區'
    suggestion = '目前價格接近支撐區，RSI 未過熱，且 MACD 未明顯轉弱，可考慮分批進場。'
  }

  if (trendBullish && macdBullish && !nearResistance) {
    tradeAction = '偏多可觀察進場'
    pattern = '均線多頭排列'
    suggestion = '股價站上短中期均線，MACD 偏多，若回測不破支撐，可考慮順勢分批進場。'
  }

  if (nearResistance && rsiValue >= 60) {
    tradeAction = '不建議追高'
    pattern = '接近壓力區'
    suggestion = '目前價格接近壓力區，且 RSI 偏高，追價風險較高，建議等拉回或突破確認。'
  }

  if (trendBearish || macdBearish) {
    tradeAction = '暫不進場'
    pattern = '短線偏弱'
    suggestion = '均線或 MACD 顯示偏弱，短線風險較高，建議等待重新站回均線或止跌訊號。'
  }

  if (rsiValue >= 70) {
    tradeAction = '不建議追高'
    pattern = 'RSI 過熱'
    suggestion = 'RSI 已進入過熱區，短線拉回風險增加，建議等待冷卻後再評估。'
  }

  if (rsiValue <= 30 && !macdBearish) {
    tradeAction = '超跌反彈觀察'
    pattern = 'RSI 超跌'
    suggestion = 'RSI 偏低，可能有反彈機會，但仍需等待止跌型態或量能確認。'
  }

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
    status: tradeAction,
    pattern,
    rsi: rsiValue ? `${rsiValue}` : '計算中',
    macd:
      macd.dif !== null
        ? `${macd.text}｜DIF ${macd.dif} / DEA ${macd.dea} / 柱 ${macd.histogram}`
        : macd.text,
    suggestion,
    ma5,
    ma20,
    change,
    changePercent,
    tradeAction,
    entryZone: `${entryLow} ~ ${entryHigh}`,
    stopLoss: stopLoss.toString(),
    takeProfit1: takeProfit1.toString(),
    takeProfit2: takeProfit2.toString(),
    tradeReason: suggestion,
  }
}