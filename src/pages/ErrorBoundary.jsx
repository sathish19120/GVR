import { Component } from 'react'

const G = {
  green:'#3B6D11', greenLight:'#EAF3DE', greenDark:'#27500A',
  red:'#DC2626', redLight:'#FEE2E2',
  border:'#E5E7EB', text:'#111827', muted:'#6B7280', white:'#fff'
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('GVR App Error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F4F6F3', padding:20, fontFamily:"'Inter',sans-serif" }}>
        <div style={{ background:G.white, borderRadius:20, padding:'40px 36px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width:64, height:64, borderRadius:16, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px' }}>🌾</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:G.text, margin:'0 0 10px' }}>Something went wrong</h2>
          <p style={{ fontSize:14, color:G.muted, lineHeight:1.7, margin:'0 0 24px' }}>
            The page ran into an unexpected error. Your orders and data are safe. Please refresh and try again.
          </p>
          {this.state.error && (
            <div style={{ background:'#F9FAF7', borderRadius:10, padding:'10px 14px', marginBottom:20, textAlign:'left' }}>
              <p style={{ margin:0, fontSize:11, color:G.muted, fontFamily:'monospace', wordBreak:'break-all' }}>
                {this.state.error.message}
              </p>
            </div>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={() => window.location.reload()}
              style={{ padding:'11px 24px', background:G.green, color:G.white, border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              🔄 Refresh Page
            </button>
            <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
              style={{ padding:'11px 20px', background:G.greenLight, color:G.greenDark, border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              🏠 Go to Login
            </button>
          </div>
          <p style={{ margin:'20px 0 0', fontSize:11, color:G.muted }}>© 2014–2026 Green Village Rice</p>
        </div>
      </div>
    )
  }
}
