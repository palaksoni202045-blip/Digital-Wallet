/* ---------------- State ---------------- */
const state = {
  loggedIn: false,
  balance: 4231.87,
  contacts: [
    {id:'c1', name:'Meera Shah', color:'#4C8C86'},
    {id:'c2', name:'Rohan Iyer', color:'#C9962C'},
    {id:'c3', name:'Priya Nair', color:'#D97575'},
    {id:'c4', name:'Dev Malhotra', color:'#6B7FD7'},
    {id:'c5', name:'Zara Khan', color:'#B27ED9'},
    {id:'c6', name:'Kabir Rao', color:'#4C8C86'},
    {id:'c7', name:'Anika Sen', color:'#C9962C'},
    {id:'c8', name:'Yusuf Ali', color:'#D97575'},
  ],
  cards: [
    {id:'card1', issuer:'Vaultline Metal', last4:'4821', holder:'AARAV KAPOOR', expiry:'09/28', frozen:false, gradient:'linear-gradient(135deg,#e3b85c,#c9962c 55%,#8a6416)'},
    {id:'card2', issuer:'Vaultline Slate', last4:'1190', holder:'AARAV KAPOOR', expiry:'02/27', frozen:false, gradient:'linear-gradient(135deg,#5c6b7c,#333c47 65%)'},
  ],
  transactions: [],
  selectedContact: null,
  txFilter: 'all',
};

const merchantIcons = ['🛒','☕','✈️','🏠','🎬','📱','🍽️','⚡'];
function seedTransactions(){
  const seed = [
    {name:'Meera Shah', type:'in', amount:120.00, note:'Split dinner'},
    {name:'Grocery Mart', type:'out', amount:64.32, note:'Weekly groceries'},
    {name:'Top-up · Vaultline Metal', type:'in', amount:500.00, note:'Card top-up'},
    {name:'Rohan Iyer', type:'out', amount:75.00, note:'Movie tickets'},
    {name:'Cloudline Hosting', type:'out', amount:12.99, note:'Subscription'},
    {name:'Priya Nair', type:'in', amount:220.00, note:'Freelance payment'},
    {name:'City Transit', type:'out', amount:3.50, note:'Metro card'},
    {name:'Dev Malhotra', type:'out', amount:45.00, note:'Concert split'},
  ];
  const now = Date.now();
  state.transactions = seed.map((t,i)=>({
    id:'tx'+i,
    ...t,
    icon: merchantIcons[i % merchantIcons.length],
    date: new Date(now - i*1000*60*60*20)
  }));
}
seedTransactions();

/* ---------------- Helpers ---------------- */
function fmtMoney(n){ return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function fmtDate(d){ return d.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' · ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join(''); }

/* ---------------- Login / Logout ---------------- */
function handleLogin(){
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  if(!email || !password){
    errorEl.textContent = 'Enter both email and password to continue.';
    return;
  }
  errorEl.textContent = '';
  state.loggedIn = true;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('login-password').value = '';
  showToast('Welcome back, Aarav');
  init();
}
function handleLoginKeydown(e){
  if(e.key === 'Enter') handleLogin();
}
function handleLogout(){
  if(!state.loggedIn) return;
  state.loggedIn = false;
  navigate('dashboard');
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-screen').classList.remove('hidden');
  showToast('Logged out');
}

/* ---------------- Odometer balance ---------------- */
let displayedBalance = 0;
function animateBalance(to){
  const from = displayedBalance;
  const duration = 700;
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    const val = from + (to-from)*eased;
    const [int, dec] = fmtMoney(Math.max(0,val)).split('.');
    document.getElementById('balance-int').textContent = int;
    document.getElementById('balance-dec').textContent = dec;
    if(p<1) requestAnimationFrame(tick);
    else displayedBalance = to;
  }
  requestAnimationFrame(tick);
}

/* ---------------- Navigation ---------------- */
function navigate(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  if(view==='transactions') renderTransactions();
  if(view==='cards') renderCards();
  if(view==='send') renderContactGrid();
  if(view==='request') { renderSources(); renderQr(); }
  if(view==='receive') renderReceiveQr();
  if(view==='scan'){ document.getElementById('scan-result-panel').style.display='none'; }
  else if(scannerStream){ stopScanner(); }
  if(view==='split'){ renderSplitContactGrid(); renderSplitShares(); renderSplitHistory(); }
}

/* ---------------- Render: dashboard cards ---------------- */
function cardHTML(card, compact){
  return `<div class="wallet-card ${card.frozen?'frozen':''}" style="background:${card.gradient}">
      ${card.frozen?'<div class="frozen-badge">Frozen</div>':''}
      <div class="card-brand-row">
        <div class="card-issuer">${card.issuer}</div>
        <div class="chip"></div>
      </div>
      <div class="card-number">•••• •••• •••• ${card.last4}</div>
      <div class="card-foot">
        <div class="card-holder">${card.holder}</div>
        <div class="card-expiry">${card.expiry}</div>
      </div>
    </div>`;
}
function renderDashCards(){
  document.getElementById('dash-card-row').innerHTML = state.cards.map(c=>cardHTML(c)).join('');
}

function renderCards(){
  const addTile = `<div class="wallet-card add-card" onclick="handleAddCard()">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add a card
    </div>`;
  let html = state.cards.map(c=>{
    const freezeLabel = c.frozen ? 'Unfreeze' : 'Freeze';
    return `<div>
        ${cardHTML(c)}
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-ghost btn-sm" onclick="toggleFreeze('${c.id}')">${freezeLabel}</button>
          <button class="btn btn-ghost btn-sm" onclick="removeCard('${c.id}')">Remove</button>
        </div>
      </div>`;
  }).join('') + addTile;
  document.getElementById('cards-row').innerHTML = html;
}
function toggleFreeze(id){
  const c = state.cards.find(c=>c.id===id);
  c.frozen = !c.frozen;
  showToast(c.frozen ? `${c.issuer} frozen` : `${c.issuer} unfrozen`);
  renderCards(); renderDashCards(); renderSources();
}
function removeCard(id){
  state.cards = state.cards.filter(c=>c.id!==id);
  showToast('Card removed');
  renderCards(); renderDashCards(); renderSources();
}
function handleAddCard(){
  const brands = ['Vaultline Onyx','Vaultline Copper','Vaultline Frost'];
  const gradients = ['linear-gradient(135deg,#3a3f4d,#181a22 65%)','linear-gradient(135deg,#d98b5c,#a35a2e 60%)','linear-gradient(135deg,#9fb4c7,#5c7286 65%)'];
  const idx = state.cards.length % brands.length;
  const last4 = String(Math.floor(1000+Math.random()*9000));
  state.cards.push({id:'card'+Date.now(), issuer:brands[idx], last4, holder:'AARAV KAPOOR', expiry:'11/29', frozen:false, gradient:gradients[idx]});
  showToast('New card added');
  renderCards(); renderDashCards(); renderSources();
}

/* ---------------- Render: ledger ---------------- */
function txRowHTML(t){
  const sign = t.type==='in' ? '+' : '−';
  const cls = t.type==='in' ? 'pos' : 'neg';
  const bg = t.type==='in' ? 'rgba(76,140,134,0.18)' : 'rgba(217,117,117,0.18)';
  const color = t.type==='in' ? 'var(--teal)' : 'var(--coral)';
  return `<div class="ledger-row">
      <div class="tx-icon" style="background:${bg}; color:${color};">${t.icon}</div>
      <div class="tx-main">
        <div class="tx-name">${t.name}</div>
        <div class="tx-meta">${t.note} · ${fmtDate(t.date)}</div>
      </div>
      <div class="tx-leader"></div>
      <div class="tx-amount ${cls}">${sign}$${fmtMoney(t.amount)}</div>
    </div>`;
}
function renderDashLedger(){
  const recent = state.transactions.slice(0,5);
  document.getElementById('dash-ledger').innerHTML = recent.map(txRowHTML).join('') ||
    `<div class="empty-state">No activity yet.</div>`;
}
function setTxFilter(f){
  state.txFilter = f;
  document.querySelectorAll('#view-transactions .chip-filter').forEach(b=>b.classList.toggle('active', b.dataset.filter===f));
  renderTransactions();
}
function renderTransactions(){
  const q = (document.getElementById('tx-search').value || '').toLowerCase();
  let list = state.transactions.filter(t=>{
    if(state.txFilter==='in' && t.type!=='in') return false;
    if(state.txFilter==='out' && t.type!=='out') return false;
    if(q && !t.name.toLowerCase().includes(q) && !t.note.toLowerCase().includes(q)) return false;
    return true;
  });
  document.getElementById('full-ledger').innerHTML = list.map(txRowHTML).join('') ||
    `<div class="empty-state">Nothing matches that filter.</div>`;
}

/* ---------------- Send money ---------------- */
function renderContactGrid(){
  document.getElementById('contact-grid').innerHTML = state.contacts.map(c=>`
    <div class="contact-pick ${state.selectedContact===c.id?'selected':''}" onclick="selectContact('${c.id}')">
      <div class="contact-avatar" style="background:${c.color}">${initials(c.name)}</div>
      <div>${c.name.split(' ')[0]}</div>
    </div>`).join('');
}
function selectContact(id){
  state.selectedContact = id;
  renderContactGrid();
}
function handleSend(){
  const amount = parseFloat(document.getElementById('send-amount').value);
  const note = document.getElementById('send-note').value.trim() || 'Sent money';
  const contact = state.contacts.find(c=>c.id===state.selectedContact);
  if(!contact){ showToast('Pick a contact first'); return; }
  if(!amount || amount<=0){ showToast('Enter a valid amount'); return; }
  if(amount > state.balance){ showToast('Insufficient balance'); return; }
  state.balance -= amount;
  state.transactions.unshift({id:'tx'+Date.now(), name:contact.name, type:'out', amount, note, icon:'👤', date:new Date()});
  animateBalance(state.balance);
  showToast(`Sent $${fmtMoney(amount)} to ${contact.name.split(' ')[0]}`);
  document.getElementById('send-amount').value='';
  document.getElementById('send-note').value='';
  state.selectedContact = null;
  renderContactGrid(); renderDashLedger();
  navigate('dashboard');
}

/* ---------------- Add / Request money ---------------- */
function switchTab(tab){
  document.getElementById('tab-add').classList.toggle('active', tab==='add');
  document.getElementById('tab-request').classList.toggle('active', tab==='request');
  document.getElementById('panel-add').style.display = tab==='add' ? 'block':'none';
  document.getElementById('panel-request').style.display = tab==='request' ? 'block':'none';
}
function renderSources(){
  const opts = state.cards.map(c=>`<option value="${c.id}" ${c.frozen?'disabled':''}>${c.issuer} •••• ${c.last4}${c.frozen?' (frozen)':''}</option>`).join('');
  document.getElementById('add-source').innerHTML = opts;
  document.getElementById('request-from').innerHTML = state.contacts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}
function handleAddMoney(){
  const amount = parseFloat(document.getElementById('add-amount').value);
  const sourceId = document.getElementById('add-source').value;
  const card = state.cards.find(c=>c.id===sourceId);
  if(!amount || amount<=0){ showToast('Enter a valid amount'); return; }
  if(!card){ showToast('Add a card first'); return; }
  state.balance += amount;
  state.transactions.unshift({id:'tx'+Date.now(), name:`Top-up · ${card.issuer}`, type:'in', amount, note:'Card top-up', icon:'💳', date:new Date()});
  animateBalance(state.balance);
  showToast(`Added $${fmtMoney(amount)} to your balance`);
  document.getElementById('add-amount').value='';
  renderDashLedger();
  navigate('dashboard');
}
const WALLET_ID = 'VL-8842-AK';

function drawQr(containerId, payload){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = '';
  if(typeof QRCode === 'undefined'){
    el.innerHTML = `<div style="font-size:11px; color:#666; padding:10px; text-align:center;">QR library unavailable — code: ${payload}</div>`;
    return;
  }
  new QRCode(el, {
    text: payload,
    width: 176,
    height: 176,
    colorDark: '#14171F',
    colorLight: '#EDE6D6',
    correctLevel: QRCode.CorrectLevel.M
  });
}
function renderQr(){
  const amount = parseFloat(document.getElementById('request-amount').value) || 0;
  const payload = JSON.stringify({ type:'request', to: WALLET_ID, amount: amount || undefined, note:'Payment request' });
  drawQr('qr-request-box', payload);
}
function handleRequest(){
  const amount = parseFloat(document.getElementById('request-amount').value);
  const fromId = document.getElementById('request-from').value;
  const contact = state.contacts.find(c=>c.id===fromId);
  if(!amount || amount<=0){ showToast('Enter a valid amount'); return; }
  showToast(`Request for $${fmtMoney(amount)} sent to ${contact.name.split(' ')[0]}`);
  document.getElementById('request-amount').value='';
  renderQr();
}

/* ---------------- Receive ---------------- */
function renderReceiveQr(){
  const amount = parseFloat(document.getElementById('receive-amount').value) || 0;
  const payload = JSON.stringify({ type:'pay', to: WALLET_ID, amount: amount || undefined });
  drawQr('qr-receive-box', payload);
  document.getElementById('receive-wallet-id').textContent = WALLET_ID;
}
function copyWalletId(){
  navigator.clipboard?.writeText(WALLET_ID).catch(()=>{});
  showToast('Wallet ID copied');
}
function simulateIncoming(){
  const amount = parseFloat(document.getElementById('receive-amount').value) || (Math.round(Math.random()*8000)/100 + 5);
  const payers = state.contacts;
  const payer = payers[Math.floor(Math.random()*payers.length)];
  state.balance += amount;
  state.transactions.unshift({id:'tx'+Date.now(), name:payer.name, type:'in', amount, note:'Scanned your code', icon:'📥', date:new Date()});
  animateBalance(state.balance);
  showToast(`${payer.name.split(' ')[0]} paid you $${fmtMoney(amount)}`);
  renderDashLedger();
}

/* ---------------- Scan & pay ---------------- */
let scannerStream = null, scannerRAF = null;
async function toggleScanner(){
  const btn = document.getElementById('scanner-toggle');
  const status = document.getElementById('scanner-status');
  if(scannerStream){ stopScanner(); return; }
  try{
    scannerStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } });
    const video = document.getElementById('scanner-video');
    video.srcObject = scannerStream;
    await video.play();
    btn.textContent = 'Stop camera';
    status.textContent = 'Point your camera at a Vaultline code.';
    scanLoop();
  }catch(err){
    status.textContent = 'Camera unavailable in this browser/context — try "Simulate a scan" or paste a code below.';
  }
}
function stopScanner(){
  if(scannerStream){ scannerStream.getTracks().forEach(t=>t.stop()); scannerStream=null; }
  if(scannerRAF) cancelAnimationFrame(scannerRAF);
  document.getElementById('scanner-toggle').textContent = 'Start camera';
  document.getElementById('scanner-status').textContent = 'Camera stopped.';
}
function scanLoop(){
  const video = document.getElementById('scanner-video');
  const canvas = document.getElementById('scanner-canvas');
  if(!scannerStream) return;
  if(video.readyState === video.HAVE_ENOUGH_DATA && typeof jsQR !== 'undefined'){
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height);
    if(code && code.data){
      handleScannedPayload(code.data);
      stopScanner();
      return;
    }
  }
  scannerRAF = requestAnimationFrame(scanLoop);
}
function simulateScan(){
  const demo = JSON.stringify({ type:'pay', to:'VL-5521-MS', amount: 32.50, note:'Meera Shah — coffee' });
  handleScannedPayload(demo);
}
function processManualScan(){
  const raw = document.getElementById('manual-scan-input').value.trim();
  if(!raw){ showToast('Paste a code first'); return; }
  handleScannedPayload(raw);
}
function handleScannedPayload(raw){
  let to = 'Unknown recipient', amount = '';
  try{
    const parsed = JSON.parse(raw);
    to = parsed.to || to;
    amount = parsed.amount || '';
  }catch(e){
    to = raw.slice(0,40);
  }
  document.getElementById('scan-result-to').value = to;
  document.getElementById('scan-result-amount').value = amount;
  document.getElementById('scan-result-panel').style.display = 'block';
  document.getElementById('scanner-status').textContent = 'Code recognized — confirm the payment below.';
  showToast('Code scanned');
}
function confirmScanPayment(){
  const to = document.getElementById('scan-result-to').value;
  const amount = parseFloat(document.getElementById('scan-result-amount').value);
  if(!amount || amount<=0){ showToast('Enter a valid amount'); return; }
  if(amount > state.balance){ showToast('Insufficient balance'); return; }
  state.balance -= amount;
  state.transactions.unshift({id:'tx'+Date.now(), name:to, type:'out', amount, note:'Paid via scan', icon:'📷', date:new Date()});
  animateBalance(state.balance);
  showToast(`Paid $${fmtMoney(amount)} to ${to}`);
  document.getElementById('scan-result-panel').style.display = 'none';
  document.getElementById('manual-scan-input').value = '';
  renderDashLedger();
  navigate('dashboard');
}

/* ---------------- Split bill ---------------- */
state.splitSelected = new Set();
state.splitMode = 'equal';
state.splits = [];

function renderSplitContactGrid(){
  document.getElementById('split-contact-grid').innerHTML = state.contacts.map(c=>`
    <div class="contact-pick ${state.splitSelected.has(c.id)?'selected':''}" onclick="toggleSplitContact('${c.id}')">
      <div class="contact-avatar" style="background:${c.color}">${initials(c.name)}</div>
      <div>${c.name.split(' ')[0]}</div>
    </div>`).join('');
}
function toggleSplitContact(id){
  if(state.splitSelected.has(id)) state.splitSelected.delete(id);
  else state.splitSelected.add(id);
  renderSplitContactGrid();
  renderSplitShares();
}
function setSplitMode(mode){
  state.splitMode = mode;
  document.getElementById('split-mode-equal').classList.toggle('active', mode==='equal');
  document.getElementById('split-mode-custom').classList.toggle('active', mode==='custom');
  renderSplitShares();
}
function renderSplitShares(){
  const total = parseFloat(document.getElementById('split-total').value) || 0;
  const ids = Array.from(state.splitSelected);
  const list = document.getElementById('split-shares-list');
  if(ids.length === 0){
    list.innerHTML = `<div class="empty-state" style="padding:24px;">Pick who's splitting this with you.</div>`;
    return;
  }
  const equalShare = ids.length ? (total / ids.length) : 0;
  list.innerHTML = ids.map(id=>{
    const c = state.contacts.find(x=>x.id===id);
    const val = state.splitMode==='equal' ? equalShare.toFixed(2) : (equalShare?equalShare.toFixed(2):'0.00');
    return `<div class="split-share-row">
        <div class="contact-avatar" style="background:${c.color}">${initials(c.name)}</div>
        <div class="share-name">${c.name}</div>
        <input type="number" min="0" step="0.01" data-split-id="${c.id}" value="${val}" ${state.splitMode==='equal'?'disabled':''}>
      </div>`;
  }).join('');
}
function createSplit(){
  const desc = document.getElementById('split-desc').value.trim() || 'Shared expense';
  const total = parseFloat(document.getElementById('split-total').value);
  const ids = Array.from(state.splitSelected);
  if(!total || total<=0){ showToast('Enter a total amount'); return; }
  if(ids.length===0){ showToast('Pick at least one person'); return; }
  const shares = ids.map(id=>{
    const input = document.querySelector(`[data-split-id="${id}"]`);
    const amount = state.splitMode==='equal' ? total/ids.length : (parseFloat(input.value)||0);
    return { contactId:id, amount, settled:false };
  });
  state.splits.unshift({ id:'split'+Date.now(), desc, total, date:new Date(), shares });
  showToast(`Split "${desc}" sent to ${ids.length} ${ids.length===1?'person':'people'}`);
  document.getElementById('split-desc').value='';
  document.getElementById('split-total').value='';
  state.splitSelected.clear();
  renderSplitContactGrid();
  renderSplitShares();
  renderSplitHistory();
}
function settleSplit(splitId, contactId){
  const split = state.splits.find(s=>s.id===splitId);
  const share = split.shares.find(s=>s.contactId===contactId);
  if(share.settled) return;
  share.settled = true;
  const contact = state.contacts.find(c=>c.id===contactId);
  state.balance += share.amount;
  state.transactions.unshift({id:'tx'+Date.now(), name:contact.name, type:'in', amount:share.amount, note:`Settled: ${split.desc}`, icon:'🤝', date:new Date()});
  animateBalance(state.balance);
  showToast(`${contact.name.split(' ')[0]} settled $${fmtMoney(share.amount)}`);
  renderDashLedger();
  renderSplitHistory();
}
function renderSplitHistory(){
  const box = document.getElementById('split-history');
  if(state.splits.length===0){
    box.innerHTML = `<div class="empty-state">No splits yet — create one above.</div>`;
    return;
  }
  box.innerHTML = state.splits.map(split=>{
    const rows = split.shares.map(s=>{
      const contact = state.contacts.find(c=>c.id===s.contactId);
      return `<div class="ledger-row" style="padding-left:52px;">
          <div class="tx-icon" style="width:26px;height:26px;font-size:10px;background:${contact.color}22;color:${contact.color}">${initials(contact.name)}</div>
          <div class="tx-main"><div class="tx-name" style="font-weight:500;">${contact.name}</div></div>
          <div class="tx-leader"></div>
          <span class="split-status ${s.settled?'settled':'pending'}" style="margin-right:10px;">${s.settled?'Settled':'Pending'}</span>
          <div class="tx-amount" style="width:70px; text-align:right;">$${fmtMoney(s.amount)}</div>
          ${s.settled?'':`<button class="btn btn-ghost btn-sm" style="margin-left:10px;" onclick="settleSplit('${split.id}','${contact.id}')">Mark paid</button>`}
        </div>`;
    }).join('');
    return `<div class="ledger-row" style="background:var(--ink-elevated); font-weight:600;">
        <div class="tx-icon" style="background:rgba(201,150,44,0.18); color:var(--brass-light);">🧾</div>
        <div class="tx-main"><div class="tx-name">${split.desc}</div><div class="tx-meta">${fmtDate(split.date)} · total $${fmtMoney(split.total)}</div></div>
      </div>${rows}`;
  }).join('');
}

/* ---------------- Init ---------------- */
function init(){
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
  renderDashCards();
  renderDashLedger();
  renderContactGrid();
  renderSources();
  renderQr();
  renderReceiveQr();
  animateBalance(state.balance);
}

/* ---------------- Bind events on load ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=>navigate(btn.dataset.view));
  });
  document.getElementById('login-password').addEventListener('keydown', handleLoginKeydown);
  document.getElementById('login-email').addEventListener('keydown', handleLoginKeydown);
  init();
});
