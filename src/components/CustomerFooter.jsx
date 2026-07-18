// src/components/CustomerFooter.jsx
//
// Sticky bottom footer shown on all customer pages (/shop).
// Place this in src/components/CustomerFooter.jsx
// and add it to App.jsx via the CustomerLayout wrapper (see App.jsx fix).

const G = {
  green:     '#3B6D11',
  greenDark: '#27500A',
  greenLight:'#EAF3DE',
  muted:     '#6B7280',
  border:    '#E5E7EB',
  white:     '#fff',
  text:      '#111827',
}

const STRINGS = {
  en: {
    tagline:   'Farm-fresh Sona Masoori rice, delivered to your door',
    products:  'Products',
    support:   'Support',
    whatsapp:  'WhatsApp Us',
    call:      'Call Us',
    rights:    '© 2014–2026 Green Village Rice. All Rights Reserved.',
    madein:    'Made with ❤️ in Hyderabad',
    privacy:   'Privacy Policy',
    terms:     'Terms of Use',
    fssai:     'FSSAI Lic. No. 10020042009874',
    links: [
      { label: 'Shop',          href: '#shop' },
      { label: 'My Orders',     href: '#orders' },
      { label: 'Subscriptions', href: '#subscriptions' },
      { label: 'Refer & Earn',  href: '#referral' },
    ],
  },
  te: {
    tagline:   'తాజా సోనా మసూరి బియ్యం, మీ తలుపు వద్దకు డెలివరీ',
    products:  'ఉత్పత్తులు',
    support:   'సహాయం',
    whatsapp:  'వాట్సాప్ చేయండి',
    call:      'కాల్ చేయండి',
    rights:    '© 2014–2026 గ్రీన్ విలేజ్ రైస్. అన్ని హక్కులు కేటాయించబడినవి.',
    madein:    'హైదరాబాద్‌లో ❤️ తో తయారు చేయబడింది',
    privacy:   'గోప్యతా విధానం',
    terms:     'వినియోగ నిబంధనలు',
    fssai:     'FSSAI లైసెన్స్ నం. 10020042009874',
    links: [
      { label: 'షాప్',            href: '#shop' },
      { label: 'నా ఆర్డర్లు',     href: '#orders' },
      { label: 'సభ్యత్వాలు',      href: '#subscriptions' },
      { label: 'రెఫర్ & సంపాదించండి', href: '#referral' },
    ],
  },
}

export default function CustomerFooter() {
  const lang = localStorage.getItem('gvr_lang') || 'en'
  const S    = STRINGS[lang] || STRINGS.en

  return (
    <footer style={{
      background:   `linear-gradient(160deg, ${G.greenDark} 0%, #1a3a08 100%)`,
      color:        G.white,
      marginTop:    48,
      fontFamily:   "'Inter', sans-serif",
    }}>

      {/* Main footer content */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'40px 24px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:32, marginBottom:32 }}>

          {/* Brand column */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🌾</div>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:15, color:G.white }}>Green Village Rice</p>
                <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.55)' }}>గ్రీన్ విలేజ్ రైస్</p>
              </div>
            </div>
            <p style={{ margin:'0 0 16px', fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6 }}>{S.tagline}</p>

            {/* FSSAI badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 10px', border:'1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize:14 }}>✅</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>{S.fssai}</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p style={{ margin:'0 0 14px', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'rgba(255,255,255,0.45)' }}>{S.products}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {S.links.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  style={{ color:'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:6, transition:'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = G.white}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                >
                  <span style={{ fontSize:10, opacity:0.4 }}>›</span> {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact / Support */}
          <div>
            <p style={{ margin:'0 0 14px', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'rgba(255,255,255,0.45)' }}>{S.support}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:10, textDecoration:'none', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.15)'}
              >
                <span style={{ fontSize:18 }}>💬</span>
                <div>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#4ade80' }}>{S.whatsapp}</p>
                  <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.5)' }}>+91 99999 99999</p>
                </div>
              </a>

              {/* Call */}
              <a
                href="tel:+919999999999"
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, textDecoration:'none', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <span style={{ fontSize:18 }}>📞</span>
                <div>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:G.white }}>{S.call}</p>
                  <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.5)' }}>Mon–Sat, 8 AM – 8 PM</p>
                </div>
              </a>

              {/* Location */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                <span style={{ fontSize:16, marginTop:1 }}>📍</span>
                <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>
                  Hyderabad, Telangana<br />
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Delivering across Hyderabad</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:20, display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
            <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.4)' }}>{S.rights}</p>
            <span style={{ color:'rgba(255,255,255,0.15)', fontSize:11 }}>|</span>
            <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.4)' }}>{S.madein}</p>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            {[S.privacy, S.terms].map(label => (
              <a key={label} href="#" style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
