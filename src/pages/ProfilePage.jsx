import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const inp = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:14,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box', transition:'border-color 0.2s',
}

export default function ProfilePage({ onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [fullName, setFullName]   = useState(user?.full_name || '')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [area, setArea]           = useState(user?.area || '')
  const [avatar, setAvatar]       = useState(user?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [err, setErr]             = useState('')
  const [oldPass, setOldPass]     = useState('')
  const [newPass, setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [passMsg, setPassMsg]     = useState('')
  const [passErr, setPassErr]     = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setErr('Image must be under 2MB'); return }

    setUploading(true); setErr('')
    try {
      // Convert to base64 for storage in profile
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result
        setAvatar(base64)
        // Save to profiles table
        await supabase.from('profiles').update({ avatar_url: base64 }).eq('id', user.id)
        // Update localStorage
        const updated = { ...user, avatar_url: base64 }
        localStorage.setItem('gvr_user', JSON.stringify(updated))
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch(e) { setErr('Failed to upload image'); setUploading(false) }
  }

  async function saveProfile() {
    setSaving(true); setMsg(''); setErr('')
    try {
      const { error } = await supabase.from('profiles')
        .update({ full_name: fullName, phone, area })
        .eq('id', user.id)
      if (error) throw error
      const updated = { ...user, full_name: fullName, phone, area }
      localStorage.setItem('gvr_user', JSON.stringify(updated))
      setMsg('Profile updated successfully!')
      setTimeout(() => setMsg(''), 3000)
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function changePassword() {
    setPassErr(''); setPassMsg('')
    if (newPass.length < 6) { setPassErr('New password must be at least 6 characters'); return }
    if (newPass !== confirmPass) { setPassErr('Passwords do not match'); return }
    setSavingPass(true)
    try {
      // Verify old password
      const encoder = new TextEncoder()
      const data = encoder.encode(oldPass + 'gvr_salt_2026')
      const hash = await crypto.subtle.digest('SHA-256', data)
      const oldHashed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')

      const { data: check } = await supabase.from('profiles')
        .select('id').eq('id', user.id).eq('password_hash', oldHashed).single()

      if (!check) { setPassErr('Current password is incorrect'); setSavingPass(false); return }

      const data2 = encoder.encode(newPass + 'gvr_salt_2026')
      const hash2 = await crypto.subtle.digest('SHA-256', data2)
      const newHashed = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2,'0')).join('')

      await supabase.from('profiles').update({ password_hash: newHashed }).eq('id', user.id)
      setPassMsg('Password changed successfully!')
      setOldPass(''); setNewPass(''); setConfirmPass('')
      setTimeout(() => setPassMsg(''), 3000)
    } catch(e) { setPassErr(e.message) }
    finally { setSavingPass(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg, ${G.green}, ${G.greenDark})`, padding:'24px 24px 60px', position:'relative', borderRadius:'20px 20px 0 0' }}>
          <button type="button" onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:G.white, fontSize:18 }}>✕</button>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:G.white }}>My Profile</h2>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(255,255,255,0.6)' }}>@{user?.username}</p>
        </div>

        {/* Avatar */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:-44, marginBottom:16, position:'relative' }}>
          <div style={{ position:'relative' }}>
            <div style={{
              width:88, height:88, borderRadius:'50%',
              background: avatar ? 'transparent' : G.green2,
              border:`4px solid ${G.white}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, fontWeight:700, color:G.white,
              overflow:'hidden', boxShadow:'0 4px 14px rgba(0,0,0,0.15)',
              cursor:'pointer',
            }} onClick={() => fileRef.current?.click()}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : initials
              }
            </div>
            {/* Camera icon overlay */}
            <button type="button" onClick={() => fileRef.current?.click()} style={{
              position:'absolute', bottom:0, right:0,
              width:28, height:28, borderRadius:'50%',
              background:G.green, border:`2px solid ${G.white}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:13,
            }}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display:'none' }} />
          </div>
        </div>

        {uploading && <p style={{ textAlign:'center', fontSize:12, color:G.muted, margin:'-8px 0 8px' }}>Uploading...</p>}

        <div style={{ padding:'0 24px 24px' }}>

          {/* Read-only notice for branch_executive */}
          {user?.role === 'branch_executive' && (
            <div style={{ background:'#FFFBEB', border:`1px solid #FCD34D`, borderRadius:12, padding:'10px 14px', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:16 }}>🔒</span>
              <p style={{ margin:0, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
                Profile details are managed by your administrator. You can only update your profile photo.
              </p>
            </div>
          )}

          {/* Profile info */}
          <div style={{ background:'#F9FAF7', borderRadius:14, padding:16, marginBottom:16 }}>
            <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700, color:G.text }}>
              Personal Information
              {user?.role === 'branch_executive' && <span style={{ fontSize:10, color:G.muted, fontWeight:400, marginLeft:8 }}>· Read Only</span>}
            </p>

            {err && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.red, fontSize:12 }}>{err}</div>}
            {msg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.greenDark, fontSize:12 }}>✓ {msg}</div>}

            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Full Name</label>
                <input type="text" value={fullName}
                  onChange={e => user?.role !== 'branch_executive' && setFullName(e.target.value)}
                  readOnly={user?.role === 'branch_executive'}
                  placeholder="Your full name"
                  style={{ ...inp, background: user?.role === 'branch_executive' ? '#F3F4F6' : '#FAFAFA', cursor: user?.role === 'branch_executive' ? 'not-allowed' : 'text', color: user?.role === 'branch_executive' ? G.muted : G.text }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Username</label>
                <input type="text" value={user?.username || ''} disabled style={{ ...inp, background:'#F3F4F6', color:G.muted, cursor:'not-allowed' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Phone</label>
                  <input type="tel" value={phone}
                    onChange={e => user?.role !== 'branch_executive' && setPhone(e.target.value)}
                    readOnly={user?.role === 'branch_executive'}
                    placeholder="Mobile number"
                    style={{ ...inp, background: user?.role === 'branch_executive' ? '#F3F4F6' : '#FAFAFA', cursor: user?.role === 'branch_executive' ? 'not-allowed' : 'text', color: user?.role === 'branch_executive' ? G.muted : G.text }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Area / Branch</label>
                  <input type="text" value={user?.role === 'branch_executive' ? (user?.branch || area) : area}
                    onChange={e => user?.role !== 'branch_executive' && setArea(e.target.value)}
                    readOnly={user?.role === 'branch_executive'}
                    placeholder="Your area"
                    style={{ ...inp, background: user?.role === 'branch_executive' ? '#F3F4F6' : '#FAFAFA', cursor: user?.role === 'branch_executive' ? 'not-allowed' : 'text', color: user?.role === 'branch_executive' ? G.muted : G.text }}
                  />
                </div>
              </div>
            </div>

            {/* Save button — hidden for branch_executive */}
            {user?.role !== 'branch_executive' && (
              <button type="button" onClick={saveProfile} disabled={saving} style={{ width:'100%', marginTop:14, padding:11, background:saving?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>

          {/* Change password — hidden for branch_executive */}
          {user?.role !== 'branch_executive' && (
          <div style={{ background:'#F9FAF7', borderRadius:14, padding:16, marginBottom:16 }}>
            <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700, color:G.text }}>Change Password</p>

            {passErr && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.red, fontSize:12 }}>{passErr}</div>}
            {passMsg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.greenDark, fontSize:12 }}>✓ {passMsg}</div>}

            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Current Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Enter current password" style={{ ...inp, paddingRight:50 }}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12 }}>{showPass?'Hide':'Show'}</button>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>New Password</label>
                <input type={showPass?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={inp}
                  onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Confirm New Password</label>
                <input type={showPass?'text':'password'} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Re-enter new password"
                  style={{ ...inp, borderColor: confirmPass && newPass !== confirmPass ? G.red : G.border }}
                  onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=confirmPass&&newPass!==confirmPass?G.red:G.border} />
              </div>
            </div>
            <button type="button" onClick={changePassword} disabled={savingPass||!oldPass||!newPass||newPass!==confirmPass} style={{ width:'100%', marginTop:14, padding:11, background:savingPass||!oldPass||!newPass||newPass!==confirmPass?'#9CA3AF':G.amber, color:G.white, border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {savingPass ? 'Changing...' : 'Change Password'}
            </button>
          </div>
          )}

          {/* Account info */}
          <div style={{ background:'#F9FAF7', borderRadius:14, padding:14, marginBottom:16 }}>
            <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:G.text }}>Account Info</p>
            {[
              ['Role', user?.role?.replace('_',' ')],
              ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${G.border}`, fontSize:13 }}>
                <span style={{ color:G.muted }}>{label}</span>
                <span style={{ fontWeight:600, color:G.text, textTransform:'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <button type="button" onClick={async()=>{ await signOut(); navigate('/login') }} style={{ width:'100%', padding:12, background:G.redLight, color:G.red, border:`1px solid #FECACA`, borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            ↩ Logout
          </button>
        </div>
      </div>
    </div>
  )
}
