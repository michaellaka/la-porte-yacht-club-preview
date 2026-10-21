export const kinds = {specials:{label:'Kitchen Specials',role:'chef'},notes:{label:'Commodore’s Corner',role:'commodore'},events:{label:'Events & Calendar',role:'events'}};
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===value;}
export function validateContent(kind,x){
 const errors=[];if(!kinds[kind])return ['Choose a valid section.'];
 if(!x.title?.trim())errors.push('Add a title.');if((x.title||'').length>120)errors.push('Keep the title under 120 characters.');
 if(!x.body?.trim())errors.push('Add a description or message.');if((x.body||'').length>5000)errors.push('Keep the message under 5,000 characters.');
 if(!['draft','published','archived'].includes(x.status))errors.push('Choose a valid publishing status.');
 if(x.startDate&&!validDate(x.startDate))errors.push('Choose a valid start date.');if(x.endDate&&!validDate(x.endDate))errors.push('Choose a valid end date.');
 if(x.startDate&&x.endDate&&x.endDate<x.startDate)errors.push('The end date must be on or after the start date.');
 if(x.status==='published'&&!validDate(x.startDate))errors.push('Choose a publication or event date.');
 if(kind==='specials'&&x.status==='published'&&!validDate(x.endDate))errors.push('Choose when the special expires.');
 if(kind==='events'&&x.status==='published'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time||''))errors.push('Choose an event start time.');
 if(!['club','social','dining'].includes(x.category))errors.push('Choose a valid calendar category.');
 if(!Number.isInteger(x.durationMinutes)||x.durationMinutes<0||x.durationMinutes>1440)errors.push('Event duration must be 0–1,440 minutes (0 means until sold out).');
 for(const [field,max] of Object.entries({price:60,location:240,author:120}))if((x[field]||'').length>max)errors.push(field+' is too long.');
 return [...new Set(errors)];
}
export function activeContent(items,today=localDate()){return items.filter(x=>x.status==='published'&&x.startDate<=today&&(!x.endDate||x.endDate>=today)).sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||'')||(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));}
export function toPublicData(all,today=localDate()){
 const special=activeContent(all.specials,today)[0];const note=activeContent(all.notes,today)[0];
 return {events:all.events.filter(x=>x.status==='published').map(x=>({id:x.id,title:x.title,description:x.body,date:x.startDate,time:x.time,durationMinutes:x.durationMinutes,location:x.location,category:x.category||'club'})),special:special?{title:special.title,description:special.body,price:special.price,validThrough:special.endDate}:null,commodore:note?{title:note.title,body:note.body,signature:note.author||'La Porte Yacht Club · Pine Lake'}:null};
}
