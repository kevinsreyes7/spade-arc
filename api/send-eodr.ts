import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@spade-arc.com'}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel cron secret
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) return res.status(500).json({ error: error.message })
  if (!subscriptions?.length) return res.json({ sent: 0 })

  let sent = 0
  const failed: string[] = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'EODR — Your Daily Report is Ready',
          body: 'Tap to view your daily summary ♠',
          url: '/eodr',
        })
      )
      sent++
    } catch (e) {
      const err = e as { statusCode?: number }
      // Remove expired or invalid subscriptions (410 Gone, 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
      failed.push(sub.id)
    }
  }

  return res.json({ sent, failed: failed.length })
}
