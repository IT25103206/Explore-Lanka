
(function(){
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
 window.customerToast=toast;
 const search=$('[data-search-input]'), filter=$('[data-filter-select]');
 function applyFilter(){const q=(search?.value||'').toLowerCase(), f=(filter?.value||'all').toLowerCase(); $$('[data-filter-item]').forEach(el=>{const text=el.textContent.toLowerCase(), tags=(el.dataset.tags||'').toLowerCase(); el.style.display=((!q||text.includes(q))&&(f==='all'||text.includes(f)||tags.includes(f)))?'':'none'})}
 search?.addEventListener('input',applyFilter); filter?.addEventListener('change',applyFilter);
 $$('[data-toast]').forEach(b=>b.addEventListener('click',()=>toast(b.dataset.toast||'Saved')));
 $$('[data-remove-card]').forEach(b=>b.addEventListener('click',()=>{b.closest('.card')?.remove();toast('Removed')}));
 $$('form[data-local-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const key=form.dataset.localForm;const arr=JSON.parse(localStorage.getItem(key)||'[]');arr.push(Object.fromEntries(new FormData(form).entries()));localStorage.setItem(key,JSON.stringify(arr));const s=$('.form-status',form);if(s)s.textContent='Saved successfully.';toast('Submitted successfully');form.reset()}));
 const add=$('#plannerAdd'), inp=$('#plannerItem'), board=$('#plannerBoard'); if(add&&inp&&board)add.addEventListener('click',()=>{const v=inp.value.trim();if(!v)return;let day=$('.planner-day:last-child',board);if(!day){day=document.createElement('section');day.className='card planner-day';day.innerHTML='<div class="day-head"><h3>Day 1</h3><span>Your plan</span></div>';board.appendChild(day)}const x=document.createElement('div');x.className='planner-item';x.textContent=v;day.appendChild(x);inp.value='';toast('Added to planner')});
 const send=$('#chatSend'), chat=$('#chatInput'), msgs=$('#chatMessages');if(send&&chat&&msgs)send.addEventListener('click',()=>{const v=chat.value.trim();if(!v)return;const b=document.createElement('div');b.className='bubble outgoing';b.textContent=v;msgs.appendChild(b);chat.value='';msgs.scrollTop=msgs.scrollHeight});
 const gs=$('#globalSearchInput'), gb=$('#globalSearchBtn'), gr=$('#globalSearchResults'), sum=$('#searchSummary'); const data=[['Ella','Destination','/images/ella-card.png','/ui/customer-destinations'],['Sigiriya','Destination','/images/sigiriya-card.png','/ui/customer-destinations'],['Hill Country Escape','Tour Package','/images/nuwara-eliya-card.png','/ui/customer-tour-packages'],['Kandy Heritage Hotel','Hotel','/images/kandy-card.png','/ui/customer-hotels'],['Cultural Events','Events','/images/anuradhapura-card.png','/ui/customer-events'],['Private Driver','Transport','/images/sigiriya-card.png','/ui/customer-transport'],['Tour Guide','Guide','/images/horton-plains-card.png','/ui/customer-tour-guides']];
 function runGlobal(){if(!gr)return;const q=(gs?.value||'').toLowerCase();const rows=data.filter(x=>!q||x.join(' ').toLowerCase().includes(q));gr.innerHTML=rows.map(x=>`<article class="card place"><div class="place-cover" style="background-image:url('${x[2]}')"></div><div class="place-body"><h4>${x[0]}</h4><p>${x[1]}</p><a class="btn btn-primary" href="${x[3]}">Open</a></div></article>`).join('');if(sum)sum.textContent=`${rows.length} result${rows.length===1?'':'s'} found`}; gb?.addEventListener('click',runGlobal);gs?.addEventListener('keydown',e=>{if(e.key==='Enter')runGlobal()}); if(gr)runGlobal();
 // Events API with graceful sample fallback
 const eg=$('#eventGrid'); if(eg){fetch('/api/events').then(r=>r.ok?r.json():Promise.reject()).then(raw=>{const list=Array.isArray(raw)?raw:(raw?.data||raw?.content||[]);renderEvents(list.length?list:null)}).catch(()=>renderEvents(null));}
 function renderEvents(list){const sample=[{id:1,name:'Kandy Cultural Night',title:'Kandy Cultural Night',location:'Kandy',date:'2026-11-18',description:'Traditional dance, drums and cultural performances.',category:'Cultural'},{id:2,name:'Galle Food Festival',title:'Galle Food Festival',location:'Galle',date:'2026-12-05',description:'Local cuisine, music and coastal atmosphere.',category:'Festival'},{id:3,name:'Ella Adventure Weekend',title:'Ella Adventure Weekend',location:'Ella',date:'2027-01-16',description:'Hiking, viewpoints and outdoor activities.',category:'Adventure'}]; const rows=list||sample;eg.innerHTML=rows.map((e,i)=>{const name=e.name||e.title||e.eventName||'Sri Lanka Event', loc=e.location||e.venue||'Sri Lanka', date=e.date||e.eventDate||e.startDate||'Upcoming', desc=e.description||'Discover this event and add it to your travel plan.', img=e.imageUrl||['/images/kandy-card.png','/images/mirissa-card.png','/images/ella-card.png'][i%3];return `<article class="card place" data-filter-item data-tags="${String(e.category||'upcoming').toLowerCase()}"><div class="place-cover" style="background-image:url('${img}')"><span>🎉</span></div><div class="place-body"><span class="badge warning">Upcoming</span><h4>${escapeHtml(name)}</h4><p>${escapeHtml(desc)}</p><div class="meta"><span>${escapeHtml(loc)}</span><span>${escapeHtml(String(date))}</span></div><div class="card-actions"><button class="btn btn-soft" data-toast="Event saved">♡ Save</button><a class="btn btn-primary" href="/ui/customer-event-details?id=${encodeURIComponent(e.id||i)}">View event</a></div></div></article>`}).join('');$$('[data-toast]',eg).forEach(b=>b.addEventListener('click',()=>toast(b.dataset.toast||'Saved')))}
 function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();


// ===== Premium customer motion & micro-interactions =====
window.addEventListener('DOMContentLoaded', () => {
  const isCustomerPage = document.querySelector('.app .sidebar') && !document.body.classList.contains('admin-app');
  if (!isCustomerPage) return;

  const targets = [
    ...document.querySelectorAll('.hero,.section-head,.card,.table-wrap,.detail-banner,.emergency-banner,.faq-list details')
  ];
  targets.forEach((el, i) => {
    if (el.closest('.sidebar,.topbar')) return;
    el.classList.add('reveal-item');
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 55}ms`;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    targets.forEach(el => observer.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-visible'));
  }

  document.querySelectorAll('.btn,.icon-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      const size = Math.max(rect.width, rect.height);
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - rect.left - size / 2}px`;
      wave.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 650);
    });
  });

  document.querySelectorAll('.place,.trip-card,.offer-card,.saved-trip').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (window.matchMedia('(max-width: 900px)').matches) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `translateY(-6px) perspective(900px) rotateX(${(-y*2.2).toFixed(2)}deg) rotateY(${(x*2.2).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  const active = document.querySelector('.nav a.active');
  if (active) {
    active.animate(
      [{transform:'translateX(0)'},{transform:'translateX(4px)'},{transform:'translateX(3px)'}],
      {duration:420,easing:'ease-out'}
    );
  }
});
