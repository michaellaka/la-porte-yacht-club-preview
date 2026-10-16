'use strict';
(() => {
 let data={...(window.CLUB_DATA||{events:[],special:null}),...(window.LPYC_LIVE_CONTENT||{})};
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=t=>Number(parts.find(p=>p.type===t).value);
 const today=new Date(part('year'),part('month')-1,part('day'));
 let selected=new Date(today),month=new Date(today.getFullYear(),today.getMonth(),1);
 const days=document.getElementById('calendar-days'),category=document.getElementById('event-category');
 const eventsFor=d=>data.events.filter(e=>e.date===key(d)&&(category.value==='all'||category.value===e.category));
 const longDate=d=>d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 function upcoming(){
  const list=document.getElementById('upcoming-events');if(!list)return;list.replaceChildren();
  const upcomingEvents=data.events.filter(e=>e.date>=key(today)).sort((a,b)=>(a.date+' '+a.time).localeCompare(b.date+' '+b.time)).slice(0,3);
  list.hidden=!upcomingEvents.length;
  const clock=minutes=>`${Math.floor(minutes/60)%12||12}:${String(minutes%60).padStart(2,'0')} ${minutes<720?'a.m.':'p.m.'}`;
  for(const event of upcomingEvents){
   const [year,number,day]=event.date.split('-').map(Number),date=new Date(year,number-1,day);
   const card=document.createElement('article');card.className='upcoming-card';
   const label=document.createElement('p');label.className='eyebrow';label.textContent='UPCOMING AT THE CLUB';
   const title=document.createElement('h3');title.textContent=event.title;
   const meta=document.createElement('p');meta.className='upcoming-meta';let times='';
   if(event.time){const [hour,minute]=event.time.split(':').map(Number),start=hour*60+minute,end=start+(Number(event.durationMinutes)||60);times=` · ${clock(start)}–${clock(end%1440)}${end>=1440?' (next day)':''}`;}
   meta.textContent=longDate(date)+times;
   const location=document.createElement('p');location.textContent=event.location||'La Porte Yacht Club';
   const body=document.createElement('p');body.className='upcoming-description';body.textContent=event.description||'';
   const actions=document.createElement('div');actions.className='upcoming-actions';
   const view=document.createElement('button');view.textContent='View on club calendar';view.onclick=()=>{selected=date;month=new Date(year,number-1,1);category.value='all';render();document.querySelector('.calendar-layout').scrollIntoView({behavior:'smooth',block:'start'});};actions.append(view);
   if(event.time){const download=document.createElement('button');download.textContent='Add to my calendar ↓';download.onclick=()=>downloadEvent(event);actions.append(download);}
   card.append(label,title,meta,location,body,actions);list.append(card);
  }
 }
 function details(){
  document.getElementById('selected-date').textContent=selected.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const list=document.getElementById('day-events');list.replaceChildren();
  const events=eventsFor(selected).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  if(!events.length){const p=document.createElement('p');p.className='empty-message';p.textContent='No confirmed events are listed for this day. Check club updates before making plans.';list.append(p);return;}
  for(const event of events){const article=document.createElement('article');article.className='event-card';const title=document.createElement('h4');title.textContent=event.title;const p=document.createElement('p');p.textContent=`${event.time||'Time to be confirmed'} · ${event.description||''}`;article.append(title,p);if(event.time){const button=document.createElement('button');button.textContent='Add to calendar ↓';button.addEventListener('click',()=>downloadEvent(event));article.append(button);}list.append(article);}
 }
 function render(){
  document.getElementById('month-label').textContent=month.toLocaleDateString('en-US',{month:'long',year:'numeric'});days.replaceChildren();
  for(let i=0;i<month.getDay();i++){const blank=document.createElement('span');blank.className='empty';days.append(blank);}
  const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  for(let n=1;n<=count;n++){const d=new Date(month.getFullYear(),month.getMonth(),n),button=document.createElement('button');button.type='button';button.textContent=n;button.setAttribute('aria-label',`${longDate(d)}${eventsFor(d).length?', events available':''}`);button.setAttribute('aria-pressed',String(key(d)===key(selected)));if(key(d)===key(today))button.classList.add('is-today');if(eventsFor(d).length)button.classList.add('has-event');button.addEventListener('click',()=>{selected=d;render();});days.append(button);}details();
 }
 const escapeICS=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 function downloadEvent(event){
  const compact=event.date.replace(/-/g,'')+'T'+event.time.replace(':','')+'00';
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LPYC//Club Calendar//EN','BEGIN:VTIMEZONE','TZID:America/Chicago','BEGIN:DAYLIGHT','DTSTART:20070311T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU','TZOFFSETFROM:-0600','TZOFFSETTO:-0500','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:20071104T020000','RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU','TZOFFSETFROM:-0500','TZOFFSETTO:-0600','END:STANDARD','END:VTIMEZONE','BEGIN:VEVENT',`UID:${escapeICS(event.id)}@lpyc.club`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=America/Chicago:${compact}`,`DURATION:PT${Number(event.durationMinutes)||60}M`,`SUMMARY:${escapeICS(event.title)}`,`DESCRIPTION:${escapeICS(event.description||'')}`,`LOCATION:${escapeICS(event.location||'La Porte Yacht Club, 814 Pine Lake Avenue, La Porte IN')}`,'END:VEVENT','END:VCALENDAR'];
  const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lpyc-event.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 document.getElementById('previous').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);selected=new Date(month);render();});
 document.getElementById('next').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);selected=new Date(month);render();});
 document.getElementById('today').addEventListener('click',()=>{selected=new Date(today);month=new Date(today.getFullYear(),today.getMonth(),1);render();});category.addEventListener('change',render);
 const toggle=document.getElementById('menu-toggle'),nav=document.getElementById('navigation');toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));
 function updateContent(){
  const art=document.getElementById('burger-special-art');if(art)art.hidden=!(data.special?.validThrough==='2026-10-18'&&data.special.description?.includes('BIG MAC BURGER')&&data.special.description?.includes('PIZZA BURGER'));
  if(data.special&&data.special.validThrough>=key(today)){document.getElementById('special-title').textContent=data.special.title;document.getElementById('special-description').textContent=[data.special.description,data.special.price].filter(Boolean).join(' · ');}
  if(data.commodore){document.getElementById('commodore-title').textContent=data.commodore.title;document.getElementById('commodore-body').textContent=data.commodore.body;document.getElementById('commodore-body').style.whiteSpace='pre-wrap';document.getElementById('commodore-signature').textContent=data.commodore.signature;}
  upcoming();render();
 }
 window.addEventListener('club-content',event=>{data={...data,...event.detail};updateContent();});updateContent();
})();
