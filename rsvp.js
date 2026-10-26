import {getClient} from './firebase-client.js?v=20261016';
import {labels,statuses,prepareRoster} from './rsvp-core.mjs?v=20261026';
const $=id=>document.getElementById(id);let c,user,member,organizer=false,admin=false,pending=[],events=window.LPYC_LIVE_CONTENT?.events||[],busy=false,renderVersion=0;
function notice(text){$('member-notice').textContent=text;}
const errorText=e=>e.code==='permission-denied'?'Access could not be verified. Sign in with the email on your active membership record.':e.code?.startsWith('auth/')?'Sign-in could not finish. Check your details or try Google sign-in.':'This action could not finish. Please try again. '+(e.code?'':e.message||'');
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('#member-panel button').forEach(b=>b.disabled=true);try{await fn();}catch(e){notice(errorText(e));}finally{busy=false;document.querySelectorAll('#member-panel button').forEach(b=>b.disabled=false);}}
function rosterRef(email){return c.dbApi.doc(c.db,'rosterEmails',email);}
async function refresh(){
 $('attendee-list').replaceChildren();$('attendee-section').hidden=true;pending=[];$('roster-file').value='';$('roster-preview').textContent='';
 member=null;organizer=false;admin=false;$('member-admin').hidden=true;$('member-identity').textContent='';
 if(user?.emailVerified){const email=user.email.toLowerCase();const role=await c.dbApi.getDoc(c.dbApi.doc(c.db,'staff',email));admin=email==='mike@options-abc.com'||role.data()?.role==='admin';organizer=admin||role.data()?.role==='events';
 const entry=await c.dbApi.getDoc(rosterRef(email));if(entry.exists()){const m=await c.dbApi.getDoc(c.dbApi.doc(c.db,'members',entry.data().memberId));if(m.exists()&&m.data().active&&m.data().email===email){member=m.data();await c.dbApi.setDoc(c.dbApi.doc(c.db,'memberBindings',member.rsvpKey),{email,memberId:member.memberId});}}
 $('member-identity').textContent=member?`Signed in: ${member.name} · Member ${member.memberId}`:`Signed in: ${email}`;$('member-admin').hidden=!organizer;$('roster-tools').hidden=!admin;
 }
 $('member-signin').hidden=!!user;$('member-signout').hidden=!user;$('member-refresh').hidden=!user;
 notice(!user?'Sign in to RSVP and view member response counts.':!user.emailVerified?'Verify your email using the message sent to your inbox, then sign in again.':!member&&!organizer?'Your membership has not been activated in the roster yet. The club must import your membership email before you can RSVP.':'Choose a response below. You can change or clear it anytime.');
 await renderAll();
}
function eventRef(id){return c.dbApi.collection(c.db,'content','events','items',id,'responses');}
async function renderAll(){
 const version=++renderVersion;const nodes=[...document.querySelectorAll('[data-rsvp-event]')];const ids=[...new Set(nodes.map(n=>n.dataset.rsvpEvent))];
 for(const id of ids){let counts=null,mine=null;
 if(member||organizer){try{const q=await c.dbApi.getDocs(eventRef(id));counts=Object.fromEntries(statuses.map(s=>[s,0]));q.forEach(d=>{if(statuses.includes(d.data().status))counts[d.data().status]++;if(d.id===member?.rsvpKey)mine=d.data().status;});}catch(e){counts=null;}}
 if(version!==renderVersion)return;for(const node of nodes.filter(n=>n.dataset.rsvpEvent===id)){node.replaceChildren();const title=document.createElement('strong');title.textContent='Your plans';node.append(title);const buttons=document.createElement('div');buttons.className='rsvp-buttons';
 for(const status of statuses){const b=document.createElement('button');b.type='button';b.textContent=labels[status]+(counts?' · '+counts[status]:'');b.setAttribute('aria-pressed',String(mine===status));b.disabled=!member||counts===null;b.onclick=()=>run(async()=>{await c.dbApi.setDoc(c.dbApi.doc(eventRef(id),member.rsvpKey),{status,updatedAt:c.dbApi.serverTimestamp()});notice('RSVP saved. You can change your answer anytime.');await renderAll();});buttons.append(b);}node.append(buttons);
 if(mine){const clear=document.createElement('button');clear.className='rsvp-clear';clear.textContent='Clear my response';clear.onclick=()=>run(async()=>{await c.dbApi.deleteDoc(c.dbApi.doc(eventRef(id),member.rsvpKey));notice('Your response was cleared.');await renderAll();});node.append(clear);}
 const hint=document.createElement('p');hint.className='small';hint.textContent=counts?'Member responses only. RSVP does not include payment or reserve a paid ticket.':member||organizer?'Response counts could not load. Please try refreshing.':'Member sign-in required. Counts and contact information are private.';node.append(hint);
 if(!user){const sign=document.createElement('a');sign.href='#member-panel';sign.textContent='Member sign-in →';node.append(sign);}
 if(organizer){const list=document.createElement('button');list.textContent='View attendee list';list.onclick=()=>run(()=>attendees(id));node.append(list);}
 }
 }
}
async function attendees(id){
 const snap=await c.dbApi.getDocs(eventRef(id)),out=$('attendee-list');out.replaceChildren();$('attendee-section').hidden=false;
 const heading=document.createElement('h3');heading.textContent=events.find(e=>e.id===id)?.title||'Event responses';out.append(heading);
 for(const response of snap.docs){const binding=await c.dbApi.getDoc(c.dbApi.doc(c.db,'memberBindings',response.id));const record=binding.exists()?await c.dbApi.getDoc(c.dbApi.doc(c.db,'members',binding.data().memberId)):null;const m=record?.data();const detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`${m?.name||'Member record unavailable'}${m?' · #'+m.memberId:''} — ${labels[response.data().status]||'Unknown'}`;detail.append(summary);if(m){const pre=document.createElement('pre');pre.textContent=Object.entries(JSON.parse(m.contactJSON)).map(([k,v])=>`${k}: ${v}`).join('\n');detail.append(pre);}out.append(detail);}
 if(snap.empty)out.append(document.createTextNode('No member responses yet.'));out.scrollIntoView({behavior:'smooth',block:'start'});
}
window.addEventListener('club-content',e=>{events=e.detail.events||[];});window.addEventListener('rsvp-render',()=>{if(c)renderAll();});
$('member-login').onsubmit=e=>{e.preventDefault();run(async()=>{await c.authApi.signInWithEmailAndPassword(c.auth,$('member-email').value.trim(),$('member-password').value);$('member-password').value='';});};
$('member-google').onclick=()=>run(()=>c.authApi.signInWithPopup(c.auth,new c.authApi.GoogleAuthProvider()));
$('member-create').onclick=()=>run(async()=>{if(!$('member-login').reportValidity())return;const result=await c.authApi.createUserWithEmailAndPassword(c.auth,$('member-email').value.trim(),$('member-password').value);await c.authApi.sendEmailVerification(result.user);$('member-password').value='';notice('Verification email sent. Follow its link, then sign out and sign back in.');});
$('member-reset').onclick=()=>run(async()=>{const email=$('member-email');if(!email.checkValidity()||!email.value){email.reportValidity();return;}await c.authApi.sendPasswordResetEmail(c.auth,email.value.trim());notice('If an account exists, a password reset email will arrive. Check your inbox.');});
$('member-refresh').onclick=()=>run(async()=>{await renderAll();notice('Responses refreshed.');});
$('member-signout').onclick=()=>run(()=>c.authApi.signOut(c.auth));
$('roster-file').onchange=async e=>{pending=[];$('roster-import').disabled=true;try{const file=e.target.files[0];if(!file)return;if(file.size>5000000)throw Error('Use a CSV smaller than 5 MB.');pending=prepareRoster(await file.text());if(!pending.length)throw Error('No member records found.');$('roster-preview').textContent=`${pending.length} memberships ready. First record: ${pending[0].name} · #${pending[0].memberId}. Existing IDs will be updated; omitted members stay unchanged. All original contact columns remain private.`;$('roster-import').disabled=false;}catch(e){$('roster-preview').textContent=e.message;}};
$('roster-import').onclick=()=>run(async()=>{
 if(!admin||!pending.length)return;const {getDoc,doc,writeBatch,serverTimestamp}=c.dbApi;
 // Validate every collision before writing any portion of this import.
 const old=[];for(const m of pending){const map=await getDoc(rosterRef(m.email));if(map.exists()&&map.data().memberId!==m.memberId)throw Error(`Email already belongs to member ${map.data().memberId}. Resolve it before importing.`);old.push((await getDoc(doc(c.db,'members',m.memberId))).data());}
 let saved=0;for(let i=0;i<pending.length;i+=100){const batch=writeBatch(c.db);for(let j=i;j<Math.min(i+100,pending.length);j++){const m={...pending[j],rsvpKey:old[j]?.rsvpKey||crypto.randomUUID()};if(old[j]?.email&&old[j].email!==m.email)batch.delete(rosterRef(old[j].email));batch.set(doc(c.db,'members',m.memberId),{...m,updatedAt:serverTimestamp()});batch.set(rosterRef(m.email),{memberId:m.memberId});}try{await batch.commit();}catch(e){notice(`${saved} of ${pending.length} records saved. Import stopped; remaining records were not saved. You can retry the same file safely.`);return;}saved=Math.min(i+100,pending.length);notice(`${saved} memberships saved…`);}
 pending=[];$('roster-file').value='';$('roster-preview').textContent='';notice(`${saved} memberships imported. Contact details are visible only to authorized organizers.`);await refresh();notice(`${saved} memberships imported.`);
});
try{c=await getClient();if(!c)throw Error('Sign-in unavailable.');c.authApi.onAuthStateChanged(c.auth,next=>{user=next;refresh().catch(e=>notice(errorText(e)));});}catch(e){notice('Member services are temporarily unavailable. Please try again later.');}
