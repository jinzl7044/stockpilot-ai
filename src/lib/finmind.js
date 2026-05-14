const FINMIND_BASE_URL = 'https://api.finmindtrade.com/api/v4/data'

function getStartDate(daysBack = 120) {
  const date = new Date()
  date.setDate(date.getDate() - daysBack)
  return date.toISOString().slice(0, 10)
}

export async function fetchTaiwanStockPrices(stockId, daysBack = 120) {
  const params = new URLSearchParams({
    dataset: 'TaiwanStockPrice',
    data_id: stockId,
    start_date: getStartDate(daysBack),
  })

  const response = await fetch(`${FINMIND_BASE_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`FinMind API error: ${response.status}`)
  }

  const json = await response.json()

  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('FinMind 回傳格式不正確')
  }

  return json.data.map((item) => ({
    date: item.date,
    open: Number(item.open),
    high: Number(item.max),
    low: Number(item.min),
    close: Number(item.close),
    volume: Number(item.Trading_Volume || 0),
  }))
}

export async function fetchTaiwanStockInfo() {
  const params = new URLSearchParams({
    dataset: 'TaiwanStockInfo',
  })

  const response = await fetch(`${FINMIND_BASE_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`FinMind StockInfo API error: ${response.status}`)
  }

  const json = await response.json()

  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('FinMind 股票名稱資料回傳格式不正確')
  }

  return json.data.map((item) => ({
    stockId: item.stock_id,
    stockName: item.stock_name,
    type: item.type,
    industryCategory: item.industry_category,
  }))
}