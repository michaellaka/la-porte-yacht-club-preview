"""La Porte Yacht Club private local prototype. Python standard library only."""
import os, sqlite3, secrets, hashlib, hmac, html, json, calendar, datetime, urllib.parse, mimetypes, re
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
from email.parser import BytesParser
from email.policy import default

ROOT=Path(__file__).resolve().parent
DB=ROOT/'club.sqlite3'; UP=ROOT/'private_uploads'; UP.mkdir(exist_ok=True)
HOST='127.0.0.1'; PORT=int(os.environ.get('LPYC_PORT','8765'))
def db():
 c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
def init():
 with db() as c:
  c.executescript('''CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',approved INTEGER NOT NULL DEFAULT 0);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires TEXT NOT NULL);CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY,title TEXT NOT NULL,kind TEXT NOT NULL,day TEXT NOT NULL,time TEXT,description TEXT,repeat_weekly INTEGER NOT NULL DEFAULT 0,repeat_until TEXT,created_by INTEGER);CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL);CREATE TABLE IF NOT EXISTS photos(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,filename TEXT NOT NULL,caption TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created TEXT NOT NULL);''')
def esc(x):return html.escape(str(x or ''),quote=True)
def hashpw(p,s=None):
 s=s or secrets.token_hex(16);return s+':'+hashlib.pbkdf2_hmac('sha256',p.encode(),bytes.fromhex(s),250000).hex()
def verify(p,stored):
 try:s,h=stored.split(':');return hmac.compare_digest(hashpw(p,s),stored)
 except:return False
def dates(entry,start,end):
 d=datetime.date.fromisoformat(entry['day']);limit=datetime.date.fromisoformat(entry['repeat_until']) if entry['repeat_until'] else d
 while d<=end and d<=limit:
  if d>=start:yield d.isoformat()
  if not entry['repeat_weekly']:break
  d+=datetime.timedelta(days=7)
def layout(title,body,user=None,notice=''):
 nav='<a href="/">Home</a><a href="/calendar">Calendar</a><a href="/dining">Dining</a><a href="/community">Member Dock</a><a href="/gallery">Gallery</a>'
 if user:nav+='<a href="/dashboard">Dashboard</a><form method="post" action="/logout" class="inline"><button>Sign out</button></form>'
 else:nav+='<a href="/login" class="navbtn">Member Sign In</a>'
 return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | La Porte Yacht Club</title><link rel="stylesheet" href="/style.css"></head><body><div class="top">LA PORTE, INDIANA · PINE LAKE</div><header><a class="brand" href="/">⚓ LA PORTE <span>YACHT CLUB</span></a><nav>{nav}</nav></header><main>{('<div class="notice">'+esc(notice)+'</div>') if notice else ''}{body}</main><footer>⚓ La Porte Yacht Club · Private working prototype · Not the public website</footer></body></html>'''.encode()
def card(title,content):return f'<section class="card"><h2>{esc(title)}</h2>{content}</section>'
def events_list(c,start,end,kind=None):
 rows=c.execute('SELECT * FROM entries ORDER BY day').fetchall();out=[]
 for e in rows:
  if kind and e['kind']!=kind:continue
  for day in dates(e,start,end):out.append((day,e))
 return sorted(out,key=lambda t:(t[0],t[1]['time'] or ''))
def fmt(d):return datetime.date.fromisoformat(d).strftime('%a, %b %-d, %Y')
def entry_html(day,e,admin=False):
 b=f'<article class="event"><span class="chip {"food" if e["kind"]=="food" else ""}">{"Kitchen special" if e["kind"]=="food" else "Club event"}</span><h3>{esc(e["title"])}</h3><div class="meta">{esc(fmt(day))} · {esc(e["time"] or "Time TBA")}</div><p>{esc(e["description"])}</p>'
 if admin:b+=f'<a class="smallbutton" href="/entry/edit?id={e["id"]}">Edit</a> <form class="inline" method="post" action="/entry/delete"><input type="hidden" name="id" value="{e["id"]}"><button class="danger" onclick="return confirm(\'Delete this item?\')">Delete</button></form>'
 return b+'</article>'
class Handler(BaseHTTPRequestHandler):
 def respond(self,data,status=200,typ='text/html; charset=utf-8',cookie=None):
  self.send_response(status);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(len(data)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');self.send_header('Cache-Control','no-store');self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'")
  if cookie:self.send_header('Set-Cookie',cookie)
  self.end_headers();self.wfile.write(data)
 def redirect(self,to,cookie=None):self.send_response(303);self.send_header('Location',to);self.send_header('Content-Length','0');self.send_header('Cache-Control','no-store');self.send_header('Set-Cookie',cookie) if cookie else None;self.end_headers()
 def who(self,c):
  cookie=SimpleCookie()
  try:cookie.load(self.headers.get('Cookie',''));token=cookie['lpyc'].value
  except:return None
  return c.execute("SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>datetime('now')",(token,)).fetchone()
 def data(self):
  n=int(self.headers.get('Content-Length','0'))
  if n>7_000_000:raise ValueError('Submission too large')
  raw=self.rfile.read(n);ct=self.headers.get('Content-Type','')
  if ct.startswith('multipart/form-data'):
   msg=BytesParser(policy=default).parsebytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
   d={};files={}
   for part in msg.iter_parts():
    name=part.get_param('name',header='content-disposition');filename=part.get_filename()
    if filename is not None:files[name]=(filename,part.get_payload(decode=True))
    elif name:d[name]=part.get_content()
   return d,files
  return {k:v[0] for k,v in urllib.parse.parse_qs(raw.decode(),keep_blank_values=True).items()},{}
 def get(self,c,user,path,q):
  admin=bool(user and user['role'] in ('admin','editor'))
  if path=='/style.css':return self.respond((ROOT/'style.css').read_bytes(),typ='text/css')
  if path.startswith('/photo/'):
   if not user or not user['approved']:return self.respond(b'Forbidden',403,'text/plain')
   try:pid=int(path.rsplit('/',1)[1]);p=c.execute('SELECT * FROM photos WHERE id=?',(pid,)).fetchone()
   except:p=None
   if not p or (p['status']!='approved' and user['role']!='admin' and p['user_id']!=user['id']):return self.respond(b'Not found',404,'text/plain')
   f=UP/p['filename'];typ=mimetypes.guess_type(f.name)[0] or 'application/octet-stream'
   return self.respond(f.read_bytes(),typ=typ) if f.exists() else self.respond(b'Not found',404,'text/plain')
  if not c.execute('SELECT 1 FROM users LIMIT 1').fetchone() and path!='/setup':return self.redirect('/setup')
  if path=='/setup':
   if c.execute('SELECT 1 FROM users LIMIT 1').fetchone():return self.redirect('/')
   return self.respond(layout('Initial setup',card('Create the first administrator','<p>This setup works only once. Choose a strong password; this account controls membership and approvals.</p><form method="post"><label>Your name<input name="name" required></label><label>Email<input type="email" name="email" required></label><label>Password (12+ characters)<input type="password" minlength="12" name="password" required></label><button class="primary">Create administrator</button></form>')))
  if path=='/':
   now=datetime.date.today();es=events_list(c,now,now+datetime.timedelta(days=60))[:4]
   items=''.join(entry_html(day,e) for day,e in es) or '<p>Club events will appear here when added by staff.</p>'
   b='''<div class="hero"><div class="heroinner"><div class="eyebrow">WELCOME TO THE LAKE</div><h1>Good friends.<br>Great memories.<br>One beautiful lake.</h1><p>A gathering place on Pine Lake, built around community and connection.</p><a class="primary" href="/calendar">Explore the Club Calendar →</a></div></div><div class="wrap"><div class="eyebrow">AROUND THE CLUB</div><h2 class="big">What's happening</h2><div class="grid">'''+items+'''</div><div class="actions"><a class="smallbutton" href="/dining">Kitchen Specials</a><a class="smallbutton" href="/community">The Member Dock</a></div></div>'''
   return self.respond(layout('Welcome',b,user))
  if path=='/calendar':
   today=datetime.date.today();year=int(q.get('year',[today.year])[0]);month=int(q.get('month',[today.month])[0]);year=max(2020,min(2040,year));month=max(1,min(12,month));view=q.get('view',['month'])[0]
   if view=='year':
    blocks=''.join(f'<a class="monthtile" href="/calendar?year={year}&month={m}"><b>{calendar.month_name[m]}</b><small>{len(events_list(c,datetime.date(year,m,1),datetime.date(year,m,calendar.monthrange(year,m)[1])))} scheduled items</small></a>' for m in range(1,13))
    b=f'<div class="wrap"><div class="eyebrow">PLAN AHEAD</div><h1>Club Calendar · {year}</h1><div class="actions"><a class="smallbutton" href="/calendar?year={year-1}&view=year">← Previous Year</a><a class="smallbutton" href="/calendar?year={year+1}&view=year">Next Year →</a></div><div class="months">{blocks}</div></div>'
   else:
    first=datetime.date(year,month,1);last=datetime.date(year,month,calendar.monthrange(year,month)[1]);items=events_list(c,first,last);lookup={}
    for day,e in items:lookup.setdefault(int(day[-2:]),[]).append(e)
    cells=''.join('<div class="dow">'+d+'</div>' for d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])
    for week in calendar.Calendar(firstweekday=6).monthdayscalendar(year,month):
     for day in week:
      cells+=('<div class="day empty"></div>' if not day else f'<div class="day"><b>{day}</b>'+''.join(f'<span class="dot {"food" if e["kind"]=="food" else ""}" title="{esc(e["description"])}">{esc(e["title"])}</span>' for e in lookup.get(day,[]))+'</div>')
    prev=(first-datetime.timedelta(days=1));nxt=(last+datetime.timedelta(days=1))
    b=f'<div class="wrap"><div class="eyebrow">PLAN AHEAD</div><h1>Club Calendar</h1><div class="actions"><a class="smallbutton" href="/calendar?year={year}&view=year">Year View</a><a class="smallbutton" href="/calendar?year={prev.year}&month={prev.month}">←</a><b>{calendar.month_name[month]} {year}</b><a class="smallbutton" href="/calendar?year={nxt.year}&month={nxt.month}">→</a></div><div class="calendar">{cells}</div><h2>Events & Specials</h2><div class="grid">'+(''.join(entry_html(day,e) for day,e in items) or '<p>No scheduled items yet.</p>')+'</div></div>'
   return self.respond(layout('Calendar',b,user))
  if path=='/dining':
   now=datetime.date.today();items=events_list(c,now,now+datetime.timedelta(days=120),'food');b='<div class="wrap"><div class="eyebrow">BAR & DINING</div><h1>From the Kitchen</h1><p class="muted">Upcoming kitchen specials also appear automatically on the club calendar.</p><div class="grid">'+(''.join(entry_html(d,e) for d,e in items) or '<p>No upcoming specials posted yet.</p>')+'</div></div>'
   return self.respond(layout('Dining',b,user))
  if path=='/login':return self.respond(layout('Sign in',card('Member Sign In','<form method="post"><label>Email<input type="email" name="email" required></label><label>Password<input type="password" name="password" required></label><button class="primary">Sign in</button></form><p><a href="/register">Request membership access →</a></p>'),user))
  if path=='/register':return self.respond(layout('Register',card('Request Member Access','<p>New accounts require board/admin approval before they can post or view member content.</p><form method="post"><label>Full name<input name="name" required></label><label>Email<input type="email" name="email" required></label><label>Password (12+ characters)<input name="password" type="password" minlength="12" required></label><button class="primary">Request access</button></form>'),user))
  if path in ('/community','/gallery'):
   if not user or not user['approved']:return self.respond(layout('Members only',card('Private Member Area','<p>Only approved members can view club posts and photos.</p><a class="primary" href="/login">Sign in</a> <a href="/register">Request access</a>'),user),403)
   if path=='/community':
    rows=c.execute('SELECT posts.*,users.name FROM posts JOIN users ON users.id=posts.user_id ORDER BY posts.id DESC LIMIT 100').fetchall()
    feed=''.join(f'<article class="event"><div class="meta">{esc(r["name"])} · {esc(r["created"])}</div><p>{esc(r["body"])}</p></article>' for r in rows)
    form='<form method="post" action="/post"><label>Share an update<textarea name="body" maxlength="2000" required></textarea></label><button class="primary">Publish Post</button></form>'
    return self.respond(layout('Member Dock','<div class="wrap"><div class="eyebrow">MEMBERS ONLY</div><h1>The Member Dock</h1>'+card('Write a Post',form)+'<div class="grid">'+(feed or '<p>No member posts yet.</p>')+'</div></div>',user))
   photos=c.execute("SELECT photos.*,users.name FROM photos JOIN users ON users.id=photos.user_id WHERE photos.status='approved' ORDER BY photos.id DESC").fetchall()
   gallery=''.join(f'<article class="event"><img class="photo" src="/photo/{p["id"]}" alt="{esc(p["caption"])}"><h3>{esc(p["caption"])}</h3><div class="meta">Shared by {esc(p["name"])}</div></article>' for p in photos)
   form='<form action="/photo/upload" method="post" enctype="multipart/form-data"><label>Caption<input name="caption" maxlength="160" required></label><label>Choose a JPEG, PNG, GIF, or WebP (max 5 MB)<input type="file" name="photo" accept="image/png,image/jpeg,image/gif,image/webp" required></label><button class="primary">Submit for Approval</button></form>'
   return self.respond(layout('Photo Gallery','<div class="wrap"><div class="eyebrow">MEMBERS ONLY</div><h1>Club Photo Gallery</h1>'+card('Submit a Photo',form)+'<div class="grid">'+(gallery or '<p>No approved photos yet.</p>')+'</div></div>',user))
  if path=='/dashboard':
   if not admin:return self.respond(layout('Access denied',card('Staff Only','Board or staff access required.'),user),403)
   es=c.execute('SELECT * FROM entries ORDER BY day DESC').fetchall();members=c.execute('SELECT * FROM users WHERE approved=0 ORDER BY id').fetchall();photos=c.execute("SELECT photos.*,users.name FROM photos JOIN users ON users.id=photos.user_id WHERE status='pending'").fetchall()
   pending=''.join(f'<div class="row"><b>{esc(u["name"])} · {esc(u["email"])}</b><form method="post" action="/approve/member"><input type="hidden" name="id" value="{u["id"]}"><button>Approve Member</button></form></div>' for u in members) or '<p>No pending member requests.</p>'
   queue=''.join(f'<div class="row"><div><img class="thumb" src="/photo/{p["id"]}" alt="Pending image"><b>{esc(p["caption"])} — {esc(p["name"])}</b></div><form method="post" action="/approve/photo"><input type="hidden" name="id" value="{p["id"]}"><button name="decision" value="approved">Approve</button> <button class="danger" name="decision" value="rejected">Reject</button></form></div>' for p in photos) or '<p>No pending photos.</p>'
   body='<div class="wrap"><div class="eyebrow">BOARD / STAFF</div><h1>Management Dashboard</h1><div class="actions"><a class="primary" href="/entry/new?kind=event">+ New Event</a><a class="primary" href="/entry/new?kind=food">+ Kitchen Special</a></div>'+card('Pending Member Approvals',pending)+card('Photos Awaiting Approval',queue)+card('Manage Calendar Items',''.join(entry_html(e['day'],e,True) for e in es) or '<p>No items yet.</p>')+'</div>'
   return self.respond(layout('Dashboard',body,user))
  if path in ('/entry/new','/entry/edit'):
   if not admin:return self.respond(b'Forbidden',403,'text/plain')
   e=None
   if path.endswith('edit'):
    try:e=c.execute('SELECT * FROM entries WHERE id=?',(int(q.get('id',[0])[0]),)).fetchone()
    except:pass
    if not e:return self.respond(b'Not found',404,'text/plain')
   val=lambda k,default='':esc(e[k] if e else default)
   kind=q.get('kind',['event'])[0]
   body=f'''<div class="wrap">{card('Edit Calendar Item' if e else 'Create Calendar Item',f'<form method="post" action="/entry/save"><input type="hidden" name="id" value="{val("id")}"><label>Type<select name="kind"><option value="event" {"selected" if val("kind",kind)=="event" else ""}>Club event</option><option value="food" {"selected" if val("kind",kind)=="food" else ""}>Kitchen special</option></select></label><label>Title<input name="title" value="{val("title")}" required maxlength="120"></label><label>Date<input type="date" name="day" value="{val("day",datetime.date.today().isoformat())}" required></label><label>Time<input type="time" name="time" value="{val("time")}"></label><label>Description<textarea name="description" maxlength="3000">{val("description")}</textarea></label><label class="check"><input type="checkbox" name="repeat_weekly" value="1" {"checked" if e and e["repeat_weekly"] else ""}> Repeat weekly</label><label>Repeat until (required for weekly items)<input type="date" name="repeat_until" value="{val("repeat_until")}"></label><button class="primary">Save & Publish</button></form>')}</div>'''
   return self.respond(layout('Manage Event',body,user))
  return self.respond(layout('Not found',card('Page Not Found','Return to <a href="/">the homepage</a>.'),user),404)
 def do_GET(self):
  parsed=urllib.parse.urlparse(self.path)
  with db() as c:
   try:self.get(c,self.who(c),parsed.path,urllib.parse.parse_qs(parsed.query))
   except Exception as e:self.respond(layout('Error',card('Unable to display page',esc(str(e)))),500)
 def do_POST(self):
  path=urllib.parse.urlparse(self.path).path
  with db() as c:
   user=self.who(c);admin=bool(user and user['role'] in ('admin','editor'))
   try:d,files=self.data()
   except Exception:return self.respond(b'Invalid submission',400,'text/plain')
   try:
    if path=='/setup' and not c.execute('SELECT 1 FROM users LIMIT 1').fetchone():
     if len(d.get('password',''))<12:return self.respond(b'Password too short',400,'text/plain')
     c.execute('INSERT INTO users(name,email,password,role,approved) VALUES(?,?,?,?,1)',(d['name'].strip(),d['email'].lower().strip(),hashpw(d['password']),'admin'));return self.redirect('/login')
    if path=='/register':
     if len(d.get('password',''))<12:return self.respond(b'Password too short',400,'text/plain')
     c.execute('INSERT INTO users(name,email,password) VALUES(?,?,?)',(d['name'].strip(),d['email'].lower().strip(),hashpw(d['password'])));return self.respond(layout('Request submitted',card('Awaiting Approval','Your account request has been submitted. A club administrator must approve it before you can sign in.')))
    if path=='/login':
     u=c.execute('SELECT * FROM users WHERE email=?',(d.get('email','').lower().strip(),)).fetchone()
     if not u or not verify(d.get('password',''),u['password']):return self.respond(layout('Sign in',card('Unable to sign in','Incorrect email or password. <a href="/login">Try again</a>.')),401)
     if not u['approved']:return self.respond(layout('Approval pending',card('Not Yet Approved','Your membership access request is still awaiting administrator approval.')),403)
     token=secrets.token_urlsafe(32);c.execute("INSERT INTO sessions VALUES(?,?,datetime('now','+7 days'))",(token,u['id']))
     return self.redirect('/dashboard' if u['role'] in ('admin','editor') else '/community',f'lpyc={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800')
    if path=='/logout':
     if user:
      cookies=SimpleCookie();cookies.load(self.headers.get('Cookie',''));c.execute('DELETE FROM sessions WHERE token=?',(cookies['lpyc'].value,))
     return self.redirect('/', 'lpyc=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    if path=='/post' and user and user['approved']:
     body=d.get('body','').strip()
     if not 1<=len(body)<=2000:return self.respond(b'Invalid post length',400,'text/plain')
     c.execute("INSERT INTO posts(user_id,body,created) VALUES(?,?,datetime('now'))",(user['id'],body));return self.redirect('/community')
    if path=='/photo/upload' and user and user['approved']:
     filename,data=files.get('photo',('',b''))
     signatures=[(b'\xff\xd8\xff','.jpg'),(b'\x89PNG\r\n\x1a\n','.png'),(b'GIF87a','.gif'),(b'GIF89a','.gif')]
     ext=next((ext for sig,ext in signatures if data.startswith(sig)),None)
     if not ext and data.startswith(b'RIFF') and data[8:12]==b'WEBP':ext='.webp'
     if not ext or not 0<len(data)<=5_000_000:return self.respond(b'Upload a JPEG, PNG, GIF, or WebP smaller than 5 MB',400,'text/plain')
     caption=d.get('caption','').strip()[:160]
     if not caption:return self.respond(b'Caption required',400,'text/plain')
     newname=secrets.token_hex(16)+ext;(UP/newname).write_bytes(data)
     c.execute('INSERT INTO photos(user_id,filename,caption,created) VALUES(?,?,?,datetime(\'now\'))',(user['id'],newname,caption));return self.redirect('/gallery')
    if path=='/entry/save' and admin:
     kind=d.get('kind');day=datetime.date.fromisoformat(d['day']);title=d.get('title','').strip()[:120];repeat=int(d.get('repeat_weekly')=='1');until=d.get('repeat_until') or None
     if kind not in ('event','food') or not title:return self.respond(b'Invalid event',400,'text/plain')
     if repeat and (not until or datetime.date.fromisoformat(until)<day):return self.respond(b'Weekly events require an end date on or after the start date',400,'text/plain')
     if d.get('id'):
      c.execute('UPDATE entries SET title=?,kind=?,day=?,time=?,description=?,repeat_weekly=?,repeat_until=? WHERE id=?',(title,kind,str(day),d.get('time',''),d.get('description','')[:3000],repeat,until,int(d['id'])))
     else:c.execute('INSERT INTO entries(title,kind,day,time,description,repeat_weekly,repeat_until,created_by) VALUES(?,?,?,?,?,?,?,?)',(title,kind,str(day),d.get('time',''),d.get('description','')[:3000],repeat,until,user['id']))
     return self.redirect('/dashboard')
    if path=='/entry/delete' and admin:c.execute('DELETE FROM entries WHERE id=?',(int(d['id']),));return self.redirect('/dashboard')
    if path=='/approve/member' and user and user['role']=='admin':c.execute('UPDATE users SET approved=1 WHERE id=?',(int(d['id']),));return self.redirect('/dashboard')
    if path=='/approve/photo' and user and user['role']=='admin' and d.get('decision') in ('approved','rejected'):c.execute('UPDATE photos SET status=? WHERE id=?',(d['decision'],int(d['id'])));return self.redirect('/dashboard')
    return self.respond(b'Forbidden',403,'text/plain')
   except (ValueError,KeyError,sqlite3.IntegrityError) as e:return self.respond(layout('Request error',card('Please check your submission',esc(str(e))+' <a href="javascript:history.back()">Go back</a>'),user),400)
if __name__=='__main__':
 init();print(f'\nLa Porte Yacht Club private prototype: http://{HOST}:{PORT}\nOpen that address in a browser. Press Ctrl+C to stop.\n',flush=True)
 ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
