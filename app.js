// ===== base =====
const app = document.getElementById('app');
const q   = document.getElementById('q');

// ดึงข้อมูลจาก window ให้ชัวร์ (กันเผื่อโหลดช้า/ไม่เป็น global)
const CARE_DATA  = window.CARE_DATA  || [];
const ROOM_GUIDE = window.ROOM_GUIDE || {steps:[], redflags:[]};

// ===== tiny hyperscript =====
// รองรับ children เป็น null/undefined/false และ string/number
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);

  if (attrs && typeof attrs === 'object'){
    Object.entries(attrs).forEach(([k,v])=>{
      if (v == null) return; // ข้าม null/undefined
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

// append แบบปลอดภัย: ข้าม null/undefined/false
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
        h('span',{class:'muted'},'เปิดดู') // ไม่ซ้อน a ใน a
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
function ListCare(filter=''){
  app.innerHTML='';
  const items = (window.CARE_DATA || CARE_DATA)
    .filter(x => (x.name + ' ' + (x.tags||[]).join(' ')).toLowerCase().includes((filter||'').toLowerCase()))
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'th'));

  app.append(
    h('div',{class:'section'},
      h('h2',{class:'section-title'},'การทำแผล'),
      h('div',{class:'auto-grid'},
        ...items.map(x =>
          h('a',{href:`#/care/${x.slug}`,class:'pill-card'},
            h('div',{class:'title'},x.name),
            h('div',{class:'tags'}, ...(x.tags||[]).slice(0,3).map(t=>h('span',{class:'tag'},t)))
          )
        )
      )
    )
  );
}

function CareDetail(slug){
  const it = (window.CARE_DATA || []).find(x => x.slug === slug);
  if(!it){ ListCare(); return; }

  app.innerHTML = '';
  appendSafe(app,
    h('a',{href:'#/care',class:'btn',style:'margin-bottom:12px;display:inline-flex'},'← กลับ'),
    h('h2',{}, it.name),
    (it.tags && it.tags.length) ? h('div',{class:'tags'}, ...it.tags.map(t=>h('span',{class:'tag'},t))) : null,
    h('div',{class:'detail'},
      h('div',{class:'box klist'},
        h('h3',{},'ขั้นตอน'),
        h('ol',{}, ...(it.steps||[]).map(s=>h('li',{},s)))
      ),
      h('div',{class:'box klist'},
        h('h3',{},'อุปกรณ์ที่ใช้บ่อย'),
        h('ul',{}, ...(it.tools||[]).map(s=>h('li',{},s))),
        (it.donts && it.donts.length) ? h('h3',{},'ข้อควรหลีกเลี่ยง') : null,
        (it.donts && it.donts.length) ? h('ul',{}, ...it.donts.map(s=>h('li',{},s))) : null,
        (it.redflags && it.redflags.length) ? h('h3',{},'สัญญาณอันตราย') : null,
        (it.redflags && it.redflags.length) ? h('ul',{}, ...it.redflags.map(s=>h('li',{},s))) : null
      )
    )
  );
}


// ===== Gear list / detail =====
function ListGear(filter=''){
  app.innerHTML='';

  const src = (window.GEAR_DATA || []);  // ใช้จาก window ตรง ๆ ให้ชัวร์
  if(!src.length){
    app.append(
      h('div',{class:'section'},
        h('h2',{class:'section-title'},'อุปกรณ์'),
        h('p',{class:'muted'},
          'ยังไม่พบข้อมูลอุปกรณ์ — เช็คว่าไฟล์ ',
          h('b',{},'gear.js'),
          ' โหลดก่อน ',
          h('b',{},'app.js'),
          ' และประกาศเป็น ',
          h('code',{},'window.GEAR_DATA = [...]'),
          ' แล้ว (ลอง Ctrl+F5 เคลียร์แคช)'
        )
      )
    );
    return;
  }

  const items = src
    .filter(x => (x.name + ' ' + (x.aka||[]).join(' ') + ' ' + (x.what||''))
      .toLowerCase().includes((filter||'').toLowerCase()))
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'th'));

  app.append(
    h('div',{class:'section'},
      h('h2',{class:'section-title'},'อุปกรณ์'),
      h('div',{class:'auto-grid'},
        ...items.map(x =>
          h('a',{href:`#/gear/${x.slug}`,class:'pill-card'},
            h('div',{class:'title'},x.name),
            (x.aka && x.aka.length)
              ? h('div',{class:'tags'}, ...x.aka.slice(0,3).map(t=>h('span',{class:'tag'},t)))
              : null
          )
        )
      )
    )
  );
}

function GearDetail(slug){
  const it = (window.GEAR_DATA || []).find(x => x.slug === slug);
  if(!it){ ListGear(); return; }

  app.innerHTML = '';
  appendSafe(app,
    h('a',{href:'#/gear',class:'btn',style:'margin-bottom:12px;display:inline-flex'},'← กลับ'),
    h('h2',{}, it.name),
    (it.aka && it.aka.length) ? h('div',{class:'tags'}, ...it.aka.map(t => h('span',{class:'tag'}, t))) : null,
    h('div',{class:'detail'},
      h('div',{class:'box klist info'},
        it.what ? h('h3',{},'คืออะไร') : null,
        it.what ? h('p',{}, it.what) : null,
        it.when ? h('h3',{},'ใช้เมื่อไหร่') : null,
        it.when ? h('p',{}, it.when) : null,
        (it.how && it.how.length) ? h('h3',{},'วิธีใช้') : null,
        (it.how && it.how.length) ? h('ol',{}, ...it.how.map(s => h('li',{}, s))) : null
      ),
      h('div',{class:'box klist'},
        (it.cautions && it.cautions.length) ? h('h3',{},'ข้อควรระวัง') : null,
        (it.cautions && it.cautions.length) ? h('ul',{}, ...it.cautions.map(s => h('li',{}, s))) : null
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

// ===== Theme toggle (เหมือนเดิม) =====
(function(){
  const root=document.documentElement;
  const btn=document.getElementById('themeToggle');
  const key='nurse-theme';
  const saved=localStorage.getItem(key);
  if(saved==='dark'){root.classList.add('theme-dark');btn && (btn.textContent='☀️');}
  else if(saved==='light'){root.classList.add('theme-light');btn && (btn.textContent='🌙');}
  btn && btn.addEventListener('click',()=>{
    if(root.classList.contains('theme-dark')){
      root.classList.remove('theme-dark');root.classList.add('theme-light');
      localStorage.setItem(key,'light');btn.textContent='🌙';
    }else{
      root.classList.remove('theme-light');root.classList.add('theme-dark');
      localStorage.setItem(key,'dark');btn.textContent='☀️';
    }
  });
})();

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
