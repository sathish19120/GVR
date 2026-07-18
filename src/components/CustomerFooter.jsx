// src/components/CustomerFooter.jsx
// Matches the CustomerShop redesign design tokens

const C = {
  p900:'#0D2B05', p800:'#1A4A0A', p700:'#27500A', p600:'#3B6D11',
  p300:'#85B84A', p100:'#D4EDB5', p50:'#EAF3DE',
  a500:'#E8931A', a400:'#F5A623',
  n200:'#E1E8ED', n300:'#B0BEC5', n500:'#6B7A8D',
  white:'#FFFFFF',
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .gvr-footer {
    background: linear-gradient(160deg, ${C.p800} 0%, ${C.p900} 100%);
    font-family: 'Inter', -apple-system, sans-serif;
    margin-top: 0;
  }
  .gvr-footer-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 40px 20px 28px;
  }
  .gvr-footer-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 32px;
    margin-bottom: 32px;
  }
  .gvr-footer-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    text-decoration: none;
    padding: 4px 0;
    transition: color 0.15s;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
  }
  .gvr-footer-link:hover { color: rgba(255,255,255,0.95); }
  .gvr-footer-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: rgba(255,255,255,0.3);
    margin-bottom: 14px;
  }
  .gvr-contact-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    text-decoration: none;
    margin-bottom: 10px;
    transition: all 0.15s;
    cursor: pointer;
    font-family: inherit;
    border: none;
    width: 100%;
  }
  .gvr-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 20px;
  }
  .gvr-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  @media (max-width: 600px) {
    .gvr-footer-grid { grid-template-columns: 1fr; gap: 24px; }
    .gvr-bottom { flex-direction: column; align-items: flex-start; }
  }
`

export default function CustomerFooter() {
  const lang = localStorage.getItem('gvr_lang') || 'en'
  const isTE = lang === 'te'

  const links = isTE
    ? [
        { label: 'షాప్',           href: '#shop' },
        { label: 'నా ఆర్డర్లు',     href: '#orders' },
        { label: 'సభ్యత్వాలు',      href: '#subscriptions' },
        { label: 'రెఫర్ & సంపాదించండి', href: '#referral' },
      ]
    : [
        { label: 'Shop',          href: '#shop' },
        { label: 'My orders',     href: '#orders' },
        { label: 'Subscribe',     href: '#subscriptions' },
        { label: 'Refer & Earn',  href: '#referral' },
      ]

  return (
    <>
      <style>{css}</style>
      <footer className="gvr-footer">
        <div className="gvr-footer-inner">
          <div className="gvr-footer-grid">

            {/* Brand column */}
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0 }}>🌾</div>
                <div>
                  <p style={{ margin:0,fontWeight:800,fontSize:15,color:C.white }}>Green Village Rice</p>
                  <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.4)' }}>గ్రీన్ విలేజ్ రైస్</p>
                </div>
              </div>
              <p style={{ margin:'0 0 16px',fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.65 }}>
                {isTE
                  ? 'తాజా సోనా మసూరి బియ్యం నేరుగా తెలంగాణ పొలాల నుండి మీ వంటగదికి.'
                  : 'Farm-fresh Sona Masoori rice from Telangana farms — direct to your kitchen.'}
              </p>

              {/* FSSAI badge */}
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.07)',borderRadius:10,padding:'8px 12px',border:'1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize:14 }}>✅</span>
                <span style={{ fontSize:10,color:'rgba(255,255,255,0.55)',fontWeight:700,letterSpacing:'0.3px' }}>FSSAI Lic. 10020042009874</span>
              </div>

              {/* Star rating */}
              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:14 }}>
                <div style={{ display:'flex',gap:2 }}>
                  {'★★★★★'.split('').map((s,i)=>(
                    <span key={i} style={{ color:C.a400,fontSize:14 }}>{s}</span>
                  ))}
                </div>
                <span style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>4.8 · 2,000+ happy customers</span>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="gvr-footer-label">{isTE?'లింక్‌లు':'Quick links'}</p>
              {links.map(link => (
                <a key={link.label} href={link.href} className="gvr-footer-link">
                  <span style={{ opacity:0.35,fontSize:12 }}>›</span> {link.label}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <p className="gvr-footer-label">{isTE?'సంప్రదించండి':'Contact us'}</p>

              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="gvr-contact-btn"
                style={{ background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)' }}>
                <span style={{ fontSize:20 }}>💬</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0,fontSize:12,fontWeight:700,color:'#4ADE80' }}>{isTE?'వాట్సాప్ చేయండి':'WhatsApp us'}</p>
                  <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.4)' }}>+91 99999 99999</p>
                </div>
              </a>

              <a href="tel:+919999999999" className="gvr-contact-btn"
                style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize:20 }}>📞</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.white }}>{isTE?'కాల్ చేయండి':'Call us'}</p>
                  <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.4)' }}>Mon–Sat, 8 AM – 8 PM</p>
                </div>
              </a>

              <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:12 }}>
                <span style={{ fontSize:16,marginTop:1 }}>📍</span>
                <div>
                  <p style={{ margin:'0 0 1px',fontSize:12,fontWeight:700,color:C.white }}>Hyderabad, Telangana</p>
                  <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.4)' }}>Delivering across Hyderabad</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="gvr-divider" />

          <div className="gvr-bottom">
            <div style={{ display:'flex',flexWrap:'wrap',alignItems:'center',gap:12 }}>
              <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.3)' }}>
                © 2014–2026 Green Village Rice. All rights reserved.
              </p>
              <span style={{ color:'rgba(255,255,255,0.15)',fontSize:11 }}>·</span>
              <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.3)' }}>Made with ❤️ in Hyderabad</p>
            </div>
            <div style={{ display:'flex',gap:16 }}>
              {['Privacy policy','Terms of use'].map(label=>(
                <a key={label} href="#" className="gvr-footer-link" style={{ fontSize:11 }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
