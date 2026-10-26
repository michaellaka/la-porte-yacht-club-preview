export const statuses=['going','interested','not-going'];
export const labels={going:'Going',interested:'Interested','not-going':'Not Going'};
export function parseCSV(text){
 const rows=[];let row=[],field='',quoted=false; text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}else if(ch==='"'){if(field)throw Error('Unexpected quote in CSV.');quoted=true;}else if(ch===','){row.push(field);field='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';}else field+=ch;}
 if(quoted)throw Error('A CSV field has an unclosed quote.');row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
export function prepareRoster(text){
 const [headers,...rows]=parseCSV(text);if(!headers)throw Error('The CSV is empty.');
 const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');const keys=headers.map(norm);
 const find=names=>keys.findIndex(x=>names.includes(x));const id=find(['memberid','membernumber','membershipid','membershipnumber']),email=find(['email','emailaddress','primaryemail']);
 if(id<0||email<0)throw Error('Include Member ID and Email columns.');
 if(new Set(keys).size!==keys.length)throw Error('Column names must be unique.');
 const ids=new Set(),emails=new Set();return rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`Row ${i+2}: column count does not match.`);const memberId=r[id].trim(),address=r[email].trim().toLowerCase();
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(memberId))throw Error(`Row ${i+2}: Member ID must use letters, numbers, hyphens or underscores.`);
 if(!/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(address)||address.length>254)throw Error(`Row ${i+2}: add a valid, unique member email.`);
 if(ids.has(memberId)||emails.has(address))throw Error(`Row ${i+2}: duplicate Member ID or email. Each sign-in email must identify one membership.`);ids.add(memberId);emails.add(address);
 const contact=Object.fromEntries(headers.map((h,j)=>[h.trim(),r[j].trim()]));const nameIndex=find(['name','fullname','membername']);const first=find(['firstname','first']),last=find(['lastname','last']);
 const name=(nameIndex>=0?r[nameIndex]:[r[first]||'',r[last]||''].join(' ')).trim()||memberId;
 const contactJSON=JSON.stringify(contact);if(contactJSON.length>20000)throw Error(`Row ${i+2}: contact information is too large.`);return {memberId,email:address,name,contactJSON,active:true};
 });
}
