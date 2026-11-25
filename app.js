/* ============================================================
   Scrabble duplicate, entraînement : code de l'appli
   Les gros fichiers de données sont à part :
   - data.js : les parties intégrées (tirages et tops)
   - dict.js : la liste de mots, compressée
   Plan de ce fichier :
   1. Réglages et fonctions de base (valeurs des lettres, cases bonus)
   2. Parties, minuteur, pause, sauvegarde
   3. Affichage (render) et calcul des points (calc)
   4. Import des fichiers .txt et .pdf
   5. Enregistrement du service worker (usage hors connexion)
   ============================================================ */
const $=id=>document.getElementById(id);
const V={A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:10,L:1,M:2,N:1,O:1,P:3,Q:8,R:1,S:1,T:1,U:1,V:4,W:10,X:10,Y:10,Z:10};
const nb=c=>c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const PR=["W..l...W...l..W",".w...t...t...w.","..w...l.l...w..","l..w...l...w..l","....w.....w....",".t...t...t...t.","..l...l.l...l..","W..l...w...l..W"];
const prem=(r,c)=>PR[Math.min(r,14-r)][c];
const CL={W:'a',w:'b',t:'c',l:'d','.':'e'},LB={W:'MT',w:'MD',t:'LT',l:'LD','.':''};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ld=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const mk=(n,rows)=>({name:n,r:rows,draws:rows.filter(r=>r[0]).map(r=>r[0]),tops:rows.slice(1).map(r=>({w:r[1],ref:r[2],pts:r[3]}))});
let D='',TL=ld('sd:tl'),end=0,iv=0,live=0,paused=0,warned=0,lf=0,AC;if(TL==null)TL=180;
let GAMES=DATA.concat(ld('sd:imp')||[]).map(g=>mk(g.n,g.r)),G,i,board,rack,sel,pend,tot,shown,err='';
(async()=>{try{const b=Uint8Array.from(atob(DICT),c=>c.charCodeAt(0));D='\n'+(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text()).trim()+'\n'}catch(e){D=''}})();
function stopT(){clearInterval(iv);iv=0}
function startT(){stopT();paused=0;warned=0;$('pz').hidden=true;$('pg').classList.remove('lo');$('tm').classList.remove('lo');if(!live||!TL||shown||i>=G.draws.length){tick(true);return}end=Date.now()+TL*1000;iv=setInterval(tick,200);tick()}
function tick(off){const el=$('tm'),pg=$('pg');
 if(off===true||!iv){el.textContent='';pg.firstChild.style.width='0';return}
 const left=Math.max(0,end-Date.now()),s=Math.ceil(left/1000),lo=s<=10;
 if(!warned&&left<=TL*333.4){warned=1;beep()}
 el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 pg.firstChild.style.width=left/(TL*1000)*100+'%';el.classList.toggle('lo',lo);pg.classList.toggle('lo',lo);
 if(left<=0){stopT();beep(300,1,.6);reveal(false,true)}}
function show(a){paused=0;$('pz').hidden=true;$('app').hidden=!a;$('hm').hidden=!!a;live=a?1:0;if(!a)stopT()}
function save(){sv('sd:cur',i<G.draws.length?{n:G.name,i,tot,board}:null)}
function tbr(){$('tb').innerHTML=[[0,'Sans'],[60,'1 min'],[120,'2 min'],[180,'3 min']].map(([s,l])=>`<button data-t="${s}" class="${TL===s?'on':''}">${l}</button>`).join('')}
function home(){show(0);$('hl').innerHTML=[...'DUPLICATE'].map((c,k)=>`<span style="--r:${(k%3-1)*4}deg">${c}</span>`).join('');fill();tbr();const s=ld('sd:cur'),g=s&&GAMES.find(x=>x.name===s.n);
 $('rs').innerHTML=g?`<div class="cd"><b>Partie en cours</b><span>${g.name}, coup ${s.i+1} sur ${g.draws.length}<br>Toi ${s.tot.me}, top ${s.tot.top}${s.tot.top?' ('+Math.round(s.tot.me/s.tot.top*100)+' %)':''}</span><button class="go" id="gc">Continuer</button></div>`:''}
function resume(){const s=ld('sd:cur'),g=s&&GAMES.find(x=>x.name===s.n);if(!g)return home();G=g;i=s.i;tot=s.tot;board=s.board;show(1);turn()}
function beep(f=880,n=2,d=.16){try{AC.resume();for(let k=0;k<n;k++){const o=AC.createOscillator(),g=AC.createGain(),s=AC.currentTime+k*d*1.6;o.frequency.value=f;g.gain.value=.25;o.connect(g);g.connect(AC.destination);o.start(s);o.stop(s+d)}}catch(e){}try{navigator.vibrate(150)}catch(e){}}
function pause(){if(!iv||paused)return;lf=Math.max(0,end-Date.now());stopT();paused=1;$('pz').hidden=false}
function unpause(){if(!paused)return;paused=0;$('pz').hidden=true;end=Date.now()+lf;iv=setInterval(tick,200);tick()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function rnd(){const td=GAMES.filter(g=>ld('sd:'+g.name)==null),p=td.length?td:GAMES;start(GAMES.indexOf(p[Math.random()*p.length|0]))}
function confetti(){for(let k=0;k<40;k++){const d=document.createElement('i');d.className='cf';d.style.cssText=`left:${Math.random()*100}vw;background:hsl(${Math.random()*360} 85% 58%);animation-delay:${Math.random()*.4}s`;document.body.appendChild(d);setTimeout(()=>d.remove(),2300)}}
let dg=null,dragged=0;
document.addEventListener('pointerdown',e=>{const t=e.target.closest&&e.target.closest('#ra [data-k]');if(t&&!shown)dg={k:+t.dataset.k,x:e.clientX,el:t,on:0}});
document.addEventListener('pointermove',e=>{if(!dg)return;const dx=e.clientX-dg.x;if(!dg.on&&Math.abs(dx)>10){dg.on=1;dg.el.style.zIndex=9;dg.el.style.transition='none'}if(dg.on)dg.el.style.transform=`translateX(${dx}px) scale(1.12)`});
document.addEventListener('pointerup',e=>{if(!dg)return;const d=dg;dg=null;if(!d.on)return;dragged=1;setTimeout(()=>dragged=0,60);
 let to=0,best=1e9;[...$('ra').children].forEach((c,k)=>{const r=c.getBoundingClientRect(),q=Math.abs(e.clientX-(r.left+r.width/2));if(q<best){best=q;to=k}});
 const old=rack.slice(),[m]=rack.splice(d.k,1);rack.splice(to,0,m);
 Object.values(pend).forEach(v=>v.k=rack.indexOf(old[v.k]));if(sel!=null)sel=rack.indexOf(old[sel]);render()});
document.addEventListener('pointercancel',()=>{if(dg&&dg.on)render();dg=null});
function nextG(){const n=GAMES.length,c=GAMES.indexOf(G);for(let k=1;k<=n;k++)if(ld('sd:'+GAMES[(c+k)%n].name)==null)return start((c+k)%n);start((c+1)%n)}
function fill(){const cur=G?GAMES.indexOf(G):0;$('g').innerHTML=GAMES.map((g,k)=>{const b=ld('sd:'+g.name);return `<option value="${k}">${g.name}${b!=null?' ('+b+' %)':''}</option>`}).join('');$('g').value=cur}
function start(k){G=GAMES[k];i=0;board=Array.from({length:15},()=>Array(15).fill(null));tot={me:0,top:0};show(1);turn()}
function turn(){rack=G.draws[i].replace(/[+-]/g,'').split('').map(l=>({l,u:0}));pend={};sel=null;shown=null;err='';render();save();startT()}
function render(){
 const n=G.draws.length;let h='';
 for(let r=0;r<16;r++)for(let c=0;c<16;c++){
  if(!r||!c){h+=`<div class="lb">${!r&&c?c:r&&!c?String.fromCharCode(64+r):''}</div>`;continue}
  const R=r-1,C=c-1,k=R+','+C,x=pend[k]||board[R][C];
  if(x)h+=`<div data-r="${R}" data-c="${C}" class="x${x.j?' j':''}${pend[k]?' p':''}${x.n?' n':''}"><b>${x.l}</b>${x.j?'':`<i>${V[nb(x.l)]}</i>`}</div>`;
  else{const p=prem(R,C);h+=`<div data-r="${R}" data-c="${C}" class="${CL[p]}">${p==='w'&&R===7&&C===7?'★':LB[p]}</div>`}
 }
 $('bd').innerHTML=h;
 $('ra').innerHTML=rack.map((t,k)=>`<div data-k="${k}" class="rt${t.u?' u':''}${sel===k?' s':''}${t.l==='?'?' jk':''}"><b>${t.l}</b>${t.l==='?'?'':`<i>${V[nb(t.l)]}</i>`}</div>`).join('');
 $('st').textContent=i<n?`Coup ${i+1} sur ${n}`:'Terminé';
 const pc=tot.top?Math.round(tot.me/tot.top*100):null;$('sc').innerHTML=(pc==null?'':`<b>${pc} %</b> `)+`<small>Toi ${tot.me}, top ${tot.top}</small>`;$('gt').textContent=G.name;$('pb').hidden=!TL||!!shown||i>=n;
 {const c=!shown&&Object.keys(pend).length?calc():null;$('lv').innerHTML=c?(c.e?'<small>…</small>':`<b>${c.raw}</b> pts <small>${c.txt}</small>`):''}
 let m='';
 if(i>=n){const p=Math.round(tot.me/tot.top*100);m=`<b>Partie terminée</b><br>Toi ${tot.me}, top ${tot.top}, soit ${p} % du top.`}
 else if(shown){const a=shown.r,t=shown.top,bd=a.bad&&a.bad.length;m=`<div class="rc ${bd?'bd':a.t===t.pts?'ok':'gp'}"><b>Toi : ${a.t} pts</b> ${a.txt?'('+a.txt+')':'(passé)'}${a.to?' ⏱ temps écoulé':''}<br><b>Top : ${t.pts} pts</b>, ${t.w} en ${t.ref}<br>${bd?'❌ Absent de la liste : '+a.bad.join(', ')+' (0 pt)<br><small>Liste ODS 8 : il peut manquer des mots récents.</small>':a.t===t.pts?'✅ Top trouvé !':a.t>t.pts?'🤔 Plus que le top : vérifie ce mot dans l’ODS 9':'Il t’a manqué '+(t.pts-a.t)+' pts'}${a.nod?'<br><small>Dictionnaire indisponible : mots non vérifiés.</small>':''}<br>Total : ${Math.round(tot.me/tot.top*100)} %<div id="df"></div></div>`}
 else if(err)m=`<span class="err">${err}</span>`;
 else m='Touche une lettre du chevalet, puis une case de la grille.';
 $('ms').innerHTML=m;if(shown&&i<n)showDefs();
 $('ac').innerHTML=i>=n?'<button class="go" id="ng">Partie suivante</button><button id="rn">🎲 Aléatoire</button><button id="rj">Rejouer</button>':shown?'<button class="go" id="nx">Coup suivant</button>':'<button class="go" id="ok">Valider</button><button id="bk">Rappeler</button><button id="sh">Mélanger</button><button id="ps">Passer</button>';
}
function back(){Object.values(pend).forEach(v=>rack[v.k].u=0);pend={};sel=null}
function cell(R,C){
 if(shown||i>=G.draws.length)return;const k=R+','+C;err='';
 if(pend[k]){rack[pend[k].k].u=0;delete pend[k]}
 else if(!board[R][C]&&sel!=null){const t=rack[sel];let l=t.l;
  if(l==='?'){l=nb((prompt('Quelle lettre pour le joker ?')||'').charAt(0));if(!/[A-Z]/.test(l))return}
  pend[k]={l,j:t.l==='?',k:sel};t.u=1;sel=null}
 render()}
function calc(){
 const P=Object.entries(pend).map(([k,v])=>{const [r,c]=k.split(',').map(Number);return{r,c,...v}});
 if(!P.length)return{e:'Pose d’abord des lettres.'};
 const rs=new Set(P.map(p=>p.r)),cs=new Set(P.map(p=>p.c));
 if(rs.size>1&&cs.size>1)return{e:'Les lettres doivent être alignées.'};
 const get=(r,c)=>r<0||c<0||r>14||c>14?null:(pend[r+','+c]||board[r][c]);
 const word=(r,c,dr,dc)=>{while(get(r-dr,c-dc)){r-=dr;c-=dc}const w=[];while(get(r,c)){w.push([r,c]);r+=dr;c+=dc}return w.length>1?w:null};
 const H=rs.size===1,W=[];
 if(P.length>1){const d=H?[0,1]:[1,0],m=word(P[0].r,P[0].c,...d);
  if(!m||!P.every(p=>m.some(([r,c])=>r===p.r&&c===p.c)))return{e:'Il y a un trou dans ton mot.'};
  W.push(m);P.forEach(p=>{const x=word(p.r,p.c,...(H?[1,0]:[0,1]));if(x)W.push(x)})}
 else[[0,1],[1,0]].forEach(d=>{const x=word(P[0].r,P[0].c,...d);if(x)W.push(x)});
 const first=board.every(r=>r.every(x=>!x));
 if(first){if(P.length<2||!P.some(p=>p.r===7&&p.c===7))return{e:'Le premier mot doit passer par la case centrale.'}}
 else if(!W.some(w=>w.some(([r,c])=>!pend[r+','+c])))return{e:'Ton mot doit toucher des lettres déjà posées.'};
 let t=0;
 W.forEach(w=>{let s=0,m=1;w.forEach(([r,c])=>{const x=get(r,c);let v=x.j?0:V[nb(x.l)];
  if(pend[r+','+c]){const p=prem(r,c);if(p==='l')v*=2;if(p==='t')v*=3;if(p==='w')m*=2;if(p==='W')m*=3}s+=v});t+=s*m});
 if(P.length===7)t+=50;
 const ws=W.map(w=>w.map(([r,c])=>nb(get(r,c).l)).join('')),bad=D?ws.filter(x=>!D.includes('\n'+x+'\n')):[];
 return{t:bad.length?0:t,raw:t,bad,nod:!D,txt:ws.join(', ')}}
function put(top){
 board.forEach(r=>r.forEach(x=>x&&(x.n=0)));
 const m=top.ref.replace(/\s/g,'');let r,c,dr,dc,a;
 if(a=m.match(/^([A-O])(\d+)$/)){r=a[1].charCodeAt(0)-65;c=+a[2]-1;dr=0;dc=1}
 else if(a=m.match(/^(\d+)([A-O])$/)){c=+a[1]-1;r=a[2].charCodeAt(0)-65;dr=1;dc=0}else return;
 let par=false;
 for(const ch of top.w){if(ch==='('){par=true;continue}if(ch===')'){par=false;continue}
  if(r<15&&c<15&&!board[r][c])board[r][c]={l:ch.toUpperCase(),j:par||ch!==ch.toUpperCase(),n:1};
  r+=dr;c+=dc}}
function reveal(skip,to){
 let a=skip?{t:0}:calc();if(a.e){if(!to){err=a.e;return render()}a={t:0}}
 back2();stopT();tick(true);if(to)a.to=1;tot.me+=a.t;const top=G.tops[i];tot.top+=top.pts;put(top);shown={r:a,top};if(!skip&&a.t===top.pts&&!(a.bad&&a.bad.length))confetti();
 render()}
function back2(){pend={};sel=null}
document.addEventListener('click',e=>{
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()}catch(x){}
 const t=e.target.closest('[data-k],[data-r],button');if(!t)return;
 if(t.dataset.t!==undefined){TL=+t.dataset.t;sv('sd:tl',TL);tbr()}
 else if(t.id==='gs')start(+$('g').value)
 else if(t.id==='gc')resume()
 else if(t.id==='ex')exportG()
 else if(t.id==='rd')rnd()
 else if(t.id==='pb')pause()
 else if(t.id==='rz')unpause()
 else if(t.id==='mn')home()
 else if(t.dataset.k!==undefined){if(dragged||shown||rack[t.dataset.k].u)return;sel=sel===+t.dataset.k?null:+t.dataset.k;err='';render()}
 else if(t.dataset.r!==undefined)cell(+t.dataset.r,+t.dataset.c);
 else if(t.id==='ok')reveal(false);
 else if(t.id==='ps')reveal(true);
 else if(t.id==='bk'){back();err='';render()}
 else if(t.id==='sh'){back();rack.sort(()=>Math.random()-.5);render()}
 else if(t.id==='nx'){i++;if(i>=G.draws.length){sv('sd:'+G.name,Math.round(tot.me/tot.top*100));fill();render();save();startT()}else turn()}
 else if(t.id==='rj')start(GAMES.indexOf(G))
 else if(t.id==='rn')rnd()
 else if(t.id==='ng')nextG()});
const LOADP=()=>window.pdfjsLib?Promise.resolve():new Promise((ok,ko)=>{const s=document.createElement('script');s.src='pdf.min.js';s.onload=()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='pdf.worker.min.js';ok()};s.onerror=ko;document.head.appendChild(s)});
async function pdfLines(f){await LOADP();const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,L=[];
 for(let n=1;n<=d.numPages;n++){const it=(await(await d.getPage(n)).getTextContent()).items.filter(x=>x.str.trim()).map(x=>({s:x.str.trim(),x:x.transform[4],y:x.transform[5]})).sort((a,b)=>b.y-a.y||a.x-b.x);
  let cur=[],y0=0;const fl=()=>{if(cur.length)L.push(cur.sort((a,b)=>a.x-b.x).map(z=>z.s).join(' '));cur=[]};
  for(const x of it){if(cur.length&&Math.abs(x.y-y0)>3)fl();if(!cur.length)y0=x.y;cur.push(x)}fl()}
 return L}
const REF=/^([A-O]\d{1,2}|\d{1,2}[A-O])$/,DG=/^\d+$/;
function rowsFromLines(L){const r=[];for(const l of L){const a=l.replace(/\s+/g,' ').trim().split(' ');
 if(DG.test(a[0])&&a.length===2&&/^[A-Z?\[+-]+$/.test(a[1]))r.push([a[1],'','',0]);
 else if(DG.test(a[0])&&a.length===6&&REF.test(a[3])&&DG.test(a[4]))r.push([a[1],a[2],a[3],+a[4]]);
 else if(!DG.test(a[0])&&a.length===4&&REF.test(a[1])&&DG.test(a[2]))r.push(['',a[0],a[1],+a[2]])}
 return r}
const norm=rows=>rows.map(r=>[r[0].replace(/\[/g,'?'),r[1].replace(/Œ/g,'OE').replace(/œ/g,'oe').replace(/Æ/g,'AE').replace(/\*/g,''),r[2],r[3]]);
function okGame(rows){const b={},T=rows.slice(1);if(rows.length<4||rows.filter(r=>r[0]).length!==T.length)return 0;
 for(const t of T){const m=t[2].match(/^([A-O])(\d+)$/),n=m?null:t[2].match(/^(\d+)([A-O])$/);if(!m&&!n)return 0;
  let r=(m?m[1]:n[2]).charCodeAt(0)-65,c=(m?+m[2]:+n[1])-1;const dr=m?0:1,dc=m?1:0;
  for(const ch of t[1].replace(/[()]/g,'')){if(r>14||c>14)return 0;const k=r+','+c,l=nb(ch);if(b[k]&&b[k]!==l)return 0;b[k]=l;r+=dr;c+=dc}}
 return 1}
$('f').onchange=async e=>{const bad=[];let ok=0,dup=0,pr=0;
 for(const f of e.target.files){let rows=[];$('im').textContent='Import '+(++pr)+' sur '+e.target.files.length+'…';await new Promise(r=>setTimeout(r));
  try{if(/\.pdf$/i.test(f.name))rows=rowsFromLines(await pdfLines(f));
   else(await f.text()).split(/\r?\n/).forEach(l=>{const p=l.split('\t').map(s=>s.trim()),q=p.concat(['','','','','']);
    if(/^\d+\.$/.test(p[0]))rows.push([q[1],q[2],q[3].replace(/\s/g,''),+q[4]||0]);
    else if(p.length>=5&&!p[0]&&!p[1]&&p[2])rows.push(['',p[2],p[3].replace(/\s/g,''),+p[4]||0])})}catch(x){bad.push(f.name);continue}
  rows=norm(rows);const nm=f.name.replace(/\.(txt|pdf)$/i,'').replace(/&#(\d+);/g,(m,c)=>String.fromCharCode(c));
  if(!okGame(rows))bad.push(f.name);else if(GAMES.some(g=>g.name===nm))dup++;
  else{ok++;GAMES.push(mk(nm,rows));const im=ld('sd:imp')||[];im.push({n:nm,r:rows});sv('sd:imp',im)}}
 fill();$('g').value=GAMES.length-1;
 $('im').innerHTML=(ok?`✅ ${ok} partie${ok>1?'s':''} ajoutée${ok>1?'s':''}.<br>`:'')+(dup?`ℹ️ ${dup} déjà dans la liste.<br>`:'')+(bad.length?`<span class="err">❌ Non reconnu : ${bad.slice(0,4).join(', ')}${bad.length>4?' et '+(bad.length-4)+' autres':''}.<br>Il faut un .txt DupliTop ou un PDF avec du texte (pas un scan).</span>`:'');e.target.value=''};
/* 4b. Dictionnaire : vérification des mots et définitions (Wiktionnaire) */
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const WK='https://fr.wiktionary.org/w/api.php?action=parse&prop=text&format=json&origin=*&redirects=1&disableeditsection=1&disablelimitreport=1&page=';
function extr(h){const d=new DOMParser().parseFromString(h,'text/html'),a=d.getElementById('fr');if(!a)return[];
 const out=[];let nat='',n=a.closest('.mw-heading')||a.closest('h2')||a;
 for(n=n.nextElementSibling;n&&n.tagName!=='H2'&&!n.classList.contains('mw-heading2');n=n.nextElementSibling){
  const hd=/^H[34]$/.test(n.tagName)?n:n.classList.contains('mw-heading')?n.querySelector('h3,h4'):null;
  if(hd)nat=hd.textContent.trim().replace(/\s*\d+$/,'');
  if(n.tagName==='OL')[...n.children].forEach(li=>{const c=li.cloneNode(true);c.querySelectorAll('ul,dl,ol').forEach(x=>x.remove());
   const t=c.textContent.replace(/\s+/g,' ').trim();if(t&&out.length<4)out.push({n:nat,t:t.slice(0,220)})})}
 return out}
async function def(w){const k='sd:def:'+w,c=ld(k);if(c)return c;let j;
 try{j=await(await fetch(WK+encodeURIComponent(w.toLowerCase()))).json()}catch(e){return'off'}
 const r=j&&j.parse?extr(j.parse.text['*']):[];sv(k,r);return r}
const fmt=r=>r==='off'?'<small>Définition indisponible hors connexion.</small>':r.length?r.slice(0,3).map(x=>`<p><i>${esc(x.n)}</i> ${esc(x.t)}</p>`).join('')+'<small>Source : Wiktionnaire (CC BY-SA)</small>':'<small>Pas de définition trouvée dans le Wiktionnaire.</small>';
const cl=s=>nb(s).replace(/[^A-Z]/g,'');
async function look(){const w=cl($('dq').value);if(w.length<2){$('dr').innerHTML='';return}
 const v=D?D.includes('\n'+w+'\n'):null;
 $('dr').innerHTML=`<div class="${v?'ok':'no'}"><b>${w}</b> ${v==null?'dictionnaire en chargement…':v?'✅ mot valide (ODS 8)':'❌ absent de la liste ODS 8'}</div>`+(v===false?'<small>Un mot récent (ODS 9) peut manquer à cette liste.</small>':'<div id="dd"></div>');
 if(!v)return;$('dd').innerHTML='<small>Définition…</small>';
 const r=await def(w);if($('dd')&&cl($('dq').value)===w)$('dd').innerHTML=fmt(r)}
async function showDefs(){const s=shown;if(!s||!$('df'))return;
 const ws=[...new Set([cl(s.top.w),...(s.r.bad&&s.r.bad.length?[]:(s.r.txt||'').split(', '))].filter(x=>x.length>1))].slice(0,3);
 $('df').innerHTML='<small>Définitions…</small>';
 const h=await Promise.all(ws.map(async w=>{const r=await def(w);return`<p><b>${w}</b> ${r==='off'?'<small>hors connexion</small>':r.length?`<i>${esc(r[0].n)}</i> ${esc(r[0].t)}`:'<small>pas de définition</small>'}</p>`}));
 if(shown===s&&$('df'))$('df').innerHTML=h.join('')}
let dt=0;
$('dk').addEventListener('click',()=>{const o=$('dc').hidden;$('dc').hidden=!o;if(o)setTimeout(()=>$('dq').focus(),60)});
$('dx').addEventListener('click',()=>{$('dc').hidden=true});
$('dq').addEventListener('input',()=>{clearTimeout(dt);dt=setTimeout(look,350)});
$('dq').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(dt);look()}});

/* 4c. Parties partagées : parties.json (dans le dépôt GitHub) est lu au démarrage par tous les téléphones */
function exportG(){const L=GAMES.slice(DATA.length).map(g=>({n:g.name,r:g.r}));
 if(!L.length){$('im').innerHTML='<span class="err">Aucune partie importée à exporter.</span>';return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(L)],{type:'application/json'}));a.download='parties.json';document.body.appendChild(a);a.click();a.remove();
 $('im').innerHTML=`✅ ${L.length} parties exportées dans parties.json (dossier Téléchargements).`}
fetch('parties.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).then(L=>{let a=0;
 for(const g of L)if(!GAMES.some(x=>x.name===g.n)&&okGame(norm(g.r))){GAMES.push(mk(g.n,g.r));a++}
 if(a){fill();if(!live)home()}}).catch(()=>{});
home();

/* 5. Service worker : permet d'utiliser l'appli sans connexion */
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
