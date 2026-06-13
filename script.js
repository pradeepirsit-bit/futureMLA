// ==================== ORIGINAL SIMULATION DATA (unchanged) ====================
const indicators = {
  povertyRate: 0.18,
  schoolAttendance: 0.86,
  waterAccess: 0.92,
  fisherDependency: 0.12,
  agParticipation: 0.28
};
const MAPPING = { baseline: 0.50, povertyImpact: -0.6, attendanceImpact: 0.8, waterImpact: 0.5, agImpact: -0.4, clampMin: 0.05, clampMax: 0.95 };
const archetypesBase = [
  { id: 'youth', name: 'Youth (18-30)', size: 0.22 },
  { id: 'farmers', name: 'Farmers', size: 0.20 },
  { id: 'fisher', name: 'Fisherfolk', size: indicators.fisherDependency },
  { id: 'women', name: 'Women', size: 0.18 },
  { id: 'seniors', name: 'Seniors', size: 0.16 },
  { id: 'business', name: 'Small Business', size: 0.12 }
];
const MOVES = {
  road:   { name: 'Repair Roads', cost: 80, effects: { farmers: 0.06, business: 0.04, seniors: 0.03 }, indicatorEffects: { povertyRate: -0.02 } },
  school: { name: 'School Grants', cost: 60, effects: { youth: 0.07, women: 0.05 }, indicatorEffects: { schoolAttendance: 0.03 } },
  water:  { name: 'Install Water Tanks', cost: 70, effects: { fisher: 0.08, women: 0.04 }, indicatorEffects: { waterAccess: 0.04 } },
  rally:  { name: 'Hold Rally', cost: 30, effects: { youth: 0.04, seniors: 0.02 }, indicatorEffects: {} },
  ad:     { name: 'Local Ads', cost: 20, effects: { business: 0.03, youth: 0.02 }, indicatorEffects: {} },
  social: { name: 'Social Media Campaign', cost: 40, effects: { youth: 0.08, business: 0.06 }, indicatorEffects: {}, reputationBoost: 3 }
};
const FUND_MOVES = {
  fundraiser: { name: 'Host Fundraiser', cost: 20, baseRaise: 120, reach: { broker: 0.6, shopOwner: 0.6, contractor: 0.5, philanthropist: 0.4 } },
  crowdfunding: { name: 'Crowdfunding Drive', cost: 5, baseRaise: 40, reach: { smallDonor: 0.9 } },
  membership: { name: 'Membership Dues Drive', cost: 0, baseRaise: 30, reach: { smallDonor: 0.6 } },
  applyGrant: { name: 'Apply for Local Grant', cost: 10, baseRaise: 200, reach: { grant: 1.0 } },
  templeAppeal: { name: 'Temple Committee Appeal', cost: 5, baseRaise: 80, reach: { temple: 0.8 } },
  shopDrive: { name: 'Shop Owners Drive', cost: 8, baseRaise: 90, reach: { shopOwner: 0.9 } }
};
const DONORS = [
  { id: 'broker', name: 'Local Broker', baseProb: 0.45, maxGift: 200, responsiveness: 0.9 },
  { id: 'shopOwner', name: 'Shop Owner', baseProb: 0.6, maxGift: 80, responsiveness: 0.8 },
  { id: 'contractor', name: 'Contractor', baseProb: 0.35, maxGift: 250, responsiveness: 0.85 },
  { id: 'union', name: 'Union Leader', baseProb: 0.3, maxGift: 120, responsiveness: 0.7 },
  { id: 'temple', name: 'Temple Committee', baseProb: 0.25, maxGift: 300, responsiveness: 0.6 },
  { id: 'philanthropist', name: 'Philanthropist', baseProb: 0.15, maxGift: 500, responsiveness: 0.8 },
  { id: 'diaspora', name: 'Diaspora', baseProb: 0.25, maxGift: 80, responsiveness: 0.7 },
  { id: 'smallDonor', name: 'Small Donor', baseProb: 0.6, maxGift: 20, responsiveness: 0.6 }
];

// ==================== REGIONAL NEWS & PROBLEMS SYSTEM (fictional, copyright-safe) ====================
const REGIONS = {
  'Chennai Central': { zone: 'chennai', regionName: 'Chennai Metro' },
  'Coimbatore South': { zone: 'west', regionName: 'Western Region' },
  'Madurai East': { zone: 'south', regionName: 'Southern Region' },
  'Tiruchirappalli West': { zone: 'central', regionName: 'Central Region' },
  'Salem North': { zone: 'north', regionName: 'Northern Region' },
  'Vellore': { zone: 'north', regionName: 'Northern Region' },
  'Tirunelveli': { zone: 'south', regionName: 'Far South Region' },
  'Erode': { zone: 'west', regionName: 'Western Region' },
  'Kanyakumari': { zone: 'south', regionName: 'Far South Region' },
  'Thanjavur': { zone: 'east', regionName: 'East Coastal Region' }
};

const regionNews = {
  chennai: [
    { headline: "Metro Water Shortage Eases After Desalination Expansion", effect: { waterAccess: 0.03, sentiment: { youth: 0.02, business: 0.02 } }, repChange: 2 },
    { headline: "IT Corridor Traffic Woes Continue – New Flyover Proposed", effect: { sentiment: { business: -0.02, youth: -0.01 } }, repChange: -1 },
    { headline: "Chennai Corporation Launches Smart Parking System", effect: { sentiment: { business: 0.03 } }, repChange: 1 },
    { headline: "Flood Prevention Works Gain Momentum After Review", effect: { sentiment: { seniors: 0.03 } }, repChange: 2 }
  ],
  north: [
    { headline: "Power Grid Upgrade in Northern Districts to Reduce Outages", effect: { sentiment: { seniors: 0.02, women: 0.02 } }, repChange: 1 },
    { headline: "Farmers in North Report Better MSP Procurement", effect: { sentiment: { farmers: 0.05 } }, repChange: 2 }
  ],
  south: [
    { headline: "New Fishing Harbour Inaugurated in Southern Coast", effect: { sentiment: { fisher: 0.06 } }, repChange: 2 },
    { headline: "Tourism Boost in Kanyakumari – Infrastructure Push", effect: { sentiment: { business: 0.04 } }, repChange: 1 }
  ],
  west: [
    { headline: "Coimbatore Textile Industry Revival Scheme", effect: { sentiment: { business: 0.05, women: 0.02 } }, repChange: 2 },
    { headline: "Western Ghats Rain Deficit Concerns Farmers", effect: { sentiment: { farmers: -0.03 } }, repChange: -1 }
  ],
  east: [
    { headline: "Coastal Erosion Threatens Villages in East", effect: { sentiment: { fisher: -0.04, seniors: -0.02 } }, repChange: -2 },
    { headline: "New Port Development in East Coast Promises Jobs", effect: { sentiment: { youth: 0.04, business: 0.03 } }, repChange: 2 }
  ],
  central: [
    { headline: "Tiruchirappalli Smart City Project Phase 2 Launched", effect: { sentiment: { youth: 0.03, business: 0.02 } }, repChange: 2 },
    { headline: "Central Districts Face Drinking Water Scarcity", effect: { sentiment: { women: -0.03, seniors: -0.02 } }, repChange: -2 }
  ]
};

const chennaiHistorical = [
  "Last year: Chennai Metro Phase 2 construction began.",
  "6 months ago: Water reservoirs reached 80% capacity after rains.",
  "3 months ago: New solid waste management plant commissioned.",
  "1 month ago: Chennai ranked high in ease of living survey."
];

function getRegionForConstituency(constituency) {
  return REGIONS[constituency] || { zone: 'central', regionName: 'Central Region' };
}

function triggerRegionalNews() {
  if (state.gameOver) return;
  if (Math.random() > 0.25) return;
  const selectedConstituency = document.getElementById('constituencySelect').value;
  const regionInfo = getRegionForConstituency(selectedConstituency);
  let newsPool = [];
  if (regionInfo.zone === 'chennai') newsPool = regionNews.chennai;
  else if (regionInfo.zone === 'north') newsPool = regionNews.north;
  else if (regionInfo.zone === 'south') newsPool = regionNews.south;
  else if (regionInfo.zone === 'west') newsPool = regionNews.west;
  else if (regionInfo.zone === 'east') newsPool = regionNews.east;
  else newsPool = regionNews.central;
  
  if (!newsPool.length) newsPool = regionNews.central;
  const news = newsPool[Math.floor(Math.random() * newsPool.length)];
  if (news.effect.waterAccess) indicators.waterAccess = clamp(indicators.waterAccess + news.effect.waterAccess, 0.5, 0.98);
  if (news.effect.sentiment) {
    Object.entries(news.effect.sentiment).forEach(([groupId, delta]) => {
      const group = state.voterGroups.find(g => g.id === groupId);
      if (group) {
        group.sentiment = clamp(group.sentiment + delta, 0, 1);
        flashSentiment(group.id);
      }
    });
  }
  if (news.repChange) state.reputation = clamp(state.reputation + news.repChange, 0, 100);
  appendLog(`📰 [${regionInfo.regionName}] ${news.headline} → Reputation ${news.repChange>=0?`+${news.repChange}`:news.repChange}`);
  if (news.effect.waterAccess) appendLog(`  💧 Water access ${news.effect.waterAccess>0?'improved':'declined'}.`);
  updateKPIs();
  renderVotersHorizontal();
  if (regionInfo.zone === 'chennai' && Math.random() < 0.2) {
    const hist = chennaiHistorical[Math.floor(Math.random() * chennaiHistorical.length)];
    appendLog(`📜 Historical note (Chennai): ${hist}`);
  }
}

// ---------- STATE ----------
let state = {
  budget: 450, partyFunds: 400, reputation: 50, corruptionScore: 0, turn: 0, daysLeft: 90,
  voterGroups: [], history: [], gameOver: false,
  microTargetGroup: null,
  opponent: { reputation: 45, partyFunds: 300 }
};
let microTargetActive = false;
let chart = null;
let playInterval = null;

// ---------- DOM refs ----------
const getEl = (id) => document.getElementById(id);
const refs = {
  moves: getEl('moves'), fundMoves: getEl('fundMoves'), donorList: getEl('donorList'),
  voterListHorizontal: getEl('voterListHorizontal'), log: getEl('log'),
  kBudget: getEl('k_budget'), kParty: getEl('k_party'), kRep: getEl('k_rep'),
  voteChart: getEl('voteChart'), playBtn: getEl('playBtn'), stepForward: getEl('stepForward'),
  speed: getEl('speed'), toggleSent: getEl('toggleSent'), toggleFunds: getEl('toggleFunds'),
  dataTable: document.querySelector('#dataTable tbody'), turnBadge: getEl('turnBadge'),
  resetBtn: getEl('resetBtn'), opponentStats: getEl('opponentStats'),
  electionResultBadge: getEl('electionResultBadge'), toggleMicroBtn: getEl('toggleMicroBtn'),
  microTargetStatus: getEl('microTargetStatus'), matchPartyBtn: getEl('matchPartyBtn'),
  transferTransparentBtn: getEl('transferTransparentBtn'), transferOpaqueBtn: getEl('transferOpaqueBtn')
};
if (!refs.dataTable) { const tbl = document.createElement('table'); tbl.id = 'dataTable'; tbl.innerHTML = '<tbody></tbody>'; document.body.appendChild(tbl); refs.dataTable = tbl.querySelector('tbody'); }

// ---------- Helpers ----------
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function now() { return new Date().toLocaleTimeString(); }
function appendLog(text) { if(refs.log) refs.log.innerHTML = `<div>[${now()}] ${text}</div>` + refs.log.innerHTML; }
function updateKPIs() {
  refs.kBudget.textContent = `₹${Math.round(state.budget)}`;
  refs.kParty.textContent = `₹${Math.round(state.partyFunds)}`;
  refs.kRep.textContent = `${Math.round(state.reputation)}`;
}
function renderVotersHorizontal() {
  if (!refs.voterListHorizontal) return;
  refs.voterListHorizontal.innerHTML = '';
  state.voterGroups.forEach(g => {
    const card = document.createElement('div'); card.className = 'voter-card';
    card.innerHTML = `<div class="voter-name">${g.name}</div><div class="voter-size">size ${(g.size*100).toFixed(0)}%</div><div class="sentiment-value" id="sent-${g.id}">${(g.sentiment*100).toFixed(0)}%</div>`;
    refs.voterListHorizontal.appendChild(card);
  });
}
function flashSentiment(id) {
  const el = document.getElementById(`sent-${id}`);
  if(el) { el.style.transform = 'scale(1.1)'; setTimeout(() => el.style.transform = '', 150); }
}
function computeInitialVoterGroups() {
  return archetypesBase.map(a => {
    let s = MAPPING.baseline;
    if(a.id === 'youth' || a.id === 'business') s += MAPPING.povertyImpact * indicators.povertyRate;
    if(a.id === 'youth' || a.id === 'women') s += MAPPING.attendanceImpact * (indicators.schoolAttendance - 0.75);
    if(a.id === 'fisher' || a.id === 'women') s += MAPPING.waterImpact * (indicators.waterAccess - 0.8);
    if(a.id === 'farmers'){ s += MAPPING.agImpact * (indicators.agParticipation - 0.2); s += MAPPING.povertyImpact * (indicators.povertyRate * 0.5); }
    return { ...a, sentiment: clamp(s, MAPPING.clampMin, MAPPING.clampMax), responsiveness: 0.5 + Math.random() * 0.6 };
  });
}
function applyDynamicIndicators(effects) {
  if(effects.povertyRate) indicators.povertyRate = clamp(indicators.povertyRate + effects.povertyRate, 0.05, 0.6);
  if(effects.schoolAttendance) indicators.schoolAttendance = clamp(indicators.schoolAttendance + effects.schoolAttendance, 0.5, 0.98);
  if(effects.waterAccess) indicators.waterAccess = clamp(indicators.waterAccess + effects.waterAccess, 0.5, 0.98);
}
function applyMove(moveKey) {
  if(state.gameOver) { appendLog("Election is over. Press Reset."); return; }
  const move = MOVES[moveKey];
  if (!move) return;
  let cost = move.cost;
  let extraCost = 0;
  let targetGroup = null;
  if(microTargetActive && state.microTargetGroup) {
    targetGroup = state.voterGroups.find(g => g.id === state.microTargetGroup.id);
    if(targetGroup) { extraCost = Math.round(cost * 0.5); cost += extraCost; }
  }
  if(cost > state.budget) { appendLog(`❌ Not enough budget for ${move.name}. Need ₹${cost}.`); return; }
  state.budget -= cost;
  let repGain = Math.round(cost / 50);
  if (move.reputationBoost) repGain += move.reputationBoost;
  state.reputation = clamp(state.reputation + repGain, 0, 100);
  applyDynamicIndicators(move.indicatorEffects || {});
  let effectsStr = '';
  Object.keys(move.effects).forEach(gid => {
    let group = state.voterGroups.find(x => x.id === gid);
    if(!group) return;
    let delta = move.effects[gid] * group.responsiveness;
    if(targetGroup && targetGroup.id === gid) delta *= 2;
    group.sentiment = clamp(group.sentiment + delta, 0, 1);
    flashSentiment(group.id);
    effectsStr += `${group.name} +${Math.round(delta*100)}% `;
  });
  appendLog(`✅ ${move.name} (₹${cost}) → ${effectsStr} | Reputation +${repGain}${extraCost ? ` (micro-target +${extraCost})` : ''}`);
  updateKPIs(); pushHistory(); updateChart(); updateTable(); updateOpponentStats();
}
function runFundMove(key) {
  if(state.gameOver) return;
  const fm = FUND_MOVES[key];
  if(fm.cost > state.budget) { appendLog(`Not enough budget for ${fm.name}.`); return; }
  state.budget -= fm.cost;
  let raised = 0;
  Object.keys(fm.reach).forEach(reachKey => {
    const reach = fm.reach[reachKey];
    const donor = DONORS.find(d => d.id === reachKey);
    if(donor){
      const prob = donor.baseProb * donor.responsiveness * (state.reputation / 100) * reach;
      if(Math.random() < prob) raised += Math.round(donor.maxGift * (0.4 + Math.random()*0.6));
    }
    if(reachKey === 'smallDonor'){
      const donorSmall = DONORS.find(d=>d.id==='smallDonor');
      const count = Math.round(10 * (state.reputation/100) * reach);
      for(let i=0;i<count;i++) if(Math.random() < donorSmall.baseProb * donorSmall.responsiveness) raised += Math.round(2+Math.random()*18);
    }
    if(reachKey === 'grant'){ const grantProb = clamp(0.5+(state.reputation-50)/200,0.1,0.95); if(Math.random()<grantProb) raised += fm.baseRaise; }
  });
  if(key === 'crowdfunding') raised = Math.round(raised*0.92);
  state.partyFunds += raised;
  appendLog(`💰 ${fm.name} raised ₹${raised} → Party Funds +₹${raised}`);
  updateKPIs(); pushHistory(); updateTable();
}
function simulateDirectDonation(donorId){
  if(state.gameOver) return;
  const donor = DONORS.find(d=>d.id===donorId);
  if(!donor) return;
  const prob = donor.baseProb * donor.responsiveness * (state.reputation/100);
  if(Math.random()<prob){ const gift = Math.round(donor.maxGift*(0.4+Math.random()*0.6)); state.partyFunds+=gift; appendLog(`💎 ${donor.name} donated ₹${gift}.`); }
  else appendLog(`❌ ${donor.name} declined.`);
  updateKPIs(); pushHistory(); updateTable();
}
window.simulateDirectDonation = simulateDirectDonation;
function requestPartyMatch(){
  if(state.gameOver) return;
  const matchRate = 0.5*(state.reputation/100);
  const requested = Math.round(state.budget*0.2);
  const match = Math.min(Math.round(requested*matchRate), state.partyFunds);
  if(match<=0){ appendLog('Party declined to match funds.'); return; }
  state.partyFunds -= match; state.budget += match;
  appendLog(`🤝 Party matched ₹${match} → campaign budget +₹${match}`);
  updateKPIs(); pushHistory(); updateChart(); updateTable();
}
function transferFromParty(transparency){
  if(state.gameOver) return;
  const amount = Math.min(Math.round(state.partyFunds*0.5), 400);
  if(amount<=0){ appendLog('No party funds.'); return; }
  state.partyFunds -= amount; state.budget += amount;
  if(transparency === 'transparent'){ appendLog(`🔓 Transparent transfer: ₹${amount} moved.`); }
  else { state.corruptionScore += 0.08; state.reputation = clamp(state.reputation-6,0,100); appendLog(`⚠️ Opaque transfer: ₹${amount}. Corruption +0.08, Rep -6.`); checkForAudit(); }
  updateKPIs(); pushHistory(); updateChart(); updateTable();
}
function checkForAudit(){
  let prob = 0.002 + state.corruptionScore*0.18 - (state.reputation/100)*0.01;
  if(Math.random() < prob){ const frozen = Math.round(state.partyFunds*0.5); state.partyFunds -= frozen; state.reputation = clamp(state.reputation-12,0,100); appendLog(`🔍 AUDIT: ₹${frozen} frozen. Rep -12.`); updateKPIs(); pushHistory(); updateTable(); }
}
function opponentMove(){
  if(state.gameOver) return;
  state.opponent.reputation = clamp(state.opponent.reputation + (Math.random()*2 - 0.5), 20, 80);
  const moveKeys = Object.keys(MOVES);
  const randomMove = MOVES[moveKeys[Math.floor(Math.random()*moveKeys.length)]];
  if(state.opponent.partyFunds >= randomMove.cost){
    state.opponent.partyFunds -= randomMove.cost;
    state.opponent.reputation = clamp(state.opponent.reputation + 1, 0, 100);
    appendLog(`🤖 OPPONENT: ${randomMove.name} → their reputation +1`);
  }
  updateOpponentStats();
}
function updateOpponentStats(){
  const oppVote = computeOpponentVoteShare();
  refs.opponentStats.innerHTML = `Reputation: ${Math.round(state.opponent.reputation)} | Estimated vote: ${(oppVote*100).toFixed(1)}%`;
}
function computeOpponentVoteShare(){ return clamp(0.3 + (state.opponent.reputation/100)*0.3, 0.2, 0.7); }
function endTurn(){
  if(state.gameOver) return;
  if(state.daysLeft <= 0){ declareElectionResult(); return; }
  state.daysLeft--;
  state.turn++;
  refs.turnBadge.textContent = `DAY ${90-state.daysLeft} / 90`;
  state.voterGroups.forEach(g => { const drift = (Math.random()*0.02)*(Math.random()>0.85?-1:1); g.sentiment = clamp(g.sentiment + drift, 0, 1); flashSentiment(g.id); });
  const passive = Math.round((state.reputation/100)*8);
  state.partyFunds += passive;
  appendLog(`🌙 Day ${90-state.daysLeft} ended. Passive income +₹${passive}.`);
  opponentMove();
  triggerRegionalNews();
  renderVotersHorizontal();
  pushHistory(); updateChart(); updateTable(); updateKPIs(); updateOpponentStats();
  if(state.daysLeft === 0) declareElectionResult();
}
function declareElectionResult(){
  state.gameOver = true;
  if(playInterval) clearInterval(playInterval);
  const playerShare = computePlayerVoteShare();
  const oppShare = computeOpponentVoteShare();
  const won = playerShare > oppShare;
  refs.electionResultBadge.innerHTML = won ? "🏆 YOU WIN!" : "😞 YOU LOST";
  appendLog(`📢 ELECTION RESULT: Your vote ${(playerShare*100).toFixed(1)}% vs Opponent ${(oppShare*100).toFixed(1)}%. ${won ? "YOU WON!" : "YOU LOST."}`);
  if(refs.playBtn) refs.playBtn.disabled = true;
  if(refs.stepForward) refs.stepForward.disabled = true;
}
function computePlayerVoteShare(){ return clamp(state.voterGroups.reduce((a,g)=>a + g.sentiment * g.size, 0), 0.2, 0.85); }
function pushHistory(){
  state.history.push({ turn: state.turn, budget: state.budget, partyFunds: state.partyFunds, rep: state.reputation,
    groups: state.voterGroups.map(g=>({id:g.id, sentiment:g.sentiment})) });
  if(state.history.length > 30) state.history.shift();
}
function updateTable(){
  if(!refs.dataTable) return;
  refs.dataTable.innerHTML = '';
  state.history.slice(-10).forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${h.turn}</td><td>₹${Math.round(h.budget)}</td><td>₹${Math.round(h.partyFunds)}</td><td>${Math.round(h.rep)}</td><td>-</td>`;
    refs.dataTable.appendChild(tr);
  });
}
function randomColorFor(id){ const map={ youth:'#0b6efd', farmers:'#ef4444', fisher:'#06b6d4', women:'#a78bfa', seniors:'#f59e0b', business:'#10b981' }; return map[id]||'#64748b'; }
function rebuildChart() {
  if(!refs.voteChart) return;
  const labels = state.history.map((_, idx) => `D${idx}`);
  const datasets = state.voterGroups.map(g => ({ label: g.name, data: [], borderColor: randomColorFor(g.id), borderWidth: 2, fill: false, tension: 0.2 }));
  state.history.forEach((snap, idx) => {
    const weighted = snap.groups.reduce((sum, g) => sum + g.sentiment * (archetypesBase.find(a=>a.id===g.id)?.size || 0), 0);
    state.voterGroups.forEach(g => {
      const groupSnap = snap.groups.find(gs => gs.id === g.id);
      const sent = groupSnap ? groupSnap.sentiment : 0.5;
      const share = weighted > 0 ? (sent * g.size / weighted) * 100 : g.size * 100;
      datasets.find(ds => ds.label === g.name).data.push(share);
    });
  });
  if(refs.toggleSent && refs.toggleSent.checked) {
    const avgData = state.history.map(snap => snap.groups.reduce((a,b)=>a+b.sentiment,0)/snap.groups.length * 100);
    datasets.push({ label: 'Avg Sentiment (%)', data: avgData, borderColor: '#16a34a', borderWidth: 2, fill: false });
  }
  if(refs.toggleFunds && refs.toggleFunds.checked) {
    const fundsData = state.history.map(snap => Math.min(100, snap.partyFunds / 10));
    datasets.push({ label: 'Party Funds (scaled)', data: fundsData, borderColor: '#f97316', borderWidth: 2, fill: false });
  }
  if(chart) chart.destroy();
  chart = new Chart(refs.voteChart, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, max: 100 } } } });
}
function updateChart() { rebuildChart(); }
function renderMovesAndDonors() {
  if(refs.moves) {
    refs.moves.innerHTML = '';
    Object.keys(MOVES).forEach(k => {
      const m = MOVES[k];
      const btn = document.createElement('button'); btn.className = 'btn-neon';
      let tooltip = `📈 Effects: ${Object.entries(m.effects).map(([g,val])=>`${g}+${Math.round(val*100)}%`).join(', ')}`;
      if (m.reputationBoost) tooltip += ` | Rep +${m.reputationBoost}`;
      btn.innerHTML = `${m.name} — ₹${m.cost}<span class="tooltip-text">${tooltip}</span>`;
      btn.onclick = () => applyMove(k);
      refs.moves.appendChild(btn);
    });
  }
  if(refs.fundMoves) {
    refs.fundMoves.innerHTML = '';
    Object.keys(FUND_MOVES).forEach(k => {
      const fm = FUND_MOVES[k];
      const btn = document.createElement('button'); btn.className = 'btn-neon';
      btn.textContent = `${fm.name} — ₹${fm.cost}`;
      btn.onclick = () => runFundMove(k);
      refs.fundMoves.appendChild(btn);
    });
  }
  if(refs.donorList) {
    refs.donorList.innerHTML = '';
    DONORS.forEach(d => {
      const div = document.createElement('div'); div.className = 'donor-item';
      div.innerHTML = `<div><strong>${d.name}</strong><div class="sub">Max ₹${d.maxGift}</div></div><div><button class="btn-neon" style="padding:4px 12px;" onclick="simulateDirectDonation('${d.id}')">Solicit</button></div>`;
      refs.donorList.appendChild(div);
    });
  }
}
function resetSimulation() {
  if(playInterval) { clearInterval(playInterval); playInterval = null; if(refs.playBtn) refs.playBtn.textContent = 'Play'; }
  state = {
    budget: 450, partyFunds: 400, reputation: 50, corruptionScore: 0, turn: 0, daysLeft: 90,
    voterGroups: computeInitialVoterGroups(), history: [], gameOver: false,
    microTargetGroup: null,
    opponent: { reputation: 45, partyFunds: 300 }
  };
  microTargetActive = false;
  if(refs.toggleMicroBtn) refs.toggleMicroBtn.innerHTML = '<i class="fas fa-bullseye"></i> Micro-target OFF';
  if(refs.microTargetStatus) refs.microTargetStatus.innerHTML = '';
  if(refs.log) refs.log.innerHTML = '';
  renderVotersHorizontal();
  renderMovesAndDonors();
  updateKPIs();
  pushHistory();
  rebuildChart();
  updateTable();
  updateOpponentStats();
  if(refs.electionResultBadge) refs.electionResultBadge.innerHTML = '';
  if(refs.turnBadge) refs.turnBadge.textContent = "DAY 0 / 90";
  if(refs.playBtn) refs.playBtn.disabled = false;
  if(refs.stepForward) refs.stepForward.disabled = false;
  appendLog("Simulation reset. Regional news system active – watch for constituency-specific events!");
}
function bindEvents() {
  if(refs.playBtn) refs.playBtn.addEventListener('click', () => {
    if(playInterval){ clearInterval(playInterval); playInterval=null; refs.playBtn.textContent='Play'; }
    else { refs.playBtn.textContent='Pause'; playInterval = setInterval(()=> endTurn(), Number(refs.speed.value)); }
  });
  if(refs.stepForward) refs.stepForward.addEventListener('click', endTurn);
  if(refs.resetBtn) refs.resetBtn.addEventListener('click', resetSimulation);
  if(refs.speed) refs.speed.addEventListener('input', () => { if(playInterval){ clearInterval(playInterval); playInterval = setInterval(()=> endTurn(), Number(refs.speed.value)); } });
  if(refs.toggleSent) refs.toggleSent.addEventListener('change', () => rebuildChart());
  if(refs.toggleFunds) refs.toggleFunds.addEventListener('change', () => rebuildChart());
  if(refs.matchPartyBtn) refs.matchPartyBtn.addEventListener('click', requestPartyMatch);
  if(refs.transferTransparentBtn) refs.transferTransparentBtn.addEventListener('click', () => transferFromParty('transparent'));
  if(refs.transferOpaqueBtn) refs.transferOpaqueBtn.addEventListener('click', () => transferFromParty('opaque'));
  if(refs.toggleMicroBtn) refs.toggleMicroBtn.addEventListener('click', () => {
    microTargetActive = !microTargetActive;
    if(microTargetActive){
      const chosen = state.voterGroups[Math.floor(Math.random()*state.voterGroups.length)];
      state.microTargetGroup = { id: chosen.id, name: chosen.name };
      refs.microTargetStatus.innerHTML = `🎯 Targeting ${chosen.name} (extra 50% cost, double effect)`;
      refs.toggleMicroBtn.innerHTML = '<i class="fas fa-bullseye"></i> Micro-target ON';
    } else {
      state.microTargetGroup = null;
      refs.microTargetStatus.innerHTML = '';
      refs.toggleMicroBtn.innerHTML = '<i class="fas fa-bullseye"></i> Micro-target OFF';
    }
  });
  const tipBtn = document.getElementById('tipButton');
  if(tipBtn) {
    const tips = ["💡 Different constituencies have unique regional news events – respond quickly!", "💡 Chennai zone has historical context based on past year trends.", "💡 Social Media Campaign boosts Youth & Business plus reputation.", "💡 Micro-targeting doubles effect on one group – use before big moves.", "💡 Reputation below 30 hurts fundraising. Protect it!", "💡 Regional news can shift voter sentiment – adapt your strategy."];
    tipBtn.addEventListener('click', () => appendLog(`✨ TIP: ${tips[Math.floor(Math.random()*tips.length)]}`));
  }
}
resetSimulation();
bindEvents();