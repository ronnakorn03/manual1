// ===== base =====
const app = document.getElementById('app');
const q   = document.getElementById('q');

// ดึงข้อมูลจาก window ให้ชัวร์ (กันเผื่อโหลดช้า/ไม่เป็น global)
const CARE_DATA  = window.CARE_DATA  || [];
const GEAR_DATA  = window.GEAR_DATA  || [];
const ROOM_GUIDE = window.ROOM_GUIDE || {steps:[], redflags:[]};

// อีโมจิแทนแต่ละอุปกรณ์ (ใช้ตอนรูปหาย)
const GEAR_ICON = {
  "saline":"🧴","gauze-pad":"🩹","adhesive-bandage":"🩹","non-adherent":"🩹",
  "tape":"🧻","roller-gauze":"🧻","elastic-bandage":"🧻","triangular":"🧣",
  "alcohol":"🧪","povidone":"🧪","gloves":"🧤","tweezers":"🔎","scissors":"✂️",
  "instant-cold-pack":"🧊","burn-gel":"🧴","eye-wash":"👁️","thermometer":"🌡️",
  "cpr-mask":"🛟","sam-splint":"🦴","island-dressing":"🩹","cotton-swab":"🪥",
  "mask":"😷","logbook":"📒","aed":"⚡"
};

// สร้างรูป thumbnail + ลองหลายสกุล + มีอีโมจิ fallback
function makeThumb(slug, name, size='sm'){
  const wrap  = h('div',{class:'thumb-wrap'});
  const img   = h('img',{alt:name, loading:'lazy'});
  const badge = h('div',{class:'icon-badge' + (size==='lg'?' lg':'')}, GEAR_ICON[slug] || '🧰');
  wrap.append(img, badge);

  img.addEventListener('load',  ()=>{ badge.style.display='none'; });
  img.addEventListener('error', tryNext);

  // ลองหลายสกุลไฟล์ (กันกรณีรูปเป็น .png/.webp)
  const exts = ['.jpg','.png','.jpeg','.webp'];
  let i = 0;
  function tryNext(){
    if(i >= exts.length){
      img.style.display = 'none';
      badge.style.display = 'flex';
      return;
    }
    // bust cache เผื่อแคชค้าง
    img.src = `img/gear/${slug}${exts[i++]}?v=1`;
  }
  tryNext();
  return wrap;
}

// ===== tiny hyperscript =====
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);

  if (attrs && typeof attrs === 'object'){
    Object.entries(attrs).forEach(([k,v])=>{
      if (v == null) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
  }

  for (const c of children.flat()){
    if (c == null || c === false) continue;
    if (typeof c === 'string' || typeof c === 'number'){
      el.append(document.createTextNode(String(c)));
    }else{
      el.append(c);
    }
  }
  return el;
}

function appendSafe(parent, ...nodes){
  for (const n of nodes.flat()){
    if (n == null || n === false) continue;
    parent.append(n);
  }
}

// ===== Home =====
function Home(){
  app.innerHTML = '';
  app.append(
    h('div',{class:'grid home-cards'},
      h('a',{href:'#/care',class:'card',style:'text-decoration:none'},
        h('h3',{},'🩹 การทำแผล'),
        h('span',{class:'muted'},'เปิดดู')
      ),
      h('a',{href:'#/gear',class:'card',style:'text-decoration:none'},
        h('h3',{},'🧰 อุปกรณ์'),
        h('span',{class:'muted'},'เปิดดู')
      ),
      h('a',{href:'#/room',class:'card',style:'text-decoration:none'},
        h('h3',{},'🏥 วิธีใช้ห้องพยาบาล'),
        h('span',{class:'muted'},'เปิดดู')
      )
    )
  );
}

// ===== Care list / detail =====
// อิโมจิประจำสถานการณ์แผล
const CARE_ICON = {
  "abrasion": "🩹",          // แผลถลอก
  "cut-minor": "🩸",         // แผลมีดบาดตื้น
  "burn-minor": "🔥",        // แผลไหม้/น้ำร้อนลวก
  "nosebleed": "👃",         // เลือดกำเดา
  "sprain-strain": "🦵",     // ข้อแพลง/กล้ามเนื้อฉีกเล็กน้อย
  "blister": "🫧",           // ตุ่มพอง/รองเท้ากัด
  "splinter": "🌵",          // เสี้ยน/หนามตำ
  "eye-irritation": "👁️",   // ฝุ่นเข้าตา/ตาเคือง
  "bite-sting": "🐝",        // แมลงกัดต่อย (ไม่แพ้รุนแรง)
  "fainting": "😵",          // เป็นลม/วูบ
  "head-bump": "🧠"          // ศีรษะกระแทก
};

// ทำไอคอนวงกลม (เล็ก/ใหญ่) — ถ้าไม่มี CSS ก็จะเห็นเป็นอิโมจิเฉยๆ (โอเค)
function makeCareIcon(slug, size='sm'){
  const base = {
    display: 'inline-grid',
    placeItems: 'center',
    width: '42px',
    height: '42px',
    minWidth: '42px',
    borderRadius: '999px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '22px',
    lineHeight: '1',
    userSelect: 'none',
    marginRight: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,.06)'
  };
  if(size === 'lg'){
    base.width = base.height = base.minWidth = '84px';
    base.fontSize = '44px';
    base.marginRight = '0';
    base.boxShadow = '0 10px 30px rgba(0,0,0,.15)';
  }
  const wrap = h('div', { class: 'icon-circle' });
  Object.assign(wrap.style, base);
  wrap.textContent = CARE_ICON[slug] || '🩺';
  return wrap;
}

function ListCare(filter=''){
  app.innerHTML='';

  const items = (window.CARE_DATA || CARE_DATA)
    .filter(x => ((x.name || '') + ' ' + ((x.tags || []).join(' ')))
      .toLowerCase().includes((filter || '').toLowerCase()))
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'th'));

  app.append(
    h('div',{class:'section'},
      h('h2',{class:'section-title'},'การทำแผล'),
      h('div',{class:'auto-grid'},
        ...items.map(x =>
          h('a',{
              href:`#/care/${x.slug}`,
              class:'pill-card media',
              // บังคับเป็นแถว + เผื่อไม่มี CSS
              style:'display:flex;align-items:center;gap:12px;'
            },
            // อิโมจิวงกลมด้านซ้าย
            makeCareIcon(x.slug,'sm'),
            h('div',{class:'meta'},
              h('div',{class:'title'}, x.name),
              (x.tags && x.tags.length)
                ? h('div',{class:'tags'}, ...x.tags.slice(0,3).map(t=>h('span',{class:'tag'},t)))
                : null
            )
          )
        )
      )
    )
  );
}



function CareDetail(slug){
  const it = (window.CARE_DATA || CARE_DATA).find(x => x.slug === slug);
  if(!it){ ListCare(); return; }

  app.innerHTML = '';
  app.append(
    h('a',{href:'#/care',class:'btn',style:'margin-bottom:12px;display:inline-flex'},'← กลับ'),

    // ✅ หัวข้อมีอิโมจิประกบ
    h('h2',{}, `${CARE_ICON[it.slug] || '🩺'} ${it.name}`),

  
    // ไอคอนใหญ่
h('div',{class:'hero-icon', style:'display:flex;justify-content:center;margin:8px 0 18px;'},
  makeCareIcon(it.slug,'lg')
),


    h('div',{class:'detail'},
      h('div',{class:'box klist info'},
        h('h3',{},'อุปกรณ์ที่ใช้บ่อย:'),
        h('ul',{}, ...(it.tools||[]).map(s=>h('li',{},s))),
        h('h3',{},'ขั้นตอน:'),
        h('ol',{}, ...(it.steps||[]).map(s=>h('li',{},s)))
      ),
      h('div',{class:'box klist'},
        it.donts && it.donts.length ? h('h3',{},'ข้อควรหลีกเลี่ยง') : null,
        it.donts && it.donts.length ? h('ul',{}, ...it.donts.map(s=>h('li',{},s))) : null,
        it.redflags && it.redflags.length ? h('h3',{},'สัญญาณอันตราย') : null,
        it.redflags && it.redflags.length ? h('ul',{}, ...it.redflags.map(s=>h('li',{},s))) : null
      )
    )
  );
}

// ===== Gear list / detail =====
function ListGear(filter=''){
  app.innerHTML='';
  const items = (window.GEAR_DATA || GEAR_DATA)
    .filter(x => (x.name + ' ' + (x.aka||[]).join(' ') + ' ' + (x.what||''))
      .toLowerCase().includes((filter||'').toLowerCase()))
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'th'));

  // debug: จำนวนรายการ
  // console.log('GEAR items:', items.length);

  app.append(
    h('div',{class:'section'},
      h('h2',{class:'section-title'},'อุปกรณ์'),
      h('div',{class:'auto-grid'},
        ...items.map(x =>
          h('a',{href:`#/gear/${x.slug}`,class:'pill-card media', title:x.name},
            makeThumb(x.slug, x.name, 'sm'),             // รูป/อีโมจิ (ซ้าย)
            h('div',{class:'meta'},
              h('div',{class:'title'}, x.name),
              (x.aka && x.aka.length)
                ? h('div',{class:'tags'}, ...x.aka.slice(0,3).map(t=>h('span',{class:'tag'},t)))
                : null
            )
          )
        )
      )
    )
  );
}

function GearDetail(slug){
  const it = (window.GEAR_DATA || GEAR_DATA).find(x=>x.slug===slug);
  if(!it){ ListGear(); return; }

  app.innerHTML='';
  app.append(
    h('a',{href:'#/gear',class:'btn',style:'margin-bottom:12px;display:inline-flex'},'← กลับ'),
    h('h2',{}, it.name),

    // รูปใหญ่ (ทำ hero จาก makeThumb)
    h('div',{class:'hero-thumb'},
      (()=>{
        const thumb = makeThumb(it.slug, it.name, 'lg');
        const frag = document.createDocumentFragment();
        [...thumb.childNodes].forEach(n=>frag.appendChild(n));
        return frag;
      })()
    ),

    h('div',{class:'detail'},
      h('div',{class:'box klist info'},
        it.what  ? h('h3',{},'คืออะไร') : null,
        it.what  ? h('p',{}, it.what)    : null,
        it.when  ? h('h3',{},'ใช้เมื่อไหร่') : null,
        it.when  ? h('p',{}, it.when)        : null,
        it.how && it.how.length ? h('h3',{},'วิธีใช้') : null,
        it.how && it.how.length ? h('ol',{}, ...it.how.map(s=>h('li',{}, s))) : null
      ),
      h('div',{class:'box klist'},
        it.cautions && it.cautions.length ? h('h3',{},'ข้อควรระวัง') : null,
        it.cautions && it.cautions.length ? h('ul',{}, ...it.cautions.map(s=>h('li',{}, s))) : null
      )
    )
  );
}

// ===== Room =====
function RoomPage(){
  const guide = (window.ROOM_GUIDE || ROOM_GUIDE);
  app.innerHTML='';
  app.append(
    h('h2',{},"วิธีใช้ห้องพยาบาล"),
    h('ul',{},...(guide.steps||[]).map(s=>h('li',{},s))),
    h('h3',{},"สัญญาณอันตราย"),
    h('ul',{},...(guide.redflags||[]).map(s=>h('li',{},s)))
  );
}

// ===== Router =====
function router(){
  const [_, section, id] = (location.hash || '#/').split('/');
  if(section === 'care' && id)      CareDetail(id);
  else if(section === 'care')       ListCare(q?.value || '');
  else if(section === 'gear' && id) GearDetail(id);
  else if(section === 'gear')       ListGear(q?.value || '');
  else if(section === 'room')       RoomPage();
  else                              Home();
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ค้นหาแล้วอัปเดต list ตามหน้า
q?.addEventListener('input', ()=>{
  const hash = location.hash || '#/';
  if(hash.startsWith('#/care')) ListCare(q.value);
  else if(hash.startsWith('#/gear')) ListGear(q.value);
});

// ===== Nav highlight =====
function highlightNav(){
  const hash = location.hash || '#/';
  document.querySelectorAll('nav .btn').forEach(a=>a.classList.remove('active'));
  const map = { '#/':'หน้าหลัก', '#/care':'การทำแผล', '#/gear':'อุปกรณ์', '#/room':'วิธีใช้ห้องพยาบาล' };
  for(const a of document.querySelectorAll('nav .btn')){
    const want = Object.keys(map).find(k => a.textContent.trim() === map[k]) || '';
    if(hash.startsWith(want)) a.classList.add('active');
  }
}
window.addEventListener('hashchange',highlightNav);
window.addEventListener('DOMContentLoaded',highlightNav);
