export default function TradingViewWidget({ symbol = 'TWSE:2377' }) {
  const encodedSymbol = encodeURIComponent(symbol)

  const src = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodedSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=131722&studies=[]&theme=dark&style=1&timezone=Asia%2FTaipei&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=zh_TW`

  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-black/30">
      <iframe
        title="TradingView Chart"
        src={src}
        className="h-full w-full"
        allowFullScreen
      />
    </div>
  )
}