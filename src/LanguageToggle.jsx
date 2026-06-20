// src/components/LanguageToggle.jsx
import { useState } from 'react'
import { setLang, useLang } from '../lib/i18n'

export default function LanguageToggle({ style }) {
  const lang    = useLang()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position:'relative', ...style }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:'rgba(255,255,255,0.12)',
          border:'1px solid rgba(255,255,255,0.25)',
          borderRadius:20, padding:'5px 12px',
          cursor:'pointer', color:'#fff', fontSize:12, fontWeight:600
        }}>
        <span style={{ fontSize:14 }}>{lang === 'te' ? '🇮🇳' : '🌐'}</span>
        {lang === 'te' ? 'తెలుగు' : 'English'}
        <span style={{ fontSize:10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'110%', right:0,
          background:'#fff', borderRadius:12,
          boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
          overflow:'hidden', minWidth:140, zIndex:999
        }}>
          {[
            { code:'en', label:'English',  flag:'🌐', sub:'English' },
            { code:'te', label:'తెలుగు',   flag:'🇮🇳', sub:'Telugu'  },
          ].map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }}
              style={{
                width:'100%', padding:'10px 16px',
                display:'flex', alignItems:'center', gap:10,
                background: lang === l.code ? '#EAF3DE' : '#fff',
                border:'none', cursor:'pointer',
                borderBottom:'1px solid #F3F4F6'
              }}>
              <span style={{ fontSize:18 }}>{l.flag}</span>
              <div style={{ textAlign:'left' }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#111827' }}>{l.label}</p>
                <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{l.sub}</p>
              </div>
              {lang === l.code && <span style={{ marginLeft:'auto', color:'#3B6D11', fontWeight:700 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
