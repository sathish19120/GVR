// api/cron/subscriptions.js
// FIX #6: Vercel Serverless Function called daily at 6 AM IST by Vercel Cron
// Setup: in vercel.json add:
//   "crons": [{ "path": "/api/cron/subscriptions", "schedule": "30 0 * * *" }]
// (30 0 UTC = 6:00 AM IST daily)
// Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel Environment Variables.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Security: only allow Vercel Cron calls (or manual trigger with secret)
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET || ''
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key — bypasses RLS
  )

  try {
    const { data, error } = await supabase.rpc('process_due_subscriptions')
    if (error) throw error

    const processed = data || []
    console.log(`[Subscriptions Cron] Processed ${processed.length} subscriptions`)

    return res.status(200).json({
      success: true,
      processed: processed.length,
      orders: processed,
      timestamp: new Date().toISOString()
    })
  } catch(e) {
    console.error('[Subscriptions Cron] Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
