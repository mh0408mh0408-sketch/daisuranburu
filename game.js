// ================================================================
// DICE RUMBLE — game.js  (v3: Firebase compat API / file:// 直接対応)
// Firebase Realtime Database compat SDK (v9.23.0)
// import文不要 → index.html の <script> タグから読み込み
// ================================================================

// ─── Firebase 設定 ────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDgiOWcmwQ2vUGlc1BvQA3edVk0paKdgFk",
  authDomain:        "daisu-b5c97.firebaseapp.com",
  databaseURL:       "https://daisu-b5c97-default-rtdb.firebaseio.com",
  projectId:         "daisu-b5c97",
  storageBucket:     "daisu-b5c97.firebasestorage.app",
  messagingSenderId: "723869666046",
  appId:             "1:723869666046:web:bd541ea87e2c71d5efb3af",
};
const fbApp = firebase.initializeApp(firebaseConfig);
const db    = firebase.database();

// ================================================================
// CONSTANTS
// ================================================================
const HP_MAX      = 10;
const MAX_HAND    = 4;
const MAX_PLAYERS = 7;
const PLAYER_COLORS = ['#ff4488','#4488ff','#44ffaa','#ffcc00','#ff8800','#cc44ff','#ff5544'];

const RARITY_LABEL = { normal:'ノーマル', rare:'レア', hero:'英雄', legend:'伝説' };
const RARITY_COLOR = { normal:'#aaaacc',  rare:'#4488ff', hero:'#c044ff', legend:'#ffcc00' };
const RARITY_ICON  = { normal:'🟢', rare:'🔵', hero:'🟣', legend:'🟡' };

// ── 全35ダイスカタログ ────────────────────────────────────────
const DC = {
  normal:      { name:'ダイス',              rarity:'normal', icon:'🎲', faces:[1,2,3,4,5,6], kind:'attack',
                 desc:'出目分のダメージを次のプレイヤーに与える', flavor:'至って普通のダイス' },
  small:       { name:'ちびダイス',          rarity:'normal', icon:'🎲', faces:[1,2,3,1,2,3], kind:'attack',
                 desc:'1〜3のダメージを次のプレイヤーに与える', flavor:'小さくて見えないダイス' },
  big:         { name:'でかダイス',          rarity:'normal', icon:'🎲', faces:[4,5,6,4,5,6], kind:'attack',
                 desc:'4〜6のダメージを次のプレイヤーに与える', flavor:'ノーカウントと言いたくなる' },
  two_face:    { name:'2面ダイス',           rarity:'normal', icon:'🎲', faces:[1,6,1,6,1,6], kind:'attack',
                 desc:'1か6のダメージを次のプレイヤーに与える', flavor:'要するにこれは硬貨' },
  odd:         { name:'奇数ダイス',          rarity:'normal', icon:'🎲', faces:[1,3,5,1,3,5], kind:'attack',
                 desc:'1・3・5のどれかのダメージを与える', flavor:'どうやっても2つに割れないダイス' },
  even:        { name:'偶数ダイス',          rarity:'normal', icon:'🎲', faces:[2,4,6,2,4,6], kind:'attack',
                 desc:'2・4・6のどれかのダメージを与える', flavor:'どこから割っても2つに割れるダイス' },
  heal:        { name:'ヒールダイス',        rarity:'normal', icon:'💚', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'出目分のHPを回復する（上限10）', flavor:'普通のヒールダイス' },
  small_heal:  { name:'ちびヒールダイス',    rarity:'normal', icon:'💚', faces:[1,2,3,1,2,3], kind:'heal',
                 desc:'1〜3のHPを回復する（上限10）', flavor:'小さくて見えないけどしっかり回復する' },
  big_heal:    { name:'でかヒールダイス',    rarity:'normal', icon:'💚', faces:[4,5,6,4,5,6], kind:'heal',
                 desc:'4〜6のHPを回復する（上限10）', flavor:'ダイスも大きいがもちろん回復も大きい' },
  two_face_heal:{ name:'2面ヒールダイス',   rarity:'normal', icon:'💚', faces:[1,6,1,6,1,6], kind:'heal',
                 desc:'1か6のHPを回復する（上限10）', flavor:'ピンチの時は祈るのみ' },
  odd_heal:    { name:'奇数ヒールダイス',    rarity:'normal', icon:'💚', faces:[1,3,5,1,3,5], kind:'heal',
                 desc:'1・3・5のどれかを回復する（上限10）', flavor:'割れないので安心して回復できる' },
  even_heal:   { name:'偶数ヒールダイス',    rarity:'normal', icon:'💚', faces:[2,4,6,2,4,6], kind:'heal',
                 desc:'2・4・6のどれかを回復する（上限10）', flavor:'2つに割って回復力2倍！とはならない' },
  spike:       { name:'尖りダイス',          rarity:'rare',   icon:'📌', faces:[1,1,1,1,1,1], kind:'attack',
                 desc:'1の貫通ダメージを与える。トゲ付け効果も貫通になる', flavor:'「これは……針？」' },
  bow:         { name:'弓のダイス',          rarity:'rare',   icon:'🏹', faces:[1,2,3,1,2,3], kind:'attack',
                 desc:'出目分のダメージをバリアのみに与える。超過分はHPに届かない', flavor:'まさかこれだけで使おうとしてない？' },
  arrow:       { name:'矢のダイス',          rarity:'rare',   icon:'🏹', faces:[1,2,3,1,2,3], kind:'attack',
                 desc:'このターンに弓のダイスを使っていれば5の貫通ダメージ。なければ不発', flavor:'弓は矢と使うって知らない？' },
  thorn:       { name:'トゲ付きダイス',      rarity:'rare',   icon:'🌵', faces:[1,2,3,4,5,6], kind:'attack',
                 desc:'出目ダメージ後に追加で3ダメージ。自分も1ダメージ受ける', flavor:'トゲが付いているのに握りしめては駄目' },
  double_die:  { name:'Wダイス',             rarity:'rare',   icon:'☯',  faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'出目分のダメージを与え、自身のHPを回復', flavor:'2つで1つの究極ダイス' },
  unstable:    { name:'不安定ダイス',        rarity:'rare',   icon:'⚠️', faces:[1,1,1,1,1,9], kind:'attack',
                 desc:'5/6の確率で1ダメージ、1/6の確率で9ダメージ', flavor:'6は逆さま、他全部1のミスプリント' },
  barrel:      { name:'樽ダイス',            rarity:'rare',   icon:'🛢️', faces:[1,2,3,1,2,3], kind:'attack',
                 desc:'自分のターン開始時にこのダイスの全出目が永続+1される。何度でも！', flavor:'樽で熟成させて強くなる画期的設計' },
  iron:        { name:'鉄のダイス',          rarity:'rare',   icon:'⚙️', faces:[1,2,3,4,5,6], kind:'attack',
                 desc:'自分以外でHPが最も多いプレイヤーを攻撃する（同数ならランダム）', flavor:'ボスには2倍のダメージ。しかしボスはこのゲームにはいない' },
  treasure:    { name:'トレジャーダイス',    rarity:'rare',   icon:'💎', faces:[1,2,3,1,2,3], kind:'special',
                 desc:'このターンのドラフトを追加でもう1回行う', flavor:'掘り出し物みっけ！' },
  double_heal: { name:'ダブルヒールダイス',  rarity:'rare',   icon:'💞', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'自分と次のプレイヤーの両方を出目分回復する（上限10）', flavor:'回復の独り占め禁止' },
  poison_heal: { name:'毒ヒールダイス',      rarity:'rare',   icon:'☠️', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'出目分回復。次のターンまでに攻撃してきた相手に3ダメージ（毒カウンター）', flavor:'可愛いものには毒がある。' },
  ex_heal:     { name:'EXヒールダイス',      rarity:'rare',   icon:'💊', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'出目分回復。さらにヒールダイスをこのターンのアクションに追加する', flavor:'破壊されても1回耐えるダイス' },
  barrier_heal:{ name:'バリアヒールダイス',  rarity:'rare',   icon:'🛡️', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'出目分回復。このターンのバリア値に+3する', flavor:'バリアだから効きませーん' },
  compress:    { name:'圧縮のダイス',        rarity:'hero',   icon:'🗜️', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'プレイヤーを1人選ぶ。その手札の全ダイスの4以上の出目をランダムな1〜3に置き換える', flavor:'石炭を握りしめ、金剛石にする握力' },
  thornify:    { name:'トゲ付けダイス',      rarity:'hero',   icon:'🌿', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'手持ちの全ダイス（これを含む）に「+3ダメージ&自-1HP」効果を付与する', flavor:'トゲ付きトゲ付きダイスなんか作っちゃいけないよ' },
  bomb:        { name:'爆弾ダイス',          rarity:'hero',   icon:'💣', faces:[3,3,3,3,3,3], kind:'attack',
                 desc:'全プレイヤー（自分含む）に3の通常ダメージを与える', flavor:'ダイスじゃなくてただの爆弾' },
  rival:       { name:'同担拒否ダイス',      rarity:'hero',   icon:'💢', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'出目を記録。次の自分のターンまでに同じ出目を出した相手に6ダメージ', flavor:'貴方が7推しだったら良かったのに' },
  echo:        { name:'やまびこダイス',      rarity:'hero',   icon:'🏔️', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'次の自分のターンのダイス効果（バフ・デバフのみ）を2回発動する', flavor:'やまびこをやまびこするのはデバッガーの仕事' },
  gamble_heal: { name:'ギャンブルヒールダイス', rarity:'hero', icon:'🎰', faces:[1,2,3,4,5,6], kind:'heal',
                 desc:'ダイスを3個振り、合計値にHPを変更する。上限10を突破できる', flavor:'ピンゾロを出したら勝ちでいいよ' },
  inv_heal:    { name:'無敵ヒールダイス',    rarity:'hero',   icon:'✨', faces:[1,1,1,1,4,4], kind:'special',
                 desc:'4が出たら1ターン間無敵状態（通常ダメージ無効）になる。1は効果なし', flavor:'無敵だが、敵に直接触れて倒すことはできない' },
  dominance:   { name:'下克上ダイス',        rarity:'legend', icon:'👑', faces:[1,2,3,1,2,3], kind:'attack',
                 desc:'1〜3のダメージ後、下克上状態に。以降ダイスを振るたびに1〜3で再発動（最大4回追加、4以上で終了）', flavor:'' },
  accumulate:  { name:'蓄積のダイス',        rarity:'legend', icon:'📦', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'2〜6: 出目分スタックを積み手持ちに戻る。1: スタック分のダメージを放出する', flavor:'いきなり「1」は出すなよ！！絶対に出すなよ！！' },
  break_die:   { name:'ブレイクダイス',      rarity:'legend', icon:'💥', faces:[1,2,3,4,5,6], kind:'special',
                 desc:'自分以外の全プレイヤーのバリアを最大3まで破壊し、破壊した分のダメージを与える', flavor:'◾︎T・ブレイカー' },
  sudden_death:{ name:'サドンデスダイス',    rarity:'special', icon:'🔥', faces:[1,2,3,1,2,3], kind:'special',
                 desc:'ターン終了時に出目分の貫通ダメージを受ける', flavor:'死のカウントダウン' }
};

const BY_RARITY = { normal:[], rare:[], hero:[], legend:[], special:[] };
for (const [id,d] of Object.entries(DC)) BY_RARITY[d.rarity].push(id);

// ================================================================
// ローカル状態
// ================================================================
let myPlayerId    = null;
let myRoomId      = null;
let isHost        = false;
let myHand        = [];
let localPlayers  = {};
let localGameState= null;
let localMeta     = null;
let handCounts    = {};
let fullLogEntries= [];

let selectedIds   = [];
let isMyTurnActive= false;
let turnState     = {};

// Firebase リスナー解除用 (関数の配列)
let unsubList     = [];
let listenersActive = false;
let catalogBuilt  = false;

// ================================================================
// UTILITIES
// ================================================================
function uid()          { return Math.random().toString(36).slice(2,14); }
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rollD6()       { return Math.floor(Math.random()*6)+1; }
function delay(ms)      { return new Promise(r=>setTimeout(r,ms)); }

function sanitizePassphrase(phrase) {
  return 'rm_' + phrase.trim()
    .replace(/[\.\$\#\[\]\/]/g,'')
    .replace(/\s+/g,'-')
    .slice(0,50) || 'rm_default';
}

function getStoredPid(roomKey, playerName) {
  return localStorage.getItem(`dr_${roomKey}_${playerName}`);
}
function storePid(roomKey, playerName, pid) {
  localStorage.setItem(`dr_${roomKey}_${playerName}`, pid);
  localStorage.setItem('dr_lastRoom', roomKey);
  localStorage.setItem('dr_lastName', playerName);
}

function randDiceId() {
  const r = Math.random()*100;
  let rarity;
  if      (r < 50) rarity = 'normal';
  else if (r < 72) rarity = 'rare';
  else if (r < 94) rarity = 'hero';
  else             rarity = 'legend';
  
  const pool = BY_RARITY[rarity];
  const weights = pool.map(id => DC[id].kind === 'heal' ? 0.5 : 1.0);
  const totalWeight = weights.reduce((a,b)=>a+b, 0);
  let rnd = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    if (rnd < weights[i]) return pool[i];
    rnd -= weights[i];
  }
  return pool[pool.length-1];
}

function mkDie(catalogId) {
  return { iid: uid(), cid: catalogId, thorn: false, barrelBonus: 0, accumStack: 0 };
}

function getEffectiveFaces(die) {
  if (die.compressedFaces) {
    let faces = [...die.compressedFaces];
    if (die.cid === 'barrel' && die.barrelBonus > 0) {
      const diff = die.barrelBonus - (die.compressedAtBarrelBonus || 0);
      if (diff > 0) faces = faces.map(f => f + diff);
    }
    return faces;
  }
  const faces = [...DC[die.cid].faces];
  if (die.cid === 'barrel' && die.barrelBonus > 0)
    return faces.map(f => f + die.barrelBonus);
  return faces;
}

function rollDie(die) {
  const faces = getEffectiveFaces(die);
  return faces[Math.floor(Math.random()*faces.length)];
}

function fmtFaces(die) {
  const faces = getEffectiveFaces(die);
  const sorted  = [...faces].sort((a,b)=>a-b);
  if (sorted.length===6 && sorted[0]===1 && sorted[5]===6 && [...new Set(sorted)].length===6) return '[1〜6]';
  return '['+sorted.join(', ')+']';
}

function hpColor(hp) {
  if (hp > 6) return '#3effa0';
  if (hp > 3) return '#ffe14d';
  return '#ff4444';
}

function getPlayerColor(pid) {
  const order = localGameState?.turnOrder || Object.keys(localPlayers);
  return PLAYER_COLORS[order.indexOf(pid) % PLAYER_COLORS.length] || '#aaaacc';
}

function defaultStatus() {
  return { invincibleTurns:0, poisonCounter:false, echoActive:false, echoTurns:0,
           dominanceActive:false, rivalRolls:null };
}

// ================================================================
// FIREBASE HELPERS (compat API)
// ================================================================

/** ルーム内パスの Reference を返す */
function R(...segs) { return db.ref(['rooms', myRoomId, ...segs].join('/')); }

/** 値を1回取得 */
async function fbGet(...segs)        { return (await R(...segs).once('value')).val(); }

/** 値をセット */
async function fbSet(val, ...segs)   { await R(...segs).set(val); }

/** 部分更新 */
async function fbUpdate(val, ...segs){ await R(...segs).update(val); }

/** 任意パスの ref を1回取得（enterRoom での直接アクセス用） */
async function dbGet(path)           { return (await db.ref(path).once('value')).val(); }

/** gameState を取得 */
async function getGS()               { return (await fbGet('gameState')) || {}; }

/** players 全体を取得 */
async function getPlayers()          { return (await fbGet('players')) || {}; }

/** 特定プレイヤーフィールドを更新 */
async function setPlayerField(pid, updates) { await R('players', pid).update(updates); }

/** 手札取得 */
async function getHand(pid) { const d=await fbGet('hands',pid,'dice'); const arr=d?(Array.isArray(d)?d:Object.values(d)):[]; return arr.filter(x=>x!=null); }

/** 手札セット */
async function setHand(pid, dice)    { await R('hands', pid, 'dice').set(dice); }

/** ログ追記 */
async function addLog(msg, type='system') {
  await R('log').push({ msg, type, ts: Date.now(), round: localGameState?.round||0 });
}

/**
 * リスナー登録ヘルパー。登録・解除関数をunsubListに積む。
 * leaveRoom() で unsubList.forEach(fn=>fn()) するだけで全解除。
 */
function listen(r, cb) {
  r.on('value', cb);
  const unsub = () => r.off('value', cb);
  unsubList.push(unsub);
  return unsub;
}

function listenChildAdded(query, cb) {
  query.on('child_added', cb);
  const unsub = () => query.off('child_added', cb);
  unsubList.push(unsub);
  return unsub;
}

// ================================================================
// UI HELPERS
// ================================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
window.closeModal = closeModal;

function showError(msg) {
  const el = document.getElementById('top-error');
  if (el) { el.textContent=msg; setTimeout(()=>el.textContent='',5000); }
}

function broadcastEvent(ev) {
  if (!myRoomId) return;
  ev.ts = Date.now();
  ev.actorId = myPlayerId;
  R('events').push(ev);
}

function showFabGroup(show) {
  document.getElementById('fab-group')?.classList.toggle('show', show);
}

function pushPopup(msg, type='system', skipBroadcast=false) {
  if (!skipBroadcast) broadcastEvent({type: 'popup', msg, msgType: type});
  const area = document.getElementById('action-log-area'); if (!area) return;
  const div  = document.createElement('div');
  div.className = `log-popup type-${type}`;
  div.textContent = msg;
  area.appendChild(div);
  while (area.children.length > 50) area.removeChild(area.firstChild);
  area.scrollTop = area.scrollHeight;
}

function floatNum(pid, amount, kind, skipBroadcast=false) {
  if (!skipBroadcast) broadcastEvent({type: 'floatNum', pid, amount, kind});
  const el = document.querySelector(`[data-pid="${pid}"]`); if (!el) return;
  const rect=el.getBoundingClientRect();
  const f=document.createElement('div');
  f.className=`dmg-float ${kind}`;
  f.textContent=(kind==='heal'?'+':'-')+amount;
  f.style.left=`${rect.left+rect.width/2-20}px`;
  f.style.top=`${rect.top+10}px`;
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),1400);
}

function animPlayer(pid, type, skipBroadcast=false) {
  if (!skipBroadcast) broadcastEvent({type: 'animPlayer', pid, animType: type});
  const el=document.querySelector(`[data-pid="${pid}"]`); if (!el) return;
  el.classList.remove('anim-damage','anim-heal');
  void el.offsetWidth;
  if (type==='damage') el.classList.add('anim-damage');
  if (type==='heal')   el.classList.add('anim-heal');
  setTimeout(()=>el.classList.remove('anim-damage','anim-heal'),900);
}

// ================================================================
// DICE CARD RENDERER
// ================================================================
function renderDiceCard(die, opts={}) {
  const { selectable=false, selected=false, orderNum=0 } = opts;
  const cat = DC[die.cid]; if (!cat) return document.createElement('div');
  const el       = document.createElement('div');
  el.className   = `dice-card rarity-${cat.rarity}${selected?' selected':''}`;
  el.dataset.iid = die.iid;
  const stack  = die.accumStack  > 0 ? `<div class="dice-stack">📦×${die.accumStack}</div>` : '';
  const barrel = die.barrelBonus > 0 ? `<div class="dice-barrel">+${die.barrelBonus}</div>` : '';
  const thornStack = die.thorn === true ? 1 : (die.thorn || 0);
  const thorn  = thornStack > 0 ? `<div class="dice-thorn">🌵x${thornStack}</div>` : '';
  el.innerHTML = `
    ${thorn}
    ${selected && orderNum>0 ? `<div class="order-num order-${orderNum}">${orderNum}</div>` : ''}
    <div class="dice-icon">${cat.icon}</div>
    <div class="dice-name">${cat.name}</div>
    <div class="dice-faces">${fmtFaces(die)}</div>
    ${stack}${barrel}
    <div class="dice-rarity-badge">${RARITY_ICON[cat.rarity]} ${RARITY_LABEL[cat.rarity]}</div>
    <div class="dice-info-btn">i</div>`;
  
  el.addEventListener('contextmenu', e => { e.preventDefault(); showDiceDetail(die.cid); });
  const infoBtn = el.querySelector('.dice-info-btn');
  if (infoBtn) infoBtn.addEventListener('click', (e) => { e.stopPropagation(); showDiceDetail(die.cid); });
  
  return el;
}

function showDiceDetail(cid) {
  const cat = DC[cid]; if (!cat) return;
  document.getElementById('ddetail-icon').textContent  = cat.icon;
  document.getElementById('ddetail-name').textContent  = cat.name;
  document.getElementById('ddetail-rarity').innerHTML  =
    `<span style="color:${RARITY_COLOR[cat.rarity]}">${RARITY_ICON[cat.rarity]} ${RARITY_LABEL[cat.rarity]}</span>`;
  document.getElementById('ddetail-faces').textContent = `面: ${JSON.stringify(cat.faces)}`;
  document.getElementById('ddetail-effect').textContent= cat.desc;
  document.getElementById('ddetail-flavor').textContent= cat.flavor || '';
  openModal('modal-dice-detail');
}

// ================================================================
// AUDIO & SUBTITLE ENGINE
// ================================================================
let soundEnabled = false;
let audioCtx = null;

function initAudio() {
  if (soundEnabled && !audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ console.warn("Web Audio API not supported", e); }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);

  if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.start(t); osc.stop(t + 0.15);
  } else if (type === 'heal') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
  } else if (type === 'barrier') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  } else if (type === 'roll') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  }
}

async function showSubtitle(text, type='effect', skipBroadcast=false) {
  if (!skipBroadcast) broadcastEvent({type: 'subtitle', msg: text, msgType: type});
  const overlay = document.getElementById('subtitle-text');
  if (!overlay) return;
  overlay.className = `subtitle-text type-${type}`;
  overlay.textContent = text;
  overlay.classList.add('show');
  playSound(type === 'damage' ? 'hit' : type === 'heal' ? 'heal' : type === 'barrier' ? 'barrier' : 'effect');
  await delay(1200); // Wait for user to read
  overlay.classList.remove('show');
  await delay(250); // Transition out delay
}

async function showDiceRollAnim(die, roll, skipBroadcast=false) {
  if (!skipBroadcast) broadcastEvent({type: 'diceroll', die, roll});
  const overlay = document.getElementById('dice-roll-overlay');
  const nameEl = document.getElementById('dice-roll-name');
  const iconEl = document.getElementById('dice-roll-icon');
  const resultEl = document.getElementById('dice-roll-result');
  const hintEl = document.getElementById('dice-roll-hint');
  if(!overlay || !nameEl || !iconEl || !resultEl) return;

  const cat = DC[die.cid];
  nameEl.textContent = cat ? `${cat.icon} ${cat.name}` : (die.name || 'ダイス');
  // Reset state
  resultEl.classList.remove('show');
  resultEl.textContent = '';
  iconEl.classList.remove('anim-shake');
  // Show the dice icon
  const iconInner = document.createElement('span');
  iconInner.style.cssText = 'font-size:5rem;line-height:1';
  iconInner.textContent = cat ? cat.icon : '🎲';
  iconEl.innerHTML = '';
  iconEl.appendChild(iconInner);
  iconEl.appendChild(resultEl);
  overlay.classList.add('show');
  
  if (!skipBroadcast) {
    if (hintEl) { hintEl.style.display = 'block'; hintEl.textContent = '👆 タップして振る！'; }
    // Wait for tap
    await new Promise(resolve => {
      const handler = () => { overlay.removeEventListener('click', handler); resolve(); };
      overlay.addEventListener('click', handler);
    });
  } else {
    if (hintEl) { hintEl.style.display = 'none'; }
    await delay(100);
  }

  if (hintEl) hintEl.style.display = 'none';
  iconEl.classList.add('anim-shake');
  playSound('roll');
  // Shake for randomness feeling
  await delay(700);

  iconEl.classList.remove('anim-shake');
  iconInner.style.opacity = '0.3';
  resultEl.textContent = typeof roll === 'number' ? roll : roll;
  resultEl.classList.add('show');
  playSound('hit');
  if (typeof roll === 'number' && roll >= 6) {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 500);
  }

  await delay(1400);
  overlay.classList.remove('show');
  await delay(300);
}

// ================================================================
// CATALOG
// ================================================================
function buildCatalog() {
  if (catalogBuilt) return; catalogBuilt=true;
  const el = document.getElementById('catalog-content'); if (!el) return;
  el.innerHTML='';
  const rarities=['normal','rare','hero','legend'];
  const rNames  ={normal:'ノーマル',rare:'レア',hero:'英雄',legend:'伝説'};
  for (const rarity of rarities) {
    const section = document.createElement('div');
    section.className = 'catalog-rarity-section'; section.dataset.rarity=rarity;
    const header = document.createElement('div');
    header.className=`catalog-rarity-header h-${rarity}`;
    header.textContent=`${RARITY_ICON[rarity]} ${rNames[rarity]}`;
    section.appendChild(header);
    const grid=document.createElement('div'); grid.className='catalog-grid';
    for (const [id,cat] of Object.entries(DC)) {
      if (cat.rarity!==rarity) continue;
      const card=document.createElement('div');
      card.className=`catalog-card rarity-${rarity}`; card.dataset.cid=id;
      card.innerHTML=`
        <div class="catalog-card-head">
          <span class="catalog-icon">${cat.icon}</span>
          <span class="catalog-name">${cat.name}</span>
        </div>
        <div class="catalog-faces-text">${JSON.stringify(cat.faces)}</div>
        <div class="catalog-desc">${cat.desc}</div>`;
      card.addEventListener('click',()=>showDiceDetail(id));
      grid.appendChild(card);
    }
    section.appendChild(grid); el.appendChild(section);
  }
}

function filterCatalog(rarity) {
  document.querySelectorAll('.catalog-filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.rarity===rarity));
  document.querySelectorAll('.catalog-rarity-section').forEach(s=>
    s.classList.toggle('catalog-hidden', rarity!=='all' && s.dataset.rarity!==rarity));
}

// ================================================================
// RENDER: 対戦相手エリア
// ================================================================
function renderOpponents() {
  const area=document.getElementById('opponents-area');
  if (!area||!localGameState) return;
  const { turnOrder, currentPlayerIndex }=localGameState; if (!turnOrder) return;
  area.innerHTML='';
  let nextTurnId = null;
  if (turnOrder && turnOrder.length > 0) {
    let nextIdx = (currentPlayerIndex + 1) % turnOrder.length;
    let loopCount = 0;
    while(localPlayers[turnOrder[nextIdx]]?.eliminated && loopCount < turnOrder.length) {
       nextIdx = (nextIdx + 1) % turnOrder.length;
       loopCount++;
    }
    nextTurnId = turnOrder[nextIdx];
  }

  for (const pid of turnOrder) {
    if (pid===myPlayerId) continue;
    const p=localPlayers[pid]; if (!p) continue;
    const isCurrent=turnOrder[currentPlayerIndex]===pid;
    const isNext=nextTurnId===pid;
    const hpPct=Math.max(0,Math.min(100,(p.hp/Math.max(p.hp,10))*100));
    const bPct =Math.max(0,Math.min(100,((p.barrier||0)/14)*100));
    const icons=statusIcons(p.status||{});
    const card=document.createElement('div');
    card.className=`opp-card${p.eliminated?' eliminated':''}${isCurrent?' current-turn':''}${isNext?' next-turn':''}`;
    card.dataset.pid=pid;
    card.innerHTML=`
      ${isNext ? '<div class="next-turn-badge">NEXT ⏭</div>' : ''}
      <div class="opp-name" title="${p.name}">${p.name}</div>
      <div class="hp-bar-wrap"><div class="hp-bar" style="width:${hpPct}%;background:${hpColor(p.hp)}"></div></div>
      <div class="bar-wrap"><div class="barrier-bar" style="width:${bPct}%"></div></div>
      <div class="opp-stats">❤ ${p.hp} &nbsp;🛡 ${p.barrier||0}</div>
      <div class="opp-status">${icons.map(s=>`<span class="sicon" title="${s.t}">${s.i}</span>`).join('')}</div>
      <div class="opp-hand-count">🎲×${handCounts[pid]??'?'}</div>`;
    card.addEventListener('click',()=>showPlayerStatus(pid));
    area.appendChild(card);
  }
}

function statusIcons(st) {
  const list=[];
  if ((st.invincibleTurns||0)>0) list.push({i:'✨',t:`無敵(${st.invincibleTurns}T)`});
  if (st.poisonCounter)           list.push({i:'☠️',t:'毒カウンター'});
  if (st.echoActive)              list.push({i:'🏔️',t:'やまびこ'});
  if (st.dominanceActive)         list.push({i:'👑',t:'下克上状態'});
  if (st.rivalRolls) {
    for (const [r, c] of Object.entries(st.rivalRolls)) {
      if (c > 0) list.push({i:'💢',t:`同担(${r})x${c}`});
    }
  } else if (st.rivalRoll!=null) {
    list.push({i:'💢',t:`同担(${st.rivalRoll})`});
  }
  return list;
}

function showPlayerStatus(pid) {
  const p=localPlayers[pid]; if (!p) return;
  document.getElementById('modal-player-name').textContent=`${p.name} のステータス`;
  const rows=document.getElementById('modal-status-rows'); rows.innerHTML='';
  const addRow=(icon,name,desc)=>{
    const d=document.createElement('div'); d.className='status-row';
    d.innerHTML=`<div class="srow-icon">${icon}</div><div><div class="srow-name">${name}</div><div class="srow-desc">${desc}</div></div>`;
    rows.appendChild(d);
  };
  addRow('❤️',`HP: ${p.hp}`,`バリア: ${p.barrier||0}`);
  const st=p.status||{};
  if ((st.invincibleTurns||0)>0) addRow('✨','無敵状態',`残${st.invincibleTurns}T`);
  if (st.poisonCounter)           addRow('☠️','毒カウンター','次の攻撃者に3ダメージ反射');
  if (st.echoActive)              addRow('🏔️','やまびこ','次ターン効果2回');
  if (st.dominanceActive)         addRow('👑','下克上','1〜3連鎖発動中');
  if (st.rivalRolls) {
    for (const [r, c] of Object.entries(st.rivalRolls)) {
      if (c > 0) addRow('💢',`同担拒否(${r})x${c}`,`出目${r}で${c*6}ダメージ`);
    }
  } else if (st.rivalRoll!=null) {
    addRow('💢',`同担拒否(${st.rivalRoll})`,`出目${st.rivalRoll}で6ダメージ`);
  }
  if (rows.children.length===1)
    rows.innerHTML+='<div style="color:#4d3d66;font-size:.82rem;padding:.8rem;text-align:center">状態異常なし</div>';
  openModal('modal-player-status');
}

// ================================================================
// RENDER: 自分エリア
// ================================================================
function renderSelf() {
  const me=localPlayers[myPlayerId]; if (!me) return;
  const hpPct=Math.max(0,Math.min(100,(me.hp/Math.max(me.hp,10))*100));
  const hpBar=document.getElementById('self-hp-bar');
  if (hpBar){hpBar.style.width=`${hpPct}%`;hpBar.style.background=hpColor(me.hp);}
  const hpVal=document.getElementById('self-hp-val'); if (hpVal) hpVal.textContent=me.hp+' HP';
  const bVal=document.getElementById('self-barrier-val'); if (bVal) bVal.textContent=`🛡 ${me.barrier||0}`;
  const hc=document.getElementById('self-hand-count'); if (hc) hc.textContent=myHand.length;
  const sa=document.querySelector('.self-area');
  if (sa) sa.classList.toggle('invincible-aura',(me.status?.invincibleTurns||0)>0);
}

function renderHand(selectable=false) {
  const el=document.getElementById('self-hand'); if (!el) return;
  el.innerHTML='';
  for (const die of myHand) {
    const sel=selectedIds.includes(die.iid);
    const ord=selectedIds.indexOf(die.iid)+1;
    const card=renderDiceCard(die,{selectable,selected:sel,orderNum:ord});
    if (selectable) card.addEventListener('click',()=>handleDiceSelect(die.iid));
    else            card.addEventListener('click',()=>showDiceDetail(die.cid));
    el.appendChild(card);
  }
  const hc=document.getElementById('self-hand-count'); if (hc) hc.textContent=myHand.length;
}

function handleDiceSelect(iid) {
  if (selectedIds.includes(iid)) selectedIds=selectedIds.filter(i=>i!==iid);
  else if (selectedIds.length<2) selectedIds.push(iid);
  else selectedIds=[selectedIds[1],iid];
  // 1枚以上選択していれば決定できる（最大2枚まで）
  document.getElementById('btn-use-dice').disabled = selectedIds.length === 0;
  renderHand(true);
}

// ================================================================
// RENDER: ゲームUI全体
// ================================================================
function updateGameUI() {
  if (!localGameState) return;
  const {round,phase,turnOrder,currentPlayerIndex,suddenDeath}=localGameState;
  const rd=document.getElementById('round-display'); if (rd) rd.textContent=`Round ${round||1}`;
  const phMap={start:'開始',action:'アクション',draft:'ドラフト',end:'終了',mulligan:'マリガン'};
  const pd=document.getElementById('phase-display'); if (pd) pd.textContent=phMap[phase]||phase;
  document.getElementById('sd-badge')?.classList.toggle('active',!!suddenDeath);
  const ti=document.getElementById('turn-indicator');
  if (ti&&turnOrder) {
    let nextIdx = (currentPlayerIndex + 1) % turnOrder.length;
    let loopCount = 0;
    while(localPlayers[turnOrder[nextIdx]]?.eliminated && loopCount < turnOrder.length) {
       nextIdx = (nextIdx + 1) % turnOrder.length;
       loopCount++;
    }
    const nid=turnOrder[nextIdx]; const nIsMe=nid===myPlayerId;
    
    const cid=turnOrder[currentPlayerIndex]; const isMe=cid===myPlayerId;
    const cName = isMe ? 'あなた' : (localPlayers[cid]?.name||'?');
    const nName = nIsMe ? 'あなた' : (localPlayers[nid]?.name||'?');
    ti.innerHTML=`<span style="color:#55ff55">🟢 現在: ${cName}</span> <span style="font-size:0.8rem;color:#888;margin:0 8px;">➔</span> <span style="color:#ffff55">⏭ 次: ${nName}</span>`;
    ti.className=`turn-indicator${isMe?' my-turn':''}`;
  }
  renderOpponents(); renderSelf();
}

function setMyTurnUI(active) {
  isMyTurnActive=active;
  document.getElementById('action-btns').style.display =active?'flex':'none';
  document.getElementById('waiting-turn').style.display=active?'none':'flex';
}

function setWaitingText(name) {
  const el=document.getElementById('waiting-turn-text');
  if (el) el.textContent=`${name||'?'} のターンです`;
}

// ================================================================
// DAMAGE / HEAL SYSTEM
// ================================================================
async function applyDamage(targetId, amount, penetrating=false) {
  if (amount<=0) return;
  const players=await getPlayers();
  const tgt=players[targetId]; if (!tgt||tgt.eliminated) return;
  if (!penetrating&&(tgt.status?.invincibleTurns||0)>0) {
    await showSubtitle(`✨ ${tgt.name} 無敵で無効化！`, 'effect');
    await addLog(`✨ ${tgt.name} 無敵で無効`,'effect'); return;
  }
  if (penetrating) {
    const newHp=Math.max(0,tgt.hp-amount);
    await setPlayerField(targetId,{hp:newHp});
    const msg=`💥 ${tgt.name} に ${amount} の貫通ダメージ！ (HP ${tgt.hp}→${newHp})`;
    await showSubtitle(`💥 ${amount} 貫通ダメージ！`, 'penetrate');
    pushPopup(msg,'penetrate'); await addLog(msg,'penetrate');
    floatNum(targetId,amount,'penetrate'); animPlayer(targetId,'damage');
  } else {
    const b=tgt.barrier||0;
    if (b>=amount) {
      await setPlayerField(targetId,{barrier:b-amount});
      const msg=`🛡 ${tgt.name} のバリアが ${amount} ダメージを防いだ！ (残り${b-amount})`;
      await showSubtitle(`🛡 バリアで ${amount} 防御！`, 'barrier');
      pushPopup(msg,'barrier'); await addLog(msg,'barrier');
      floatNum(targetId,amount,'barrier');
    } else {
      const hpDmg=amount-b; const newHp=Math.max(0,tgt.hp-hpDmg);
      await setPlayerField(targetId,{barrier:0,hp:newHp});
      let msg=''; if (b>0) msg+=`🛡 バリア${b}を全て破壊！ `;
      msg+=`❤ ${tgt.name} に ${hpDmg} ダメージ！ (HP ${tgt.hp}→${newHp})`;
      await showSubtitle(`❤ ${hpDmg} ダメージ！`, 'damage');
      pushPopup(msg,'damage'); await addLog(msg,'damage');
      floatNum(targetId,hpDmg,'damage'); animPlayer(targetId,'damage');
    }
  }
  const fp=await getPlayers();
  if (fp[targetId]?.status?.poisonCounter && targetId!==myPlayerId) {
    const poisonStacks = fp[targetId].status.poisonCounter;
    await showSubtitle(`☠️ 毒カウンター反射！ ${3*poisonStacks} ダメージ！`, 'effect');
    pushPopup(`☠️ 毒カウンター！攻撃者に ${3*poisonStacks} ダメージ`,'effect');
    await addLog(`☠️ 毒カウンター発動 (x${poisonStacks})`,'effect');
    await setPlayerField(targetId,{'status/poisonCounter':0});
    await applyDamage(myPlayerId,3*poisonStacks,false);
  }
  await delay(600);
}

async function applyHeal(targetId, amount, overheal=false) {
  if (amount<=0) return;
  const players=await getPlayers(); const tgt=players[targetId];
  if (!tgt||tgt.eliminated) return;
  const newHp=overheal?tgt.hp+amount:Math.min(HP_MAX,tgt.hp+amount);
  const actual=newHp-tgt.hp; if (actual<=0) return;
  await setPlayerField(targetId,{hp:newHp});
  const msg=`💚 ${tgt.name} が ${actual} 回復！ (HP ${tgt.hp}→${newHp})`;
  await showSubtitle(`💚 ${actual} 回復！`, 'heal');
  pushPopup(msg,'heal'); await addLog(msg,'heal');
  floatNum(targetId,actual,'heal'); animPlayer(targetId,'heal'); await delay(600);
}

function getDefaultTarget() {
  if (!localGameState) return null;
  const {turnOrder,currentPlayerIndex}=localGameState;
  for (let i=1;i<turnOrder.length;i++) {
    const pid=turnOrder[(currentPlayerIndex+i)%turnOrder.length];
    if (!localPlayers[pid]?.eliminated) return pid;
  }
  return null;
}

async function checkRivalWatch(roll) {
  const players=await getPlayers();
  for (const [pid,p] of Object.entries(players)) {
    if (pid===myPlayerId||p.eliminated) continue;
    const rolls = p.status?.rivalRolls || {};
    if (rolls[roll] && rolls[roll] > 0) {
      const stacks = rolls[roll];
      const dmg = 6 * stacks;
      const msg=`💢 同担拒否！ [${roll}] が ${p.name} のトリガー！ ${dmg} ダメージ！`;
      await showSubtitle(`💢 同担拒否 発動！ ${dmg} ダメージ！`, 'damage');
      pushPopup(msg,'effect'); await addLog(msg,'effect');
      await applyDamage(myPlayerId,dmg,false);
    }
  }
}

// ================================================================
// EFFECT HANDLERS
// ================================================================
const EH={};

for (const id of ['normal','small','big','two_face','odd','even']) {
  EH[id]=async(die,roll,ctx,isEcho=false)=>{await applyDamage(ctx.targetId,roll);};
}
for (const id of ['heal','small_heal','big_heal','two_face_heal','odd_heal','even_heal']) {
  EH[id]=async(die,roll,ctx,isEcho=false)=>{await applyHeal(ctx.userId,roll);};
}
EH['spike']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId,1,true);
  if(die.thorn && !ctx._thornDone){
    const thornStack = die.thorn === true ? 1 : die.thorn;
    if(!isEcho) await showSubtitle('📌 トゲスパイク貫通！', 'penetrate'); 
    pushPopup(`📌 トゲ+スパイク: 追加 ${3*thornStack} 貫通！`,'effect');
    await applyDamage(ctx.targetId, 3*thornStack, true);
    await applyDamage(ctx.userId, 1*thornStack, true);
    ctx._thornDone=true;
  }
};
EH['bow']=async(die,roll,ctx,isEcho=false)=>{
  const players=await getPlayers();const tgt=players[ctx.targetId];
  const oldBarrier = tgt?.barrier||0;
  const newBarrier = Math.max(0, oldBarrier - roll);
  const dmg = oldBarrier - newBarrier;
  
  await setPlayerField(ctx.targetId,{barrier: newBarrier});
  if(!isEcho) await showSubtitle(`🏹 弓: バリアに ${roll} ダメージ！`, 'barrier');
  pushPopup(`🏹 弓: ${tgt?.name} のバリアに ${roll} ダメージ！`,'barrier');
  await addLog(`🏹 弓 バリア攻撃(${roll})`,'barrier');
  
  ctx.turnState.bowUsed=true;
};
EH['arrow']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  if(ctx.turnState.bowUsed){
    if(!isEcho) await showSubtitle('🏹 弓コンボ: 追加5貫通ダメージ！', 'penetrate');
    pushPopup('🏹 矢: 弓とのコンボで追加5貫通ダメージ！','penetrate');
    await addLog('🏹 矢コンボ: 5貫通','penetrate');
    await applyDamage(ctx.targetId,5,true);
  }
};
EH['thorn']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId,roll);
  if(!isEcho) await showSubtitle('🌵 トゲ: 追加3ダメ＆自1貫通ダメ！', 'effect');
  pushPopup('🌵 トゲ: +3ダメ！自-1貫通ダメ','effect');
  await applyDamage(ctx.targetId,3,false);await applyDamage(ctx.userId,1,true);
  // (generic thorn also applies after this because thorn stack adds on top of normal thorn die effect)
};
EH['double_die']=async(die,roll,ctx,isEcho=false)=>{
  // Wダイス: 出目分のダメージ + 自分を同じ出目分回復
  await applyDamage(ctx.targetId, roll);
  await applyHeal(ctx.userId, roll);
  if(!isEcho) await showSubtitle(`☣️ Wダイス: ${roll}ダメージ & ${roll}回復！`, 'heal');
  pushPopup(`☣️ Wダイス: ${roll}ダメージ+${roll}回復!`,'heal');
};
EH['unstable']=async(die,roll,ctx,isEcho=false)=>{await applyDamage(ctx.targetId,roll);};
EH['barrel']=async(die,roll,ctx,isEcho=false)=>{await applyDamage(ctx.targetId,roll);};
EH['iron']=async(die,roll,ctx,isEcho=false)=>{
  const players=await getPlayers();let maxHp=-1,targets=[];
  for(const [pid,p] of Object.entries(players)){if(pid===ctx.userId||p.eliminated)continue;if(p.hp>maxHp){maxHp=p.hp;targets=[pid];}else if(p.hp===maxHp)targets.push(pid);}
  if(!targets.length)return;
  const ironTgt=pickRandom(targets);
  if(!isEcho) await showSubtitle(`⚙️ 鉄: 最高HP ${players[ironTgt]?.name} を攻撃！`, 'effect');
  pushPopup(`⚙️ 鉄: 最高HP「${players[ironTgt]?.name}」(${maxHp}HP)を攻撃！`,'effect');
  const old=ctx.targetId;ctx.targetId=ironTgt;await applyDamage(ironTgt,roll);ctx.targetId=old;
};
EH['treasure']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  await showSubtitle('💎 トレジャー: 追加ドラフト！', 'effect');
  pushPopup('💎 トレジャーダイス: 追加ドラフト獲得！','effect');await addLog('💎 トレジャー: 追加ドラフト','effect');
  if(!isEcho) {
    const me = localPlayers[ctx.userId];
    const currentExtra = me?.status?.extraDrafts || 0;
    await setPlayerField(ctx.userId, {'status/extraDrafts': currentExtra + 1});
  }
};
EH['double_heal']=async(die,roll,ctx,isEcho=false)=>{await applyHeal(ctx.userId,roll);if(ctx.targetId)await applyHeal(ctx.targetId,roll);};
EH['poison_heal']=async(die,roll,ctx,isEcho=false)=>{
  if(!isEcho) await applyHeal(ctx.userId,roll);
  const me = localPlayers[ctx.userId];
  const curPoison = me?.status?.poisonCounter || 0;
  await setPlayerField(ctx.userId,{'status/poisonCounter':curPoison + 1});
  await showSubtitle('☠️ 毒カウンターをセット！', 'effect');
  pushPopup('☠️ 毒カウンターセット！','effect');await addLog('☠️ 毒カウンターセット','effect');
};
EH['ex_heal']=async(die,roll,ctx,isEcho=false)=>{
  await applyHeal(ctx.userId,roll);
  if(!isEcho) {
    ctx.turnState.exHealBonus=true;
    await showSubtitle('💊 ヒールダイス追加！', 'effect');
    pushPopup('💊 EXヒール: ヒールダイス追加！','effect');
  }
};
EH['barrier_heal']=async(die,roll,ctx,isEcho=false)=>{
  if(!isEcho) await applyHeal(ctx.userId,roll);
  const players=await getPlayers();const nb=(players[ctx.userId]?.barrier||0)+3;
  await setPlayerField(ctx.userId,{barrier:nb});
  await showSubtitle('🛡️ バリアヒール: バリア+3', 'barrier');
  pushPopup(`🛡️ バリアヒール: バリア+3 (→${nb})`,'barrier');await addLog(`🛡️ バリア+3→${nb}`,'barrier');
};
EH['compress']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  const tgtId=await pickTarget('圧縮の対象を選んでください',true);if(!tgtId)return;
  const hand=await getHand(tgtId);
  const newHand=hand.map(d=>{
    const nf=getEffectiveFaces(d).map(f=>f>=4?Math.floor(Math.random()*3)+1:f);
    return {...d, compressedFaces:nf, compressedAtBarrelBonus: (d.barrelBonus||0)};
  });
  await setHand(tgtId,newHand);if(tgtId===myPlayerId)myHand=newHand;
  await showSubtitle(`🗜️ 圧縮: ${localPlayers[tgtId]?.name||tgtId} の出目を低下！`, 'effect');
  pushPopup(`🗜️ 圧縮: ${localPlayers[tgtId]?.name||tgtId} の4以上を1〜3に変換！`,'effect');await addLog(`🗜️ 圧縮→${localPlayers[tgtId]?.name}`,'effect');
};
EH['thornify']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  await showSubtitle('🌿 全ダイスにトゲ効果付与！', 'effect');
  const hand=await getHand(ctx.userId);
  const newHand=hand.map(d=>{
    const currentThorn = (d.thorn === true) ? 1 : (d.thorn || 0);
    return {...d, thorn: currentThorn + 1};
  });
  await setHand(ctx.userId,newHand);myHand=newHand;
  pushPopup('🌿 トゲ付け: 全ダイスにトゲ効果付与！','effect');await addLog('🌿 トゲ付け全体','effect');
};
EH['bomb']=async(die,roll,ctx,isEcho=false)=>{
  if(!isEcho) await showSubtitle('💣 爆弾！全員に3ダメージ！', 'damage');
  pushPopup('💣 爆発！全プレイヤーに3の通常ダメージ！','effect');await addLog('💣 爆弾: 全員3ダメ','effect');
  const players=await getPlayers();
  for(const [pid,p] of Object.entries(players)){if(!p.eliminated){await applyDamage(pid,3,false);await delay(300);}}
};
EH['rival']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  const me = localPlayers[ctx.userId];
  const currentRolls = me?.status?.rivalRolls || {};
  const currentStack = currentRolls[roll] || 0;
  await setPlayerField(ctx.userId,{[`status/rivalRolls/${roll}`]: currentStack + 1});
  await showSubtitle(`💢 同担拒否！ 出目 [${roll}] を記録！`, 'effect');
  pushPopup(`💢 同担拒否: 出目 [${roll}] を記録！`,'effect');await addLog(`💢 同担拒否(${roll})セット`,'effect');
};
EH['echo']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  if(isEcho)return;
  const players=await getPlayers(); const me=players[ctx.userId];
  const curMult = me?.status?.echoMultiplierActive || 1;
  const nextMult = curMult === 1 ? 2 : curMult * 2;
  await setPlayerField(ctx.userId,{'status/echoActive':true, 'status/echoMultiplierActive':nextMult, 'status/echoTurns':2});
  await showSubtitle(`🏔️ やまびこ: 以降の効果 ${nextMult} 倍！`, 'effect');
  pushPopup(`🏔️ やまびこ: このターンのバフ・デバフが ${nextMult} 倍に増幅！`,'effect');await addLog(`🏔️ やまびこx${nextMult}`,'effect');
};
EH['gamble_heal']=async(die,roll,ctx,isEcho=false)=>{
  const r1=rollD6(),r2=rollD6(),r3=rollD6();const total=r1+r2+r3;
  const players=await getPlayers();const me=players[ctx.userId];
  await setPlayerField(ctx.userId,{hp:total});
  if(!isEcho) await showSubtitle(`🎰 ギャンブル: HPが ${total} になった！`, total>=(me?.hp||0)?'heal':'damage');
  const msg=`🎰 ギャンブルヒール: [${r1}][${r2}][${r3}]=${total}！ HP ${me?.hp||'?'}→${total}`;
  pushPopup(msg,total>=(me?.hp||0)?'heal':'damage');await addLog(msg,'heal');
  floatNum(ctx.userId,Math.abs(total-(me?.hp||0)),total>=(me?.hp||0)?'heal':'damage');
};
EH['inv_heal']=async(die,roll,ctx,isEcho=false)=>{
  if(roll===4){
    await setPlayerField(ctx.userId,{'status/invincibleTurns':1});
    await showSubtitle('✨ [4] 1ターン無敵！', 'effect');
    pushPopup('✨ 無敵ヒール: [4]！1ターン無敵！','effect');await addLog('✨ 無敵1ターン','effect');animPlayer(ctx.userId,'heal');
  }
  else{
    await showSubtitle('✨ [1] 効果なし', 'system');
    pushPopup('✨ 無敵ヒール: [1] 効果なし','system');await addLog('✨ 無敵: 出目1, 効果なし','system');
  }
};
EH['dominance']=async(die,roll,ctx,isEcho=false)=>{
  if(!isEcho) await showSubtitle(`👑 下克上！ ${roll}ダメージ！`, 'damage');
  await applyDamage(ctx.targetId,roll);
  // 下克上状態をセット（初回のみ。executeDiceWithDominance内で再発動ループが動く）
  if(!isEcho) {
    await setPlayerField(ctx.userId,{'status/dominanceActive':true});
    pushPopup(`👑 下克上発動！(${roll}ダメ) 最大4回再発動します！`,'effect');
    await addLog(`👑 下克上: ${roll}ダメ`,'effect');
  } else {
    // やまびこ時は再発動ループなし（単にもう一回ダメージ）
    pushPopup(`👑 やまびこ「下克上」2回目: ${roll}ダメ`,'effect');
    await addLog(`👑 やまびこ下克上2回目: ${roll}ダメ`,'effect');
  }
};
EH['accumulate']=async(die,roll,ctx,isEcho=false)=>{
  // 最新の手札から現在のスタックを取得
  let hand=await getHand(ctx.userId);
  let existingIdx = hand.findIndex(d => d.iid === die.iid);
  let currentStack = existingIdx >= 0 ? (hand[existingIdx].accumStack || 0) : (die.accumStack || 0);

  if(roll===1){
    // 1が出たら: 「1+スタック」分ダメージを与えて消滅（手札には戻らない）
    // やまびこ時は放出しない（スタックのみ2倍にされる）
    if(isEcho) {
      // やまびこ時: スタックが2倍になる(建付処理は元処理と共通化不要)。ただし消滅はしない
      const newStack2 = currentStack + 1;
      if(existingIdx >= 0) hand[existingIdx].accumStack = newStack2;
      else hand.push({...die, accumStack:newStack2});
      await setHand(ctx.userId,hand);myHand=hand;
      pushPopup(`📦 やまびこ「蓄積」: [1]だが放出なし スタック=${newStack2}`,'effect');
      return;
    }
    const totalDmg = 1 + currentStack;
    if(!isEcho) await showSubtitle(`📦 蓄積放出！ ${totalDmg} ダメージ！ (消滅)`, 'damage');
    pushPopup(`📦 蓄積: [1]放出! 1+スタック${currentStack}=${totalDmg}ダメージ! ダイス消滅`,'damage');
    await addLog(`📦 蓄積放出: ${totalDmg}ダメ(消滅)`,'damage');
    await applyDamage(ctx.targetId, totalDmg);
    // 手札から削除（使用時にすでに手札から抜いてあるのでなにもしない）
    // useSelectedDice内で先にこのダイスを手札から削除済みなので、ここでは手札に戻さないでそのまま
  } else {
    // 2~6が出たら: スタックを積んで手札に戻る
    await applyDamage(ctx.targetId, roll);
    const newStack = currentStack + roll;
    if(!isEcho) await showSubtitle(`📦 スタック+${roll} (計${newStack}) 手札へ！`, 'effect');
    pushPopup(`📦 蓄積: [${roll}] スタック→${newStack}！手持ちに戻る`,'effect');
    await addLog(`📦 蓄積スタック${newStack}`,'effect');
    const updatedDie = {...die, accumStack:newStack};
    if(existingIdx >= 0) hand[existingIdx] = updatedDie;
    else hand.push(updatedDie);
    await setHand(ctx.userId,hand); myHand=hand;
    // 手札に戻すマーカーを返す（useSelectedDice内の消去処理をキャンセルする）
    ctx._accumReturnedToHand = die.iid;
  }
};
EH['break_die']=async(die,roll,ctx,isEcho=false)=>{
  await applyDamage(ctx.targetId, roll);
  const breakAmt=Math.min(roll,3);
  if(!isEcho) await showSubtitle(`💥 ブレイク！ 全員のバリア最大${breakAmt}破壊！`, 'effect');
  pushPopup(`💥 ブレイク [${roll}]: 全員バリアを最大${breakAmt}破壊してその分ダメージ！`,'effect');await addLog(`💥 ブレイク: 最大${breakAmt}`,'effect');
  const players=await getPlayers();
  for(const [pid,p] of Object.entries(players)){
    if(pid===ctx.userId||p.eliminated)continue;
    const destroyed=Math.min(breakAmt,p.barrier||0);const newBarrier=(p.barrier||0)-destroyed;const newHp=Math.max(0,(p.hp||0)-destroyed);
    await setPlayerField(pid,{barrier:newBarrier,hp:newHp});
    const msg=`💥 ${p.name}: バリア${destroyed}破壊→${destroyed}ダメ (HP ${p.hp}→${newHp})`;
    pushPopup(msg,'damage');await addLog(msg,'damage');floatNum(pid,destroyed,'damage');animPlayer(pid,'damage');await delay(400);
  }
};

async function applyThornExtra(die,roll,ctx,penetrating) {
  if(!die.thorn||ctx._thornDone)return;
  const stack = die.thorn === true ? 1 : die.thorn;
  await showSubtitle(`🌵 トゲ発動: 追加 ${3*stack} ダメージ！`, 'damage');
  pushPopup(`🌵 トゲ効果 x${stack}: +${3*stack}ダメ！自-${1*stack}貫通ダメ`,'effect');
  await applyDamage(ctx.targetId,3*stack,penetrating);
  await applyDamage(ctx.userId,1*stack,true);
  ctx._thornDone=true;
}

// ================================================================
// TARGET SELECTION
// ================================================================
function pickTarget(title,includeSelf=false) {
  return new Promise(resolve=>{
    document.getElementById('modal-target-title').textContent=title;
    const list=document.getElementById('target-list');list.innerHTML='';
    const order=localGameState?.turnOrder||[];
    for(const pid of order){const p=localPlayers[pid];if(!p||p.eliminated)continue;if(!includeSelf&&pid===myPlayerId)continue;
      const item=document.createElement('div');item.className='target-item';
      item.innerHTML=`<div class="player-avatar" style="background:${getPlayerColor(pid)};color:#000">${p.name.charAt(0)}</div><div><div style="font-weight:700">${p.name}</div><div class="target-stat">HP: ${p.hp} | バリア: ${p.barrier||0}</div></div>`;
      item.addEventListener('click',()=>{closeModal('modal-target');resolve(pid);});list.appendChild(item);
    }
    openModal('modal-target');
  });
}

// ================================================================
// ダイス1個実行
// ================================================================
async function executeOneDie(die,ctx) {
  const roll=rollDie(die);
  await showDiceRollAnim(die, roll);

  await showSubtitle(`${DC[die.cid]?.name} [${roll}]！`, 'system');
  pushPopup(`🎲 ${DC[die.cid]?.name} ▶ [${roll}]`,'system');await addLog(`🎲 ${DC[die.cid]?.name} [${roll}]`,'system');await delay(200);
  await checkRivalWatch(roll);
  
  const handler=EH[die.cid];
  const me = localPlayers[myPlayerId];
  
  if (me?.status?.dominanceActive && roll >= 4) {
    await showSubtitle(`👑 [${roll}] 4以上→失敗！`, 'system');
    pushPopup(`👑 下克上中: [${roll}] 4以上のためダイス失敗`,'system');
    await addLog(`👑 下克上失敗: ${roll}`,'system');
    return roll;
  }

  // バフ・デバフのみやまびこ倍率を適用する
  const isBuffDebuff = ['echo', 'thornify', 'rival', 'poison_heal', 'ex_heal', 'dominance', 'inv_heal', 'treasure', 'accumulate', 'compress', 'barrier_heal', 'bomb'].includes(die.cid);
  const echoMult = (isBuffDebuff && !ctx.echoMode && me?.status?.echoMultiplierActive) ? (me.status.echoMultiplierActive) : 1;
  
  // 蓄積のダイスで1が出た時はやまびこ無効（放出）
  const actualLoops = (die.cid === 'accumulate' && roll === 1) ? 1 : echoMult;
  
  for(let i=0; i<actualLoops; i++) {
    const isEchoLoop = i > 0;
    if(isEchoLoop) {
      await delay(600);
      await showSubtitle(`🏔️ やまびこ: 発動 ${i+1}/${actualLoops}回目！`, 'effect');
      pushPopup(`🏔️ やまびこ: ${i+1}/${actualLoops}回目`,'effect');
    }
    if(handler) await handler(die,roll,{...ctx, echoMode: isEchoLoop}, isEchoLoop);
  }
  
  await applyThornExtra(die,roll,ctx,false);
  return roll;
}

// ================================================================
// PHASE: 開始
// ================================================================
async function doStartPhase() {
  pushPopup(`─── Round ${localGameState?.round||1} ─── ${localPlayers[myPlayerId]?.name||'?'} のターン`,'system');
  await addLog(`▶ ${localPlayers[myPlayerId]?.name||'?'} のターン開始`,'system');
  const hand=await getHand(myPlayerId);let handUpdated=false;
  const newHand=hand.map(d=>{if(d.cid==='barrel'){handUpdated=true;return{...d,barrelBonus:(d.barrelBonus||0)+1};}return d;});
  if(handUpdated){await setHand(myPlayerId,newHand);myHand=newHand;}
  const players=await getPlayers();const me=players[myPlayerId];const st=me?.status||{};
  const invT=Math.max(0,(st.invincibleTurns||0)-1);
  if(invT===0&&(st.invincibleTurns||0)>0){
    await showSubtitle('✨ 無敵終了', 'system');
    pushPopup('✨ 無敵状態が解除されました','effect');
    await addLog('✨ 無敵解除','effect');
  }

  setMyTurnUI(true);

  const bRecov = Math.floor(Math.random() * 6) + 1;
  const newBarrier = (me.barrier || 0) + bRecov;

  const bdDie = {cid:'normal', name:'バリア回復(1d6)'};
  await showDiceRollAnim(bdDie, bRecov);

  const et = Math.max(0, (me.status?.echoTurns || 0) - 1);
  const echoKeep = et > 0;
  await setPlayerField(myPlayerId,{
    barrier: newBarrier,
    'status/invincibleTurns':invT,
    'status/rivalRolls':null,
    'status/echoTurns': et,
    'status/echoActive': echoKeep ? me.status.echoActive : false,
    'status/echoMultiplierActive': echoKeep ? me.status.echoMultiplierActive : 1
  });

  await showSubtitle(`🛡️ ターン開始: バリアが ${bRecov} 回復！`, 'barrier');
  pushPopup(`🛡️ ターン開始: バリアが自然回復！ (+${bRecov})`,'barrier');
  await addLog(`🛡️ バリア自然回復: +${bRecov}`,'barrier');
  floatNum(myPlayerId, bRecov, 'barrier');
  renderSelf();
  await fbUpdate({phase:'action'},'gameState');
}

// ================================================================
// PHASE: アクション
// ================================================================
async function doActionPhase() {
  try {
    setMyTurnUI(true);selectedIds=[];
    turnState={bowUsed:false,extraDraft:false,exHealBonus:false};
    myHand=await getHand(myPlayerId);renderHand(true);
    const requiredCount = Math.min(2, myHand.length);
    document.getElementById('btn-use-dice').disabled = selectedIds.length !== requiredCount;
  } catch(e) {
    pushPopup('ActionPhase Error: ' + e.message, 'damage');
  }
}


async function useSelectedDice() {
  setMyTurnUI(false);
  setWaitingText('アクション処理中...');
  if(selectedIds.length===0) {
    await fbUpdate({phase:'draft'},'gameState');
    return;
  }
  const iidsToExecute = [...selectedIds];
  selectedIds=[]; renderHand(false);



  const ctx={userId:myPlayerId,targetId:getDefaultTarget(),turnState:{bowUsed:false,extraDraft:false,exHealBonus:false},_thornDone:false,echoMode:false,_accumReturnedToHand:null};
  const inDominance=localPlayers[myPlayerId]?.status?.dominanceActive;

  for(const iid of iidsToExecute){
    // フェッチし直して最新状態（トゲ付与など）を取得
    let hand = await getHand(myPlayerId);
    let die = hand.find(d=>d.iid===iid);
    if(!die) continue;

    // ダイスごとにトゲフラグをリセット（2枚目にもトゲが乗るように）
    ctx._thornDone = false;
    ctx._accumReturnedToHand = null;

    // 手札からこのダイスだけ削除してから実行
    hand = hand.filter(d=>d.iid!==iid);
    await setHand(myPlayerId,hand); myHand=hand; renderHand(false);

    await addLog(`── ${DC[die.cid]?.name} 使用 ──`,'system');
    if(inDominance&&die.cid!=='dominance')await executeDiceWithDominance(die,ctx);
    else await executeOneDie(die,ctx);

    // 蓄積ダイスが2~6で手札に戻った場合、すでにEH内で手札に追加されているので何もしない
    // 蓄積ダイスが1で消滅した場合、手札に戻さない（EH内でも手札に追加しない）

    await delay(600);
    const gameOver=await checkDeaths();if(gameOver)return;
  }
  
  if(ctx.turnState.exHealBonus){
    await delay(600);
    await showSubtitle('💊 EXヒール: ヒール追加！', 'effect');
    pushPopup('💊 EXヒールボーナス: ヒールダイス使用！','effect');
    const bonusDie=mkDie('heal');await executeOneDie(bonusDie,{...ctx,_thornDone:false});await checkDeaths();
  }
  selectedIds=[];renderHand(false);
  
  const me = localPlayers[myPlayerId];
  if ((me?.status?.extraDrafts || 0) > 0) {
    await delay(300);
    await setPlayerField(myPlayerId, {'status/extraDrafts': (me.status.extraDrafts - 1)});
    await doDraftPhase(true);
    return;
  }
  
  await fbUpdate({phase:'draft'},'gameState');
}

async function executeDiceWithDominance(die,ctx) {
  const roll=await executeOneDie(die,ctx);if(roll==null)return;
  for(let i=0;i<4;i++){
    if(roll>=4)break;
    await delay(800);
    playSound('roll');
    const rr=rollDie(die);
    await showSubtitle(`👑 下克上 再発動: [${rr}]`, 'effect');
    pushPopup(`👑 下克上: 再発動${i+1}/4 [${rr}]`,'effect');
    if(rr>=4){
      await showSubtitle(`👑 [${rr}] 4以上→終了`, 'system');
      pushPopup(`👑 [${rr}] 4以上→終了`,'system');break;
    }
    await EH[die.cid]?.(die,rr,{...ctx,_thornDone:false},false);await checkDeaths();
  }
}

// ================================================================
// PHASE: ドラフト
// ================================================================
async function doDraftPhase(extraRound=false) {
  const loot=localGameState?.loot?.[myPlayerId]||[];
  const pool=[...loot,...Array.from({length:4},()=>mkDie(randDiceId()))];
  document.getElementById('draft-subtitle').textContent=extraRound?'トレジャー追加ドラフト！ 2枚選んでください':'2枚のダイスを選んでください';
  showScreen('screen-draft');showFabGroup(true);renderDraftPool(pool);
  const picks=await waitDraftPicks();
  myHand=await getHand(myPlayerId);myHand.push(...picks);await setHand(myPlayerId,myHand);
  if(loot.length>0)await R('gameState/loot/'+myPlayerId).set(null);
  for(const p of picks){pushPopup(`📦 ${localPlayers[myPlayerId]?.name||'?'} が「${DC[p.cid]?.name}」を獲得！`,'system');await addLog(`📦 ドラフト: ${DC[p.cid]?.name}`,'system');}
  const me = localPlayers[myPlayerId];
  if (extraRound) {
    if ((me?.status?.extraDrafts || 0) > 0) {
      await setPlayerField(myPlayerId, {'status/extraDrafts': (me.status.extraDrafts - 1)});
      await delay(300);
      await doDraftPhase(true);
      return;
    }
  } else {
    // 初回ドラフト終了後
    if ((me?.status?.extraDrafts || 0) > 0) {
      await setPlayerField(myPlayerId, {'status/extraDrafts': (me.status.extraDrafts - 1)});
      await delay(300);
      await doDraftPhase(true);
      return;
    }
  }
  
  showScreen('screen-game');showFabGroup(true);renderHand(false);await fbUpdate({phase:'end'},'gameState');
}

let draftPicks=[],draftPool=[],draftResolve=null;

function renderDraftPool(pool) {
  draftPool=pool;draftPicks=[];
  document.getElementById('draft-counter').textContent='0 / 2 選択中';
  document.getElementById('btn-draft-confirm').disabled=true;
  const el=document.getElementById('draft-pool');el.innerHTML='';
  for(const die of pool){const card=renderDiceCard(die,{selectable:true,selected:false});card.addEventListener('click',()=>handleDraftSelect(die.iid,pool));el.appendChild(card);}
}

function handleDraftSelect(iid,pool) {
  const die=pool.find(d=>d.iid===iid);if(!die)return;
  if(draftPicks.some(d=>d.iid===iid))draftPicks=draftPicks.filter(d=>d.iid!==iid);
  else if(draftPicks.length<2)draftPicks.push(die);
  else draftPicks=[draftPicks[1],die];
  document.getElementById('draft-counter').textContent=`${draftPicks.length} / 2 選択中`;
  document.getElementById('btn-draft-confirm').disabled=draftPicks.length!==2;
  const el=document.getElementById('draft-pool');el.innerHTML='';
  for(const d of pool){const sel=draftPicks.some(p=>p.iid===d.iid);const card=renderDiceCard(d,{selectable:true,selected:sel,orderNum:draftPicks.findIndex(p=>p.iid===d.iid)+1});card.addEventListener('click',()=>handleDraftSelect(d.iid,pool));el.appendChild(card);}
}

function waitDraftPicks() { return new Promise(resolve=>{draftResolve=resolve;}); }

// ================================================================
// PHASE: エンド
// ================================================================
async function doEndPhase() {
  if(localGameState?.suddenDeath){
    await delay(600);
    await showSubtitle('🔥 サドンデス・ペナルティ！', 'damage');
    pushPopup('🔥 サドンデス: ダイスを振ります！','damage');
    const sdDie = mkDie('sudden_death');
    const roll = rollDie(sdDie);
    await showDiceRollAnim(sdDie, roll);
    await applyDamage(myPlayerId, roll, true);
    const gameOver=await checkDeaths();if(gameOver)return;
  }
  myHand=await getHand(myPlayerId);if(myHand.length>MAX_HAND)await doDiscardModal(myHand.length-MAX_HAND);
  await advanceTurn();
}

// ================================================================
// 手札捨てモーダル
// ================================================================
let discardResolve=null,discardSelected=[];

async function doDiscardModal(count) {
  discardSelected=[];
  document.getElementById('discard-subtitle').textContent=`${count}枚捨ててください（現在${myHand.length}枚 → ${MAX_HAND}枚にする）`;
  document.getElementById('btn-discard-confirm').disabled=true;
  renderDiscardHand(myHand.length-MAX_HAND);openModal('modal-discard');
  await new Promise(resolve=>{discardResolve=resolve;});closeModal('modal-discard');
  const discardIids=new Set(discardSelected.map(d=>d.iid));
  myHand=myHand.filter(d=>!discardIids.has(d.iid));await setHand(myPlayerId,myHand);
}

function renderDiscardHand(cnt) {
  const el=document.getElementById('discard-hand');el.innerHTML='';
  for(const die of myHand){
    const sel=discardSelected.some(d=>d.iid===die.iid);
    const card=renderDiceCard(die,{selectable:true,selected:sel});
    card.addEventListener('click',()=>{
      if(sel)discardSelected=discardSelected.filter(d=>d.iid!==die.iid);
      else if(discardSelected.length<cnt)discardSelected.push(die);
      document.getElementById('btn-discard-confirm').disabled=discardSelected.length!==cnt;
      renderDiscardHand(cnt);
    });
    el.appendChild(card);
  }
}

// ================================================================
// 死亡判定
// ================================================================
async function checkDeaths() {
  const players=await getPlayers();
  const justDied=Object.entries(players).filter(([,p])=>!p.eliminated&&p.hp<=0);
  for(const [pid,p] of justDied){
    await setPlayerField(pid,{eliminated:true,hp:0});
    pushPopup(`💀 ${p.name} が脱落！`,'death');await addLog(`💀 ${p.name} 脱落`,'death');
    const loot=await getHand(pid);
    if(loot.length>0){await R('gameState/loot/'+myPlayerId).set(loot);pushPopup(`🎁 ${p.name} の手札 ${loot.length}枚がドロップ！`,'system');await addLog(`🎁 遺品${loot.length}枚`,'system');}
  }
  const allPlayers=await getPlayers();const alive=Object.entries(allPlayers).filter(([,p])=>!p.eliminated);
  if(alive.length===0){await endGame(Object.keys(allPlayers));return true;}
  if(alive.length===1&&Object.keys(allPlayers).length>1){await endGame([alive[0][0]]);return true;}
  return false;
}

// ================================================================
// ターン進行
// ================================================================
async function advanceTurn() {
  const gs=localGameState||await getGS();const players=await getPlayers();
  const {turnOrder,currentPlayerIndex,round}=gs;
  let nextIdx=currentPlayerIndex,loopCount=0;
  do{nextIdx=(nextIdx+1)%turnOrder.length;loopCount++;if(loopCount>turnOrder.length)break;}
  while(players[turnOrder[nextIdx]]?.eliminated);
  const newRound=nextIdx<=currentPlayerIndex?round+1:round;
  const totalPlayers=Object.keys(players).length;
  const sdThreshold=9;const suddenDeath=gs.suddenDeath||newRound>sdThreshold;
  if(!gs.suddenDeath&&suddenDeath){pushPopup(`⚡ サドンデスモード突入！（Round 10）`,'death');await addLog('⚡ サドンデス突入！','death');openModal('modal-sudden');}
  await fbUpdate({currentPlayerIndex:nextIdx,round:newRound,suddenDeath,phase:'start',draftPool:null},'gameState');
}

// ================================================================
// ゲーム終了
// ================================================================
async function endGame(winnerIds) {
  await R('meta').update({status:'ended',winnerIds});
  await addLog(`🏆 ゲーム終了！勝者: ${winnerIds.map(id=>localPlayers[id]?.name||id).join(', ')}`,'death');
}

function showEndScreen(meta) {
  showScreen('screen-end');showFabGroup(false);
  const winIds=meta.winnerIds||[];const names=winIds.map(id=>localPlayers[id]?.name||id);
  document.getElementById('end-title').textContent=winIds.includes(myPlayerId)?'🏆 あなたの勝利！':'💀 残念...';
  document.getElementById('winner-names').textContent=names.join('  &  ')||'---';
  document.getElementById('end-subtitle').textContent=winIds.length>1?'全員同時勝利！':'最後の生存者';
}

// ================================================================
// ロビーに戻る / 再戦
// ================================================================
async function backToLobby() {
  const btn=document.getElementById('btn-back-lobby');
  if(btn){btn.disabled=true;btn.textContent='処理中...';}
  try{
    const players=await getPlayers();
    for(const pid of Object.keys(players)){
      await setPlayerField(pid,{hp:HP_MAX,barrier:0,eliminated:false,status:defaultStatus()});
      await R('hands',pid).set({dice:[],mulliganDone:false});
    }
    await R('gameState').set(null);await R('log').set(null);fullLogEntries=[];
    await R('meta').update({status:'lobby',winnerIds:null});
  }finally{if(btn){btn.disabled=false;btn.textContent='🏠 ロビーに戻る';}}
}

async function startRematch() {
  const btn=document.getElementById('btn-rematch');
  if(btn){btn.disabled=true;btn.textContent='準備中...';}
  try{await R('log').set(null);fullLogEntries=[];await startGame();}
  finally{if(btn){btn.disabled=false;btn.textContent='🔄 再戦する（同じメンバーで）';}}
}

// ================================================================
// Firebase リスナー一括設定
// ================================================================
function setupRoomListeners() {
  if(listenersActive)return;listenersActive=true;

  // ─ イベント同期（他プレイヤーの演出を受信）
  const startTs = Date.now();
  listenChildAdded(R('events').orderByChild('ts').startAt(startTs), snap => {
    const ev = snap.val();
    if (!ev || ev.actorId === myPlayerId) return; // 自分のイベントはローカルで再生済みなので無視
    if (ev.type === 'popup') pushPopup(ev.msg, ev.msgType, true);
    if (ev.type === 'subtitle') showSubtitle(ev.msg, ev.msgType, true);
    if (ev.type === 'diceroll') showDiceRollAnim(ev.die, ev.roll, true);
    if (ev.type === 'floatNum') floatNum(ev.pid, ev.amount, ev.kind, true);
    if (ev.type === 'animPlayer') animPlayer(ev.pid, ev.animType, true);
  });

  // ─ メタ（画面遷移ドライバー）
  listen(R('meta'), async snap=>{
    localMeta=snap.val();if(!localMeta)return;
    const passEl=document.getElementById('room-passphrase-display');
    if(passEl&&localMeta.passphrase)passEl.textContent=localMeta.passphrase;
    switch(localMeta.status){
      case'lobby':showScreen('screen-lobby');showFabGroup(false);renderLobbyPlayers();break;
      case'mulligan':await initMulliganScreen();break;
      case'playing':if(!document.getElementById('screen-game').classList.contains('active')){showScreen('screen-game');showFabGroup(true);}break;
      case'ended':showEndScreen(localMeta);break;
    }
  });

  // ─ プレイヤー全体
  listen(R('players'), snap=>{
    localPlayers=snap.val()||{};renderLobbyPlayers();renderOpponents();renderSelf();
  });

  // ─ 自分の手札
  listen(R('hands',myPlayerId,'dice'), snap=>{
    const raw=snap.val();
    myHand=(raw?(Array.isArray(raw)?raw:Object.values(raw)):[]).filter(x=>x!=null);
    renderSelf();
    if(localMeta?.status === 'mulligan') renderMulliganHand();
    else if(isMyTurnActive)renderHand(true);else renderHand(false);
  });

  // ─ ゲームステート
  listen(R('gameState'), async snap=>{
    const gs=snap.val();if(!gs)return;
    localGameState=gs;updateGameUI();
    // 他プレイヤーの手札枚数リスナーを動的に追加（1回だけ）
    if(gs.turnOrder&&!window._handListenersReady){
      window._handListenersReady=true;
      for(const pid of gs.turnOrder){
        if(pid===myPlayerId)continue;
        const handRef=R('hands',pid,'dice');
        handRef.on('value',snap2=>{handCounts[pid]=(snap2.val()||[]).length;renderOpponents();});
        // これらは leaveRoom で off する（listenヘルパーを使わずに直接）
      }
    }
    const {turnOrder,currentPlayerIndex,phase}=gs;if(!turnOrder)return;
    const currentPid=turnOrder[currentPlayerIndex];

    
    if(currentPid!==myPlayerId){setMyTurnUI(false);setWaitingText(localPlayers[currentPid]?.name||'?');return;}
    if(phase==='action_execute' && currentPid===myPlayerId) {
       setMyTurnUI(false);
       setWaitingText('あなたの攻撃（タップでダイスを振る）');
       return;
    }
    
    if(phase==='start') await doStartPhase();
    if(phase==='action')await doActionPhase();
    if(phase==='draft') await doDraftPhase();
    if(phase==='end')   await doEndPhase();
  });


  // ─ ログ
  listen(R('log'), snap=>{
    const val=snap.val();if(!val)return;
    fullLogEntries=Object.values(val).sort((a,b)=>a.ts-b.ts);renderFullLog();
  });
}

// ================================================================
// LOBBY
// ================================================================
function renderLobbyPlayers() {
  const list=document.getElementById('lobby-player-list');if(!list)return;list.innerHTML='';
  const entries=Object.entries(localPlayers).sort((a,b)=>(a[1].order||0)-(b[1].order||0));
  for(const [pid,p] of entries){
    const item=document.createElement('div');item.className='player-list-item';
    item.innerHTML=`<div class="player-avatar" style="background:${PLAYER_COLORS[(p.order||0)%PLAYER_COLORS.length]};color:#000">${p.name.charAt(0)}</div><span>${p.name}</span>${pid===myPlayerId?'<span class="badge badge-me">あなた</span>':''}${pid===localMeta?.hostId?'<span class="badge badge-host">ホスト</span>':''}`;
    list.appendChild(item);
  }
  const cnt=entries.length;const startBtn=document.getElementById('btn-start-game');
  if(startBtn){startBtn.disabled=cnt<2||!isHost;startBtn.textContent=isHost?`ゲーム開始（${cnt}人）`:`ホストを待っています（${cnt}人）`;}
  const statusEl=document.getElementById('lobby-status');
  if(statusEl)statusEl.textContent=cnt<2?'あと1人以上必要です':cnt>=MAX_PLAYERS?'満員':'';
}

// ================================================================
// マリガン
// ================================================================
let mulliganPicks=[];

async function initMulliganScreen() {
  if(document.getElementById('screen-mulligan').classList.contains('active'))return;
  showScreen('screen-mulligan');myHand=await getHand(myPlayerId);mulliganPicks=[];renderMulliganHand();
}

function renderMulliganHand() {
  const el=document.getElementById('mulligan-hand');if(!el)return;el.innerHTML='';
  for(const die of myHand){
    const sel=mulliganPicks.includes(die.iid);const card=renderDiceCard(die,{selectable:true,selected:sel});
    card.addEventListener('click',()=>{
      if(mulliganPicks.includes(die.iid)) mulliganPicks=mulliganPicks.filter(i=>i!==die.iid);
      else mulliganPicks.push(die.iid);
      document.getElementById('btn-mulligan-swap').disabled=mulliganPicks.length===0;
      renderMulliganHand();
    });
    el.appendChild(card);
  }
}

async function completeMulligan(swap) {
  document.getElementById('btn-mulligan-swap').disabled=true;document.getElementById('btn-mulligan-skip').disabled=true;
  if(swap&&mulliganPicks.length>0){
    myHand=myHand.map(d=>{
      if(mulliganPicks.includes(d.iid)) return mkDie(randDiceId());
      return d;
    });
  }
  await setHand(myPlayerId,myHand);await R('hands',myPlayerId).update({mulliganDone:true});
  document.getElementById('mulligan-waiting').style.display='flex';
  if(isHost)await checkMulliganAllDone();
}

async function checkMulliganAllDone() {
  const handsSnap=await R('hands').once('value');const hands=handsSnap.val()||{};
  const players=await getPlayers();const pids=Object.keys(players);
  const allDone=pids.every(pid=>hands[pid]?.mulliganDone);
  if(allDone){await fbUpdate({phase:'start',round:1},'gameState');await R('meta').update({status:'playing'});await addLog('🎮 ゲーム開始！全員マリガン完了！','system');}
}

function watchMulliganForAll() {
  const handsRef=R('hands');
  const cb=async snap=>{
    const hands=snap.val()||{};const players=await getPlayers();const pids=Object.keys(players);
    if(isHost){const allDone=pids.every(pid=>hands[pid]?.mulliganDone);if(allDone&&localMeta?.status==='mulligan')await checkMulliganAllDone();}
  };
  handsRef.on('value',cb);
  unsubList.push(()=>handsRef.off('value',cb));
}

// ================================================================
// ゲーム開始
// ================================================================
async function startGame() {
  const players=await getPlayers();const pids=Object.keys(players);
  for(let i=pids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pids[i],pids[j]]=[pids[j],pids[i]];}
  for(let i=0;i<pids.length;i++)await setPlayerField(pids[i],{hp:HP_MAX,barrier:0,eliminated:false,order:i,status:defaultStatus()});
  for(const pid of pids){const hand=Array.from({length:4},()=>mkDie(randDiceId()));await R('hands',pid).set({dice:hand,mulliganDone:false});}
  for(const pid of pids){const b=10;await setPlayerField(pid,{barrier:b});await addLog(`🛡 ${localPlayers[pid]?.name||pid} 初期バリア: ${b}`,'barrier');}
  window._handListenersReady=false;
  await fbSet({phase:'mulligan',round:1,currentPlayerIndex:0,turnOrder:pids,suddenDeath:false,draftPool:null,loot:null},'gameState');
  await R('meta').update({status:'mulligan'});
}

// ================================================================
// ENTER ROOM（合言葉による入室・再接続）
// ================================================================
async function enterRoom(passphrase,playerName) {
  const roomKey=sanitizePassphrase(passphrase);const savedPid=getStoredPid(roomKey,playerName);
  myRoomId=roomKey;
  let snapVal;
  try{snapVal=await dbGet(`rooms/${roomKey}`);}
  catch(e){showError('接続エラー: '+e.message);myRoomId=null;return;}

  // ── 部屋がない → 新規作成（ホスト）
  if(!snapVal){
    myPlayerId=savedPid||('p_'+uid());isHost=true;storePid(roomKey,playerName,myPlayerId);
    await db.ref(`rooms/${roomKey}`).set({
      meta:{hostId:myPlayerId,status:'lobby',passphrase,createdAt:Date.now()},
      players:{[myPlayerId]:{name:playerName,hp:HP_MAX,barrier:0,eliminated:false,order:0,status:defaultStatus()}},
      hands:{[myPlayerId]:{dice:[],mulliganDone:false}},
      gameState:null,log:null,
    });
    localMeta={hostId:myPlayerId,status:'lobby',passphrase};localPlayers={};
    showScreen('screen-lobby');setupRoomListeners();watchMulliganForAll();return;
  }

  const {meta,players}=snapVal;const status=meta?.status;
  const existing=players?Object.entries(players).find(([,p])=>p.name===playerName):[null,null];
  const [existingPid,existingPlayer]=existing||[null,null];

  if(status==='lobby'||status==='ended') {
    if(existingPid){
      if(savedPid&&savedPid===existingPid){myPlayerId=existingPid;isHost=meta.hostId===myPlayerId;}
      else{showError(`「${playerName}」はすでに使われています`);myRoomId=null;return;}
    } else {
      const pcount=Object.keys(players||{}).length;
      if(pcount>=MAX_PLAYERS){showError('ルームが満員です（最大7人）');myRoomId=null;return;}
      myPlayerId=savedPid||('p_'+uid());isHost=false;
      await db.ref(`rooms/${roomKey}/players/${myPlayerId}`).update({name:playerName,hp:HP_MAX,barrier:0,eliminated:false,order:pcount,status:defaultStatus()});
      await db.ref(`rooms/${roomKey}/hands/${myPlayerId}`).update({dice:[],mulliganDone:false});
    }
    storePid(roomKey,playerName,myPlayerId);localMeta=meta;
    showScreen('screen-lobby');setupRoomListeners();watchMulliganForAll();return;
  }

  if(status==='mulligan'||status==='playing') {
    if(!existingPid){showError('ゲームはすでに進行中です。参加できません。');myRoomId=null;return;}
    myPlayerId=existingPid;isHost=meta.hostId===myPlayerId;
    storePid(roomKey,playerName,myPlayerId);localMeta=meta;localPlayers=players||{};localGameState=snapVal.gameState||null;
    setupRoomListeners();watchMulliganForAll();return;
  }

  showError('不明なルーム状態です');myRoomId=null;
}

// ================================================================
// ログ全体
// ================================================================
function renderFullLog() {
  const el=document.getElementById('log-full-list');if(!el)return;
  const typeColor={damage:'#ff3333',penetrate:'#ff9900',heal:'#3effa0',barrier:'#38d9ff',effect:'#c044ff',system:'#4d3d66',death:'#ffcc00'};
  el.innerHTML=fullLogEntries.map(e=>`<div class="log-entry-full" style="border-left-color:${typeColor[e.type]||'#4d3d66'}"><span style="color:#4d3d66;font-size:.65rem">R${e.round}</span> ${e.msg}</div>`).join('');
  el.scrollTop=el.scrollHeight;
}

// ================================================================
// EVENT LISTENERS
// ================================================================
function initEvents() {
  // Sound toggle
  const soundBtn = document.getElementById('sound-toggle');
  if(soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.textContent = soundEnabled ? '🔊 音ON' : '🔇 音OFF';
      soundBtn.classList.toggle('on', soundEnabled);
      initAudio();
    });
  }

  // Log toggle
  const toggleLogBtn = document.getElementById('btn-toggle-log');
  if(toggleLogBtn) {
    toggleLogBtn.addEventListener('click', () => {
      const logArea = document.getElementById('action-log-area');
      if (logArea.classList.contains('collapsed')) {
        logArea.classList.remove('collapsed');
        toggleLogBtn.textContent = '📜 ログを閉じる';
        logArea.scrollTop = logArea.scrollHeight;
      } else {
        logArea.classList.add('collapsed');
        toggleLogBtn.textContent = '📜 ログを開く';
      }
    });
  }

  document.getElementById('btn-enter-room').addEventListener('click',async()=>{
    const passphrase=document.getElementById('input-passphrase').value.trim();
    const playerName=document.getElementById('input-name').value.trim();
    if(!passphrase){showError('合言葉を入力してください');return;}
    if(!playerName){showError('プレイヤー名を入力してください');return;}
    const btn=document.getElementById('btn-enter-room');btn.disabled=true;btn.textContent='接続中...';
    try{await enterRoom(passphrase,playerName);}
    catch(e){showError('エラー: '+e.message);console.error(e);}
    finally{btn.disabled=false;btn.textContent='🚪 入室する';}
  });

  document.getElementById('input-passphrase').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('input-name').focus();});
  document.getElementById('input-name').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-enter-room').click();});

  document.getElementById('btn-start-game').addEventListener('click',startGame);
  document.getElementById('btn-leave-lobby').addEventListener('click',leaveRoom);
  document.getElementById('room-passphrase-display').addEventListener('click',()=>{
    const txt=document.getElementById('room-passphrase-display').textContent;
    navigator.clipboard?.writeText(txt).then(()=>{const el=document.getElementById('room-passphrase-display');const ori=el.textContent;el.textContent='コピーしました！';setTimeout(()=>el.textContent=ori,1500);});
  });

  document.getElementById('btn-mulligan-swap').addEventListener('click',()=>completeMulligan(true));
  document.getElementById('btn-mulligan-skip').addEventListener('click',()=>completeMulligan(false));

  document.getElementById('btn-use-dice').addEventListener('click',useSelectedDice);

  document.getElementById('btn-draft-confirm').addEventListener('click',()=>{
    if(draftPicks.length===2&&draftResolve){const res=draftResolve;draftResolve=null;res(draftPicks);}
  });

  document.getElementById('btn-discard-confirm').addEventListener('click',()=>{
    if(discardResolve){const res=discardResolve;discardResolve=null;res();}
  });

  document.getElementById('btn-close-sudden').addEventListener('click',()=>closeModal('modal-sudden'));

  document.getElementById('btn-rematch').addEventListener('click',startRematch);
  document.getElementById('btn-back-lobby').addEventListener('click',backToLobby);
  document.getElementById('btn-back-top').addEventListener('click',leaveRoom);
  document.getElementById('btn-show-endlog').addEventListener('click',()=>{renderFullLog();openModal('modal-log');});

  document.getElementById('fab-log').addEventListener('click',()=>{renderFullLog();openModal('modal-log');});
  document.getElementById('fab-rules').addEventListener('click',()=>openModal('modal-rules'));
  document.getElementById('fab-catalog').addEventListener('click',()=>{buildCatalog();openModal('modal-catalog');});

  document.querySelectorAll('.catalog-filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>filterCatalog(btn.dataset.rarity));
  });

  document.getElementById('close-player-status').addEventListener('click',()=>closeModal('modal-player-status'));
  document.getElementById('close-dice-detail').addEventListener('click',  ()=>closeModal('modal-dice-detail'));
  document.getElementById('close-log').addEventListener('click',          ()=>closeModal('modal-log'));
  document.getElementById('close-rules').addEventListener('click',        ()=>closeModal('modal-rules'));
  document.getElementById('close-catalog').addEventListener('click',      ()=>closeModal('modal-catalog'));

  document.querySelectorAll('.modal-overlay').forEach(overlay=>{
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal(overlay.id);});
  });
}

// ================================================================
// ルーム退出
// ================================================================
function leaveRoom() {
  // リスナー全解除
  unsubList.forEach(fn=>{try{fn();}catch(e){}});unsubList.length=0;
  // 手札枚数リスナーも解除
  if(localGameState?.turnOrder){
    for(const pid of localGameState.turnOrder){
      if(pid===myPlayerId)continue;
      try{R('hands',pid,'dice').off('value');}catch(e){}
    }
  }
  myRoomId=null;isHost=false;listenersActive=false;window._handListenersReady=false;
  localPlayers={};localGameState=null;localMeta=null;myHand=[];selectedIds=[];fullLogEntries=[];
  showScreen('screen-top');showFabGroup(false);
}

// ================================================================
// MAIN
// ================================================================
document.addEventListener('DOMContentLoaded',()=>{
  initEvents();
  buildCatalog();

  // 前回の入力を復元
  const lastName=localStorage.getItem('dr_lastName');
  if(lastName)document.getElementById('input-name').value=lastName;
  // 前回のルームの合言葉を復元する試み
  const lastRoom=localStorage.getItem('dr_lastRoom');
  if(lastRoom){
    db.ref(`rooms/${lastRoom}/meta/passphrase`).once('value').then(snap=>{
      const ph=snap.val();
      if(ph)document.getElementById('input-passphrase').value=ph;
    }).catch(()=>{});
  }
});
