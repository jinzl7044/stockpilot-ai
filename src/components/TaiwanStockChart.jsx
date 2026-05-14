import { useEffect, useRef, useState } from 'react'
import * as LightweightCharts from 'lightweight-charts'
import { fetchTaiwanStockPrices } from '../lib/finmind'

export default function TaiwanStockChart({ stockId = '2330' }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [latest, setLatest] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      const chart = LightweightCharts.createChart(containerRef.current, {
        width: containerRef.current.clientWidth || 800,
        height: 420,
        layout: {
          background: { color: '#050607' },
          textColor: '#d4d4d8',
        },
        grid: {
          vertLines: { color: '#18181b' },
          horzLines: { color: '#18181b' },
        },
        rightPriceScale: {
          borderColor: '#27272a',
        },
        timeScale: {
          borderColor: '#27272a',
        },
      })

      let candleSeries

      if (typeof chart.addCandlestickSeries === 'function') {
        candleSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        })
      } else if (LightweightCharts.CandlestickSeries) {
        candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        })
      } else {
        throw new Error('目前 lightweight-charts 版本不支援 CandlestickSeries')
      }

      chartRef.current = chart
      seriesRef.current = candleSeries

      const handleResize = () => {
        if (!containerRef.current || !chartRef.current) return
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth || 800,
        })
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    } catch (err) {
      console.error('Chart init error:', err)
      setError(err.message || 'K 線圖初始化失敗')
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!seriesRef.current) return

      setLoading(true)
      setError('')

      try {
        const rows = await fetchTaiwanStockPrices(stockId, 180)

        const chartData = rows
          .filter(
            (item) =>
              Number.isFinite(item.open) &&
              Number.isFinite(item.high) &&
              Number.isFinite(item.low) &&
              Number.isFinite(item.close)
          )
          .map((item) => ({
            time: item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))

        if (chartData.length === 0) {
          throw new Error('查無可用 K 線資料')
        }

        seriesRef.current.setData(chartData)
        chartRef.current?.timeScale().fitContent()
        setLatest(rows[rows.length - 1])
      } catch (err) {
        console.error('FinMind load error:', err)
        setError(err.message || '資料載入失敗')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [stockId])

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-sm text-zinc-400">FinMind 台股日 K</p>
          <p className="text-lg font-bold">{stockId}</p>
        </div>

        {latest && (
          <div className="text-right text-sm">
            <p className="text-zinc-400">{latest.date}</p>
            <p className="font-semibold text-emerald-300">
              收盤 {latest.close}
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[420px] w-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-zinc-300">
            載入 FinMind 資料中...
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
