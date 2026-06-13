// ==================== FULL ORIGINAL SIMULATION LOGIC (unchanged) ====================
// All core game data, state, moves, fundraising, donors, etc. are preserved.
const indicators = {
  povertyRate: 0.18,
  schoolAttendance: 0.86,
  waterAccess: 0.92,
  fisherDependency: 0.12,
  agParticipation: 0.28
};
const MAPPING = { baseline: 0.50, povertyImpact: -0.6, attendanceImpact: 0.8, waterImpact: 0.5, agImpact: -0.4, clampMin: 0.05, clampMax: 0.95 };
const archetypesBase = [
  { id: 'youth', name: 'Youth', size: 0.22 },
  { id: 'farmers', name: 'Farmers', size: 0.20 },
  { id: 'fisher', name: 'Fisherfolk', size: indicators.fisherDependency },
  { id: 'women', name: 'Women', size: 0.18 },
  { id: 'seniors', name: 'Seniors', size: 0.16 },
  { id: 'business', name: 'Business', size: 0.12 }
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

// Regional news (fictional, safe)
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
const regionNews = { chennai:[{headline:"Metro Water Shortage Eases", effect:{waterAccess:0.03}, repChange:2}], north:[{headline:"Power Grid Upgrade", effect:{}, repChange:1}], south:[{headline:"New Fishing Harbour", effect:{}, repChange:2}], west:[{headline:"Textile Revival", effect:{}, repChange:2}], east:[{headline:"Coastal Erosion Threat", effect:{}, repChange:-2}], central:[{headline:"Smart City Project", effect:{}, repChange:2}] };
regionNews.chennai = regionNews.chennai || [];
function getRegionForConstituency(c){ return REGIONS[c]||{zone:'central',regionName:'Central'}; }
function triggerRegionalNews(){ if(state.gameOver || Math.random()>0.25) return; const sel=document.getElementById('constituencySelect').value; const ri=getRegionForConstituency(sel); let pool=regionNews[ri.zone]||regionNews.central; if(!pool.length) pool=regionNews.central; const news=pool[Math.floor(Math.random()*pool.length)]; if(news.effect?.waterAccess) indicators.waterAccess=clamp(indicators.waterAccess+news.effect.waterAccess,0.5,0.98); if(news.repChange) state.reputation=clamp(state.reputation+news.repChange,0,100); appendLog(`📰 [${ri.regionName}] ${news.headline} → Rep ${news.repChange>=0?`+${news.repChange}`:news.repChange}`); updateKPIs(); renderVotersHorizontal(); }

let state = { budget:450, partyFunds:400, reputation:50, corruptionScore:0, turn:0, daysLeft:90, voterGroups:[], history:[], gameOver:false, microTargetGroup:null, opponent:{reputation:45,partyFunds:300} };
let microTargetActive=false, chart=null, playInterval=null;
const refs = {};
['moves','fundMoves','donorList','voterListHorizontal','log','kBudget','kParty','kRep','voteChart','playBtn','stepForward','speed','toggleSent','toggleFunds','turnBadge','resetBtn','opponentStats','electionResultBadge','toggleMicroBtn','microTargetStatus','matchPartyBtn','transferTransparentBtn','transferOpaqueBtn','dataTable'].forEach(id=>{ refs[id]=document.getElementById(id); });
if(!refs.dataTable){ const tbl=document.createElement('table'); tbl.id='dataTable'; tbl.innerHTML='<tbody></tbody>'; document.body.appendChild(tbl); refs.dataTable=tbl.querySelector('tbody'); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function now(){ return new Date().toLocaleTimeString(); }
function appendLog(text){ if(refs.log) refs.log.innerHTML=`<div>[${now()}] ${text}</div>`+refs.log.innerHTML; }
function updateKPIs(){ refs.kBudget.textContent=`₹${Math.round(state.budget)}`; refs.kParty.textContent=`₹${Math.round(state.partyFunds)}`; refs.kRep.textContent=`${Math.round(state.reputation)}`; }
function renderVotersHorizontal(){ if(!refs.voterListHorizontal) return; refs.voterListHorizontal.innerHTML=''; state.voterGroups.forEach(g=>{ const card=document.createElement('div'); card.className='voter-card'; card.innerHTML=`<div class="voter-name">${g.name}</div><div class="voter-size">${(g.size*100).toFixed(0)}%</div><div class="sentiment-value" id="sent-${g.id}">${(g.sentiment*100).toFixed(0)}%</div>`; refs.voterListHorizontal.appendChild(card); }); }
function flashSentiment(id){ const el=document.getElementById(`sent-${id}`); if(el){ el.style.transform='scale(1.1)'; setTimeout(()=>el.style.transform='',150); } }
function computeInitialVoterGroups(){ return archetypesBase.map(a=>{ let s=MAPPING.baseline; if(a.id==='youth'||a.id==='business') s+=MAPPING.povertyImpact*indicators.povertyRate; if(a.id==='youth'||a.id==='women') s+=MAPPING.attendanceImpact*(indicators.schoolAttendance-0.75); if(a.id==='fisher'||a.id==='women') s+=MAPPING.waterImpact*(indicators.waterAccess-0.8); if(a.id==='farmers'){ s+=MAPPING.agImpact*(indicators.agParticipation-0.2); s+=MAPPING.povertyImpact*(indicators.povertyRate*0.5); } return {...a, sentiment:clamp(s,MAPPING.clampMin,MAPPING.clampMax), responsiveness:0.5+Math.random()*0.6}; }); }
function applyDynamicIndicators(effects){ if(effects.povertyRate) indicators.povertyRate=clamp(indicators.povertyRate+effects.povertyRate,0.05,0.6); if(effects.schoolAttendance) indicators.schoolAttendance=clamp(indicators.schoolAttendance+effects.schoolAttendance,0.5,0.98); if(effects.waterAccess) indicators.waterAccess=clamp(indicators.waterAccess+effects.waterAccess,0.5,0.98); }
function applyMove(moveKey){ if(state.gameOver){ appendLog("Election over. Press Reset."); return; } const move=MOVES[moveKey]; if(!move) return; let cost=move.cost, extraCost=0, targetGroup=null; if(microTargetActive && state.microTargetGroup){ targetGroup=state.voterGroups.find(g=>g.id===state.microTargetGroup.id); if(targetGroup){ extraCost=Math.round(cost*0.5); cost+=extraCost; } } if(cost>state.budget){ appendLog(`❌ Not enough budget for ${move.name}. Need ₹${cost}.`); return; } state.budget-=cost; let repGain=Math.round(cost/50); if(move.reputationBoost) repGain+=move.reputationBoost; state.reputation=clamp(state.reputation+repGain,0,100); applyDynamicIndicators(move.indicatorEffects||{}); let effectsStr=''; Object.keys(move.effects).forEach(gid=>{ let group=state.voterGroups.find(x=>x.id===gid); if(!group) return; let delta=move.effects[gid]*group.responsiveness; if(targetGroup && targetGroup.id===gid) delta*=2; group.sentiment=clamp(group.sentiment+delta,0,1); flashSentiment(group.id); effectsStr+=`${group.name}+${Math.round(delta*100)}% `; }); appendLog(`✅ ${move.name} (₹${cost}) → ${effectsStr} | Rep +${repGain}${extraCost?` (micro-target +${extraCost})`:''}`); updateKPIs(); pushHistory(); updateChart(); updateTable(); updateOpponentStats(); }
function runFundMove(key){ if(state.gameOver) return; const fm=FUND_MOVES[key]; if(fm.cost>state.budget){ appendLog(`Not enough budget for ${fm.name}.`); return; } state.budget-=fm.cost; let raised=0; Object.keys(fm.reach).forEach(rk=>{ const reach=fm.reach[rk]; const donor=DONORS.find(d=>d.id===rk); if(donor){ const prob=donor.baseProb*donor.responsiveness*(state.reputation/100)*reach; if(Math.random()<prob) raised+=Math.round(donor.maxGift*(0.4+Math.random()*0.6)); } if(rk==='smallDonor'){ const ds=DONORS.find(d=>d.id==='smallDonor'); const count=Math.round(10*(state.reputation/100)*reach); for(let i=0;i<count;i++) if(Math.random()<ds.baseProb*ds.responsiveness) raised+=Math.round(2+Math.random()*18); } if(rk==='grant'){ const gp=clamp(0.5+(state.reputation-50)/200,0.1,0.95); if(Math.random()<gp) raised+=fm.baseRaise; } }); if(key==='crowdfunding') raised=Math.round(raised*0.92); state.partyFunds+=raised; appendLog(`💰 ${fm.name} raised ₹${raised} → Party Funds +₹${raised}`); updateKPIs(); pushHistory(); updateTable(); }
function simulateDirectDonation(donorId){ if(state.gameOver) return; const donor=DONORS.find(d=>d.id===donorId); if(!donor) return; const prob=donor.baseProb*donor.responsiveness*(state.reputation/100); if(Math.random()<prob){ const gift=Math.round(donor.maxGift*(0.4+Math.random()*0.6)); state.partyFunds+=gift; appendLog(`💎 ${donor.name} donated ₹${gift}.`); } else appendLog(`❌ ${donor.name} declined.`); updateKPIs(); pushHistory(); updateTable(); }
window.simulateDirectDonation = simulateDirectDonation;
function requestPartyMatch(){ if(state.gameOver) return; const matchRate=0.5*(state.reputation/100); const requested=Math.round(state.budget*0.2); const match=Math.min(Math.round(requested*matchRate), state.partyFunds); if(match<=0){ appendLog('Party declined to match funds.'); return; } state.partyFunds-=match; state.budget+=match; appendLog(`🤝 Party matched ₹${match} → campaign budget +₹${match}`); updateKPIs(); pushHistory(); updateChart(); updateTable(); }
function transferFromParty(transparency){ if(state.gameOver) return; const amount=Math.min(Math.round(state.partyFunds*0.5),400); if(amount<=0){ appendLog('No party funds.'); return; } state.partyFunds-=amount; state.budget+=amount; if(transparency==='transparent'){ appendLog(`🔓 Transparent transfer: ₹${amount} moved.`); }else{ state.corruptionScore+=0.08; state.reputation=clamp(state.reputation-6,0,100); appendLog(`⚠️ Opaque transfer: ₹${amount}. Corruption +0.08, Rep -6.`); checkForAudit(); } updateKPIs(); pushHistory(); updateChart(); updateTable(); }
function checkForAudit(){ let prob=0.002+state.corruptionScore*0.18-(state.reputation/100)*0.01; if(Math.random()<prob){ const frozen=Math.round(state.partyFunds*0.5); state.partyFunds-=frozen; state.reputation=clamp(state.reputation-12,0,100); appendLog(`🔍 AUDIT: ₹${frozen} frozen. Rep -12.`); updateKPIs(); pushHistory(); updateTable(); } }
function opponentMove(){ if(state.gameOver) return; state.opponent.reputation=clamp(state.opponent.reputation+(Math.random()*2-0.5),20,80); const moveKeys=Object.keys(MOVES); const randomMove=MOVES[moveKeys[Math.floor(Math.random()*moveKeys.length)]]; if(state.opponent.partyFunds>=randomMove.cost){ state.opponent.partyFunds-=randomMove.cost; state.opponent.reputation=clamp(state.opponent.reputation+1,0,100); appendLog(`🤖 OPPONENT: ${randomMove.name} → their reputation +1`); } updateOpponentStats(); }
function updateOpponentStats(){ const oppVote=computeOpponentVoteShare(); refs.opponentStats.innerHTML=`Reputation: ${Math.round(state.opponent.reputation)} | Vote: ${(oppVote*100).toFixed(1)}%`; }
function computeOpponentVoteShare(){ return clamp(0.3+(state.opponent.reputation/100)*0.3,0.2,0.7); }
function endTurn(){ if(state.gameOver) return; if(state.daysLeft<=0){ declareElectionResult(); return; } state.daysLeft--; state.turn++; refs.turnBadge.textContent=`DAY ${90-state.daysLeft} / 90`; state.voterGroups.forEach(g=>{ const drift=(Math.random()*0.02)*(Math.random()>0.85?-1:1); g.sentiment=clamp(g.sentiment+drift,0,1); flashSentiment(g.id); }); const passive=Math.round((state.reputation/100)*8); state.partyFunds+=passive; appendLog(`🌙 Day ${90-state.daysLeft} ended. Passive income +₹${passive}.`); opponentMove(); triggerRegionalNews(); renderVotersHorizontal(); pushHistory(); updateChart(); updateTable(); updateKPIs(); updateOpponentStats(); if(state.daysLeft===0) declareElectionResult(); }
function declareElectionResult(){ state.gameOver=true; if(playInterval) clearInterval(playInterval); const playerShare=computePlayerVoteShare(); const oppShare=computeOpponentVoteShare(); const won=playerShare>oppShare; refs.electionResultBadge.innerHTML=won?"🏆 YOU WIN!":"😞 YOU LOST"; appendLog(`📢 ELECTION RESULT: Your vote ${(playerShare*100).toFixed(1)}% vs Opponent ${(oppShare*100).toFixed(1)}%. ${won?"YOU WON!":"YOU LOST."}`); if(refs.playBtn) refs.playBtn.disabled=true; if(refs.stepForward) refs.stepForward.disabled=true; }
function computePlayerVoteShare(){ return clamp(state.voterGroups.reduce((a,g)=>a+g.sentiment*g.size,0),0.2,0.85); }
function pushHistory(){ state.history.push({ turn:state.turn, budget:state.budget, partyFunds:state.partyFunds, rep:state.reputation, groups:state.voterGroups.map(g=>({id:g.id,sentiment:g.sentiment})) }); if(state.history.length>30) state.history.shift(); }
function updateTable(){ if(!refs.dataTable) return; refs.dataTable.innerHTML=''; state.history.slice(-10).forEach(h=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${h.turn}<\/td><td>₹${Math.round(h.budget)}<\/td><td>₹${Math.round(h.partyFunds)}<\/td><td>${Math.round(h.rep)}<\/td><td>-<\/td>`; refs.dataTable.appendChild(tr); }); }
function randomColorFor(id){ const map={ youth:'#3b82f6', farmers:'#ef4444', fisher:'#06b6d4', women:'#a78bfa', seniors:'#f59e0b', business:'#10b981' }; return map[id]||'#64748b'; }
function rebuildChart() {
  if(!refs.voteChart) return;
  const labels = state.history.map((_,idx)=>`D${idx}`);
  const datasets = state.voterGroups.map(g=>({ label:g.name, data:[], borderColor:randomColorFor(g.id), borderWidth:2, fill:false, tension:0.2 }));
  state.history.forEach(snap=>{
    const weighted = snap.groups.reduce((sum,g)=>sum + g.sentiment * (archetypesBase.find(a=>a.id===g.id)?.size||0),0);
    state.voterGroups.forEach(g=>{
      const groupSnap = snap.groups.find(gs=>gs.id===g.id);
      const sent = groupSnap ? groupSnap.sentiment : 0.5;
      const share = weighted>0 ? (sent * g.size / weighted)*100 : g.size*100;
      datasets.find(ds=>ds.label===g.name).data.push(share);
    });
  });
  if(refs.toggleSent && refs.toggleSent.checked) {
    const avgData = state.history.map(snap=>snap.groups.reduce((a,b)=>a+b.sentiment,0)/snap.groups.length*100);
    datasets.push({ label:'Avg Sentiment (%)', data:avgData, borderColor:'#16a34a', borderWidth:2, fill:false });
  }
  if(refs.toggleFunds && refs.toggleFunds.checked) {
    const fundsData = state.history.map(snap=>Math.min(100, snap.partyFunds/10));
    datasets.push({ label:'Party Funds (scaled)', data:fundsData, borderColor:'#f97316', borderWidth:2, fill:false });
  }
  if(chart) chart.destroy();
  chart = new Chart(refs.voteChart, { type:'line', data:{ labels, datasets }, options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ position:'bottom', labels:{ font:{ size:10 } } }, tooltip:{ mode:'index', intersect:false } }, scales:{ y:{ beginAtZero:true, max:100, title:{ display:true, text:'Share / Value', font:{ size:10 } } } } } });
}
function updateChart(){ rebuildChart(); }
function renderMovesAndDonors() {
  if(refs.moves){ refs.moves.innerHTML=''; Object.keys(MOVES).forEach(k=>{ const m=MOVES[k]; const btn=document.createElement('button'); btn.className='btn-minimal'; btn.title=`Effects: ${Object.entries(m.effects).map(([g,val])=>`${g}+${Math.round(val*100)}%`).join(', ')}${m.reputationBoost?` | Rep +${m.reputationBoost}`:''}`; btn.innerHTML=`${m.name} — ₹${m.cost}`; btn.onclick=()=>applyMove(k); refs.moves.appendChild(btn); }); }
  if(refs.fundMoves){ refs.fundMoves.innerHTML=''; Object.keys(FUND_MOVES).forEach(k=>{ const fm=FUND_MOVES[k]; const btn=document.createElement('button'); btn.className='btn-minimal'; btn.textContent=`${fm.name} — ₹${fm.cost}`; btn.onclick=()=>runFundMove(k); refs.fundMoves.appendChild(btn); }); }
  if(refs.donorList){ refs.donorList.innerHTML=''; DONORS.forEach(d=>{ const div=document.createElement('div'); div.className='donor-item'; div.innerHTML=`<div><strong>${d.name}</strong><div style="font-size:0.7rem;">Max ₹${d.maxGift}</div></div><div><button class="btn-minimal" style="padding:0.2rem 0.6rem;" onclick="simulateDirectDonation('${d.id}')">Solicit</button></div>`; refs.donorList.appendChild(div); }); }
}
function resetSimulation() { if(playInterval){ clearInterval(playInterval); playInterval=null; if(refs.playBtn) refs.playBtn.textContent='Play'; } state = { budget:450, partyFunds:400, reputation:50, corruptionScore:0, turn:0, daysLeft:90, voterGroups:computeInitialVoterGroups(), history:[], gameOver:false, microTargetGroup:null, opponent:{ reputation:45, partyFunds:300 } }; microTargetActive=false; if(refs.toggleMicroBtn) refs.toggleMicroBtn.textContent='Micro-target OFF'; if(refs.microTargetStatus) refs.microTargetStatus.innerHTML=''; if(refs.log) refs.log.innerHTML=''; renderVotersHorizontal(); renderMovesAndDonors(); updateKPIs(); pushHistory(); rebuildChart(); updateTable(); updateOpponentStats(); if(refs.electionResultBadge) refs.electionResultBadge.innerHTML=''; if(refs.turnBadge) refs.turnBadge.textContent="DAY 0 / 90"; if(refs.playBtn) refs.playBtn.disabled=false; if(refs.stepForward) refs.stepForward.disabled=false; appendLog("Simulation reset. New: API tips & auto-play with monetisation."); }

// ==================== NEW FEATURES: API TIPS, AUTO-PLAY, MONETISATION ====================
let freeTipsLeft = 3;
let freeAutoLeft = 3;
const tipCost = 20;    // campaign budget
const autoCost = 50;

async function fetchPoliticalTip() {
  const constituency = document.getElementById('constituencySelect').value;
  const region = getRegionForConstituency(constituency).regionName;
  try {
    // Using free GNews API demo endpoint (limited but works for demo)
    // No API key required for demo – returns sample data. Replace with your own key for production.
    const url = `https://gnews.io/api/v4/search?q=politics%20tamil%20nadu%20${encodeURIComponent(constituency)}&lang=en&country=in&max=1&token=demo`;
    const res = await fetch(url);
    const data = await res.json();
    let headline = "No political news found.";
    if(data.articles && data.articles.length>0) {
      headline = data.articles[0].title;
    } else {
      // fallback mock
      headline = `${region}: Government announces new infrastructure plan.`;
    }
    return `📰 ${headline}`;
  } catch(e) {
    console.warn("API error, using fallback", e);
    return `📰 ${region}: Local civic budget review scheduled.`;
  }
}

async function getTipWithCost() {
  if(state.gameOver){
    appendLog("Election over. Cannot request tips.");
    return;
  }
  if(freeTipsLeft > 0){
    freeTipsLeft--;
    const tipText = await fetchPoliticalTip();
    appendLog(`💡 FREE TIP (${3-freeTipsLeft}/3): ${tipText}`);
    document.getElementById('tipCostInfo').innerHTML = `✨ Tips left: ${freeTipsLeft} free · then ₹${tipCost} each`;
    return;
  }
  if(state.budget >= tipCost){
    state.budget -= tipCost;
    updateKPIs();
    const tipText = await fetchPoliticalTip();
    appendLog(`💰 Paid tip (₹${tipCost}): ${tipText}`);
    document.getElementById('tipCostInfo').innerHTML = `✨ Tips left: 0 free · ₹${tipCost} each (budget ₹${Math.round(state.budget)})`;
  } else {
    appendLog(`❌ Not enough campaign budget for tip (need ₹${tipCost}).`);
  }
}

function autoPlayTurn() {
  if(state.gameOver){
    appendLog("Election over. Cannot auto-play.");
    return;
  }
  if(freeAutoLeft > 0){
    freeAutoLeft--;
    appendLog(`🤖 AUTO-PLAY (free, ${3-freeAutoLeft}/3 used) – simulating a random move...`);
    const movesKeys = Object.keys(MOVES);
    const randomMoveKey = movesKeys[Math.floor(Math.random() * movesKeys.length)];
    applyMove(randomMoveKey);
    document.getElementById('autoCostInfo').innerHTML = `🤖 Auto turns left: ${freeAutoLeft} free · then ₹${autoCost} each`;
    return;
  }
  if(state.budget >= autoCost){
    state.budget -= autoCost;
    updateKPIs();
    appendLog(`🤖 AUTO-PLAY (paid ₹${autoCost}) – simulating random move...`);
    const movesKeys = Object.keys(MOVES);
    const randomMoveKey = movesKeys[Math.floor(Math.random() * movesKeys.length)];
    applyMove(randomMoveKey);
    document.getElementById('autoCostInfo').innerHTML = `🤖 Auto turns left: 0 free · ₹${autoCost} each (budget ₹${Math.round(state.budget)})`;
  } else {
    appendLog(`❌ Cannot auto-play: need ₹${autoCost} campaign budget.`);
  }
}

// bind new buttons
document.getElementById('getTipApiBtn')?.addEventListener('click', getTipWithCost);
document.getElementById('autoPlayBtn')?.addEventListener('click', autoPlayTurn);

// bind original events
function bindEvents(){
  if(refs.playBtn) refs.playBtn.addEventListener('click',()=>{ if(playInterval){ clearInterval(playInterval); playInterval=null; refs.playBtn.textContent='Play'; } else { refs.playBtn.textContent='Pause'; playInterval=setInterval(()=>endTurn(), Number(refs.speed.value)); } });
  if(refs.stepForward) refs.stepForward.addEventListener('click', endTurn);
  if(refs.resetBtn) refs.resetBtn.addEventListener('click', resetSimulation);
  if(refs.speed) refs.speed.addEventListener('input',()=>{ if(playInterval){ clearInterval(playInterval); playInterval=setInterval(()=>endTurn(), Number(refs.speed.value)); } });
  if(refs.toggleSent) refs.toggleSent.addEventListener('change',()=>rebuildChart());
  if(refs.toggleFunds) refs.toggleFunds.addEventListener('change',()=>rebuildChart());
  if(refs.matchPartyBtn) refs.matchPartyBtn.addEventListener('click', requestPartyMatch);
  if(refs.transferTransparentBtn) refs.transferTransparentBtn.addEventListener('click',()=>transferFromParty('transparent'));
  if(refs.transferOpaqueBtn) refs.transferOpaqueBtn.addEventListener('click',()=>transferFromParty('opaque'));
  if(refs.toggleMicroBtn) refs.toggleMicroBtn.addEventListener('click',()=>{
    microTargetActive=!microTargetActive;
    if(microTargetActive){
      const chosen=state.voterGroups[Math.floor(Math.random()*state.voterGroups.length)];
      state.microTargetGroup={ id:chosen.id, name:chosen.name };
      refs.microTargetStatus.innerHTML=`🎯 Targeting ${chosen.name} (extra cost, double effect)`;
      refs.toggleMicroBtn.textContent='Micro-target ON';
    } else {
      state.microTargetGroup=null;
      refs.microTargetStatus.innerHTML='';
      refs.toggleMicroBtn.textContent='Micro-target OFF';
    }
  });
  const tipBtn=document.getElementById('tipButton');
  if(tipBtn) tipBtn.addEventListener('click',()=>appendLog(`✨ TIP: Use 'Get Political Tip' for real news (first 3 free). Auto-play helps grind but costs after 3 free uses. Monetisation potential: in-app purchases for extra tips/auto-turns.`));
}
resetSimulation();
bindEvents();
