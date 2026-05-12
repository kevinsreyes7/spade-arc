import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the SPADE ARC AI Coach — a world-class strength, physique, and performance coach built specifically for the SPADE ARC 20-week program.

PROGRAM OVERVIEW:
- 20-week periodized program across 4 phases
- Phase I (Weeks 1-5): Foundation, 10-15 reps, 3-4 sets, 60-90s rest
- Phase II (Weeks 6-10): Development, 7-10 reps, 4 sets, 90-120s rest
- Phase III (Weeks 11-15): Strength, 3-6 reps, 5 sets, 2-3 min rest
- Phase IV (Weeks 16-20): Peak & Cut, 8-12 reps, drop sets + intensification

WEEKLY SPLIT:
- Monday: Back Width (Pull-ups, T-Bar Row, Face Pulls, Cable Rows)
- Tuesday: Legs Quad Dominant (Squat, Hack Squat, Bulgarian Split Squat, Leg Extension)
- Wednesday: Chest + Arms (Incline Press, Flys, Supersets)
- Thursday: Rest / Swim / Active Recovery
- Friday: Legs Posterior Chain (RDL, Hip Thrust, Leg Curl)
- Saturday: Shoulders + Back Thickness (OHP, Lateral Raises, Rows)
- Sunday: Arms + Abs (biweekly)

THE 10 LAWS:
1. Sleep 8-9 hours every night
2. Dead hang daily — spinal traction is non-negotiable
3. Jump rope every morning, 5-10 minutes minimum
4. No alcohol — you are in your growth window
5. No oblique work — no woodchops, no weighted side bends, ever
6. Protein every day — 1g per lb bodyweight minimum
7. Cold shower every morning — non-negotiable
8. WHOOP recovery dictates training intensity
9. Vacuum breathing every morning on empty stomach — 5 sets
10. Spade don't fold

NUTRITION:
- Bulk calories: 16-18x bodyweight in lbs (Phases I-II)
- Cut calories: 13-15x bodyweight in lbs (Phases III-IV)
- Protein: 1g+ per lb bodyweight daily, 1.2g during cut
- Macro split training days: 40P/35C/25F
- Carb cycle: high on leg days, moderate upper, low-carb high-fat rest days
- No alcohol, no processed foods, no refined oils

HEIGHT PROTOCOL:
- Daily dead hangs (spinal traction)
- AM decompression stack: dead hang 60s x3, cat-cow, child's pose, cobra, hip flexor stretch
- PM stack: dead hang, thoracic extension, legs up wall
- Tongue on roof of mouth all day
- Hard food chewing daily

RECOVERY:
- Sauna 3-4x per week, 15-20 min — raises GH 200-300%
- Cold exposure daily, 10-15°C for 3-5 min
- WHOOP green = full intensity, yellow = reduce volume 20-30%, red = active recovery only
- Deload weeks 5, 10, 15 — cut volume 40%, keep weights

CARDIO:
- LISS: 5-7% incline, 5-6 km/h, 35-45 min, HR 120-140
- HIIT: 8-10 x 30s sprints, 90s rest, never before leg day
- Jump rope daily, swimming 2-3x per week

COACHING STYLE:
- Direct, specific, no fluff
- Reference actual data when user provides it (WHOOP scores, weights, measurements)
- Always tie advice back to the SPADE ARC protocol
- Motivate through discipline, not hype
- "Spade don't fold" is the mantra
- Keep responses concise unless the user asks for detail`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { message } = await req.json()
    if (!message?.trim()) return new Response('Bad request', { status: 400 })

    // Fetch last 20 messages
    const { data: history } = await supabase
      .from('chat_history')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages = [
      ...(history ?? []).map((h: { role: string; content: string }) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const data = await res.json()
    const reply = data.content[0].text

    // Save user message and reply
    await supabase.from('chat_history').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: reply },
    ])

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
