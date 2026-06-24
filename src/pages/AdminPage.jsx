import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',text:'#111827',muted:'#6B7280',
  border:'#E5E7EB',surface:'#F4F6F3',white:'#fff',purple:'#7C3AED',purpleLight:'#EDE9FE'
}

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

const ROLES = ['superadmin','admin','branch_executive','delivery','customer','vendor']
const BRANCHES = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']
const ROLE_COLORS = {
  superadmin:       [G.purple, G.purpleLight],
  admin:            [G.blue,   G.blueLight],
  branch_executive: ['#0891B2','#ECFEFF'],
  delivery:         [G.amber,  G.amberLight],
  customer:         [G.green,  G.greenLight],
  vendor:           ['#0E7490','#ECFEFF'],
}

function RoleBadge({ role }) {
  // FIX: safe fallback so unknown roles don't crash
  const [color, bg] = ROLE_COLORS[role] || [G.muted, '#F3F4F6']
  return <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:bg, color }}>{role}</span>
}

// ── Create User Modal ─────────────────────────────────────
function CreateUserModal({ onClose, onSaved }) {
  const [fullName, setFullName]   = useState('')
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [role, setRole]           = useState('customer')
  const [phone, setPhone]         = useState('')
  const [branch, setBranch]       = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function save() {
    if (!username.trim() || !password.trim()) { setError('Username and password are required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (role === 'branch_executive' && !branch) { setError('Please select a branch for branch executive'); return }
    setSaving(true); setError('')
    try {
      const clean = username.trim().toLowerCase()
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', clean).single()
      if (existing) { setError('Username already taken'); setSaving(false); return }
      const hashed = await hashPassword(password)
      // Auto-generate referral code
      const referralCode = clean.slice(0,4).toUpperCase() + Math.floor(1000 + Math.random()*9000)
      const { error: err } = await supabase.from('profiles').insert({
        username: clean, full_name: fullName, password_hash: hashed,
        role, phone, branch: branch || null,
        referral_code: referralCode,
        created_at: new Date().toISOString()
      })
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(); onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:460, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700, color:G.text }}>Create New User</h3>
          <button type="button" onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>

        {error && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13 }}>{error}</div>}

        <div style={{ display:'grid', gap:16 }}>
          <Field label="Full Name">
            <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Enter full name" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Username *">
            <input type="text" value={username} onChange={e=>setUsername(e.target.value.trim().toLowerCase())} placeholder="Enter username (no spaces)" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Password *">
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" style={{ ...inp, paddingRight:40 }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12 }}>
                {showPass?'Hide':'Show'}
              </button>
            </div>
          </Field>
          <Field label="Phone">
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>

          <Field label="Role">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ROLES.map(r => {
                const [color, bg] = ROLE_COLORS[r] || [G.muted, '#F3F4F6']
                return (
                  <button key={r} type="button" onClick={()=>{ setRole(r); if(r !== 'branch_executive') setBranch('') }} style={{
                    padding:'10px', borderRadius:10,
                    border:`2px solid ${role===r?color:G.border}`,
                    background:role===r?bg:G.white, cursor:'pointer', fontWeight:600,
                    fontSize:12, color:role===r?color:G.muted, textTransform:'capitalize'
                  }}>{r.replace('_',' ')}</button>
                )
              })}
            </div>
          </Field>

          {role === 'branch_executive' && (
            <Field label="Assign Branch *">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {BRANCHES.map(b => (
                  <button key={b} type="button" onClick={() => setBranch(b)} style={{
                    padding:'9px 8px', borderRadius:9,
                    border:`2px solid ${branch===b?'#0891B2':G.border}`,
                    background:branch===b?'#ECFEFF':G.white,
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    color:branch===b?'#0891B2':G.muted
                  }}>{b}</button>
                ))}
              </div>
              {!branch && <p style={{ margin:'6px 0 0', fontSize:11, color:G.amber }}>⚠ Select a branch to assign this executive</p>}
            </Field>
          )}
        </div>

        <button type="button" onClick={save} disabled={saving} style={{
          width:'100%', marginTop:24, padding:13,
          background:saving?'#9CA3AF':G.green,
          color:G.white, border:'none', borderRadius:12,
          fontSize:15, fontWeight:700, cursor:saving?'not-allowed':'pointer'
        }}>
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  )
}

// ── Edit User Modal ───────────────────────────────────────
// FIX #4: added missing branch / setBranch state
function EditUserModal({ user: u, onClose, onSaved }) {
  const [fullName, setFullName] = useState(u.full_name || '')
  const [phone, setPhone]       = useState(u.phone || '')
  const [role, setRole]         = useState(u.role || 'customer')
  const [branch, setBranch]     = useState(u.branch || '') // FIX: was missing
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function save() {
    if (role === 'branch_executive' && !branch) { setError('Please select a branch for branch executive'); return }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('profiles').update({
        full_name: fullName, phone, role,
        branch: role === 'branch_executive' ? branch : null
      }).eq('id', u.id)
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:460, padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>Edit User — {u.username}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid', gap:16 }}>
          <Field label="Full Name">
            <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Role">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ROLES.map(r => {
                const [color, bg] = ROLE_COLORS[r] || [G.muted, '#F3F4F6']
                return (
                  <button key={r} type="button" onClick={()=>{ setRole(r); if(r !== 'branch_executive') setBranch('') }} style={{
                    padding:'10px', borderRadius:10, border:`2px solid ${role===r?color:G.border}`,
                    background:role===r?bg:G.white, cursor:'pointer', fontWeight:600,
                    fontSize:13, color:role===r?color:G.muted, textTransform:'capitalize'
                  }}>{r.replace('_',' ')}</button>
                )
              })}
            </div>
          </Field>
          {/* FIX #4: branch selector now works — branch state exists */}
          {role === 'branch_executive' && (
            <Field label="Assign Branch *">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {BRANCHES.map(b => (
                  <button key={b} type="button" onClick={() => setBranch(b)} style={{
                    padding:'9px 8px', borderRadius:9,
                    border:`2px solid ${branch===b?'#0891B2':G.border}`,
                    background:branch===b?'#ECFEFF':'#fff',
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    color:branch===b?'#0891B2':G.muted
                  }}>{b}</button>
                ))}
              </div>
              {!branch && <p style={{ margin:'6px 0 0', fontSize:11, color:G.amber }}>⚠ Select a branch</p>}
            </Field>
          )}
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%', marginTop:24, padding:13, background:saving?'#9CA3AF':G.blue, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── Change Password Modal ─────────────────────────────────
function ChangePasswordModal({ user: u, onClose, onSaved }) {
  const [newPass, setNewPass]     = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  async function save() {
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPass !== confirm) { setError('Passwords do not match'); return }
    setSaving(true); setError('')
    try {
      const hashed = await hashPassword(newPass)
      const { error: err } = await supabase.from('profiles').update({ password_hash: hashed }).eq('id', u.id)
      if (err) { setError(err.message); setSaving(false); return }
      setSuccess('Password changed successfully!')
      setNewPass(''); setConfirm('')
      setTimeout(() => { onSaved(); onClose() }, 1200)
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:420, padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>Change Password</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>
        <p style={{ color:G.muted, fontSize:13, marginBottom:20 }}>Changing password for: <strong style={{ color:G.text }}>{u.username}</strong></p>
        {error && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13 }}>{error}</div>}
        {success && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.greenDark, fontSize:13 }}>✓ {success}</div>}
        <div style={{ display:'grid', gap:14 }}>
          <Field label="New Password">
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={{ ...inp, paddingRight:40 }} />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12 }}>{showPass?'Hide':'Show'}</button>
            </div>
          </Field>
          <Field label="Confirm New Password">
            <input type={showPass?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password"
              style={{ ...inp, borderColor: confirm && newPass !== confirm ? G.red : G.border }} />
          </Field>
        </div>
        <button onClick={save} disabled={saving || !newPass || newPass !== confirm} style={{ width:'100%', marginTop:24, padding:13, background:saving||!newPass||newPass!==confirm?'#9CA3AF':G.amber, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}

// ── My Profile / Change Own Password ─────────────────────
function MyProfile({ currentUser, onUpdated }) {
  const [fullName, setFullName]     = useState(currentUser.full_name || '')
  const [phone, setPhone]           = useState(currentUser.phone || '')
  const [oldPass, setOldPass]       = useState('')
  const [newPass, setNewPass]       = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showP, setShowP]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [msg, setMsg]               = useState('')
  const [passMsg, setPassMsg]       = useState('')
  const [passErr, setPassErr]       = useState('')

  async function saveProfile() {
    setSaving(true); setMsg('')
    await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', currentUser.id)
    setMsg('Profile updated successfully!')
    setSaving(false)
    onUpdated()
    setTimeout(() => setMsg(''), 3000)
  }

  async function changeOwnPassword() {
    setPassErr(''); setPassMsg('')
    if (newPass.length < 6) { setPassErr('New password must be at least 6 characters'); return }
    if (newPass !== confirm) { setPassErr('Passwords do not match'); return }
    setSavingPass(true)
    try {
      const oldHashed = await hashPassword(oldPass)
      const { data } = await supabase.from('profiles').select('id').eq('id', currentUser.id).eq('password_hash', oldHashed).single()
      if (!data) { setPassErr('Current password is incorrect'); setSavingPass(false); return }
      const newHashed = await hashPassword(newPass)
      await supabase.from('profiles').update({ password_hash: newHashed }).eq('id', currentUser.id)
      setPassMsg('Password changed successfully!')
      setOldPass(''); setNewPass(''); setConfirm('')
      setTimeout(() => setPassMsg(''), 3000)
    } catch(e) { setPassErr(e.message) }
    finally { setSavingPass(false) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div style={{ background:G.white, borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:G.text }}>My Profile</h3>
        {msg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.greenDark, fontSize:13 }}>✓ {msg}</div>}
        <div style={{ display:'grid', gap:14 }}>
          <Field label="Username">
            <input type="text" value={currentUser.username} disabled style={{ ...inp, background:'#F9FAF7', color:G.muted, cursor:'not-allowed' }} />
          </Field>
          <Field label="Full Name">
            <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </Field>
          <Field label="Role">
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#F9FAF7', fontSize:13 }}>
              <RoleBadge role={currentUser.role} />
            </div>
          </Field>
        </div>
        <button onClick={saveProfile} disabled={saving} style={{ width:'100%', marginTop:20, padding:12, background:saving?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div style={{ background:G.white, borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:G.text }}>Change My Password</h3>
        {passErr && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13 }}>{passErr}</div>}
        {passMsg && <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.greenDark, fontSize:13 }}>✓ {passMsg}</div>}
        <div style={{ display:'grid', gap:14 }}>
          <Field label="Current Password">
            <div style={{ position:'relative' }}>
              <input type={showP?'text':'password'} value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Enter current password" style={{ ...inp, paddingRight:40 }} />
              <button type="button" onClick={()=>setShowP(!showP)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12 }}>{showP?'Hide':'Show'}</button>
            </div>
          </Field>
          <Field label="New Password">
            <input type={showP?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={inp} />
          </Field>
          <Field label="Confirm New Password">
            <input type={showP?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter new password"
              style={{ ...inp, borderColor: confirm && newPass !== confirm ? G.red : G.border }} />
          </Field>
        </div>
        <button onClick={changeOwnPassword} disabled={savingPass || !oldPass || !newPass || newPass !== confirm} style={{ width:'100%', marginTop:20, padding:12, background:savingPass||!oldPass||!newPass||newPass!==confirm?'#9CA3AF':G.amber, color:G.white, border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          {savingPass ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────
export default function AdminPage() {
  const authStore = useAuth()
  const currentUser = authStore.user
  const [tab, setTab]               = useState('users')
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [changePassUser, setChangePassUser] = useState(null)
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function deleteUser(id, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    setDeleting(id)
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleting(null)
  }

  async function toggleActive(id, active) {
    await supabase.from('profiles').update({ active: !active }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !active } : u))
  }

  const ROLE_ORDER = { superadmin:0, admin:1, branch_executive:2, delivery:3, customer:4, vendor:5 }
  const filtered = users.filter(u => {
    const matchSearch = !search || u.username?.includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  }).sort((a,b) => (ROLE_ORDER[a.role]??99) - (ROLE_ORDER[b.role]??99))

  const TABS = [
    { key:'users',   label:'👥 Manage Users' },
    { key:'profile', label:'👤 My Profile & Password' },
  ]

  return (
    <div style={{ fontFamily:"'Inter', sans-serif" }}>
      {showCreate && <CreateUserModal onClose={()=>setShowCreate(false)} onSaved={loadUsers} />}
      {editUser && <EditUserModal user={editUser} onClose={()=>setEditUser(null)} onSaved={loadUsers} />}
      {changePassUser && <ChangePasswordModal user={changePassUser} onClose={()=>setChangePassUser(null)} onSaved={loadUsers} />}

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:'9px 20px', borderRadius:10, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:600, transition:'all 0.15s',
            background: tab===t.key ? G.green : G.white,
            color: tab===t.key ? G.white : G.muted,
            boxShadow: tab===t.key ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && currentUser && (
        <MyProfile currentUser={currentUser} onUpdated={loadUsers} />
      )}

      {tab === 'users' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Total Users',  value:users.length,                                      color:G.blue,   bg:G.blueLight },
              { label:'Super Admins', value:users.filter(u=>u.role==='superadmin').length,      color:G.purple, bg:G.purpleLight },
              { label:'Admins',       value:users.filter(u=>u.role==='admin').length,           color:G.blue,   bg:G.blueLight },
              { label:'Delivery',     value:users.filter(u=>u.role==='delivery').length,        color:G.amber,  bg:G.amberLight },
              { label:'Customers',    value:users.filter(u=>u.role==='customer').length,        color:G.green,  bg:G.greenLight },
              { label:'Vendors',      value:users.filter(u=>u.role==='vendor').length,          color:'#0E7490',bg:'#ECFEFF' },
            ].map((s,i) => (
              <div key={i} style={{ background:G.white, borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`3px solid ${s.color}` }}>
                <p style={{ margin:'0 0 5px', fontSize:11, color:G.muted }}>{s.label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:800, color:s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input type="text" placeholder="Search username or name..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...inp, width:240, padding:'9px 14px' }} />
            <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
              style={{ ...inp, width:160, padding:'9px 14px', cursor:'pointer' }}>
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
            </select>
            <div style={{ marginLeft:'auto' }}>
              <button onClick={()=>setShowCreate(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                + Create User
              </button>
            </div>
          </div>

          <div style={{ background:G.white, borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#F9FAF7' }}>
                    {['#','Name','Username','Role','Branch','Phone','Status','Joined','Actions'].map(h=>(
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:G.muted }}>Loading users...</td></tr>
                  )}
                  {!loading && filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                      <td style={{ padding:'12px 14px', color:G.muted, fontSize:12 }}>{i+1}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:G.greenDark, flexShrink:0 }}>
                            {u.full_name?.[0] || u.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span style={{ fontWeight:600, color:G.text }}>{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', color:G.muted, fontFamily:'monospace', fontSize:12 }}>{u.username}</td>
                      <td style={{ padding:'12px 14px' }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding:'12px 14px', color:u.branch?'#0891B2':G.muted, fontSize:12, fontWeight:u.branch?600:400 }}>{u.branch || '—'}</td>
                      <td style={{ padding:'12px 14px', color:G.muted, fontSize:12 }}>{u.phone || '—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:u.active!==false?G.greenLight:G.redLight, color:u.active!==false?G.green:G.red }}>
                          {u.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px', color:G.muted, fontSize:12, whiteSpace:'nowrap' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          <button onClick={()=>setEditUser(u)} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, color:G.blue, cursor:'pointer' }}>✏️ Edit</button>
                          <button onClick={()=>setChangePassUser(u)} style={{ background:G.amberLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, color:G.amber, cursor:'pointer' }}>🔑 Password</button>
                          <button onClick={()=>toggleActive(u.id, u.active)} style={{ background:u.active!==false?G.redLight:G.greenLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, color:u.active!==false?G.red:G.green, cursor:'pointer' }}>
                            {u.active !== false ? '🚫 Disable' : '✅ Enable'}
                          </button>
                          {u.id !== currentUser?.id && (
                            <button onClick={()=>deleteUser(u.id, u.username)} disabled={deleting===u.id} style={{ background:G.redLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, color:G.red, cursor:'pointer' }}>
                              {deleting===u.id ? '...' : '🗑 Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length===0 && (
                    <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:G.muted }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>{label}</label>
      {children}
    </div>
  )
}

const inp = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:14,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box', transition:'border-color 0.2s',
}
