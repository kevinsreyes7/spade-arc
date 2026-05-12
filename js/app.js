// ═══════════════════════════════════════════
// SPADE ARC — Main Application
// ═══════════════════════════════════════════

const { createClient } = supabase;
const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

let currentUser = null;
let userProfile = null;
let currentPage = 'dashboard';
let charts = {};
let matrixInterval = null;
let coachLoaded = false;

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  currentUser = session.user;
  await loadProfile();

  document.getElementById('app-header').style.display = 'block';
  document.getElementById('bottom-nav').style.display = 'flex';
  document.getElementById('coach-fab').style.display = 'block';
  document.getElementById('user-avatar').textContent = (currentUser.email?.[0] ?? 'U').toUpperCase();
  document.getElementById('dropdown-email').textContent = currentUser.email;

  // Start matrix rain
  document.getElementById('matrix-canvas').style.display = 'block';
  initMatrixRain();

  // Nav
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  sb.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') window.location.href = 'index.html';
  });

  // Workout phase/day tabs
  document.querySelectorAll('[data-phase]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-phase]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('phase-banner').textContent = PHASE_TEXT[this.dataset.phase];
    });
  });

  document.querySelectorAll('[data-day]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-day]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderWorkoutDay(this.dataset.day);
    });
  });

  await showPage('dashboard');
}

async function loadProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) { userProfile = data; return; }
  const { data: p } = await sb.from('profiles').upsert({
    id: currentUser.id, current_phase: 1, current_week: 1,
    start_date: new Date().toISOString().split('T')[0],
    subscription_status: 'trial', trial_start: new Date().toISOString(),
  }).select().single();
  userProfile = p;
}

function isPro() { return true; }
function isTrialActive() { return true; }
function hasAccess() { return true; }
function updateTierBadge() {}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

async function navigateTo(page) {
  await showPage(page);
}

async function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) {
    pageEl.classList.add('active');
    pageEl.classList.remove('page-fade-in');
    void pageEl.offsetWidth;
    pageEl.classList.add('page-fade-in');
  }
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
  currentPage = page;

  destroyPageCharts();

  switch (page) {
    case 'dashboard': await renderDashboard(); break;
    case 'today':     await renderToday(); break;
    case 'train':     renderWorkouts(); break;
    case 'stats':     await renderStats(); break;
    case 'program':   renderProgram(); break;
    case 'profile':   await renderProfile(); break;
  }
}

function destroyPageCharts() {
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(_){} });
  charts = {};
}

function openProfile() {
  document.getElementById('user-dropdown').classList.remove('open');
  navigateTo('profile');
}

// ─── MATRIX RAIN ─────────────────────────────────────────────────────────────

function initMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');
  const chars = '♠0123456789♠♠0♠1♠2♠3♠4♠5♠6♠7♠8♠9♠♠';
  const fontSize = 13;
  let w, h, cols, drops;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cols = Math.ceil(w / fontSize);
    if (!drops || drops.length !== cols) {
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.fillStyle = 'rgba(10,13,26,0.07)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${fontSize}px 'SF Mono', monospace`;

    for (let i = 0; i < cols; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const alpha = 0.018 + Math.random() * 0.042; // max ~0.06
      ctx.fillStyle = `rgba(200,212,240,${alpha})`;
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > h && Math.random() > 0.978) drops[i] = -Math.random() * 20;
      drops[i] += 0.22;
    }
  }

  if (matrixInterval) clearInterval(matrixInterval);
  matrixInterval = setInterval(draw, 90);
}

// ─── COACH PANEL ─────────────────────────────────────────────────────────────

let coachPanelOpen = false;

function toggleCoachPanel() {
  coachPanelOpen ? closeCoachPanel() : openCoachPanel();
}

function openCoachPanel() {
  document.getElementById('coach-panel').classList.add('open');
  document.getElementById('coach-backdrop').classList.add('open');
  document.getElementById('fab-btn').classList.add('active');
  coachPanelOpen = true;
  if (!coachLoaded) {
    loadChatHistory();
    coachLoaded = true;
  }
}

function closeCoachPanel() {
  document.getElementById('coach-panel').classList.remove('open');
  document.getElementById('coach-backdrop').classList.remove('open');
  document.getElementById('fab-btn').classList.remove('active');
  coachPanelOpen = false;
}

async function loadChatHistory() {
  const { data } = await sb.from('chat_history')
    .select('role,content').eq('user_id', currentUser.id)
    .order('created_at', { ascending: true }).limit(20);
  if (data?.length > 0) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    data.forEach(m => appendChatBubble(m.role, m.content));
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
  input.style.height = 'auto';
  appendChatBubble('user', msg);
  const sendBtn = document.getElementById('chat-send');
  sendBtn.disabled = true;
  const container = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.textContent = 'Coach is thinking...';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/ai-coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message: msg }),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 404) throw new Error('Edge function not deployed yet — see setup instructions in Supabase dashboard.');
      throw new Error(`HTTP ${res.status}: ${txt.substring(0,120)}`);
    }
    const data = await res.json();
    typing.remove();
    if (data.error) throw new Error(data.error);
    appendChatBubble('assistant', data.reply);
  } catch (e) {
    typing.remove();
    appendChatBubble('assistant', '⚠️ ' + e.message);
  }
  sendBtn.disabled = false;
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

async function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  const today = todayStr();
  const [ckRes, wlRes] = await Promise.all([
    sb.from('checklist_logs').select('completed').eq('user_id', currentUser.id).eq('date', today),
    sb.from('workout_logs').select('id').eq('user_id', currentUser.id).eq('date', today),
  ]);

  const ckData = ckRes.data ?? [];
  const doneCount = ckData.filter(r => r.completed).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);
  const trainedToday = (wlRes.data ?? []).length > 0;
  const phase = userProfile?.current_phase ?? 1;
  const week = userProfile?.current_week ?? 1;

  el.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;color:var(--muted);font-weight:500;margin-bottom:4px">${dayOfWeek()}</div>
      <div style="font-size:26px;font-weight:700;letter-spacing:-.4px">Week ${week} · Phase ${phase}</div>
      <div style="font-size:14px;color:var(--muted);margin-top:2px">${PHASE_NAMES[phase]}</div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val">${pct}%</div>
        <div class="stat-label">Habits today</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${trainedToday ? 'var(--green)' : 'var(--text2)'}">${trainedToday ? '✓' : '—'}</div>
        <div class="stat-label">Trained today</div>
      </div>
    </div>

    <div class="section-title">Today's progress</div>
    <div class="card card-sm">
      <div class="flex-between mb-8">
        <span style="font-size:14px;font-weight:500">${doneCount} / ${CHECKLIST_ITEMS.length} habits</span>
        <span style="font-size:13px;color:var(--muted)">${pct}%</span>
      </div>
      <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="section-title">Current phase</div>
    <div class="card">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${PHASE_COLORS[phase]};margin-bottom:6px">Phase ${phase} · ${PHASE_NAMES[phase]}</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">${PHASE_TEXT[phase]}</div>
      <div class="prog-track"><div class="prog-fill" style="width:${(week/20)*100}%;background:${PHASE_COLORS[phase]}"></div></div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">Week ${week} of 20</div>
    </div>

    <div class="section-title">Set current week</div>
    <div class="card card-sm">
      <div class="field-row">
        <div class="field"><label>Week (1–20)</label>
          <input type="number" min="1" max="20" value="${week}" id="set-week" onchange="updateWeekPhase()">
        </div>
        <div class="field"><label>Phase (1–4)</label>
          <input type="number" min="1" max="4" value="${phase}" id="set-phase" onchange="updateWeekPhase()">
        </div>
      </div>
    </div>

    <div class="section-title">Quick actions</div>
    <div class="grid-2">
      <button class="btn btn-secondary w-full" onclick="navigateTo('today')">Today's Checklist</button>
      <button class="btn btn-secondary w-full" onclick="navigateTo('train')">Log Workout</button>
    </div>`;
}

async function updateWeekPhase() {
  const week = Math.min(20, Math.max(1, parseInt(document.getElementById('set-week')?.value) || 1));
  const phase = Math.min(4, Math.max(1, parseInt(document.getElementById('set-phase')?.value) || 1));
  await sb.from('profiles').update({ current_week: week, current_phase: phase }).eq('id', currentUser.id);
  await loadProfile();
  toast('Updated', 'success');
}

// ─── TODAY ────────────────────────────────────────────────────────────────────

async function renderToday() {
  const el = document.getElementById('page-today');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  const today = todayStr();
  const [ckRes, journalRes, ckAllRes] = await Promise.all([
    sb.from('checklist_logs').select('*').eq('user_id', currentUser.id).eq('date', today),
    sb.from('journal_entries').select('*').eq('user_id', currentUser.id).eq('date', today).maybeSingle(),
    sb.from('checklist_logs').select('item_id,completed,date').eq('user_id', currentUser.id).order('date', { ascending: false }).limit(240),
  ]);

  const ckMap = {};
  (ckRes.data ?? []).forEach(r => { ckMap[r.item_id] = r; });
  const journalData = journalRes.data;
  const streaks = calcStreaks(ckAllRes.data ?? []);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  el.innerHTML = `
    <div class="page-title">Today</div>
    <div class="page-subtitle">${todayLabel}</div>

    <div class="section-title">Daily checklist</div>
    <ul class="ck-list" id="checklist-list">
      ${CHECKLIST_ITEMS.map(item => {
        const done = ckMap[item.id]?.completed ?? false;
        const streak = streaks[item.id] ?? 0;
        return `<li class="ck-item ${done ? 'done' : ''}" data-id="${item.id}" onclick="toggleChecklist('${item.id}','${item.label}')">
          <div class="ck-box">✓</div>
          <div class="ck-text">${item.label}</div>
          ${streak > 0 ? `<div class="ck-streak">${streak}d</div>` : ''}
        </li>`;
      }).join('')}
    </ul>

    <div class="section-title">Journal</div>
    <div class="card">
      <div class="field"><label>What did I execute today?</label>
        <textarea id="j-executed" placeholder="Sessions, habits, wins..." rows="2">${journalData?.executed ?? ''}</textarea>
      </div>
      <div class="field"><label>What did I resist or avoid?</label>
        <textarea id="j-avoided" placeholder="Temptations, shortcuts..." rows="2">${journalData?.avoided ?? ''}</textarea>
      </div>
      <div class="field"><label>WHOOP recovery</label>
        <div class="rating-row">
          ${['green','yellow','red'].map(c => `
            <button class="rating-btn ${journalData?.whoop_score === c ? 'active' : ''}" data-score="${c}" onclick="selectScore(this,'${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>
          `).join('')}
        </div>
      </div>
      <div class="field"><label>Tomorrow's focus</label>
        <textarea id="j-tomorrow" placeholder="Non-negotiable for tomorrow..." rows="2">${journalData?.tomorrow_focus ?? ''}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveJournal()">Save Journal</button>
      </div>
    </div>`;
}

function selectScore(btn, score) {
  btn.closest('.rating-row').querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function toggleChecklist(itemId, label) {
  const li = document.querySelector(`.ck-item[data-id="${itemId}"]`);
  const nowDone = !li.classList.contains('done');
  li.classList.toggle('done');
  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id, date: todayStr(), item_id: itemId, item_label: label, completed: nowDone,
  }, { onConflict: 'user_id,date,item_id' });
}

async function saveJournal() {
  const scoreBtn = document.querySelector('.rating-btn.active[data-score]');
  const { error } = await sb.from('journal_entries').upsert({
    user_id: currentUser.id, date: todayStr(),
    executed: document.getElementById('j-executed')?.value ?? '',
    avoided: document.getElementById('j-avoided')?.value ?? '',
    tomorrow_focus: document.getElementById('j-tomorrow')?.value ?? '',
    whoop_score: scoreBtn?.dataset?.score ?? null,
  }, { onConflict: 'user_id,date' });
  if (error) { toast('Error saving', 'error'); return; }
  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id, date: todayStr(), item_id: 'journal', item_label: 'Journal entry written', completed: true,
  }, { onConflict: 'user_id,date,item_id' });
  toast('Journal saved', 'success');
}

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────

function renderWorkouts() {
  const phase = userProfile?.current_phase ?? 1;
  document.getElementById('phase-banner').textContent = PHASE_TEXT[phase];
  document.querySelectorAll('[data-phase]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.phase) === phase));

  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().replace('.', '');
  const dayMap = { mon:'mon', tue:'tue', wed:'wed', thu:'thu', fri:'fri', sat:'sat', sun:'sun' };
  const activeDay = dayMap[todayKey] ?? 'mon';
  document.querySelectorAll('[data-day]').forEach(b => b.classList.toggle('active', b.dataset.day === activeDay));
  renderWorkoutDay(activeDay);
}

async function fetchPrevWorkout(dayTitle) {
  const keyword = dayTitle.split('—')[0].replace('—','').trim();
  const { data } = await sb.from('workout_logs')
    .select('id,date,exercises,whoop_recovery,session_rating,notes')
    .eq('user_id', currentUser.id)
    .ilike('day_name', `%${keyword.substring(0,8)}%`)
    .order('date', { ascending: false })
    .limit(2);
  return data ?? [];
}

async function renderWorkoutDay(day) {
  const w = WORKOUTS[day];
  const el = document.getElementById('workout-day-content');
  if (!w) { el.innerHTML = ''; return; }

  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  if (w.rest) {
    el.innerHTML = `
      <div class="day-header">
        <div class="day-title">${w.title}</div>
        <div class="day-focus">${w.focus}</div>
        <div class="day-note">${w.note}</div>
      </div>
      <div class="card">${w.activities.map(a => `<div class="proto-item"><span style="font-size:16px;min-width:24px">${a.icon}</span><span>${a.text}</span></div>`).join('')}</div>`;
    return;
  }

  const prevSessions = await fetchPrevWorkout(w.title);
  const prevSession = prevSessions[0]; // most recent
  const editSession = prevSessions.find(s => s.date === todayStr()) ?? null; // today's session if exists

  // Build previous weights map
  const prevData = {};
  if (prevSession) {
    (prevSession.exercises ?? []).forEach(ex => {
      if (ex.sets?.length > 0) {
        const best = ex.sets.reduce((b, s) => (parseFloat(s.weight)||0) > (parseFloat(b.weight)||0) ? s : b, ex.sets[0]);
        prevData[ex.name] = best;
      }
    });
  }

  // Build edit data map (today's already-logged session)
  const editData = {};
  let editLogId = null;
  if (editSession) {
    editLogId = editSession.id;
    (editSession.exercises ?? []).forEach(ex => { editData[ex.name] = ex.sets ?? []; });
  }

  el.innerHTML = `
    <div class="day-header">
      <div class="day-title">${w.title}</div>
      <div class="day-focus">${w.focus}</div>
      <div class="day-note">${w.note}</div>
    </div>

    ${prevSession && prevSession.date !== todayStr() ? `
    <div class="infobox" style="margin-bottom:14px">
      <span style="color:var(--accent);font-weight:600">Last session:</span> ${prevSession.date}
      ${prevSession.session_rating ? ` · ${prevSession.session_rating}/5 ⭐` : ''}
    </div>` : ''}

    ${editSession ? `
    <div class="infobox infobox-green" style="margin-bottom:14px">
      Session logged today — editing existing entry.
    </div>` : ''}

    <div class="section-title">Log session</div>
    <div class="field-row" style="margin-bottom:12px">
      <div class="field"><label>Recovery</label>
        <select id="log-whoop">
          <option value="">Select</option>
          <option value="green" ${editSession?.whoop_recovery==='green'?'selected':''}>🟢 Green</option>
          <option value="yellow" ${editSession?.whoop_recovery==='yellow'?'selected':''}>🟡 Yellow</option>
          <option value="red" ${editSession?.whoop_recovery==='red'?'selected':''}>🔴 Red</option>
        </select>
      </div>
      <div class="field"><label>Rating (1–5)</label>
        <input type="number" min="1" max="5" id="log-rating" placeholder="4" value="${editSession?.session_rating??''}">
      </div>
    </div>

    ${w.exercises.map((ex, i) => {
      const prev = prevData[ex.name];
      const prevLabel = prev ? `${prev.weight||'?'} lbs × ${prev.reps||'?'}` : null;
      const todaySets = editData[ex.name] ?? [];
      return `
      <div class="ex-card">
        <div class="ex-card-header">
          <div class="ex-card-name">
            ${ex.name}
            ${ex.key ? '<span class="badge badge-key">KEY</span>' : ''}
            ${ex.ss ? '<span class="badge badge-ss">SS</span>' : ''}
          </div>
          ${prevLabel ? `<div class="ex-card-prev">Last: ${prevLabel}</div>` : ''}
        </div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">${ex.reps} reps · ${ex.rest} rest</div>
        ${Array.from({length:ex.sets},(_,s) => {
          const setData = todaySets[s];
          const prevSet = prevSession ? (prevSession.exercises?.find(e=>e.name===ex.name)?.sets?.[s]) : null;
          return `<div class="set-row">
            <span class="set-num">${s+1}</span>
            <input class="set-input" type="number" placeholder="${prevSet?.weight??'lbs'}" id="ex-${i}-${s}-w" min="0" step="0.5" value="${setData?.weight??''}">
            <span class="set-sep">×</span>
            <input class="set-input" type="number" placeholder="${prevSet?.reps??'reps'}" id="ex-${i}-${s}-r" min="0" value="${setData?.reps??''}">
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}

    <div class="field" style="margin-top:4px"><label>Notes</label>
      <textarea id="log-notes" placeholder="How did it feel? PRs?" rows="2">${editSession?.notes??''}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-sm" onclick="saveWorkoutLog('${day}', '${editLogId}')">
        ${editLogId ? 'Update Session' : 'Save Session'}
      </button>
    </div>`;
}

async function saveWorkoutLog(day, editLogId) {
  const w = WORKOUTS[day];
  const logged = w.exercises.map((ex, i) => ({
    name: ex.name,
    sets: Array.from({length:ex.sets},(_,s) => ({
      weight: document.getElementById(`ex-${i}-${s}-w`)?.value ?? '',
      reps: document.getElementById(`ex-${i}-${s}-r`)?.value ?? '',
    })),
  }));

  const payload = {
    user_id: currentUser.id, date: todayStr(),
    phase: userProfile?.current_phase ?? 1, week: userProfile?.current_week ?? 1,
    day_name: w.title, exercises: logged,
    whoop_recovery: document.getElementById('log-whoop')?.value || null,
    session_rating: parseInt(document.getElementById('log-rating')?.value) || null,
    notes: document.getElementById('log-notes')?.value ?? '',
  };

  let error;
  if (editLogId && editLogId !== 'null') {
    ({ error } = await sb.from('workout_logs').update(payload).eq('id', editLogId).eq('user_id', currentUser.id));
  } else {
    ({ error } = await sb.from('workout_logs').insert(payload));
  }

  if (error) { toast('Error: ' + error.message, 'error'); return; }
  await sb.from('checklist_logs').upsert({
    user_id: currentUser.id, date: todayStr(), item_id: 'training', item_label: 'Training session completed and logged', completed: true,
  }, { onConflict: 'user_id,date,item_id' });
  toast(editLogId && editLogId !== 'null' ? 'Session updated!' : 'Session saved!', 'success');
  // Refresh to show updated state
  await renderWorkoutDay(day);
}

// ─── STATS (Progress + Measurements) ─────────────────────────────────────────

async function renderStats() {
  const el = document.getElementById('page-stats');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  const [ckRes, wlRes, measureRes] = await Promise.all([
    sb.from('checklist_logs').select('*').eq('user_id', currentUser.id).order('date', {ascending:true}),
    sb.from('workout_logs').select('date,exercises').eq('user_id', currentUser.id).order('date', {ascending:true}),
    sb.from('measurements').select('*').eq('user_id', currentUser.id).order('date', {ascending:true}),
  ]);

  const ckData = ckRes.data ?? [];
  const wlData = wlRes.data ?? [];
  const measures = measureRes.data ?? [];
  const streaks = calcStreaks(ckData);
  const allStreaks = Object.entries(streaks).sort((a,b) => b[1]-a[1]);
  const best = allStreaks[0];
  const worst = allStreaks[allStreaks.length-1];

  const byDate = {};
  ckData.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = {total:0,done:0};
    byDate[r.date].total++;
    if (r.completed) byDate[r.date].done++;
  });
  const completionDates = Object.keys(byDate).sort();
  const completionPcts = completionDates.map(d => Math.round((byDate[d].done / Math.max(byDate[d].total,1))*100));

  const keyExData = {};
  KEY_EXERCISES.forEach(ex => { keyExData[ex] = []; });
  wlData.forEach(log => {
    (log.exercises ?? []).forEach(ex => {
      if (keyExData[ex.name] && ex.sets?.length > 0) {
        const maxW = Math.max(...ex.sets.map(s => parseFloat(s.weight)||0));
        if (maxW > 0) keyExData[ex.name].push({ date: log.date, weight: maxW });
      }
    });
  });

  const latest = measures[measures.length - 1];

  el.innerHTML = `
    <div class="page-title">Stats</div>
    <div class="page-subtitle">Progress · habits · strength</div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${wlData.length}</div><div class="stat-label">Sessions</div></div>
      <div class="stat-card"><div class="stat-val">${completionDates.length}</div><div class="stat-label">Days tracked</div></div>
      <div class="stat-card"><div class="stat-val">${best?.[1] ?? 0}</div><div class="stat-label">Best streak</div></div>
      <div class="stat-card"><div class="stat-val">${completionPcts.length>0?Math.round(completionPcts.reduce((a,b)=>a+b,0)/completionPcts.length):0}%</div><div class="stat-label">Avg habits</div></div>
    </div>

    ${best ? `<div class="infobox infobox-green">Best habit: <strong>${CHECKLIST_ITEMS.find(i=>i.id===best[0])?.label??best[0]}</strong> — ${best[1]} day streak</div>` : ''}
    ${worst?.[1]===0 ? `<div class="infobox infobox-red">Focus needed: <strong>${CHECKLIST_ITEMS.find(i=>i.id===worst[0])?.label??worst[0]}</strong></div>` : ''}

    <div class="section-title">Habit streaks</div>
    <div class="card">
      ${allStreaks.map(([id,streak]) => {
        const item = CHECKLIST_ITEMS.find(i=>i.id===id);
        return `<div class="streak-item">
          <div class="streak-label">${item?.label??id}</div>
          <div class="streak-bar"><div class="streak-fill" style="width:${Math.min(100,(streak/30)*100)}%"></div></div>
          <div class="streak-count">${streak}d</div>
        </div>`;
      }).join('')}
    </div>

    ${completionDates.length > 1 ? `
    <div class="section-title">Habit completion</div>
    <div class="chart-wrap"><div class="chart-title">Daily %</div><canvas id="chart-completion"></canvas></div>` : ''}

    ${measures.length > 0 ? `
    <div class="section-title">Latest body stats</div>
    <div class="card card-sm" style="margin-bottom:8px">
      <div class="kv-list">
        ${latest.weight_lbs ? `<div class="kv-item"><span class="kv-key">Weight</span><span>${latest.weight_lbs} lbs</span></div>` : ''}
        ${latest.body_fat_pct ? `<div class="kv-item"><span class="kv-key">Body fat</span><span>${latest.body_fat_pct}%</span></div>` : ''}
        ${latest.shoulders_cm && latest.waist_cm ? `<div class="kv-item"><span class="kv-key">V-taper ratio</span><span>${(latest.shoulders_cm/latest.waist_cm).toFixed(2)}</span></div>` : ''}
        ${latest.whoop_age ? `<div class="kv-item"><span class="kv-key">WHOOP age</span><span>${latest.whoop_age}</span></div>` : ''}
        <div class="kv-item"><span class="kv-key">Logged</span><span>${latest.date}</span></div>
      </div>
    </div>` : '<div class="infobox" style="margin-top:8px">Log body measurements via your profile (tap avatar).</div>'}

    ${measures.length > 1 ? `
    <div class="section-title">Body trends</div>
    <div class="chart-wrap"><div class="chart-title">Weight (lbs)</div><canvas id="chart-weight"></canvas></div>
    <div class="chart-grid">
      <div class="chart-wrap"><div class="chart-title">Body Fat %</div><canvas id="chart-bf"></canvas></div>
      <div class="chart-wrap"><div class="chart-title">V-Taper Ratio</div><canvas id="chart-vtaper"></canvas></div>
    </div>` : ''}

    ${KEY_EXERCISES.filter(ex=>keyExData[ex].length>1).length>0 ? `
    <div class="section-title">Strength progression</div>
    <div class="chart-grid">
      ${KEY_EXERCISES.filter(ex=>keyExData[ex].length>1).map(ex=>`
        <div class="chart-wrap"><div class="chart-title">${ex}</div><canvas id="chart-ex-${ex.replace(/\s+/g,'_')}"></canvas></div>
      `).join('')}
    </div>` : ''}`;

  setTimeout(() => {
    if (completionDates.length > 1) makeLineChart('chart-completion', completionDates, completionPcts, 'Completion %', '#c8d4f0');
    if (measures.length > 1) {
      makeLineChart('chart-weight', measures.map(m=>m.date), measures.map(m=>m.weight_lbs), 'Weight (lbs)', '#c8d4f0');
      makeLineChart('chart-bf', measures.map(m=>m.date), measures.map(m=>m.body_fat_pct), 'Body Fat %', '#c0392b');
      makeLineChart('chart-vtaper', measures.map(m=>m.date), measures.map(m=> m.shoulders_cm&&m.waist_cm?(m.shoulders_cm/m.waist_cm).toFixed(2):null), 'V-Taper Ratio', '#7b9fd4');
    }
    KEY_EXERCISES.forEach(ex => {
      const pts = keyExData[ex];
      if (pts.length > 1) makeLineChart(`chart-ex-${ex.replace(/\s+/g,'_')}`, pts.map(p=>p.date), pts.map(p=>p.weight), 'lbs', '#c8d4f0');
    });
  }, 50);
}

// ─── PROFILE / MEASUREMENTS ───────────────────────────────────────────────────

async function renderProfile() {
  const el = document.getElementById('page-profile');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  const { data } = await sb.from('measurements').select('*').eq('user_id', currentUser.id).order('date', {ascending:true});
  const records = data ?? [];
  const latest = records[records.length-1];

  el.innerHTML = `
    <div class="page-title">Body</div>
    <div class="page-subtitle">Log measurements · track composition</div>

    <div class="card" style="margin-bottom:14px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">
        Tap avatar → <strong style="color:var(--text2)">Body Measurements</strong> to return here.
      </div>
    </div>

    <div class="section-title">Log measurements</div>
    <div class="card">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="m-date" value="${todayStr()}"></div>
        <div class="field"><label>Weight (lbs)</label><input type="number" id="m-weight" placeholder="185" step="0.1" value="${latest?.weight_lbs??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Height (cm)</label><input type="number" id="m-height" placeholder="178" step="0.1" value="${latest?.height_cm??''}"></div>
        <div class="field"><label>Body Fat %</label><input type="number" id="m-bf" placeholder="15" step="0.1" value="${latest?.body_fat_pct??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Shoulders (cm)</label><input type="number" id="m-shoulders" step="0.1" value="${latest?.shoulders_cm??''}"></div>
        <div class="field"><label>Waist (cm)</label><input type="number" id="m-waist" step="0.1" value="${latest?.waist_cm??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Chest (cm)</label><input type="number" id="m-chest" step="0.1" value="${latest?.chest_cm??''}"></div>
        <div class="field"><label>Hips (cm)</label><input type="number" id="m-hips" step="0.1" value="${latest?.hips_cm??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left arm (cm)</label><input type="number" id="m-larm" step="0.1" value="${latest?.left_arm_cm??''}"></div>
        <div class="field"><label>Right arm (cm)</label><input type="number" id="m-rarm" step="0.1" value="${latest?.right_arm_cm??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left quad (cm)</label><input type="number" id="m-lquad" step="0.1" value="${latest?.left_quad_cm??''}"></div>
        <div class="field"><label>Right quad (cm)</label><input type="number" id="m-rquad" step="0.1" value="${latest?.right_quad_cm??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Left calf (cm)</label><input type="number" id="m-lcalf" step="0.1" value="${latest?.left_calf_cm??''}"></div>
        <div class="field"><label>Right calf (cm)</label><input type="number" id="m-rcalf" step="0.1" value="${latest?.right_calf_cm??''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Neck (cm)</label><input type="number" id="m-neck" step="0.1" value="${latest?.neck_cm??''}"></div>
        <div class="field"><label>WHOOP age</label><input type="number" id="m-whoopAge" step="0.1" value="${latest?.whoop_age??userProfile?.whoop_age??''}"></div>
      </div>
      <div class="field"><label>Notes</label><textarea id="m-notes" rows="2"></textarea></div>
      <div class="form-actions">
        <button class="btn btn-sm" onclick="saveMeasurement()">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('stats')">View charts →</button>
      </div>
    </div>

    ${records.length > 0 ? `
    <div class="section-title">History</div>
    <div class="table-wrap">
      <table><thead><tr><th>Date</th><th>Weight</th><th>BF%</th><th>Waist</th><th>WHOOP Age</th></tr></thead>
      <tbody>
        ${records.slice(-10).reverse().map(r=>`<tr>
          <td>${r.date}</td>
          <td>${r.weight_lbs??'—'}</td>
          <td>${r.body_fat_pct??'—'}</td>
          <td>${r.waist_cm??'—'}</td>
          <td>${r.whoop_age??'—'}</td>
        </tr>`).join('')}
      </tbody></table>
    </div>` : ''}`;
}

async function saveMeasurement() {
  const { error } = await sb.from('measurements').insert({
    user_id: currentUser.id,
    date: document.getElementById('m-date').value,
    weight_lbs: numVal('m-weight'), height_cm: numVal('m-height'),
    body_fat_pct: numVal('m-bf'), shoulders_cm: numVal('m-shoulders'),
    waist_cm: numVal('m-waist'), chest_cm: numVal('m-chest'),
    hips_cm: numVal('m-hips'), left_arm_cm: numVal('m-larm'),
    right_arm_cm: numVal('m-rarm'), left_quad_cm: numVal('m-lquad'),
    right_quad_cm: numVal('m-rquad'), left_calf_cm: numVal('m-lcalf'),
    right_calf_cm: numVal('m-rcalf'), neck_cm: numVal('m-neck'),
    whoop_age: numVal('m-whoopAge'), notes: document.getElementById('m-notes')?.value??'',
  });
  if (error) { toast('Error: '+error.message,'error'); return; }
  const age = numVal('m-whoopAge');
  if (age) await sb.from('profiles').update({whoop_age:age}).eq('id',currentUser.id);
  toast('Saved!','success');
  await renderProfile();
}

// ─── PROGRAM ──────────────────────────────────────────────────────────────────

function renderProgram() {
  const el = document.getElementById('program-content');
  if (el.innerHTML) return;

  el.innerHTML = `
    <div class="sub-tabs" style="margin-bottom:18px">
      <button class="sub-tab active" onclick="showProgramSection(this,'prog-laws')">Laws</button>
      <button class="sub-tab" onclick="showProgramSection(this,'prog-protocol')">Protocol</button>
      <button class="sub-tab" onclick="showProgramSection(this,'prog-nutrition')">Nutrition</button>
      <button class="sub-tab" onclick="showProgramSection(this,'prog-recovery')">Recovery</button>
      <button class="sub-tab" onclick="showProgramSection(this,'prog-schedule')">Schedule</button>
    </div>

    <div id="prog-laws" class="prog-section">
      <div class="card" style="padding:8px 16px">
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
          "Spade don't fold.",
        ].map((law, i) => `<div class="proto-item"><div style="font-size:12px;font-weight:700;color:var(--muted);min-width:24px">0${i+1}</div><div>${law}</div></div>`).join('')}
      </div>
    </div>

    <div id="prog-protocol" class="prog-section" style="display:none">
      <div class="section-title">Morning · 06:00–07:00</div>
      <div class="card">${['Cold shower immediately on waking · 3–5 min','No phone for first 30 minutes','Sunlight outdoors · 10–15 min','Jump rope · 5–10 min (daily, non-negotiable)','Spinal decompression AM stack','Vacuum breathing · 5 × 20s holds on empty stomach','High-protein breakfast within 60 min of waking'].map(i=>`<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}</div>
      <div class="section-title">AM Spinal Stack</div>
      <div class="table-wrap"><table><thead><tr><th>Movement</th><th>Volume</th><th>Purpose</th></tr></thead><tbody>
        ${[['Dead hang','60s × 3','Spinal traction'],['Cat-cow','15 reps','Disc hydration'],["Child's pose",'60s','Lumbar decompression'],['Cobra pose','30s × 2','Anterior spinal opening'],['Hip flexor stretch','45s each side','Pelvic tilt correction']].map(([m,v,p])=>`<tr><td>${m}</td><td>${v}</td><td style="color:var(--muted)">${p}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="section-title">Night · 21:00–22:00</div>
      <div class="card">${['Spinal decompression repeat — hang, cat-cow, child\'s pose','Legs up wall · 5 minutes','Magnesium glycinate · 400mg','Casein protein or Greek yogurt','No food 3 hours before bed','No screens 60 min before bed','Room temperature 18–20°C','Same sleep and wake time every day','Sleep on back or side — never stomach'].map(i=>`<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}</div>
    </div>

    <div id="prog-nutrition" class="prog-section" style="display:none">
      <div class="card card-sm flex-between" style="margin-bottom:8px">
        <span style="font-size:13px;color:var(--muted)">Bulk calories</span>
        <span style="font-weight:700">× 16–18 lbs bodyweight</span>
      </div>
      <div class="card card-sm flex-between" style="margin-bottom:8px">
        <span style="font-size:13px;color:var(--muted)">Cut calories</span>
        <span style="font-weight:700">× 13–15 lbs bodyweight</span>
      </div>
      <div class="card card-sm flex-between" style="margin-bottom:14px">
        <span style="font-size:13px;color:var(--muted)">Protein</span>
        <span style="font-weight:700">1g+ per lb bodyweight</span>
      </div>
      <div class="section-title">Supplements</div>
      <div class="table-wrap"><table><thead><tr><th>Supplement</th><th>Dose</th><th>Timing</th></tr></thead><tbody>
        ${[['Creatine monohydrate','5g daily','Any'],['Vitamin D3','4000–5000 IU','Morning'],['Vitamin K2','100–200mcg','With D3'],['Magnesium glycinate','400mg','Night'],['Omega-3','2–3g','With food'],['Zinc','15–25mg','With food'],['Vitamin C','500–1000mg','Any'],['Collagen peptides','10–15g','Morning']].map(([n,d,t])=>`<tr><td style="color:var(--text)">${n}</td><td>${d}</td><td style="color:var(--muted)">${t}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div id="prog-recovery" class="prog-section" style="display:none">
      <div class="card" style="margin-bottom:10px">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px">Sauna · 3–4× per week</div>
        ${['15–20 min at 80–100°C','Increases GH up to 200–300%','Reduces inflammatory markers','Decreases cortisol'].map(i=>`<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:10px">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px">Cold Exposure · Daily</div>
        ${['10–15°C for 3–5 minutes','Norepinephrine +300%','Builds psychological hardness','Avoid within 4h of training — blunts hypertrophy'].map(i=>`<div class="proto-item"><div class="proto-dot"></div>${i}</div>`).join('')}
      </div>
      <div class="section-title">Deload weeks · 5, 10, 15</div>
      <div class="infobox">Cut volume 40%. Keep same weights. Fewer sets. Supercompensation — body grows during recovery not training.</div>
    </div>

    <div id="prog-schedule" class="prog-section" style="display:none">
      <div class="section-title">Weekly split</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${[['Mon','Back Width'],['Tue','Legs Quad'],['Wed','Chest + Arms'],['Thu','Rest / Swim'],['Fri','Legs Post.'],['Sat','Shoulders'],['Sun','Arms + Abs']].map(([d,f])=>`
          <div class="card card-sm" style="text-align:center">
            <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:4px">${d}</div>
            <div style="font-size:14px;font-weight:600">${f}</div>
          </div>`).join('')}
      </div>
      <div class="section-title">20-week breakdown</div>
      <div class="table-wrap"><table><thead><tr><th>Wk</th><th>Phase</th><th>Focus</th><th>Reps</th></tr></thead>
        <tbody>${WEEK_SCHEDULE.map(w=>`<tr style="${w.deload?'color:var(--yellow)':w.peak?'color:var(--text2)':''}">
          <td>${w.week}</td><td style="color:${PHASE_COLORS[w.phase]}">${w.phase}</td>
          <td>${w.focus}</td><td>${w.reps}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>

    <div class="closing">THE ONES WHO ACHIEVED IT WERE NOT THE MOST GENETICALLY GIFTED. THEY WERE THE MOST CONSISTENT.</div>`;
}

function showProgramSection(btn, id) {
  document.querySelectorAll('.prog-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(id).style.display = 'block';
  btn.classList.add('active');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeLineChart(id, labels, data, label, color) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  const clean = data.map(v => v === null || v === undefined || v === '' ? null : Number(v));
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label, data: clean,
        borderColor: color,
        backgroundColor: color + '14',
        borderWidth: 1.5,
        fill: true,
        tension: 0.35,
        pointRadius: clean.length > 30 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#4a5568', font: { size: 9 }, maxTicksLimit: 7 }, grid: { color: '#1e2d4a' } },
        y: { ticks: { color: '#4a5568', font: { size: 9 } }, grid: { color: '#1e2d4a' } },
      },
    }
  });
}

function calcStreaks(ckData) {
  const streaks = {};
  CHECKLIST_ITEMS.forEach(item => { streaks[item.id] = 0; });
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

function numVal(id) {
  const v = document.getElementById(id)?.value;
  return v ? parseFloat(v) : null;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }
function dayOfWeek() { return new Date().toLocaleDateString('en-US', { weekday: 'long' }); }
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

async function handleSignOut() {
  if (matrixInterval) clearInterval(matrixInterval);
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) document.getElementById('user-dropdown')?.classList.remove('open');
});

document.addEventListener('DOMContentLoaded', init);
