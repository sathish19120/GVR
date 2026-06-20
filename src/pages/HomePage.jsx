import { useState, useEffect } from 'react'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const VIDEOS = [
  { id:1, title:'Paddy Fields — Nalgonda, Telangana', desc:'Fresh Sona Masoori paddy grown in fertile Nalgonda soil. Traditional farming methods for best quality grain.', url:'https://www.youtube.com/results?search_query=sona+masoori+paddy+farm+telangana+nalgonda', thumb:'🌾', tag:'Farm Origin', color:G.green, bg:G.greenLight },
  { id:2, title:'Rice Milling Process — Fresh Small Batch', desc:'How raw paddy is cleaned, hulled, milled and polished in small batches to preserve freshness and nutrition.', url:'https://www.youtube.com/results?search_query=rice+milling+process+small+batch+india', thumb:'⚙️', tag:'Fresh Milling', color:G.blue, bg:G.blueLight },
  { id:3, title:'Quality Testing — Every Batch Inspected', desc:'Moisture testing, broken rice inspection and color sorting. Every batch passes strict quality checks before packing.', url:'https://www.youtube.com/results?search_query=rice+quality+testing+moisture+broken+rice', thumb:'🔬', tag:'Quality Control', color:'#7C3AED', bg:'#EDE9FE' },
  { id:4, title:'GVR Packing & QR Labelling Process', desc:'Each bag is packed fresh, sealed and labelled with batch number, packing date and QR code for full traceability.', url:'https://www.youtube.com/results?search_query=rice+packing+labelling+qr+code+process', thumb:'📦', tag:'Packing', color:G.amber, bg:G.amberLight },
]

const STEPS = [
  { icon:'🌱', step:1, title:'Seed to Paddy',    desc:'Farmers in Nalgonda, Khammam & Warangal grow Sona Masoori paddy using traditional methods', color:G.green },
  { icon:'🚜', step:2, title:'Harvest',           desc:'Paddy harvested at peak ripeness — October to January for best grain quality and aroma', color:G.green2 },
  { icon:'⚙️', step:3, title:'Fresh Milling',     desc:'Small batch milling within days of harvest — no long warehouse storage', color:G.blue },
  { icon:'🔬', step:4, title:'Quality Check',     desc:'Moisture below 14%, broken rice below 5%, color sorted. Only best quality passes', color:'#7C3AED' },
  { icon:'📦', step:5, title:'GVR Packing',       desc:'Packed in GVR branded bags with QR code, batch number and packing date on every bag', color:G.amber },
  { icon:'🚚', step:6, title:'Farm to Kitchen',   desc:'Delivered fresh to customers across Hyderabad — days from farm, not months', color:G.green },
]

const FACTS = [
  { value:'2–3', unit:'days', label:'Farm to pack time', icon:'⚡' },
  { value:'14%', unit:'max',  label:'Moisture level',    icon:'💧' },
  { value:'5%',  unit:'max',  label:'Broken rice limit', icon:'🌾' },
  { value:'365', unit:'days', label:'Best before date',  icon:'📅' },
  { value:'100%', unit:'',    label:'Sona Masoori pure', icon:'✅' },
  { value:'0',    unit:'',    label:'Artificial additives', icon:'🚫' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [slide, setSlide] = useState(0)

  const SLIDES = [
    { url:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=80', caption:'Sona Masoori paddy fields — Nalgonda, Telangana' },
    { url:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1400&q=80', caption:'Fresh harvest — farm to mill in hours' },
    { url:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1400&q=80', caption:'Quality rice — small batch milled fresh' },
    { url:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=1400&q=80', caption:'Farm direct — no middlemen, no markup' },
    { url:'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80', caption:'Nalgonda farmers — our trusted partners' },
  ]

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s+1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])


  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>

      {/* Hero banner with slideshow */}
      <div style={{ borderRadius:20, marginBottom:24, position:'relative', overflow:'hidden', height:320 }}>
        {/* Slides */}
        {SLIDES.map((s,i) => (
          <div key={i} style={{
            position:'absolute', inset:0,
            backgroundImage:`url(${s.url})`,
            backgroundSize:'cover', backgroundPosition:'center',
            opacity: i === slide ? 1 : 0,
            transition:'opacity 1.5s ease',
            zIndex: i === slide ? 1 : 0
          }} />
        ))}
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(27,50,8,0.82) 0%,rgba(0,0,0,0.45) 100%)', zIndex:2 }} />
        {/* Slide dots */}
        <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, zIndex:4 }}>
          {SLIDES.map((_,i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ width: i===slide?22:8, height:8, borderRadius:4, background: i===slide?'#C0DD97':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.3s' }} />
          ))}
        </div>
        {/* Caption */}
        <div style={{ position:'absolute', bottom:32, left:24, zIndex:4 }}>
          <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.65)', letterSpacing:'0.5px' }}>{SLIDES[slide].caption}</p>
        </div>
        {/* Left / Right arrows */}
        <button onClick={()=>setSlide(s=>(s-1+SLIDES.length)%SLIDES.length)} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',zIndex:4,background:'rgba(0,0,0,0.35)',border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
        <button onClick={()=>setSlide(s=>(s+1)%SLIDES.length)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',zIndex:4,background:'rgba(0,0,0,0.35)',border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
        <div style={{ position:'relative', zIndex:3, padding:'36px 32px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:16 }}>
            <div style={{ width:56,height:56,borderRadius:14,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30 }}>🌾</div>
            <div>
              <h1 style={{ margin:0,fontSize:28,fontWeight:800,color:G.white }}>Green Village Rice</h1>
              <p style={{ margin:0,fontSize:13,color:'rgba(255,255,255,0.65)' }}>గ్రీన్ విలేజ్ రైస్ · Hyderabad, Telangana · Est. 2026</p>
            </div>
          </div>
          <p style={{ margin:'0 0 20px',fontSize:14,color:'rgba(255,255,255,0.85)',lineHeight:1.8,maxWidth:580 }}>
            Farm-fresh Sona Masoori sourced directly from Nalgonda farmers, milled in small batches and delivered to your kitchen. Every bag has a QR code — scan and know exactly where your rice came from.
          </p>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            {['Farm Direct','Small Batch Milled','QR Traceable','FSSAI Certified','No Middleman','Fresh Every Week'].map(tag=>(
              <span key={tag} style={{ padding:'4px 12px',borderRadius:20,background:'rgba(255,255,255,0.15)',color:G.white,fontSize:11,fontWeight:600,border:'1px solid rgba(255,255,255,0.2)' }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:22 }}>
          {[{label:'Branches',value:'6',icon:'🏪'},{label:'Products',value:'4',icon:'🌾'},{label:'Cities',value:'6',icon:'📍'},{label:'Founded',value:'2026',icon:'📅'}].map(s=>(
            <div key={s.label} style={{ background:'rgba(255,255,255,0.1)',borderRadius:12,padding:'12px',textAlign:'center',border:'1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ margin:'0 0 4px',fontSize:16 }}>{s.icon}</p>
              <p style={{ margin:'0 0 2px',fontSize:20,fontWeight:800,color:G.white }}>{s.value}</p>
              <p style={{ margin:0,fontSize:10,color:'rgba(255,255,255,0.6)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome */}
      <div style={{ background:G.white,borderRadius:14,padding:'16px 20px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:14 }}>
        <div style={{ width:44,height:44,borderRadius:'50%',background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:G.greenDark,flexShrink:0,overflow:'hidden' }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} /> : (user?.full_name?.[0]||user?.username?.[0]?.toUpperCase()||'A')}
        </div>
        <div>
          <p style={{ margin:'0 0 2px',fontSize:15,fontWeight:700,color:G.text }}>Welcome, {user?.full_name?.split(' ')[0]||user?.username}! 👋</p>
          <p style={{ margin:0,fontSize:12,color:G.muted }}>Manage orders, stock, batches, suppliers and branches from the left sidebar.</p>
        </div>
      </div>

      {/* Our Story */}
      <div style={{ background:G.white,borderRadius:16,padding:'20px 24px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin:'0 0 12px',fontSize:16,fontWeight:700,color:G.text }}>🌱 Our Story</h2>
        <p style={{ margin:'0 0 10px',fontSize:13,color:G.muted,lineHeight:1.8 }}>
          Green Village Rice was started with one simple belief — every family deserves to know where their rice comes from. We work directly with farmers in Nalgonda, Khammam and Warangal, mill fresh in small batches and deliver to Hyderabad homes within days of packing.
        </p>
        <p style={{ margin:0,fontSize:13,color:G.muted,lineHeight:1.8 }}>
          Unlike brands that sit in warehouses for months, every GVR bag is packed fresh with a QR code. Scan it and see the exact farm, mill and packing date. No secrets. Just fresh rice at a fair price.
        </p>
      </div>

      {/* Freshness Standards */}
      <h2 style={{ margin:'0 0 12px',fontSize:16,fontWeight:700,color:G.text }}>📊 Our Freshness Standards</h2>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20 }}>
        {FACTS.map((f,i)=>(
          <div key={i} style={{ background:G.white,borderRadius:14,padding:'14px 12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',textAlign:'center',borderTop:`3px solid ${G.green}` }}>
            <p style={{ margin:'0 0 5px',fontSize:22 }}>{f.icon}</p>
            <p style={{ margin:'0 0 2px',fontSize:20,fontWeight:800,color:G.green }}>{f.value}<span style={{ fontSize:11,color:G.muted,fontWeight:400 }}> {f.unit}</span></p>
            <p style={{ margin:0,fontSize:10,color:G.muted,lineHeight:1.4 }}>{f.label}</p>
          </div>
        ))}
      </div>

      {/* Farm to Kitchen Journey */}
      <div style={{ background:G.white,borderRadius:16,padding:'20px 24px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin:'0 0 16px',fontSize:16,fontWeight:700,color:G.text }}>🚀 Farm to Kitchen — 6 Steps</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10 }}>
          {STEPS.map(s=>(
            <div key={s.step} style={{ background:'#F9FAF7',borderRadius:12,padding:'14px 12px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:s.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>{s.icon}</div>
                <span style={{ width:20,height:20,borderRadius:'50%',background:s.color,color:G.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700 }}>{s.step}</span>
              </div>
              <p style={{ margin:'0 0 4px',fontWeight:700,fontSize:12,color:G.text }}>{s.title}</p>
              <p style={{ margin:0,fontSize:11,color:G.muted,lineHeight:1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Videos */}
      <h2 style={{ margin:'0 0 6px',fontSize:16,fontWeight:700,color:G.text }}>🎥 Farm & Freshness Videos</h2>
      <p style={{ margin:'0 0 14px',fontSize:13,color:G.muted }}>Watch how GVR rice goes from farm to kitchen. Click any card to watch on YouTube.</p>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:20 }}>
        {VIDEOS.map(v=>(
          <div key={v.id} style={{ background:G.white,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${G.border}` }}>
            <a href={v.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none',display:'block' }}>
              <div style={{ background:`linear-gradient(135deg,${v.color}22,${v.color}55)`,height:130,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer' }}>
                <span style={{ fontSize:44 }}>{v.thumb}</span>
                <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ width:48,height:48,borderRadius:'50%',background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <div style={{ width:0,height:0,borderTop:'9px solid transparent',borderBottom:'9px solid transparent',borderLeft:'16px solid white',marginLeft:3 }} />
                  </div>
                </div>
                <span style={{ position:'absolute',top:8,right:8,background:v.color,color:G.white,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20 }}>{v.tag}</span>
              </div>
            </a>
            <div style={{ padding:'14px 16px' }}>
              <p style={{ margin:'0 0 5px',fontWeight:700,fontSize:13,color:G.text }}>{v.title}</p>
              <p style={{ margin:'0 0 10px',fontSize:11,color:G.muted,lineHeight:1.5 }}>{v.desc}</p>
              <a href={v.url} target="_blank" rel="noreferrer" style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',background:v.bg,color:v.color,borderRadius:8,fontSize:11,fontWeight:700,textDecoration:'none' }}>
                ▶ Watch on YouTube
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add own videos tip */}
      <div style={{ background:G.blueLight,borderRadius:14,padding:'16px 20px',marginBottom:20,border:`1px solid #BFDBFE` }}>
        <p style={{ margin:'0 0 6px',fontSize:14,fontWeight:700,color:G.blue }}>📹 Add Your Own Farm Videos</p>
        <p style={{ margin:'0 0 10px',fontSize:12,color:G.blue,lineHeight:1.7 }}>When you visit your supplier mills — record short videos on your phone. Upload to YouTube as "Unlisted" and share the link to embed directly here. This builds huge trust when customers see real GVR farm footage.</p>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          {['🌾 Paddy field walkthrough','⚙️ Mill tour video','📦 Packing process','🚚 Delivery day footage'].map(tip=>(
            <span key={tip} style={{ padding:'5px 12px',borderRadius:20,background:'rgba(255,255,255,0.7)',fontSize:11,color:G.blue,fontWeight:500 }}>{tip}</span>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ background:G.white,borderRadius:16,padding:'20px 24px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin:'0 0 14px',fontSize:16,fontWeight:700,color:G.text }}>🛍 Our Products</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10 }}>
          {[
            { name:'Sona Masoori 1kg', price:'₹68',  sku:'GVR-SM-1KG',  desc:'Daily cooking rice. Soft, aromatic, perfect for all dishes.',  badge:'Best Seller' },
            { name:'Sona Masoori 5kg', price:'₹320', sku:'GVR-SM-5KG',  desc:'Family pack. Same freshness, better value per kg.',            badge:'Value Pack'  },
            { name:'Basmati 1kg',      price:'₹95',  sku:'GVR-BAS-1KG', desc:'Long grain, fragrant. Perfect for biryani and pulao.',         badge:'Premium'    },
            { name:'Basmati 5kg',      price:'₹440', sku:'GVR-BAS-5KG', desc:'Bulk basmati for restaurants and large families.',             badge:'Bulk'       },
          ].map(p=>(
            <div key={p.sku} style={{ background:'#F9FAF7',borderRadius:12,padding:'14px',borderLeft:`3px solid ${G.green}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:26 }}>🌾</span>
                <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:G.greenLight,color:G.greenDark }}>{p.badge}</span>
              </div>
              <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:13 }}>{p.name}</p>
              <p style={{ margin:'0 0 6px',fontSize:10,color:G.muted }}>{p.sku}</p>
              <p style={{ margin:'0 0 8px',fontSize:11,color:G.muted,lineHeight:1.5 }}>{p.desc}</p>
              <p style={{ margin:0,fontSize:18,fontWeight:800,color:G.green }}>{p.price}<span style={{ fontSize:10,color:G.muted,fontWeight:400 }}>/bag</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20 }}>
        {[
          { icon:'🎯', title:'Our Mission', text:'Make fresh, traceable rice accessible to every household in Hyderabad at a fair price — with complete transparency from farm to kitchen.', color:G.green },
          { icon:'👁️', title:'Our Vision',  text:"Become Telangana's most trusted farm-to-home rice brand and expand across all major cities in Andhra Pradesh by 2028.", color:G.blue },
        ].map(item=>(
          <div key={item.title} style={{ background:G.white,borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderTop:`3px solid ${item.color}` }}>
            <p style={{ margin:'0 0 6px',fontSize:22 }}>{item.icon}</p>
            <p style={{ margin:'0 0 8px',fontWeight:700,fontSize:14,color:item.color }}>{item.title}</p>
            <p style={{ margin:0,fontSize:12,color:G.muted,lineHeight:1.7 }}>{item.text}</p>
          </div>
        ))}
      </div>

      {/* Contact footer */}
      <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,borderRadius:14,padding:'20px 22px',color:G.white }}>
        <h2 style={{ margin:'0 0 14px',fontSize:15,fontWeight:700,color:G.white }}>📞 Contact & Info</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10 }}>
          {[{icon:'📧',label:'Email',value:'admin@greenvillagerice.in'},{icon:'📍',label:'HQ',value:'Hyderabad, Telangana'},{icon:'🌐',label:'Website',value:'gvr-lemon.vercel.app'},{icon:'📅',label:'Est.',value:'2026 · FSSAI Licensed'}].map(c=>(
            <div key={c.label} style={{ background:'rgba(255,255,255,0.12)',borderRadius:10,padding:'10px 12px' }}>
              <p style={{ margin:'0 0 3px',fontSize:15 }}>{c.icon}</p>
              <p style={{ margin:'0 0 1px',fontSize:10,color:'rgba(255,255,255,0.6)' }}>{c.label}</p>
              <p style={{ margin:0,fontSize:11,fontWeight:600,color:G.white }}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
