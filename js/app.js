// ═══════════════════════════════════════════
// SPADE ARC — Main Application
// ═══════════════════════════════════════════

const { createClient } = supabase;
const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

let currentUser = null;
let userProfile = null;
let currentPage = 'dashboard';
let charts = {};

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  currentUser = session.user;
  await loadProfile();

  document.getElementById('app-header').style.display = 'block';
  document.getElementById('user-avatar').textContent = (currentUser.email?.[0] ?? 'U').toUpperCase();
  document.getElementById('dropdown-email').textContent = currentUser.email;
  updateTierBadge();

  // Tab nav
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgraded') === '1') {
    await sb.from('profiles').update({ subscription_status: 'active' }).eq('id', currentUser.id);
    await loadProfile();
    updateTierBadge();
    toast('Upgraded to Pro!', 'success');
    window.history.replaceState({}, '', 'app.html');
  }

  // Auth state listener
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'index.html';
  });

  await showPage('dashboard');
}

async function loadProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) {
    userProfile = data;
  } else {
    // Create profile if missing
    const { data: newProfile } = await sb.from('profiles').upsert({
      id: currentUser.id,
      current_phase: 1,
      current_week: 1,
      start_date: new Date().toISOString().split('T')[0],
      subscription_status: 'trial',
      trial_start: new Date().toISOString(),
    }).select().single();
    userProfile = newProfile;
  }
}

function isPro() {
  return true;
}

function isTrialActive() {
  return true;
}

function hasAccess() {
  return true;
}

function updateTierBadge() {
  const badge = document.getElementById('tier-badge');
  badge.style.display = 'none';
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

async function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
  currentPage = page;

  // Destroy charts on page leave to prevent canvas reuse errors
  destroyPageCharts();

  switch (page) {
    case 'dashboard':     await renderDashboard(); break;
    case 'today':         await renderToday(); break;
    case 'coach':         renderCoach(); break;
    case 'workouts':      renderWorkouts(); break;
    case 'measurements':  await renderMeasurements(); break;
    case 'whoop':         await renderWhoop(); break;
    case 'journal':       await renderJournal(); break;
    case 'progress':      await renderProgress(); break;
    case 'schedule':      renderSchedule(); break;
    case 'program':       renderProgram(); break;
  }
}

function destroyPageCharts() {
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(_){} });
  charts = {};
}

// ─── PAYWALL ─────────────────────────────────────────────────────────────────

function renderPaywall(containerId, contentId, feature) {
  const container = document.getElementById(containerId);
  const content = document.getElementById(contentId);
  if (hasAccess()) {
    container.innerHTML = '';
    content.style.display = 'block';
    return true;
  }
  content.style.display = 'none';
  container.innerHTML = `
    <div class="paywall-overlay">
      <div class="paywall-title">Unlock ${feature}</div>
      <p class="paywall-text">This feature requires a Pro subscription.<br>Get full access to AI coaching, workout logging, charts, and everything else.</p>
      <div class="paywall-price">$20</div>
      <div class="paywall-period">per month · cancel anytime</div>
      <div style="margin-top:24px">
        <button class="btn" style="max-width:260px;margin:0 auto" onclick="startCheckout()">Upgrade to Pro →</button>
      </div>
    </div>`;
  return false;
}

async function startCheckout() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ returnUrl: window.location.origin + '/app.html' }),
    });
    const { url, error } = await res.json();
    if (error) throw new Error(error);
    window.location.href = url;
  } catch (e) {
    toast('Checkout error: ' + e.message, 'error');
  }
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

async function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading...</div>';

  const today = todayStr();
  const [ckRes, whoopRes, measureRes] = await Promise.all([
    sb.from('checklist_logs').select('completed').eq('user_id', currentUser.id).eq('date', today),
    sb.from('whoop_logs').select('recovery_color,recovery_score').eq('user_id', currentUser.id).order('date', { ascending: false }).limit(1),
    sb.from('measurements').select('weight_lbs').eq('user_id', currentUser.id).order('date', { ascending: false }).limit(1),
  ]);

  const ckData = ckRes.data ?? [];
  const doneCount = ckData.filter(r => r.completed).length;
  const pct = CHECKLIST_ITEMS.length > 0 ? Math.round((doneCount / CHECKLIST_ITEMS.length) * 100) : 0;
  const latestWhoop = whoopRes.data?.[0];
  const latestWeight = measureRes.data?.[0]?.weight_lbs;

  const phase = userProfile?.current_phase ?? 1;
  const week = userProfile?.current_week ?? 1;

  const whoopColor = latestWhoop?.recovery_color ?? null;
  const whoopColorMap = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };

  el.innerHTML = `
    <div class="page-title">Dashboard</div>
    <div class="page-subtitle">${dayOfWeek()}, Week ${week} · Phase ${phase}: ${PHASE_NAMES[phase]}</div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val" style="color:var(--gold)">${pct}%</div>
        <div class="stat-label">Today's Habits</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">W${week}</div>
        <div class="stat-label">Current Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${PHASE_COLORS[phase]}">${phase}</div>
        <div class="stat-label">Current Phase</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${whoopColor ? whoopColorMap[whoopColor] : 'var(--muted)'}">
          ${latestWhoop?.recovery_score ?? '—'}
        </div>
        <div class="stat-label">Recovery Score</div>
      </div>
    </div>

    ${latestWeight ? `
    <div class="card card-sm flex-between" style="margin-bottom:12px">
      <span style="font-size:13px;color:var(--muted)">Last Logged Weight</span>
      <span style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--gold)">${latestWeight} lbs</span>
    </div>` : ''}

    <div class="section-title">Today's Checklist Progress</div>
    <div class="card" style="padding:14px 18px">
      <div class="flex-between mb-8">
        <span style="font-size:13px">${doneCount} of ${CHECKLIST_ITEMS.length} habits completed</span>
        <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--gold)">${pct}%</span>
      </div>
      <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="section-title">Current Phase</div>
    <div class="card">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Phase ${phase} of 4</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:28px;letter-spacing:.08em;color:${PHASE_COLORS[phase]};margin-bottom:4px">${PHASE_NAMES[phase]}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">${PHASE_TEXT[phase]}</div>
      <div class="prog-track"><div class="prog-fill" style="width:${(week/20)*100}%;background:${PHASE_COLORS[phase]}"></div></div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:6px">Week ${week} / 20</div>
    </div>

    <div class="section-title">Week Settings</div>
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Current Week (1–20)</label>
          <input type="number" min="1" max="20" value="${week}" id="set-week" onchange="updateWeekPhase()">
        </div>
        <div class="field">
          <label>Current Phase (1–4)</label>
          <input type="number" min="1" max="4" value="${phase}" id="set-phase" onchange="updateWeekPhase()">
        </div>
      </div>
    </div>

    <div class="section-title">WHOOP Decision Today</div>
    <div class="whoop-decision">
      <div class="whoop-card green ${whoopColor === 'green' ? '' : 'opacity:0.5'}">
        <div class="whoop-score">Green</div>
        <div class="whoop-pct">67–100%</div>
        <div class="whoop-desc">Full intensity. Body is ready.</div>
      </div>
      <div class="whoop-card yellow">
        <div class="whoop-score">Yellow</div>
        <div class="whoop-pct">34–66%</div>
        <div class="whoop-desc">Reduce volume 20–30%. Keep intensity.</div>
      </div>
      <div class="whoop-card red">
        <div class="whoop-score">Red</div>
        <div class="whoop-pct">0–33%</div>
        <div class="whoop-desc">Active recovery only.</div>
      </div>
    </div>

    <div class="section-title">Quick Links</div>
    <div class="grid-3">
      ${['Today', 'Workouts', 'WHOOP', 'Journal', 'Coach', 'Progress'].map(p => `
        <button class="btn btn-secondary" onclick="showPage('${p.toLowerCase()}')" style="width:100%">${p}</button>
      `).join('')}
    </div>`;
}

async function updateWeekPhase() {
  const week = parseInt(document.getElementById('set-week')?.value) || 1;
  const phase = parseInt(document.getElementById('set-phase')?.value) || 1;
  await sb.from('profiles').update({
    current_week: Math.min(20, Math.max(1, week)),
    current_phase: Math.min(4, Math.max(1, phase)),
  }).eq('id', currentUser.id);
  await loadProfile();
  toast('Updated', 'success');
}

// ─── TODAY ────────────────────────────────────────────────────────────────────

async function renderToday() {
  const el = document.getElementById('page-today');
  const today = todayStr();

  const { data: ckData } = await sb.from('checklist_logs').select('*').eq('user_id', currentUser.id).eq('date', today);
  const { data: journalData } = await sb.from('journal_entries').select('*').eq('user_id', currentUser.id).eq('date', today).single();
  const { data: streakData } = await sb.from('checklist_logs').select('item_id,completed,date').eq('user_id', currentUser.id).order('date', { ascending: false }).limit(200);

  const ckMap = {};
  (ckData ?? []).forEach(r => { ckMap[r.item_id] = r; });

  // Calculate streaks
  const streaks = calcStreaks(streakData ?? []);

  const today_day = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dayKey = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().replace('.','');
  const workout = WORKOUTS[dayKey] ?? WORKOUTS.mon;

  el.innerHTML = `
    <div class="page-title">Today</div>
    <div class="page-subtitle">${today_day}</div>

    <div class="section-title">Daily Checklist</div>
    <ul class="ck-list" id="checklist-list">
      ${CHECKLIST_ITEMS.map(item => {
        const rec = ckMap[item.id];
        const done = rec?.completed ?? false;
        const streak = streaks[item.id] ?? 0;
        return `<li class="ck-item ${done ? 'done' : ''}" data-id="${item.id}" onclick="toggleChecklist('${item.id}', '${item.label}')">
          <div class="ck-box">✓</div>
          <div class="ck-text">${item.label}</div>
          ${streak > 0 ? `<div class="ck-streak">${streak}d</div>` : ''}
        </li>`;
      }).join('')}
    </ul>

    <div class="section-title">Today's Workout — ${workout.title.split('—')[1]?.trim() ?? workout.title}</div>
    <div class="card card-sm" style="margin-bottom:4px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue)">${workout.focus}</div>
    </div>
    <div class="infobox" style="margin-bottom:16px">Tap <strong>Workouts</strong> tab to log today's session.</div>

    <div class="section-title">Daily Journal</div>
    ${hasAccess() ? `
    <div class="card">
      <div class="field">
        <label>What did I execute today?</label>
        <textarea id="j-executed" placeholder="Sessions done, habits hit..." rows="2">${journalData?.executed ?? ''}</textarea>
      </div>
      <div class="field">
        <label>What did I avoid or resist?</label>
        <textarea id="j-avoided" placeholder="Temptations, shortcuts..." rows="2">${journalData?.avoided ?? ''}</textarea>
      </div>
      <div class="field">
        <label>WHOOP Score Today</label>
        <div class="rating-row">
          ${['green','yellow','red'].map(c => `
            <button class="rating-btn ${journalData?.whoop_score === c ? 'active' : ''}" data-score="${c}" onclick="selectScore(this,'${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>
          `).join('')}
        </div>
      </div>
      <div class="field">
        <label>Tomorrow's Focus</label>
        <textarea id="j-tomorrow" placeholder="Non-negotiable for tomorrow..." rows="2">${journalData?.tomorrow_focus ?? ''}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveJournal()">Save Entry</button>
      </div>
    </div>` : renderInlinePaywall('Journal')}`;
}

function selectScore(btn, score) {
  btn.closest('.rating-row').querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.dataset.selected = score;
}

async function toggleChecklist(itemId, label) {
  const today = todayStr();
  const li = document.querySelector(`.ck-item[data-id="${itemId}"]`);
  const nowDone = !li.classList.contains('done');
  li.classList.toggle('done');

  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id,
    date: today,
    item_id: itemId,
    item_label: label,
    completed: nowDone,
  }, { onConflict: 'user_id,date,item_id' });
}

async function saveJournal() {
  const today = todayStr();
  const scoreBtn = document.querySelector('.rating-btn.active[data-score]');
  const score = scoreBtn?.dataset?.score ?? scoreBtn?.dataset?.selected ?? null;

  const { error } = await sb.from('journal_entries').upsert({
    user_id: currentUser.id,
    date: today,
    executed: document.getElementById('j-executed')?.value ?? '',
    avoided: document.getElementById('j-avoided')?.value ?? '',
    tomorrow_focus: document.getElementById('j-tomorrow')?.value ?? '',
    whoop_score: score,
  }, { onConflict: 'user_id,date' });

  if (error) { toast('Error saving journal', 'error'); return; }
  toast('Journal saved', 'success');

  // Auto-check journal habit
  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id,
    date: today,
    item_id: 'journal',
    item_label: 'Journal entry written',
    completed: true,
  }, { onConflict: 'user_id,date,item_id' });
}

// ─── COACH ────────────────────────────────────────────────────────────────────

function renderCoach() {
  const showChat = hasAccess();
  document.getElementById('coach-chat').style.display = showChat ? 'block' : 'none';
  if (!showChat) {
    document.getElementById('coach-paywall').innerHTML = renderPaywallHTML('AI Coach');
    return;
  }
  document.getElementById('coach-paywall').innerHTML = '';
  loadChatHistory();
}

async function loadChatHistory() {
  const { data } = await sb.from('chat_history')
    .select('role,content')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: true })
    .limit(20);

  if (data && data.length > 0) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    data.forEach(msg => appendChatBubble(msg.role, msg.content));
    container.scrollTop = container.scrollHeight;
  }
}

function appendChatBubble(role, content) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="chat-avatar ${role === 'assistant' ? 'ai' : 'user'}">${role === 'assistant' ? 'S' : 'U'}</div>
    <div class="chat-bubble">${escHtml(content)}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendChatBubble('user', msg);

  const sendBtn = document.getElementById('chat-send');
  sendBtn.disabled = true;
  sendBtn.textContent = '...';

  // Typing indicator
  const container = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.textContent = 'Coach is thinking...';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;

  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/ai-coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    typing.remove();
    if (data.error) throw new Error(data.error);
    appendChatBubble('assistant', data.reply);
  } catch (e) {
    typing.remove();
    appendChatBubble('assistant', 'Error: ' + e.message);
  }

  sendBtn.disabled = false;
  sendBtn.textContent = 'Send';
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────

function renderWorkouts() {
  const showContent = hasAccess();
  document.getElementById('workouts-paywall').innerHTML = showContent ? '' : renderPaywallHTML('Workout Logging');
  document.getElementById('workouts-content').style.display = showContent ? 'block' : 'none';
  if (!showContent) return;

  // Phase banner
  const phase = userProfile?.current_phase ?? 1;
  document.getElementById('phase-banner').textContent = PHASE_TEXT[phase];

  // Phase tabs
  document.querySelectorAll('[data-phase]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.phase) === phase);
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-phase]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('phase-banner').textContent = PHASE_TEXT[this.dataset.phase];
    });
  });

  // Day tabs — default to today
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().replace('.','');
  const dayMap = { mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun' };
  const activeDay = dayMap[todayDay] ?? 'mon';

  document.querySelectorAll('[data-day]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.day === activeDay);
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-day]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderWorkoutDay(this.dataset.day);
    });
  });

  renderWorkoutDay(activeDay);
}

function renderWorkoutDay(day) {
  const w = WORKOUTS[day];
  const el = document.getElementById('workout-day-content');
  if (!w) { el.innerHTML = ''; return; }

  if (w.rest) {
    el.innerHTML = `
      <div class="day-header">
        <div class="day-title">${w.title}</div>
        <div class="day-focus">${w.focus}</div>
        <div class="day-note">${w.note}</div>
      </div>
      <div class="card">
        ${w.activities.map(a => `
          <div class="proto-item">
            <span style="font-size:16px;min-width:24px">${a.icon}</span>
            <span>${a.text}</span>
          </div>`).join('')}
      </div>`;
    return;
  }

  const phase = userProfile?.current_phase ?? 1;
  const week = userProfile?.current_week ?? 1;

  el.innerHTML = `
    <div class="day-header">
      <div class="day-title">${w.title}</div>
      <div class="day-focus">${w.focus}</div>
      <div class="day-note">${w.note}</div>
    </div>

    <div class="table-wrap" style="margin-bottom:20px">
      <table>
        <thead>
          <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th><th>Notes</th></tr>
        </thead>
        <tbody>
          ${w.exercises.map(ex => `
            <tr>
              <td>${ex.name}${ex.key ? '<span class="badge badge-key">KEY</span>' : ''}${ex.ss ? '<span class="badge badge-ss">SS</span>' : ''}</td>
              <td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.rest}</td><td style="color:var(--muted)">${ex.notes}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title">Log This Session</div>
    <div class="card" id="log-form">
      <div class="field-row">
        <div class="field">
          <label>WHOOP Recovery</label>
          <select id="log-whoop">
            <option value="">Select</option>
            <option value="green">🟢 Green</option>
            <option value="yellow">🟡 Yellow</option>
            <option value="red">🔴 Red</option>
          </select>
        </div>
        <div class="field">
          <label>Session Rating (1–5)</label>
          <input type="number" min="1" max="5" id="log-rating" placeholder="4">
        </div>
      </div>

      ${w.exercises.map((ex, i) => `
        <div style="margin-bottom:14px">
          <div style="font-size:12px;font-weight:500;color:var(--accent);margin-bottom:8px">${ex.name}</div>
          <div style="display:grid;grid-template-columns:repeat(${ex.sets},1fr);gap:6px">
            ${Array.from({length: ex.sets}, (_, s) => `
              <div style="background:var(--card2);border:1px solid var(--border2);border-radius:6px;padding:8px;text-align:center">
                <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:5px">SET ${s+1}</div>
                <input class="ex-input" type="number" placeholder="kg" id="ex-${i}-${s}-weight" min="0" step="0.5">
                <div style="height:4px"></div>
                <input class="ex-input" type="number" placeholder="reps" id="ex-${i}-${s}-reps" min="0">
              </div>`).join('')}
          </div>
        </div>`).join('')}

      <div class="field">
        <label>Session Notes</label>
        <textarea id="log-notes" placeholder="How did it feel? PRs? Issues?" rows="2"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveWorkoutLog('${day}', ${JSON.stringify(w.exercises).replace(/'/g, "\\'")} )">Save Session</button>
      </div>
    </div>`;
}

async function saveWorkoutLog(day, exercises) {
  const phase = userProfile?.current_phase ?? 1;
  const week = userProfile?.current_week ?? 1;
  const w = WORKOUTS[day];

  const logged = exercises.map((ex, i) => ({
    name: ex.name,
    sets: Array.from({ length: ex.sets }, (_, s) => ({
      weight: document.getElementById(`ex-${i}-${s}-weight`)?.value ?? '',
      reps: document.getElementById(`ex-${i}-${s}-reps`)?.value ?? '',
    })).filter(s => s.weight || s.reps),
  }));

  const { error } = await sb.from('workout_logs').insert({
    user_id: currentUser.id,
    date: todayStr(),
    phase,
    week,
    day_name: w.title,
    exercises: logged,
    whoop_recovery: document.getElementById('log-whoop')?.value || null,
    session_rating: parseInt(document.getElementById('log-rating')?.value) || null,
    notes: document.getElementById('log-notes')?.value ?? '',
  });

  if (error) { toast('Error saving: ' + error.message, 'error'); return; }

  // Auto-check training habit
  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id,
    date: todayStr(),
    item_id: 'training',
    item_label: 'Training session completed and logged',
    completed: true,
  }, { onConflict: 'user_id,date,item_id' });

  toast('Session saved!', 'success');
}

// ─── MEASUREMENTS ─────────────────────────────────────────────────────────────

async function renderMeasurements() {
  if (!renderPaywall('measurements-paywall', 'measurements-content', 'Measurements')) return;

  const el = document.getElementById('measurements-content');
  const { data } = await sb.from('measurements').select('*').eq('user_id', currentUser.id).order('date', { ascending: true });
  const records = data ?? [];

  const latest = records[records.length - 1];

  el.innerHTML = `
    <div class="section-title">Log Measurements</div>
    <div class="card">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="m-date" value="${todayStr()}"></div>
        <div class="field"><label>Weight (lbs)</label><input type="number" id="m-weight" placeholder="185" step="0.1" value="${latest?.weight_lbs ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Height (cm)</label><input type="number" id="m-height" placeholder="178" step="0.1" value="${latest?.height_cm ?? ''}"></div>
        <div class="field"><label>Body Fat %</label><input type="number" id="m-bf" placeholder="15" step="0.1" value="${latest?.body_fat_pct ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Shoulders (cm)</label><input type="number" id="m-shoulders" step="0.1" value="${latest?.shoulders_cm ?? ''}"></div>
        <div class="field"><label>Waist (cm)</label><input type="number" id="m-waist" step="0.1" value="${latest?.waist_cm ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Chest (cm)</label><input type="number" id="m-chest" step="0.1" value="${latest?.chest_cm ?? ''}"></div>
        <div class="field"><label>Hips (cm)</label><input type="number" id="m-hips" step="0.1" value="${latest?.hips_cm ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left Arm (cm)</label><input type="number" id="m-larm" step="0.1" value="${latest?.left_arm_cm ?? ''}"></div>
        <div class="field"><label>Right Arm (cm)</label><input type="number" id="m-rarm" step="0.1" value="${latest?.right_arm_cm ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left Quad (cm)</label><input type="number" id="m-lquad" step="0.1" value="${latest?.left_quad_cm ?? ''}"></div>
        <div class="field"><label>Right Quad (cm)</label><input type="number" id="m-rquad" step="0.1" value="${latest?.right_quad_cm ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left Calf (cm)</label><input type="number" id="m-lcalf" step="0.1" value="${latest?.left_calf_cm ?? ''}"></div>
        <div class="field"><label>Right Calf (cm)</label><input type="number" id="m-rcalf" step="0.1" value="${latest?.right_calf_cm ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Neck (cm)</label><input type="number" id="m-neck" step="0.1" value="${latest?.neck_cm ?? ''}"></div>
        <div class="field"><label>WHOOP Age</label><input type="number" id="m-whoopAge" step="0.1" value="${latest?.whoop_age ?? ''}"></div>
      </div>
      <div class="field"><label>Notes</label><textarea id="m-notes" rows="2"></textarea></div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveMeasurement()">Save Measurements</button>
      </div>
    </div>

    ${records.length > 1 ? `
    <div class="section-title">Trends</div>
    <div class="chart-wrap"><div class="chart-title">Weight (lbs)</div><canvas id="chart-weight"></canvas></div>
    <div class="chart-wrap"><div class="chart-title">V-Taper Ratio (Shoulders ÷ Waist)</div><canvas id="chart-vtaper"></canvas></div>
    <div class="chart-grid">
      <div class="chart-wrap"><div class="chart-title">Body Fat %</div><canvas id="chart-bf"></canvas></div>
      <div class="chart-wrap"><div class="chart-title">Waist (cm)</div><canvas id="chart-waist"></canvas></div>
    </div>
    ` : '<div class="infobox" style="margin-top:16px">Log at least 2 measurements to see trend charts.</div>'}`;

  if (records.length > 1) {
    const labels = records.map(r => r.date);
    setTimeout(() => {
      makeLineChart('chart-weight', labels, records.map(r => r.weight_lbs), 'Weight (lbs)', '#f0c040');
      makeLineChart('chart-vtaper', labels,
        records.map(r => r.shoulders_cm && r.waist_cm ? (r.shoulders_cm / r.waist_cm).toFixed(2) : null),
        'V-Taper Ratio', '#7b9fd4');
      makeLineChart('chart-bf', labels, records.map(r => r.body_fat_pct), 'Body Fat %', '#c0392b');
      makeLineChart('chart-waist', labels, records.map(r => r.waist_cm), 'Waist (cm)', '#4a6fa5');
    }, 50);
  }
}

async function saveMeasurement() {
  const { error } = await sb.from('measurements').insert({
    user_id: currentUser.id,
    date: document.getElementById('m-date').value,
    weight_lbs: numVal('m-weight'),
    height_cm: numVal('m-height'),
    body_fat_pct: numVal('m-bf'),
    shoulders_cm: numVal('m-shoulders'),
    waist_cm: numVal('m-waist'),
    chest_cm: numVal('m-chest'),
    hips_cm: numVal('m-hips'),
    left_arm_cm: numVal('m-larm'),
    right_arm_cm: numVal('m-rarm'),
    left_quad_cm: numVal('m-lquad'),
    right_quad_cm: numVal('m-rquad'),
    left_calf_cm: numVal('m-lcalf'),
    right_calf_cm: numVal('m-rcalf'),
    neck_cm: numVal('m-neck'),
    whoop_age: numVal('m-whoopAge'),
    notes: document.getElementById('m-notes')?.value ?? '',
  });
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Measurements saved!', 'success');
  await renderMeasurements();
}

// ─── WHOOP ─────────────────────────────────────────────────────────────────────

async function renderWhoop() {
  const el = document.getElementById('whoop-content');
  const { data } = await sb.from('whoop_logs').select('*').eq('user_id', currentUser.id).order('date', { ascending: true });
  const records = data ?? [];
  const todayLog = records.find(r => r.date === todayStr());

  el.innerHTML = `
    <div class="section-title">Log Today's WHOOP</div>
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Recovery Score (0–100)</label>
          <input type="number" id="w-score" min="0" max="100" placeholder="72" value="${todayLog?.recovery_score ?? ''}">
        </div>
        <div class="field">
          <label>Recovery Color</label>
          <select id="w-color">
            <option value="">Select</option>
            <option value="green" ${todayLog?.recovery_color === 'green' ? 'selected' : ''}>🟢 Green (67–100%)</option>
            <option value="yellow" ${todayLog?.recovery_color === 'yellow' ? 'selected' : ''}>🟡 Yellow (34–66%)</option>
            <option value="red" ${todayLog?.recovery_color === 'red' ? 'selected' : ''}>🔴 Red (0–33%)</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>HRV (ms)</label><input type="number" id="w-hrv" placeholder="65" value="${todayLog?.hrv ?? ''}"></div>
        <div class="field"><label>Resting HR (bpm)</label><input type="number" id="w-rhr" placeholder="52" value="${todayLog?.resting_hr ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Sleep Hours</label><input type="number" id="w-sleep" step="0.1" placeholder="8.5" value="${todayLog?.sleep_hours ?? ''}"></div>
        <div class="field"><label>Slow Wave Sleep %</label><input type="number" id="w-sws" step="0.1" placeholder="22" value="${todayLog?.slow_wave_pct ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>REM Sleep %</label><input type="number" id="w-rem" step="0.1" placeholder="21" value="${todayLog?.rem_pct ?? ''}"></div>
        <div class="field"><label>Strain Score</label><input type="number" id="w-strain" step="0.1" placeholder="12.4" value="${todayLog?.strain_score ?? ''}"></div>
      </div>
      <div class="field"><label>WHOOP Age</label><input type="number" id="w-age" step="0.1" placeholder="19.1" value="${todayLog?.whoop_age ?? userProfile?.whoop_age ?? ''}"></div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveWhoopLog()">Save WHOOP Data</button>
      </div>
    </div>

    <div class="section-title">Decision Framework</div>
    <div class="whoop-decision">
      <div class="whoop-card green">
        <div class="whoop-score">Green</div>
        <div class="whoop-pct">67–100%</div>
        <div class="whoop-desc">Full intensity. Body is ready. Push hard.</div>
      </div>
      <div class="whoop-card yellow">
        <div class="whoop-score">Yellow</div>
        <div class="whoop-pct">34–66%</div>
        <div class="whoop-desc">Reduce volume 20–30%. Keep intensity. Listen.</div>
      </div>
      <div class="whoop-card red">
        <div class="whoop-score">Red</div>
        <div class="whoop-pct">0–33%</div>
        <div class="whoop-desc">Active recovery ONLY. Walk, swim, decompress.</div>
      </div>
    </div>

    ${records.length > 1 ? `
    <div class="section-title">30-Day Trends</div>
    <div class="chart-wrap"><div class="chart-title">HRV (ms)</div><canvas id="chart-hrv"></canvas></div>
    <div class="chart-grid">
      <div class="chart-wrap"><div class="chart-title">Sleep Hours</div><canvas id="chart-sleep"></canvas></div>
      <div class="chart-wrap"><div class="chart-title">Recovery Score</div><canvas id="chart-recovery"></canvas></div>
    </div>
    <div class="chart-wrap"><div class="chart-title">Recovery Distribution</div><canvas id="chart-recovery-pie"></canvas></div>
    ` : '<div class="infobox">Log at least 2 days of WHOOP data to see trend charts.</div>'}`;

  if (records.length > 1) {
    const recent = records.slice(-30);
    const labels = recent.map(r => r.date);
    setTimeout(() => {
      makeLineChart('chart-hrv', labels, recent.map(r => r.hrv), 'HRV', '#27ae60');
      makeLineChart('chart-sleep', labels, recent.map(r => r.sleep_hours), 'Sleep Hours', '#7b9fd4');
      makeLineChart('chart-recovery', labels, recent.map(r => r.recovery_score), 'Recovery %', '#f0c040');
      // Pie chart
      const g = records.filter(r => r.recovery_color === 'green').length;
      const y = records.filter(r => r.recovery_color === 'yellow').length;
      const re = records.filter(r => r.recovery_color === 'red').length;
      const pieCtx = document.getElementById('chart-recovery-pie')?.getContext('2d');
      if (pieCtx) {
        charts['chart-recovery-pie'] = new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: ['Green', 'Yellow', 'Red'],
            datasets: [{ data: [g, y, re], backgroundColor: ['#27ae60','#f0c040','#c0392b'], borderWidth: 0 }],
          },
          options: { plugins: { legend: { labels: { color: '#566070', font: { family: 'DM Mono' } } } } },
        });
      }
    }, 50);
  }
}

async function saveWhoopLog() {
  const { error } = await sb.from('whoop_logs').upsert({
    user_id: currentUser.id,
    date: todayStr(),
    recovery_score: numVal('w-score'),
    recovery_color: document.getElementById('w-color')?.value || null,
    hrv: numVal('w-hrv'),
    resting_hr: numVal('w-rhr'),
    sleep_hours: numVal('w-sleep'),
    slow_wave_pct: numVal('w-sws'),
    rem_pct: numVal('w-rem'),
    strain_score: numVal('w-strain'),
    whoop_age: numVal('w-age'),
  }, { onConflict: 'user_id,date' });

  if (error) { toast('Error: ' + error.message, 'error'); return; }

  // Update profile whoop_age
  const age = numVal('w-age');
  if (age) await sb.from('profiles').update({ whoop_age: age }).eq('id', currentUser.id);

  toast('WHOOP data saved!', 'success');
  await renderWhoop();
}

// ─── JOURNAL ──────────────────────────────────────────────────────────────────

async function renderJournal() {
  if (!renderPaywall('journal-paywall', 'journal-content', 'Journal')) return;

  const el = document.getElementById('journal-content');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading...</div>';

  const { data } = await sb.from('journal_entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false })
    .limit(50);

  const entries = data ?? [];

  el.innerHTML = `
    <div class="search-bar">
      <input class="search-input" type="text" placeholder="Search entries..." id="journal-search" oninput="filterJournal(this.value)">
    </div>
    <div id="journal-list">
      ${entries.length === 0 ? `<div class="empty-state"><div class="empty-icon">📓</div><div class="empty-text">No journal entries yet.<br>Write your first entry in Today.</div></div>` :
        entries.map(e => renderJournalCard(e)).join('')}
    </div>`;

  window._journalEntries = entries;
}

function renderJournalCard(e) {
  const scoreColors = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };
  return `
    <div class="journal-entry" onclick="expandJournal('${e.id}')">
      <div class="journal-date">${e.date} ${e.whoop_score ? `<span class="badge badge-${e.whoop_score}">${e.whoop_score}</span>` : ''}</div>
      ${e.executed ? `<div class="journal-text">${escHtml(e.executed.substring(0, 120))}${e.executed.length > 120 ? '...' : ''}</div>` : ''}
      ${e.tomorrow_focus ? `<div style="font-size:11px;color:var(--blue);margin-top:4px;font-family:'DM Mono',monospace">Tomorrow: ${escHtml(e.tomorrow_focus.substring(0, 60))}</div>` : ''}
    </div>`;
}

function filterJournal(query) {
  const entries = window._journalEntries ?? [];
  const filtered = query ? entries.filter(e =>
    (e.executed + e.avoided + e.tomorrow_focus).toLowerCase().includes(query.toLowerCase())
  ) : entries;
  document.getElementById('journal-list').innerHTML = filtered.map(e => renderJournalCard(e)).join('') ||
    '<div class="empty-state"><div class="empty-text">No entries match your search.</div></div>';
}

function expandJournal(id) {
  const e = (window._journalEntries ?? []).find(x => x.id === id);
  if (!e) return;
  // Simple modal-like expansion in a new card
  const card = document.querySelector(`[onclick="expandJournal('${id}')"]`);
  if (!card) return;
  card.outerHTML = `
    <div class="card" id="journal-expanded-${id}">
      <div class="flex-between mb-12">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${e.date}</div>
        ${e.whoop_score ? `<span class="badge badge-${e.whoop_score}">${e.whoop_score}</span>` : ''}
      </div>
      ${e.executed ? `<div class="field"><div class="form-label">Executed</div><div style="font-size:13px;line-height:1.6">${escHtml(e.executed)}</div></div>` : ''}
      ${e.avoided ? `<div class="field"><div class="form-label">Avoided / Resisted</div><div style="font-size:13px;line-height:1.6">${escHtml(e.avoided)}</div></div>` : ''}
      ${e.tomorrow_focus ? `<div class="field"><div class="form-label">Tomorrow's Focus</div><div style="font-size:13px;line-height:1.6">${escHtml(e.tomorrow_focus)}</div></div>` : ''}
    </div>`;
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

async function renderProgress() {
  if (!renderPaywall('progress-paywall', 'progress-content', 'Progress Charts')) return;

  const el = document.getElementById('progress-content');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading...</div>';

  const [ckRes, wlRes, measureRes] = await Promise.all([
    sb.from('checklist_logs').select('*').eq('user_id', currentUser.id).order('date', { ascending: true }),
    sb.from('workout_logs').select('date,exercises').eq('user_id', currentUser.id).order('date', { ascending: true }),
    sb.from('measurements').select('*').eq('user_id', currentUser.id).order('date', { ascending: true }),
  ]);

  const ckData = ckRes.data ?? [];
  const wlData = wlRes.data ?? [];
  const measures = measureRes.data ?? [];

  // Streak calculation
  const streaks = calcStreaks(ckData);
  const allStreaks = Object.entries(streaks).sort((a,b) => b[1]-a[1]);
  const best = allStreaks[0];
  const worst = allStreaks[allStreaks.length-1];

  // Daily completion rates
  const byDate = {};
  ckData.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { total: 0, done: 0 };
    byDate[r.date].total++;
    if (r.completed) byDate[r.date].done++;
  });
  const completionDates = Object.keys(byDate).sort();
  const completionPcts = completionDates.map(d => Math.round((byDate[d].done / Math.max(byDate[d].total, 1)) * 100));

  // Key exercise progression
  const keyExData = {};
  KEY_EXERCISES.forEach(ex => { keyExData[ex] = []; });
  wlData.forEach(log => {
    if (!log.exercises) return;
    log.exercises.forEach((ex) => {
      if (keyExData[ex.name] && ex.sets?.length > 0) {
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
        if (maxWeight > 0) keyExData[ex.name].push({ date: log.date, weight: maxWeight });
      }
    });
  });

  el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val">${wlData.length}</div>
        <div class="stat-label">Sessions Logged</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${completionDates.length}</div>
        <div class="stat-label">Days Tracked</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${best ? best[1] : 0}</div>
        <div class="stat-label">Best Streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${completionPcts.length > 0 ? Math.round(completionPcts.reduce((a,b)=>a+b,0)/completionPcts.length) : 0}%</div>
        <div class="stat-label">Avg Daily %</div>
      </div>
    </div>

    ${best ? `<div class="infobox-green infobox" style="margin-bottom:8px">🏆 Best habit: <strong>${CHECKLIST_ITEMS.find(i=>i.id===best[0])?.label ?? best[0]}</strong> — ${best[1]} day streak</div>` : ''}
    ${worst && worst[1] === 0 ? `<div class="infobox-red infobox">⚠️ Weakest habit: <strong>${CHECKLIST_ITEMS.find(i=>i.id===worst[0])?.label ?? worst[0]}</strong> — focus here</div>` : ''}

    ${completionDates.length > 1 ? `
    <div class="section-title">Habit Completion Rate</div>
    <div class="chart-wrap"><div class="chart-title">Daily Habit Completion %</div><canvas id="chart-completion"></canvas></div>
    ` : ''}

    <div class="section-title">Habit Streaks</div>
    <div class="card">
      ${allStreaks.map(([id, streak]) => {
        const item = CHECKLIST_ITEMS.find(i => i.id === id);
        const maxStreak = 30;
        return `<div class="streak-item">
          <div class="streak-label" style="font-size:12px">${item?.label ?? id}</div>
          <div class="streak-bar"><div class="streak-fill" style="width:${Math.min(100,(streak/maxStreak)*100)}%"></div></div>
          <div class="streak-count">${streak}d</div>
        </div>`;
      }).join('')}
    </div>

    ${measures.length > 1 ? `
    <div class="section-title">Body Measurements</div>
    <div class="chart-wrap"><div class="chart-title">Weight Trend (lbs)</div><canvas id="chart-weight-p"></canvas></div>
    ` : ''}

    ${KEY_EXERCISES.filter(ex => keyExData[ex].length > 1).length > 0 ? `
    <div class="section-title">Strength Progression</div>
    <div class="chart-grid">
      ${KEY_EXERCISES.filter(ex => keyExData[ex].length > 1).map(ex => `
        <div class="chart-wrap">
          <div class="chart-title">${ex}</div>
          <canvas id="chart-ex-${ex.replace(/\s+/g,'_')}"></canvas>
        </div>`).join('')}
    </div>` : ''}`;

  setTimeout(() => {
    if (completionDates.length > 1) {
      makeLineChart('chart-completion', completionDates, completionPcts, 'Completion %', '#f0c040');
    }
    if (measures.length > 1) {
      makeLineChart('chart-weight-p', measures.map(m=>m.date), measures.map(m=>m.weight_lbs), 'Weight', '#f0c040');
    }
    KEY_EXERCISES.forEach(ex => {
      const pts = keyExData[ex];
      if (pts.length > 1) {
        makeLineChart(`chart-ex-${ex.replace(/\s+/g,'_')}`, pts.map(p=>p.date), pts.map(p=>p.weight), 'kg', '#7b9fd4');
      }
    });
  }, 50);
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────

function renderSchedule() {
  const el = document.getElementById('schedule-content');
  if (el.innerHTML) return; // already rendered

  el.innerHTML = `
    <div class="section-title">Weekly Split</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:20px">
      ${[
        ['Mon','Back Width'],['Tue','Legs Quad'],['Wed','Chest + Arms'],
        ['Thu','Rest / Swim'],['Fri','Legs Post.'],['Sat','Shoulders'],['Sun','Arms + Abs']
      ].map(([d,f]) => `
        <div class="card card-sm" style="text-align:center">
          <div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:5px">${d}</div>
          <div style="font-family:'Bebas Neue',cursive;font-size:13px">${f}</div>
        </div>`).join('')}
    </div>

    <div class="section-title">Cardio by Phase</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Phase</th><th>LISS</th><th>HIIT</th><th>Swim</th><th>Jump Rope</th></tr></thead>
        <tbody>
          <tr><td style="color:var(--p1)">I · Wks 1–5</td><td>3× walk only</td><td>None</td><td>2×/wk</td><td>Daily 5 min</td></tr>
          <tr><td style="color:var(--p2)">II · Wks 6–10</td><td>3× LISS</td><td>1× sprints</td><td>2–3×/wk</td><td>Daily 8 min</td></tr>
          <tr><td style="color:var(--p3)">III · Wks 11–15</td><td>4× LISS</td><td>1–2×</td><td>3×/wk</td><td>Daily 10 min</td></tr>
          <tr><td style="color:var(--p4)">IV · Wks 16–20</td><td>4–5× LISS</td><td>2×</td><td>3×/wk</td><td>Daily 12 min</td></tr>
        </tbody>
      </table>
    </div>

    <div class="infobox infobox-gold">Deload Weeks: 5, 10, 15 — Cut volume 40%. Keep same weights. Fewer sets.</div>

    <div class="section-title">20-Week Breakdown</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Week</th><th>Phase</th><th>Focus</th><th>Reps</th><th>Note</th></tr></thead>
        <tbody>
          ${WEEK_SCHEDULE.map(w => `
            <tr style="${w.deload ? 'color:var(--p4)' : w.peak ? 'color:var(--p3)' : ''}">
              <td>${w.week}</td>
              <td style="color:${PHASE_COLORS[w.phase]}">${w.phase}</td>
              <td>${w.focus}${w.deload ? '<span class="badge badge-yellow">DELOAD</span>' : ''}${w.peak ? '<span class="badge" style="background:rgba(200,212,240,.12);color:var(--p3);border:1px solid rgba(200,212,240,.25)">APEX</span>' : ''}</td>
              <td>${w.reps}</td>
              <td style="color:var(--muted)">${w.note}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ─── PROGRAM ──────────────────────────────────────────────────────────────────

function renderProgram() {
  const el = document.getElementById('program-content');
  if (el.innerHTML) return;

  el.innerHTML = `
    <div class="section-title">The 10 Laws</div>
    <div class="card" style="padding:8px 18px">
      <ol style="list-style:none;counter-reset:law">
        ${[
          'Sleep 8–9 hours every night. No exceptions.',
          'Dead hang daily. Multiple times. Spinal traction is non-negotiable.',
          'Jump rope every morning. 5–10 minutes minimum.',
          'No alcohol. You are in your growth window.',
          'No oblique work. No woodchops. No weighted side bends. Ever.',
          'Protein every single day. 1g per lb bodyweight minimum.',
          'Cold shower every morning. Non-negotiable.',
          'WHOOP recovery dictates training intensity. Green goes hard. Red rests.',
          'Vacuum breathing every morning on empty stomach. 5 sets.',
          'Spade don\'t fold.',
        ].map(law => `<li style="counter-increment:law;display:flex;align-items:flex-start;gap:14px;padding:12px 0;border-bottom:1px solid var(--border2);font-size:13px;line-height:1.5">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);min-width:22px;padding-top:1px">0\${new Array(Math.max(0,2-String([].length+1).length)).fill('0').join('')}</span>
          ${law}
        </li>`).join('')}
      </ol>
    </div>

    <div class="section-title">Daily Protocol</div>
    <div class="card" style="margin-bottom:12px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);margin-bottom:10px">Morning · 06:00–07:00</div>
      ${['Cold shower immediately on waking · 3–5 minutes','No phone for first 30 minutes','Sunlight exposure outdoors · 10–15 minutes','Jump rope · 5–10 minutes (daily, non-negotiable)','Spinal decompression AM stack','Vacuum breathing · 5 × 20-second holds on empty stomach','High-protein breakfast within 60 minutes of waking'].map(i => `<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);margin-bottom:10px">Night · 21:00–22:00</div>
      ${['Spinal decompression repeat — hang, cat-cow, child\'s pose','Legs up wall · 5 minutes','Magnesium glycinate · 400mg','Casein protein or Greek yogurt','No food 3 hours before bed','No screens 60 min before bed','Room temperature 18–20°C','Same sleep and wake time every day','Sleep on back or side — never stomach'].map(i => `<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}
    </div>

    <div class="section-title">Nutrition</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Supplement</th><th>Dose</th><th>Timing</th><th>Purpose</th></tr></thead>
        <tbody>
          ${[
            ['Creatine monohydrate','5g daily','Any time','Strongest evidence base of any supplement'],
            ['Whey protein','To hit targets','Post-workout','Fast protein source'],
            ['Vitamin D3','4000–5000 IU','Morning w/ food','Testosterone, bone, immune'],
            ['Vitamin K2','100–200mcg','With D3','Directs calcium to bone'],
            ['Magnesium glycinate','400mg','Night','Sleep quality, testosterone, bone'],
            ['Omega-3','2–3g daily','With food','Inflammation, cardiovascular'],
            ['Zinc','15–25mg','With food','IGF-1 signaling at growth plates'],
            ['Vitamin C','500–1000mg','Any time','Collagen synthesis'],
            ['Collagen peptides','10–15g','Morning','Growth plate cartilage support'],
          ].map(([n,d,t,p]) => `<tr><td style="color:var(--accent)">${n}</td><td>${d}</td><td>${t}</td><td style="color:var(--muted)">${p}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title">Recovery</div>
    <div class="table-wrap" style="margin-bottom:12px">
      <table>
        <thead><tr><th>Tool</th><th>Frequency</th><th>Benefit</th></tr></thead>
        <tbody>
          <tr><td>Sauna</td><td>3–4×/week · 15–20 min</td><td>GH up 200–300%, reduces cortisol</td></tr>
          <tr><td>Cold shower</td><td>Daily morning · 3–5 min</td><td>Norepinephrine +300%, inflammation</td></tr>
          <tr><td>Contrast therapy</td><td>Post-training</td><td>Reduces DOMS 20–30%</td></tr>
          <tr><td>Deep sleep</td><td>8–9 hours nightly</td><td>70% of GH released during SWS</td></tr>
          <tr><td>Deload weeks</td><td>Wks 5, 10, 15</td><td>Supercompensation — body grows during recovery</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">Height Protocol</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Movement</th><th>Volume</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td>Dead hang</td><td>60s × 3 (AM) + 60s × 2 (PM)</td><td>Spinal traction, vertebral decompression</td></tr>
          <tr><td>Cat-cow</td><td>15 reps</td><td>Disc hydration</td></tr>
          <tr><td>Child's pose</td><td>60 seconds</td><td>Lumbar decompression</td></tr>
          <tr><td>Cobra pose</td><td>30s × 2</td><td>Anterior spinal opening</td></tr>
          <tr><td>Hip flexor stretch</td><td>45s each side</td><td>Pelvic tilt correction · apparent height</td></tr>
          <tr><td>Thoracic extension</td><td>60s over foam roller (PM)</td><td>Thoracic kyphosis correction</td></tr>
          <tr><td>Legs up wall</td><td>5 minutes (PM)</td><td>Venous return + spinal reset</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">Mental Framework</div>
    <div class="infobox">Every time you execute when you don't feel like it — every cold shower, every session on yellow WHOOP, every meal prepared correctly — you are literally rewiring your prefrontal cortex toward discipline as a default state. Neuroscience calls this automaticity. Ancient warriors called it character.</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Old Identity</th><th>→</th><th>New Identity</th></tr></thead>
        <tbody>
          ${[
            ["I'm trying to get in shape","I am someone who trains daily"],
            ["I'll try to eat better","I fuel my body with precision"],
            ["I should sleep more","Sleep is my most anabolic tool"],
            ["I want to be faster","I am an athlete who sprints"],
            ["I hope I stick with this","Spade don't fold. Period."],
          ].map(([a,b]) => `<tr><td style="color:var(--muted);font-style:italic">${a}</td><td style="color:var(--blue)">→</td><td style="color:var(--accent)">${b}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="closing">THE ONES WHO ACHIEVED IT WERE NOT THE MOST GENETICALLY GIFTED.<br>THEY WERE THE MOST CONSISTENT.</div>`;

  // Manually fix the laws list
  const lawsOl = el.querySelector('ol');
  if (lawsOl) {
    const laws = [
      'Sleep 8–9 hours every night. No exceptions.',
      'Dead hang daily. Multiple times. Spinal traction is non-negotiable.',
      'Jump rope every morning. 5–10 minutes minimum.',
      'No alcohol. You are in your growth window.',
      'No oblique work. No woodchops. No weighted side bends. Ever.',
      'Protein every single day. 1g per lb bodyweight minimum.',
      'Cold shower every morning. Non-negotiable.',
      'WHOOP recovery dictates training intensity. Green goes hard. Red rests.',
      'Vacuum breathing every morning on empty stomach. 5 sets.',
      "Spade don't fold.",
    ];
    lawsOl.innerHTML = laws.map((law, i) => `
      <li style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;border-bottom:1px solid var(--border2);font-size:13px;line-height:1.5">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);min-width:24px;padding-top:1px">${String(i+1).padStart(2,'0')}</span>
        ${law}
      </li>`).join('');
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeLineChart(id, labels, data, label, color) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  const cleanData = data.map(v => v === null || v === undefined || v === '' ? null : Number(v));
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: cleanData,
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: cleanData.length > 30 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } },
      },
      scales: {
        x: { ticks: { color: '#566070', font: { size: 9, family: 'DM Mono' }, maxTicksLimit: 8 }, grid: { color: '#162038' } },
        y: { ticks: { color: '#566070', font: { size: 9, family: 'DM Mono' } }, grid: { color: '#162038' } },
      },
    }
  });
}

function calcStreaks(ckData) {
  const streaks = {};
  CHECKLIST_ITEMS.forEach(item => { streaks[item.id] = 0; });

  // Group by date
  const byDate = {};
  ckData.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = {};
    byDate[r.date][r.item_id] = r.completed;
  });

  const dates = Object.keys(byDate).sort().reverse();

  CHECKLIST_ITEMS.forEach(item => {
    let streak = 0;
    for (const date of dates) {
      if (byDate[date][item.id]) streak++;
      else break;
    }
    streaks[item.id] = streak;
  });

  return streaks;
}

function renderPaywallHTML(feature) {
  return `
    <div class="paywall-overlay">
      <div class="paywall-title">Unlock ${feature}</div>
      <p class="paywall-text">This feature requires a Pro subscription.</p>
      <div class="paywall-price">$20</div>
      <div class="paywall-period">per month · cancel anytime</div>
      <div style="margin-top:20px">
        <button class="btn" style="max-width:240px;margin:0 auto" onclick="startCheckout()">Upgrade to Pro →</button>
      </div>
    </div>`;
}

function renderInlinePaywall(feature) {
  return `<div class="infobox" style="text-align:center">
    <strong>${feature} requires Pro.</strong>
    <div style="margin-top:10px"><button class="btn btn-sm" onclick="startCheckout()">Upgrade $20/mo</button></div>
  </div>`;
}

function numVal(id) {
  const v = document.getElementById(id)?.value;
  return v ? parseFloat(v) : null;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function dayOfWeek() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function toggleDropdown() {
  document.getElementById('user-dropdown').classList.toggle('open');
}

function goToSettings() {
  document.getElementById('user-dropdown').classList.remove('open');
  showPage('dashboard');
}

async function handleSignOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
