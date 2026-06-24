import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const inp = (readOnly) => ({
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:14,
  color: readOnly ? G.muted : G.text,
  outline:'none',
  background: readOnly ? '#F3F4F6' : '#FAFAFA',
  boxSizing:'border-box',
  cursor: readOnly ? 'not-allowed' : 'text',
})

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export default function ProfilePage({ onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const isReadOnly = user?.role === 'branch_executive' || user?.role === 'delivery'

  const [fullName, setFullName]       = useState(user?.full_name || '')
  const [phone, setPhone]             = useState(user?.phone || '')
  const [area, setArea]               = useState(user?.area || '')
  const [address, setAddress]         = useState(user?.address || '')
  const [avatar, setAvatar]           = useState(user?.avatar_url || null)
  const [uploading, setUploading]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')
  const [err, setErr]                 = useState('')
  const [oldPass, setOldPass]         = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [passMsg, setPassMsg]         = useState('')
  const [passErr, setPassErr]         = useState('')
  const [savingPass, setSavingPass]   = useState(false)

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

  // FIX #8: update localStorage AND trigger storage event so sidebar re-reads
  function updateLocalUser(updates) {
    const updated = { ...user, ...updates }
    try {
      localStorage.setItem('gvr_user', JSON.stringify(updated))
      // Standard storage event only fires in OTHER tabs — dispatch custom event
      // for the same tab. auth.js should listen for 'gvr_user_updated'.
      window.dispatchEvent(new CustomEvent('gvr_user_updated', { detail: updated }))
      // Also fire storage event for any listeners using that pattern
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gvr_user', newValue: JSON.stringify(updated)
      }))
    } catch(e) { console.error('updateLocalUser error:', e) }
  }

  // FIX #4: upload avatar to Supabase Storage instead of base64 in DB row
  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setErr('Image must be under 3MB'); return }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setErr('Only JPEG, PNG or WebP images allowed'); return
    }
    setUploading(true); setErr('')
    try {
      // Try Supabase Storage first (preferred — no row size limit)
      const ext      = file.name.split('.').pop().toLowerCase() || 'jpg'
      const filePath = `avatars/${user.id}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('gvr-avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      let avatarUrl = null

      if (!uploadErr) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gvr-avatars')
          .getPublicUrl(filePath)
        avatarUrl = urlData?.publicUrl
          ? `${urlData.publicUrl}?t=${Date.now()}` // cache-bust
          : null
      }

      if (!avatarUrl) {
        // Fallback: if storage bucket not set up, use compressed base64
        // Resize image to max 200x200 before base64 to keep row small
        avatarUrl = await resizeAndBase64(file, 200)
      }

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('username', user.username)
      if (dbErr) throw dbErr

      setAvatar(avatarUrl)
      updateLocalUser({ avatar_url: avatarUrl })
      setMsg('Profile photo updated!')
      setTimeout(() => setMsg(''), 3000)
    } catch(e) {
      setErr('Failed to save photo: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  // Resize image to maxSize x maxSize, return base64 — fallback when Storage unavailable
  function resizeAndBase64(file, maxSize) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio  = Math.min(maxSize/img.width, maxSize/img.height, 1)
        canvas.width  = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
      img.src = url
    })
  }

  async function saveProfile() {
    if (!fullName.trim()) { setErr('Name cannot be empty'); return }
    setSaving(true); setMsg(''); setErr('')
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(), phone: phone.trim(),
        area: area.trim(), address: address.trim()
      }).eq('username', user.username)
      if (error) throw error
      updateLocalUser({ full_name: fullName.trim(), phone: phone.trim(), area: area.trim(), address: address.trim() })
      setMsg('Profile updated successfully!')
      setTimeout(() => setMsg(''), 3000)
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function changePassword() {
    setPassErr(''); setPassMsg('')
    if (!oldPass) { setPassErr('Enter your current password'); return }
    if (newPass.length < 6) { setPassErr('New password must be at least 6 characters'); return }
    if (newPass !== confirmPass) { setPassErr('Passwords do not match'); return }
    setSavingPass(true)
    try {
      const oldHashed = await hashPassword(oldPass)
      const { data: check, error: checkErr } = await supabase
        .from('profiles').select('id')
        .eq('username', user.username).eq('password_hash', oldHashed).single()
      if (checkErr || !check) { setPassErr('Current password is incorrect'); setSavingPass(false); return }
      const newHashed = await hashPassword(newPass)
      const { error } = await supabase.from('profiles')
        .update({ password_hash: newHashed }).eq('username', user.username)
      if (error) throw error
      setPassMsg('Password changed successfully!')
      setOldPass(''); setNewPass(''); setConfirmPass('')
      setTimeout(() => setPassMsg(''), 3000)
    } catch(e) { setPassErr(e.message) }
    finally { setSavingPass(false) }
  }

  const Field = ({ label, children }) => (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Header gradient */}
        <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`, padding:'22px 22px 56px', position:'relative', borderRadius:'20px 20px 0 0' }}>
          <button type="button" onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:G.white, fontSize:16 }}>✕</button>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:G.white }}>My Profile</h2>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(255,255,255,0.6)' }}>@{user?.username}</p>
        </div>

        {/* Avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop:-40, marginBottom:8 }}>
          <div style={{ position:'relative' }}>
            <div onClick={() => !uploading && fileRef.current?.click()} style={{
              width:80, height:80, borderRadius:'50%',
              background: avatar ? 'transparent' : G.green2,
              border:`4px solid ${G.white}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, fontWeight:700, color:G.white,
              overflow:'hidden', boxShadow:'0 4px 14px rgba(0,0,0,0.18)',
              cursor:'pointer', position:'relative'
            }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : initials
              }
              {uploading && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:G.white }}>⏳</div>
              )}
            </div>
            <button type="button" onClick={() => !uploading && fileRef.current?.click()} style={{
              position:'absolute', bottom:0, right:0,
              width:26, height:26, borderRadius:'50%',
              background:uploading?'#9CA3AF':G.green, border:`2px solid ${G.white}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:uploading?'wait':'pointer', fontSize:12,
            }}>📷</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display:'none' }} />
          </div>
          {uploading && <p style={{ margin:'6px 0 0', fontSize:12, color:G.green }}>⏳ Uploading...</p>}
          {!uploading && <p style={{ margin:'6px 0 0', fontSize:11, color:G.muted }}>Tap photo to change · Max 3MB</p>}
        </div>

        <div style={{ padding:'0 20px 22px' }}>
          {isReadOnly && (
            <div style={{ background:'#FFFBEB', border:`1px solid #FCD34D`, borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>🔒</span>
              <p style={{ margin:0, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
                Your profile details are managed by the administrator. Only profile photo upload is allowed.
              </p>
            </div>
          )}

          {err && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.red, fontSize:12, display:'flex', justifyContent:'space-between' }}>
            <span>{err}</span>
            <button type="button" onClick={()=>setErr('')} style={{ background:'none',border:'none',cursor:'pointer',color:G.red,fontSize:14 }}>✕</button>
          </div>}
          {msg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:8, padding:'8px 12px', marginBottom:12, color:G.greenDark, fontSize:12 }}>✓ {msg}</div>}

          {/* Personal info */}
          <div style={{ background:'#F9FAF7', borderRadius:14, padding:16, marginBottom:14 }}>
            <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:G.text }}>
              Personal Information
              {isReadOnly && <span style={{ fontSize:10, color:G.muted, fontWeight:400, marginLeft:6 }}>· Read Only</span>}
            </p>
            <div style={{ display:'grid', gap:12 }}>
              <Field label="Full Name">
                <input type="text" value={fullName}
                  onChange={e => !isReadOnly && setFullName(e.target.value)}
                  readOnly={isReadOnly} placeholder="Your full name" style={inp(isReadOnly)}
                  onFocus={e=>!isReadOnly&&(e.target.style.borderColor=G.green)}
                  onBlur={e=>e.target.style.borderColor=G.border} />
              </Field>
              <Field label="Username">
                <input type="text" value={user?.username || ''} readOnly disabled style={inp(true)} />
              </Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Field label="Phone Number">
                  <input type="tel" value={phone}
                    onChange={e => !isReadOnly && setPhone(e.target.value)}
                    readOnly={isReadOnly} placeholder="Mobile number" style={inp(isReadOnly)}
                    onFocus={e=>!isReadOnly&&(e.target.style.borderColor=G.green)}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                </Field>
                <Field label={user?.role === 'branch_executive' ? 'Branch' : 'Area / Locality'}>
                  <input type="text"
                    value={user?.role === 'branch_executive' ? (user?.branch || '—') : area}
                    onChange={e => !isReadOnly && setArea(e.target.value)}
                    readOnly={isReadOnly} placeholder="e.g. Kukatpally" style={inp(isReadOnly)}
                    onFocus={e=>!isReadOnly&&(e.target.style.borderColor=G.green)}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                </Field>
              </div>
              {!isReadOnly && (
                <Field label="Delivery Address">
                  <textarea value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="House/flat no, street, landmark, city"
                    rows={3}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, color:G.text, outline:'none', background:'#FAFAFA', boxSizing:'border-box', resize:'none', fontFamily:'inherit', lineHeight:1.5 }}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                  <p style={{ margin:'4px 0 0', fontSize:11, color:G.muted }}>💡 Auto-filled at checkout</p>
                </Field>
              )}
            </div>
            {!isReadOnly && (
              <button type="button" onClick={saveProfile} disabled={saving} style={{ width:'100%', marginTop:14, padding:11, background:saving?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
                {saving ? '⏳ Saving...' : '✓ Save Profile'}
              </button>
            )}
          </div>

          {/* Change password */}
          {!isReadOnly && (
            <div style={{ background:'#F9FAF7', borderRadius:14, padding:16, marginBottom:14 }}>
              <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:G.text }}>Change Password</p>
              {passErr && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px', marginBottom:10, color:G.red, fontSize:12 }}>{passErr}</div>}
              {passMsg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:8, padding:'8px 12px', marginBottom:10, color:G.greenDark, fontSize:12 }}>✓ {passMsg}</div>}
              <div style={{ display:'grid', gap:12 }}>
                <Field label="Current Password">
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} value={oldPass} onChange={e=>setOldPass(e.target.value)}
                      placeholder="Enter current password" style={{ ...inp(false), paddingRight:50 }}
                      onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                    <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12 }}>
                      {showPass?'Hide':'Show'}
                    </button>
                  </div>
                </Field>
                <Field label="New Password">
                  <input type={showPass?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)}
                    placeholder="Min 6 characters" style={inp(false)}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </Field>
                <Field label="Confirm New Password">
                  <input type={showPass?'text':'password'} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ ...inp(false), borderColor: confirmPass && newPass !== confirmPass ? G.red : G.border }}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=confirmPass&&newPass!==confirmPass?G.red:G.border} />
                </Field>
              </div>
              <button type="button" onClick={changePassword}
                disabled={savingPass||!oldPass||!newPass||newPass!==confirmPass}
                style={{ width:'100%', marginTop:14, padding:11, background:savingPass||!oldPass||!newPass||newPass!==confirmPass?'#9CA3AF':G.amber, color:G.white, border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {savingPass ? '⏳ Changing...' : 'Change Password'}
              </button>
            </div>
          )}

          {/* Account info */}
          <div style={{ background:'#F9FAF7', borderRadius:14, padding:14, marginBottom:14 }}>
            <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:G.text }}>Account Info</p>
            {[
              ['Role',         (user?.role||'').replace(/_/g,' ')],
              ...(user?.branch ? [['Branch', user.branch]] : []),
              ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${G.border}`, fontSize:13 }}>
                <span style={{ color:G.muted }}>{label}</span>
                <span style={{ fontWeight:600, color:G.text, textTransform:'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <button type="button" onClick={async()=>{ await signOut(); navigate('/login') }}
            style={{ width:'100%', padding:12, background:G.redLight, color:G.red, border:`1px solid #FECACA`, borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            ↩ Logout
          </button>
        </div>
      </div>
    </div>
  )
}
