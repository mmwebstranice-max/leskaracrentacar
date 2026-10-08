(function(){
"use strict";
var KATEGORIJE = ["Osobni automobil","Putnički kombi","Teretni kombi","Prikolica"];
var OPISI = {"Osobni automobil":"Za grad, posao i putovanja","Putnički kombi":"8+1 sjedala za grupe","Teretni kombi":"Do 3,5 t, B kategorija","Prikolica":"Zatvorena i otvorena"};
var MJENJAC = ["","Manualni","Automatski"];
var GORIVO = ["","Benzin","Dizel","Hibrid","Električni","Plin"];

var saved = window.SITE_DATA;
var state = clone(saved);
var dirty = false, canEdit = false, filter = "Sve";
var ui = {car:null, panel:false, tab:"vozila", editId:null, img:"", delArm:null, status:"", statusKind:"", sent:false};
var form = {tip:"kratko",mj:"12",ime:"",tel:"",vozilo:"",lok:"",d1:"",t1:"09:00",d2:"",t2:"09:00",nap:""};
var zf = {opis:"",vrsta:"Osobni automobil",mjenjac:"Svejedno",trajanje:"Kratkoročni najam",od:"",ime:"",tel:"",nap:""};
var pf = {tvrtka:"",ime:"",tel:"",broj:"1",vrsta:"Osobni automobil",trajanje:"12 mjeseci",nap:""};
var MJESECI = ["1","3","6","12","24","36"];
var errors = {};

function clone(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function pad(n){return (n<10?"0":"")+n;}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function hrDate(s){if(!s)return "";var p=s.split("-");return p[2]+"."+p[1]+"."+p[0]+".";}
function digits(s){return String(s||"").replace(/\D/g,"");}
function byId(id){for(var i=0;i<state.vozila.length;i++)if(state.vozila[i].id===id)return state.vozila[i];return null;}
function carName(v){return (v.marka+" "+(v.model||"")).trim();}
function hasPrice(v){return v.cijena!==null&&v.cijena!==""&&v.cijena!==undefined&&Number(v.cijena)>0;}

(function(){var a=new Date();a.setDate(a.getDate()+1);var b=new Date(a);b.setDate(b.getDate()+3);form.d1=iso(a);form.d2=iso(b);form.lok=(state.postavke.lokacije||[])[0]||"";})();

/* ---------- drawings ---------- */
function wheel(x,y,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="var(--ink)"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.42)+'" fill="var(--muted)"/>';}
function draw(k){
 var body="var(--red)", glass="var(--night-2)", ground='<ellipse cx="160" cy="132" rx="140" ry="6" fill="var(--line)"/>';
 var s;
 if(k==="Putnički kombi"||k==="Teretni kombi"){
  s='<path d="M22,112 L22,40 Q22,22 42,22 L232,22 Q246,22 254,34 L284,70 Q300,74 300,92 L300,112 Z" fill="'+body+'"/>'+
    (k==="Putnički kombi"?'<path d="M40,34 L90,34 L90,62 L40,62 Z M98,34 L148,34 L148,62 L98,62 Z M156,34 L206,34 L206,62 L156,62 Z" fill="'+glass+'"/>':'<rect x="40" y="40" width="160" height="3" rx="1.5" fill="rgba(0,0,0,.18)"/>')+
    '<path d="M216,34 L238,34 Q246,34 250,42 L266,64 L216,64 Z" fill="'+glass+'"/>'+wheel(76,112,19)+wheel(250,112,19);
 } else if(k==="Prikolica"){
  s='<rect x="60" y="56" width="200" height="50" rx="6" fill="'+body+'"/><rect x="60" y="50" width="200" height="10" rx="4" fill="var(--ink)"/><path d="M260,90 L304,98" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><circle cx="306" cy="98" r="5" fill="var(--ink)"/>'+wheel(160,112,19);
 } else if(k==="Traktor"){
  s='<path d="M70,104 L70,62 L150,62 L156,28 L214,28 L222,62 L262,66 Q276,68 276,84 L276,104 Z" fill="'+body+'"/><path d="M164,36 L206,36 L212,62 L160,62 Z" fill="'+glass+'"/><rect x="104" y="40" width="6" height="22" fill="var(--ink)"/>'+wheel(208,100,32)+wheel(92,112,20);
 } else {
  s='<path d="M24,112 L24,84 Q26,70 48,67 L100,62 L132,38 Q140,32 154,32 L208,32 Q222,33 232,46 L252,63 L284,68 Q298,72 298,88 L298,112 Z" fill="'+body+'"/><path d="M112,62 L138,41 L206,41 Q216,42 224,52 L236,62 Z" fill="'+glass+'"/>'+wheel(82,112,19)+wheel(248,112,19);
 }
 return '<svg viewBox="0 0 320 140" aria-hidden="true">'+ground+s+'</svg>';
}
function pic(v){
 if(!v.slika)return draw(v.kategorija);
 if(!v.slika2)return '<img src="'+esc(v.slika)+'" alt="'+esc(carName(v))+'">';
 return '<div class="slides"><img src="'+esc(v.slika)+'" alt="'+esc(carName(v))+'" loading="lazy"><img src="'+esc(v.slika2)+'" alt="'+esc(carName(v))+', tablica M&I rent a car" loading="lazy"></div>'+
  '<button class="arr prev" data-slide="-1" aria-label="Prethodna slika">&#8249;</button><button class="arr next" data-slide="1" aria-label="Sljedeća slika">&#8250;</button>';
}
var I={
 seat:'<svg viewBox="0 0 24 24"><path d="M7 4v9h10M7 13l-1 7M17 13v7M9 4h3"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v10M12 7v10M18 7v5H6"/></svg>',
 fuel:'<svg viewBox="0 0 24 24"><path d="M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M3 20h12M4 10h10M14 8l3 2v7a1.5 1.5 0 0 0 3 0V8l-3-3"/></svg>',
 snow:'<svg viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>',
 kg:'<svg viewBox="0 0 24 24"><path d="M6 8h12l2 12H4zM9 8a3 3 0 0 1 6 0"/></svg>',
 cal:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>'
};

/* ---------- booking logic ---------- */
function days(){
 if(!form.d1||!form.d2)return 0;
 var a=new Date(form.d1+"T"+(form.t1||"00:00")),b=new Date(form.d2+"T"+(form.t2||"00:00"));
 var h=(b-a)/36e5; if(!(h>0))return 0; return Math.max(1,Math.ceil(h/24-0.0001));
}
function mm(n){n=Number(n);var a=n%10,c=n%100;return n+(a===1&&c!==11?" mjesec":a>=2&&a<=4&&(c<12||c>14)?" mjeseca":" mjeseci");}
function dd(d){return d+(d%10===1&&d%100!==11?" dan":" dana");}
function chosenCar(){return form.vozilo?byId(form.vozilo):null;}
function waNumber(){return digits(state.postavke.whatsapp);}
function message(){
 var v=chosenCar(), d=days(), L=[];
 L.push("Novi upit za najam – "+state.postavke.naziv);
 L.push("");
 L.push("Ime: "+form.ime.trim());
 L.push("Telefon: "+form.tel.trim());
 L.push("Vrsta najma: "+(form.tip==="dugo"?"Dugoročni ("+mm(form.mj)+")":"Kratkoročni"));
 L.push("Vozilo: "+(v?carName(v)+" ("+v.kategorija+")":"Bilo koje slobodno"));
 L.push("Preuzimanje: "+hrDate(form.d1)+" u "+form.t1+(form.lok?", "+form.lok:""));
 if(form.tip!=="dugo"){
  L.push("Povratak: "+hrDate(form.d2)+" u "+form.t2);
  if(d)L.push("Trajanje: "+dd(d));
  if(v&&d&&hasPrice(v))L.push("Okvirna cijena: "+(v.cijena*d)+" € ("+v.cijena+" €/dan)");
 }
 if(form.nap.trim())L.push("Napomena: "+form.nap.trim());
 return L.join("\n");
}
function waHref(text){return "https://wa.me/"+waNumber()+"?text="+encodeURIComponent(text==null?message():text);}
function validate(){
 errors={};
 if(form.ime.trim().length<2)errors.ime="Upišite ime i prezime.";
 if(digits(form.tel).length<6)errors.tel="Upišite broj na koji vas možemo kontaktirati.";
 if(!form.d1)errors.d1="Odaberite datum preuzimanja.";
 if(form.tip!=="dugo"){
  if(!form.d2)errors.d2="Odaberite datum povratka.";
  else if(!days())errors.d2="Povratak mora biti nakon preuzimanja.";
 }
 return !Object.keys(errors).length;
}

/* ---------- render ---------- */
var app=document.getElementById("app");
function render(){
 var fid=document.activeElement&&document.activeElement.id, pos=null;
 try{if(fid&&document.activeElement.selectionStart!=null)pos=document.activeElement.selectionStart;}catch(e){}
 var p=state.postavke;
 app.innerHTML=editBar()+'<div class="night">'+topBar(p)+hero(p)+'</div>'+ribbon(p)+types()+rentals(p)+fleet()+onRequest(p)+longTerm(p)+business(p)+services(p)+why(p)+gallery()+contact(p)+footer(p)+
  '<a class="fab" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener" aria-label="Pišite nam na WhatsApp">'+I.wa+'</a>'+(ui.panel?panel():"")+(ui.car&&byId(ui.car)?carModal(byId(ui.car)):"");
 document.documentElement.classList.toggle("lock",!!(ui.car&&byId(ui.car))||ui.panel);
 if(fid){var el=document.getElementById(fid);if(el){el.focus({preventScroll:true});try{if(pos!=null)el.setSelectionRange(pos,pos);}catch(e){}}}
 watchFab();
}
var fabObs=null;
function watchFab(){
 if(!("IntersectionObserver" in window))return;
 var bk=document.getElementById("bk"),fab=document.querySelector(".fab");if(!bk||!fab)return;
 if(fabObs)fabObs.disconnect();
 fabObs=new IntersectionObserver(function(en){fab.classList.toggle("away",en[0].isIntersecting);});
 fabObs.observe(bk);
}
function editBar(){
 if(!canEdit)return "";
 return '<div class="editbar"><div class="wrap"><span class="sp">'+(dirty?"Imate promjene. Preuzmite site.js i zamijenite ga u data/ mapi na gitu.":"Uređivački način. Kupci ovu traku ne vide.")+'</span>'+
 (dirty?'<button class="btn btn-sm alt" data-act="discard">Odbaci</button><button class="btn btn-sm" data-act="publish">Preuzmi site.js</button>':'')+
 '<button class="btn btn-sm" data-act="open-panel">Uredi vozila i kontakt</button></div></div>';
}
function initials(n){var m=String(n).match(/^([A-ZČĆŽŠĐ0-9])\s*&\s*([A-ZČĆŽŠĐ0-9])/i);return m?m[1]+"&"+m[2]:String(n).trim().charAt(0).toUpperCase();}
function topBar(p){
 return '<header class="top"><div class="wrap"><a class="brand" href="#rezervacija"><span class="logo"><img src="logo.png" alt="'+esc(p.naziv)+'"></span><small class="not-m">Najam vozila · '+esc(p.grad)+'</small></a>'+
 '<nav class="nav" aria-label="Glavna navigacija"><a href="#vozila">Vozila</a><a href="#dugorocni">Dugoročni najam</a><a href="#poslovni">Poslovni najam</a><a href="#po-zelji">Vozilo po želji</a><a href="#usluge">Selidbe</a><a href="#kontakt">Kontakt</a></nav>'+
 '<a class="btn btn-wa btn-sm" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener">'+I.wa+'<span>WhatsApp</span></a></div></header>';
}
function opt(v,l,s){return '<option value="'+esc(v)+'"'+(s?" selected":"")+'>'+esc(l)+'</option>';}
function field(id,label,html,full){return '<div class="f'+(full?" full":"")+(errors[id]?" bad":"")+'"><label for="bk-'+id+'">'+label+'</label>'+html+(errors[id]?'<span class="err">'+esc(errors[id])+'</span>':'')+'</div>';}
function stars(){return '<span class="stars" aria-hidden="true">★★★★★</span>';}
function hero(p){
 var avail=state.vozila.filter(function(v){return v.dostupno;});
 var v=chosenCar(), d=days();
 var sel=opt("","Bilo koje slobodno vozilo",!form.vozilo)+avail.map(function(c){return opt(c.id,carName(c)+(hasPrice(c)?" · "+c.cijena+" €/dan":""),form.vozilo===c.id);}).join("");
 var lok=(p.lokacije||[]).map(function(l){return opt(l,l,form.lok===l);}).join("");
 return '<section class="hero" id="rezervacija"><div class="wrap"><div>'+
 (p.ocjena?'<a class="rating-pill" href="https://www.google.com/search?q='+encodeURIComponent(p.naziv+" "+p.grad)+'" target="_blank" rel="noopener"><span class="g">G</span>'+stars()+'<span class="num">'+esc(p.ocjena)+' na Googleu</span></a>':'')+
 '<h1>Najam vozila<br>u <em>'+esc(p.gradU||p.grad)+'</em></h1>'+(p.moto?'<p class="moto">'+esc(p.moto)+'</p>':'')+
 '<p class="lead">Kratkoročni i dugoročni najam osobnih automobila, kombija i prikolica, za privatne i poslovne potrebe. Nema vozila koje trebate? Nabavit ćemo ga. Pošaljite upit u minuti, odgovor stiže na WhatsApp.</p>'+
 ((p.usluge||{}).whatsapp?'<a class="extra" href="#usluge"><span class="tag-n">Usluge</span><span class="tx">Radimo i <b>selidbe</b> te <b>prijevoz do zračne luke</b> s vozačem</span><span aria-hidden="true">→</span></a>':'')+
 (p.cijenaOd?'<p class="from"><span>Najam već od</span><b class="num">'+esc(p.cijenaOd)+' €</b><span>dnevno</span></p>':'')+
 '<div class="ctas"><a class="btn btn-red only-m" href="#bk">Pošalji upit</a><a class="btn btn-red not-m" href="#vozila">Pogledaj vozila</a><a class="btn btn-ghost-n" href="tel:'+esc(digits(p.whatsapp)?"+"+digits(p.whatsapp):"")+'">Nazovi '+esc(p.telefon)+'</a></div>'+
 '<div class="facts">'+(p.brojVozila?'<div><b class="num">'+esc(p.brojVozila)+'+ vozila</b><span>Širok izbor</span></div>':'')+(p.godine?'<div><b class="num">'+esc(p.godine)+'+ godina</b><span>S vama</span></div>':'')+'<div><b class="num">'+esc(p.ocjena||"–")+' / 5</b><span>Ocjena na Googleu</span></div></div>'+
 '<img class="hero-logo" src="slike/naslovna-logo.webp" width="804" height="259" alt="M&amp;I rent a car" fetchpriority="high">'+
 '</div>'+
 '<form class="book" id="bk" novalidate><div class="book-head"><div><h2>Pošalji upit</h2><p class="sub">Obavezno: ime, telefon i datumi.</p></div><span class="wa-badge" aria-hidden="true">'+I.wa+'</span></div><div class="seg" role="group" aria-label="Vrsta najma"><button type="button" data-tip="kratko" aria-pressed="'+(form.tip!=="dugo")+'"><b>Kratkoročni</b><span>dani i tjedni</span></button><button type="button" data-tip="dugo" aria-pressed="'+(form.tip==="dugo")+'"><b>Dugoročni</b><span>od 30 dana</span></button></div><div class="fgrid">'+
 field("ime","Ime i prezime",'<input id="bk-ime" autocomplete="name" value="'+esc(form.ime)+'" placeholder="Ivana Horvat">')+
 field("tel","Telefon",'<input id="bk-tel" type="tel" autocomplete="tel" value="'+esc(form.tel)+'" placeholder="09x xxx xxxx">')+
 field("vozilo","Vozilo",'<select id="bk-vozilo">'+sel+'</select><a class="mini-link" href="#po-zelji">Nema vozila koje trebate? Nabavit ćemo ga →</a>',true)+
 field("d1","Preuzimanje (datum i vrijeme)",'<div class="pair"><input id="bk-d1" type="date" value="'+esc(form.d1)+'" min="'+iso(new Date())+'"><input id="bk-t1" type="time" value="'+esc(form.t1)+'" aria-label="Vrijeme preuzimanja"></div>',true)+
 (form.tip==="dugo"?field("mj","Trajanje najma",'<select id="bk-mj">'+MJESECI.map(function(m){return opt(m,mm(m)+(m==="1"?" (od 30 dana)":""),form.mj===m);}).join("")+'</select>',true):
 field("d2","Povratak (datum i vrijeme)",'<div class="pair"><input id="bk-d2" type="date" value="'+esc(form.d2)+'" min="'+esc(form.d1||iso(new Date()))+'"><input id="bk-t2" type="time" value="'+esc(form.t2)+'" aria-label="Vrijeme povratka"></div>',true))+
 (lok?field("lok","Mjesto preuzimanja",'<select id="bk-lok">'+lok+'</select>',true):'')+
 field("nap","Napomena",'<textarea id="bk-nap" placeholder="Dodatni vozač, dječja sjedalica, kuka za prikolicu…">'+esc(form.nap)+'</textarea>',true)+
 '</div><div class="summary" id="bk-sum">'+summary(v,d)+'</div>'+
 '<a class="btn btn-wa send" id="bk-send" href="'+esc(waHref())+'" target="_blank" rel="noopener">'+I.wa+'Pošalji upit na WhatsApp</a>'+
 (ui.sent?'<p class="sentnote" aria-live="polite"><b>WhatsApp bi se trebao otvoriti s pripremljenom porukom.</b> Pritisnite Pošalji u WhatsAppu. Ako se nije otvorio, nazovite <span class="num" style="user-select:all">'+esc(p.telefon)+'</span>.</p>':'<p class="privacy">Poruku vidite prije slanja. Bez registracije.</p>')+
 '</form></div></section>';
}
function summary(v,d){
 if(form.tip==="dugo")return '<small>Dugoročni najam · fiksna mjesečna cijena, ponuda na upit</small><span class="big num">'+mm(form.mj)+'</span>';
 if(!d)return '<small>Datum povratka mora biti nakon preuzimanja.</small>';
 if(d>=30)return '<small>Najam od '+dd(d)+' · isplati se <button type="button" class="linkbtn" data-tip="dugo">dugoročni najam</button></small><span class="big num">'+dd(d)+'</span>';
 if(v&&hasPrice(v))return '<small>'+esc(carName(v))+' · '+dd(d)+'</small><span class="big num">'+(v.cijena*d)+' € <small>okvirno</small></span>';
 return '<small>Trajanje najma'+(v?" · cijena na upit":"")+'</small><span class="big num">'+dd(d)+'</span>';
}
function types(){
 return '<section class="sec" id="ponuda"><div class="wrap"><div class="sechead"><div><span class="kicker">Ponuda</span><h2>Što iznajmljujemo</h2></div><p>Od gradskog auta do kombija za devet osoba ili selidbu. Kliknite vrstu za popis vozila.</p></div>'+
 '<div class="types">'+KATEGORIJE.map(function(k){return '<button class="type" data-type="'+esc(k)+'"><span class="ic">'+draw(k)+'</span><b>'+esc(k)+'</b><span>'+esc(OPISI[k])+'</span></button>';}).join("")+'</div></div></section>';
}
function fleet(){
 var cats=["Sve"].concat(KATEGORIJE.filter(function(k){return state.vozila.some(function(v){return v.kategorija===k;});}));
 if(cats.indexOf(filter)<0)filter="Sve";
 var list=state.vozila.filter(function(v){return filter==="Sve"||v.kategorija===filter;});
 return '<section class="sec" id="vozila" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Vozila</span><h2>Naša vozila</h2></div>'+
 (cats.length>2?'<div class="chips" role="group" aria-label="Filtriraj po vrsti">'+cats.map(function(c){return '<button class="chip" data-filter="'+esc(c)+'" aria-pressed="'+(filter===c)+'">'+esc(c)+'</button>';}).join("")+'</div>':'')+'</div>'+
 (state.vozila.some(function(v){return v.foto||v.ilustrativna;})?'<p class="illu">Fotografije su ilustrativne. Vozilo koje dobijete može se razlikovati u boji i opremi.</p>':'')+
 (list.length?'<div class="grid">'+list.map(carCard).join("")+reqCard()+'</div>':
  '<div class="empty">'+(state.vozila.length?"Trenutno nema vozila ove vrste na popisu. Pošaljite upit i javit ćemo vam što je slobodno.":"Popis vozila uskoro. Pošaljite upit i javit ćemo vam što je slobodno.")+(canEdit&&!state.vozila.length?'<br><br><button class="btn btn-red" data-act="new-car">Dodaj prvo vozilo</button>':'')+'</div>')+
 '</div></section>';
}
function carCard(v){
 var sp=[];
 if(v.mjenjac)sp.push(I.gear+esc(v.mjenjac));
 if(Number(v.sjedala)>0)sp.push(I.seat+esc(v.sjedala)+" mjesta");
 if(v.gorivo)sp.push(I.fuel+esc(v.gorivo));
 if(v.nosivost)sp.push(I.kg+esc(v.nosivost));
 if(v.klima)sp.push(I.snow+"Klima");
 if(v.godina)sp.push(I.cal+esc(v.godina));
 if(v.kolicina)sp.unshift('<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'+esc(v.kolicina));
 return '<article class="car'+(v.dostupno?"":" off")+'" data-car="'+esc(v.id)+'"><div class="pic">'+pic(v)+'<span class="tag">'+esc(v.kategorija)+'</span>'+(v.primjer?'<span class="tag ex">Primjer</span>':'')+'</div>'+
 '<div class="body"><h3><button class="ttl" data-car="'+esc(v.id)+'">'+esc(carName(v))+'</button></h3>'+
 (sp.length?'<ul class="specs">'+sp.map(function(s){return '<li>'+s+'</li>';}).join("")+'</ul>':'')+
 (v.opis?'<p class="desc">'+esc(v.opis)+'</p>':'')+
 '<div class="foot">'+(hasPrice(v)?'<span class="price num">'+esc(v.cijena)+' €<small> / dan</small></span>':'<span class="price ask">Cijena na upit</span>')+
 (v.dostupno?'<button class="btn btn-sm btn-ink" data-pick="'+esc(v.id)+'">Rezerviraj</button>':'<span class="kicker" style="color:var(--muted)">Zauzeto</span>')+'</div>'+
 '<button class="more" data-car="'+esc(v.id)+'">Detalji i specifikacije <span aria-hidden="true">→</span></button></div></article>';
}
/* ---------- najam: kratkoročni, dugoročni, poslovni, vozilo po želji ---------- */
var J={
 check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 flex:'<svg viewBox="0 0 24 24"><path d="M4 7h12l-3-3M20 17H8l3 3"/></svg>',
 simple:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 cost:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 8.5a3.5 3.5 0 1 0 0 7M7 11h6M7 13.5h6"/></svg>',
 fleet:'<svg viewBox="0 0 24 24"><path d="M3 16v-4l2-5h9l3 5h2a2 2 0 0 1 2 2v2h-2M3 16h2m4 0h6"/><circle cx="7" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/></svg>',
 swap:'<svg viewBox="0 0 24 24"><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z"/><path d="M9 12l2 2 4-4"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>'
};
var zErr={}, pErr={};
function list(arr){return '<ul class="ticks">'+arr.map(function(t){return '<li>'+J.check+'<span>'+esc(t)+'</span></li>';}).join("")+'</ul>';}
function fx(pre,errs,id,label,html,full){return '<div class="f'+(full?" full":"")+(errs[id]?" bad":"")+'"><label for="'+pre+id+'">'+label+'</label>'+html+(errs[id]?'<span class="err">'+esc(errs[id])+'</span>':'')+'</div>';}
function selx(id,arr,val){return '<select id="'+id+'">'+arr.map(function(a){return opt(a,a,a===val);}).join("")+'</select>';}

function rentals(p){
 return '<section class="sec" id="najam" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Vrste najma</span><h2>Najam po vašoj mjeri</h2></div><p>Fleksibilni paketi prilagođeni privatnim i poslovnim korisnicima. Vozilo za vikend, za cijelu godinu ili za cijelu ekipu.</p></div>'+
 '<div class="plans">'+
 '<div class="plan"><span class="plan-k">Od 1 dana</span><h3>Kratkoročni najam</h3><p>Dnevni, vikend i tjedni najam za putovanja, selidbe ili dok vam je auto na servisu.</p>'+
 list(["Cijena po danu, povoljnija za duži najam","Preuzimanje u Kutini ili dostava po dogovoru","Osobna vozila, kombiji i prikolice"])+
 '<button class="btn btn-ink" data-tipgo="kratko">Pošalji upit</button></div>'+
 '<div class="plan hot"><span class="plan-k">Od 30 dana do 36 mjeseci</span><h3>Dugoročni najam</h3><p>Vozilo na mjesece ili godine uz jednu fiksnu mjesečnu cijenu. Bez kupnje i bez učešća.</p>'+
 list(["Registracija, servis i gume na nama","Bez leasinga i bez kredita","Zamjensko vozilo dok je vaše na servisu"])+
 '<a class="btn btn-red" href="#dugorocni">Saznaj više</a></div>'+
 '<div class="plan"><span class="plan-k">Za tvrtke i obrtnike</span><h3>Poslovni najam</h3><p>Vozila za vaš tim i flotu koja raste i smanjuje se zajedno s poslom.</p>'+
 list(["Jedan račun mjesečno za sva vozila","Dodajte ili vratite vozila po potrebi","Ponuda prilagođena vašoj djelatnosti"])+
 '<a class="btn btn-ink" href="#poslovni">Poslovni najam</a></div>'+
 '</div></div></section>';
}
function reqCard(){
 return '<article class="car req"><div class="req-in"><span class="req-ic">'+J.search+'</span><h3>Ne vidite vozilo koje trebate?</h3><p>Nabavit ćemo ga za vas. Recite nam marku, model ili samo vrstu vozila.</p><a class="btn btn-red btn-sm" href="#po-zelji">Vozilo po želji</a></div></article>';
}
function zMsg(){
 var L=["Upit: vozilo po želji – "+state.postavke.naziv,""];
 L.push("Ime: "+zf.ime.trim());L.push("Telefon: "+zf.tel.trim());
 L.push("Tražim: "+(zf.opis.trim()||"-"));L.push("Vrsta vozila: "+zf.vrsta);
 if(zf.mjenjac!=="Svejedno")L.push("Mjenjač: "+zf.mjenjac);
 L.push("Najam: "+zf.trajanje);if(zf.od)L.push("Potrebno od: "+hrDate(zf.od));
 if(zf.nap.trim())L.push("Napomena: "+zf.nap.trim());
 return L.join("\n");
}
function pMsg(){
 var L=["Upit za poslovni najam – "+state.postavke.naziv,""];
 L.push("Tvrtka / obrt: "+pf.tvrtka.trim());L.push("Kontakt osoba: "+pf.ime.trim());L.push("Telefon: "+pf.tel.trim());
 L.push("Broj vozila: "+(pf.broj||"1"));L.push("Vrsta vozila: "+pf.vrsta);L.push("Trajanje: "+pf.trajanje);
 if(pf.nap.trim())L.push("Napomena: "+pf.nap.trim());
 return L.join("\n");
}
function onRequest(p){
 var steps=[["Recite nam što trebate","Marku i model, ili samo vrstu: npr. auto sa 7 sjedala, automatik, kombi s dugim teretnim prostorom."],["Pronalazimo vozilo","Provjerimo svoju flotu i partnere te pronađemo vozilo koje odgovara."],["Šaljemo ponudu","Cijenu i rok dostupnosti dobijete na WhatsApp, bez obveze."],["Vozilo je spremno","Preuzmete ga kod nas ili vam ga dostavimo na adresu."]];
 return '<section class="sec" id="po-zelji" style="padding-top:0"><div class="wrap"><div class="req-sec">'+
 '<div class="req-txt"><span class="kicker">Vozilo po želji</span><h2>Nema ga u ponudi? Nabavit ćemo ga.</h2>'+
 '<p class="lead2">Ako na popisu ne vidite vozilo koje trebate, javite nam. Nabavljamo vozila po želji za kratkoročni, dugoročni i poslovni najam.</p>'+
 '<ol class="steps">'+steps.map(function(s,i){return '<li><span class="n num">'+(i+1)+'</span><div><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div></li>';}).join("")+'</ol></div>'+
 '<form class="book side" id="zf" novalidate><div class="book-head"><div><h2>Koje vozilo trebate?</h2><p class="sub">Obavezno: ime i telefon.</p></div><span class="wa-badge" aria-hidden="true">'+I.wa+'</span></div><div class="fgrid">'+
 fx("zf-",zErr,"opis","Vozilo (marka, model ili opis)",'<input id="zf-opis" value="'+esc(zf.opis)+'" placeholder="npr. Škoda Kodiaq 7 sjedala, automatik">',true)+
 fx("zf-",zErr,"vrsta","Vrsta",selx("zf-vrsta",KATEGORIJE.concat(["Ostalo"]),zf.vrsta))+
 fx("zf-",zErr,"mjenjac","Mjenjač",selx("zf-mjenjac",["Svejedno","Manualni","Automatski"],zf.mjenjac))+
 fx("zf-",zErr,"trajanje","Najam",selx("zf-trajanje",["Kratkoročni najam","Dugoročni najam","Poslovni najam"],zf.trajanje))+
 fx("zf-",zErr,"od","Potrebno od",'<input id="zf-od" type="date" value="'+esc(zf.od)+'" min="'+iso(new Date())+'">')+
 fx("zf-",zErr,"ime","Ime i prezime",'<input id="zf-ime" autocomplete="name" value="'+esc(zf.ime)+'" placeholder="Ivana Horvat">')+
 fx("zf-",zErr,"tel","Telefon",'<input id="zf-tel" type="tel" autocomplete="tel" value="'+esc(zf.tel)+'" placeholder="09x xxx xxxx">')+
 fx("zf-",zErr,"nap","Napomena",'<textarea id="zf-nap" placeholder="Broj sjedala, kuka, boja, budžet…">'+esc(zf.nap)+'</textarea>',true)+
 '</div><a class="btn btn-wa send" id="zf-send" href="'+esc(waHref(zMsg()))+'" target="_blank" rel="noopener">'+I.wa+'Pošalji upit na WhatsApp</a><p class="privacy">Poruku vidite prije slanja.</p></form>'+
 '</div></div></section>';
}
function longTerm(p){
 var dg=p.dugorocni||{};
 var inc=dg.ukljuceno||[];
 var cmp=dg.usporedba||[];
 return '<section class="sec" id="dugorocni" style="padding-top:0"><div class="wrap"><div class="lt">'+
 '<div class="lt-head"><span class="kicker">Dugoročni najam</span><h2>Vozite, a mi brinemo o svemu ostalom</h2>'+
 '<p>Najam od 30 dana do 36 mjeseci uz fiksnu mjesečnu cijenu. Bez kupnje, bez učešća i bez administracije, za privatne osobe i tvrtke.</p>'+
 '<div class="pillars"><div>'+J.flex+'<b>Fleksibilnost</b><span>Trajanje prema vašim potrebama. Vozilo možete zamijeniti kad se potrebe promijene.</span></div>'+
 '<div>'+J.simple+'<b>Jednostavnost</b><span>Bez kredita i odobrenja banke. Vozilo je brzo spremno, a papirologiju rješavamo mi.</span></div>'+
 '<div>'+J.cost+'<b>Kontrola troškova</b><span>Jedna fiksna mjesečna rata. Unaprijed znate koliko vas vozilo košta.</span></div></div>'+
 '<button class="btn btn-red" data-tipgo="dugo">Zatraži ponudu za dugoročni najam</button></div>'+
 '<div class="lt-side">'+(inc.length?'<div class="inc"><h3>Uključeno u mjesečnu cijenu</h3>'+list(inc)+'</div>':'')+
 (cmp.length?'<div class="cmp"><h3>Dugoročni najam ili leasing?</h3><table><thead><tr><th></th><th>Dugoročni najam</th><th>Leasing / kupnja</th></tr></thead><tbody>'+
  cmp.map(function(r){return '<tr><th scope="row">'+esc(r[0])+'</th><td class="yes">'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';}).join("")+'</tbody></table></div>':'')+
 '</div></div></div></section>';
}
function business(p){
 var ben=[[J.fleet,"Flota bez ulaganja","Kapital ostaje u poslu. Bez kredita, učešća i opterećenja bilance."],[J.simple,"Jedan račun mjesečno","Sva vozila na jednom računu, jednostavno za knjigovodstvo."],[J.flex,"Flota koja prati posao","Dodajte vozila u sezoni, vratite ih kad posao smiri."],[J.swap,"Posao ne staje","Zamjensko vozilo dok je vaše na servisu ili popravku."]];
 var who=["Građevina i montaža","Dostava i trgovina","Servisi na terenu","Sezonski poslovi","Terenska prodaja","Prijevoz radnika"];
 return '<section class="sec" id="poslovni" style="padding-top:0"><div class="wrap"><div class="biz">'+
 '<div class="biz-txt"><span class="kicker">Za tvrtke i obrtnike</span><h2>Poslovni najam</h2>'+
 '<p class="lead2">Osobna vozila, putnički i teretni kombiji za vaš tim, na kraći ili duži rok. Paket slažemo prema vašoj djelatnosti i broju vozila.</p>'+
 '<div class="ben">'+ben.map(function(b){return '<div>'+b[0]+'<b>'+esc(b[1])+'</b><span>'+esc(b[2])+'</span></div>';}).join("")+'</div>'+
 '<div class="who"><span>Za koga:</span>'+who.map(function(w){return '<em>'+esc(w)+'</em>';}).join("")+'</div></div>'+
 '<form class="book side" id="pf" novalidate><div class="book-head"><div><h2>Ponuda za tvrtke</h2><p class="sub">Obavezno: tvrtka, ime i telefon.</p></div><span class="wa-badge" aria-hidden="true">'+I.wa+'</span></div><div class="fgrid">'+
 fx("pf-",pErr,"tvrtka","Tvrtka ili obrt",'<input id="pf-tvrtka" autocomplete="organization" value="'+esc(pf.tvrtka)+'" placeholder="Naziv d.o.o.">',true)+
 fx("pf-",pErr,"ime","Kontakt osoba",'<input id="pf-ime" autocomplete="name" value="'+esc(pf.ime)+'" placeholder="Ime i prezime">')+
 fx("pf-",pErr,"tel","Telefon",'<input id="pf-tel" type="tel" autocomplete="tel" value="'+esc(pf.tel)+'" placeholder="09x xxx xxxx">')+
 fx("pf-",pErr,"broj","Broj vozila",'<input id="pf-broj" type="number" min="1" max="200" value="'+esc(pf.broj)+'">')+
 fx("pf-",pErr,"vrsta","Vrsta vozila",selx("pf-vrsta",KATEGORIJE.slice(0,3).concat(["Kombinacija vozila"]),pf.vrsta))+
 fx("pf-",pErr,"trajanje","Trajanje",selx("pf-trajanje",["Do 30 dana","1 do 3 mjeseca","6 mjeseci","12 mjeseci","24 mjeseca","36 mjeseci","Sezonski (po dogovoru)"],pf.trajanje),true)+
 fx("pf-",pErr,"nap","Napomena",'<textarea id="pf-nap" placeholder="Djelatnost, posebni zahtjevi, kuka, oprema…">'+esc(pf.nap)+'</textarea>',true)+
 '</div><a class="btn btn-wa send" id="pf-send" href="'+esc(waHref(pMsg()))+'" target="_blank" rel="noopener">'+I.wa+'Zatraži poslovnu ponudu</a><p class="privacy">Poruku vidite prije slanja.</p></form>'+
 '</div></div></section>';
}

/* ---------- detalji vozila ---------- */
var lastFocus=null;
function openCar(id){if(!byId(id))return;if(!ui.car)lastFocus=document.activeElement;ui.car=id;try{history.replaceState(null,"","#vozilo-"+id);}catch(e){}render();var c=document.querySelector(".cm-x");if(c)c.focus({preventScroll:true});}
function closeCar(silent){if(!ui.car)return;ui.car=null;try{history.replaceState(null,"",location.pathname+location.search+(canEdit?"#uredi":""));}catch(e){}if(!silent){render();if(lastFocus&&lastFocus.focus&&document.body.contains(lastFocus))lastFocus.focus({preventScroll:true});}}
function specRows(v){
 var r=[["Vrsta",v.kategorija]];
 if(v.mjenjac)r.push(["Mjenjač",v.mjenjac]);
 if(v.kategorija!=="Prikolica")r.push(["Gorivo",v.gorivo||"Na upit"]);
 if(Number(v.sjedala)>0)r.push(["Broj mjesta",v.kategorija==="Putnički kombi"&&Number(v.sjedala)===9?"9 (8+1)":String(v.sjedala)]);
 (v.specifikacije||[]).forEach(function(x){r.push([x[0],x[1]]);});
 if(v.nosivost)r.push(["Nosivost",v.nosivost]);
 if(v.klima)r.push(["Klima uređaj","Da"]);
 if(v.godina)r.push(["Godište",String(v.godina)]);
 if(v.kolicina)r.push(["Dostupno",v.kolicina]);
 if(v.kategorija!=="Prikolica")r.push(["Vozačka kategorija","B"]);
 r.push(["Vrste najma","Kratkoročni, dugoročni i poslovni"]);
 return r;
}
function carModal(v){
 var ids=state.vozila.map(function(x){return x.id;}),ix=ids.indexOf(v.id);
 var ask="Pozdrav, zanima me "+carName(v)+" ("+v.kategorija+"). Je li slobodno i koja je cijena?";
 return '<div class="cm-ov" data-act="cm-close"><div class="cm" role="dialog" aria-modal="true" aria-labelledby="cm-t">'+
 '<div class="cm-top"><span class="cm-count num">'+(ix+1)+' / '+ids.length+'</span><div class="cm-nav"><button class="btn btn-sm btn-ghost" data-cnav="-1" aria-label="Prethodno vozilo">‹</button><button class="btn btn-sm btn-ghost" data-cnav="1" aria-label="Sljedeće vozilo">›</button><button class="btn btn-sm btn-ink cm-x" data-act="cm-close">Zatvori</button></div></div>'+
 '<div class="cm-grid"><div class="cm-pic pic">'+pic(v)+(v.primjer?'<span class="tag ex">Primjer</span>':'')+'</div>'+
 '<div class="cm-info"><span class="kicker">'+esc(v.kategorija)+'</span><h2 id="cm-t">'+esc(carName(v))+'</h2>'+
 (v.opis?'<p class="cm-desc">'+esc(v.opis)+'</p>':'')+
 '<div class="cm-price">'+(hasPrice(v)?'<span class="price num">'+esc(v.cijena)+' €<small> / dan</small></span>':'<span class="price ask">Cijena na upit</span>')+(v.dostupno?'<span class="ok-dot">Dostupno</span>':'<span class="no-dot">Trenutno zauzeto</span>')+'</div>'+
 '<div class="cm-acts">'+(v.dostupno?'<button class="btn btn-red" data-pick="'+esc(v.id)+'">Rezerviraj</button>':'')+'<a class="btn btn-wa" href="'+esc(waHref(ask))+'" target="_blank" rel="noopener">'+I.wa+'Pitaj na WhatsApp</a>'+(v.dostupno&&v.kategorija!=="Prikolica"?'<button class="btn btn-ghost" data-pick="'+esc(v.id)+'" data-tipset="dugo">Dugoročni najam</button>':'')+'</div>'+
 '</div></div>'+
 '<div class="cm-specs"><h3>Specifikacije</h3><dl>'+specRows(v).map(function(r){return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>';}).join("")+'</dl>'+
 '<p class="hint">Mjere i volumen su okvirne tvorničke vrijednosti za ovaj model. Točnu izvedbu, motor i opremu potvrđujemo u ponudi.'+(v.foto||v.ilustrativna?' Fotografija je ilustrativna.':'')+'</p></div>'+
 '</div></div>';
}
function ribbon(p){
 var s=p.slogani||[];if(!s.length)return "";
 var one=s.map(function(x){return '<span>'+esc(x)+'</span>';}).join('<i aria-hidden="true">✦</i>')+'<i aria-hidden="true">✦</i>';
 return '<div class="ribbon-w"><div class="ribbon" role="note" aria-label="'+esc(s.join(", "))+'"><div class="track" aria-hidden="true">'+one+one+one+'</div></div></div>';
}
function gallery(){
 var g=state.postavke.galerija||[];if(!g.length)return "";
 return '<section class="sec" id="galerija" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Galerija</span><h2>M&amp;I u slikama</h2></div><p>Fotografije s naše Facebook stranice.</p></div>'+
 '<div class="gal">'+g.map(function(x,i){return '<button class="gi" data-gal="'+i+'" aria-label="Povećaj: '+esc(x.opis)+'"><img src="'+esc(x.src)+'" alt="'+esc(x.opis)+'"></button>';}).join("")+'</div></div></section>'+
 (ui.lb!=null&&g[ui.lb]?'<div class="lb" data-act="lb-close" role="dialog" aria-modal="true" aria-label="'+esc(g[ui.lb].opis)+'"><img src="'+esc(g[ui.lb].src)+'" alt="'+esc(g[ui.lb].opis)+'"><button class="lb-x btn btn-sm btn-ghost-n" data-act="lb-close">Zatvori</button>'+
  (g.length>1?'<button class="lb-p btn btn-sm btn-ghost-n" data-act="lb-prev" aria-label="Prethodna">‹</button><button class="lb-n btn btn-sm btn-ghost-n" data-act="lb-next" aria-label="Sljedeća">›</button>':'')+'</div>':'');
}
function services(p){
 var u=p.usluge||{};var wa=digits(u.whatsapp);if(!wa)return "";
 function href(t){return "https://wa.me/"+wa+"?text="+encodeURIComponent(t);}
 var tel="tel:+"+wa;
 return '<section class="sec" id="usluge" style="padding-top:0"><div class="wrap"><div class="svc">'+
 '<div class="svc-head"><span class="kicker">Usluge s vozačem</span><h2>Selidbe i prijevoz do zračne luke</h2>'+
 '<p>Ne želite voziti sami? Odvezemo vas ili vaše stvari našim vozilima. Za ove usluge javite se na poseban broj.</p>'+
 '<div class="svc-num"><span>Selidbe i transferi</span><b class="num" style="user-select:all">'+esc(u.telefon||("+"+wa))+'</b></div></div>'+
 '<div class="svc-cards">'+
 '<div class="svc-card"><span class="ic">'+draw("Teretni kombi")+'</span><b>Selidbe</b><p>Prijevoz namještaja, kućanskih aparata i stvari teretnim kombijem.</p>'+
 '<div class="acts"><a class="btn btn-wa btn-sm" href="'+esc(href("Pozdrav, zanima me selidba. Datum: , od: , do: "))+'" target="_blank" rel="noopener">'+I.wa+'Upit za selidbu</a><a class="btn btn-ghost btn-sm" href="'+esc(tel)+'">Nazovi</a></div></div>'+
 '<div class="svc-card"><span class="ic">'+draw("Putnički kombi")+'</span><b>Prijevoz do zračne luke</b><p>Odvoz i doček u zračnoj luci osobnim automobilom ili kombijem do 8 putnika.</p>'+
 '<div class="acts"><a class="btn btn-wa btn-sm" href="'+esc(href("Pozdrav, zanima me prijevoz do zračne luke. Datum i vrijeme: , broj putnika: , polazište: "))+'" target="_blank" rel="noopener">'+I.wa+'Upit za prijevoz</a><a class="btn btn-ghost btn-sm" href="'+esc(tel)+'">Nazovi</a></div></div>'+
 '</div></div></div></section>';
}
function why(p){
 return '<section class="sec" id="zasto" style="padding-top:0"><div class="wrap why">'+
 '<div class="panel-n"><span class="kicker">Zašto M&amp;I</span><h2>Pouzdano, povoljno, sigurno</h2><p class="slogan">'+esc(p.slogan)+'</p>'+
 '<ul class="points">'+(p.godine?'<li><b>Preko '+esc(p.godine)+' godina s vama</b><span>Iskustvo i povjerenje stečeni u '+esc(p.gradU||p.grad)+' i okolici.</span></li>':'')+(p.brojVozila?'<li><b>Širok izbor od preko '+esc(p.brojVozila)+' vozila</b><span>Vozila za svaku priliku: osobna, putnička i teretna.</span></li>':'')+'<li><b>Redovito održavana vozila</b><span>Registracija i servis su na nama, vi samo vozite.</span></li><li><b>Bez skrivenih troškova</b><span>Cijenu znate unaprijed, prije preuzimanja vozila.</span></li><li><b>Jednostavno preuzimanje</b><span>Dogovor na WhatsAppu, preuzimanje u Kutini ili dostava po dogovoru.</span></li><li><b>Fleksibilni paketi</b><span>Prilagođeni privatnim i poslovnim korisnicima, povoljnije za duži najam.</span></li></ul></div>'+
 '<div class="score"><span class="kicker">Recenzije na Googleu</span><div class="big num">'+esc(p.ocjena||"–")+'<small> / 5</small></div>'+stars()+
 '<p>Prosječna ocjena'+(p.brojRecenzija?' iz '+esc(p.brojRecenzija)+' recenzija':'')+' korisnika na Googleu.</p>'+
 '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:auto"><a class="btn btn-ghost" href="https://www.google.com/search?q='+encodeURIComponent(p.naziv+" "+p.grad)+'" target="_blank" rel="noopener">Pročitaj recenzije</a>'+
 (p.instagram?'<a class="btn btn-ghost" href="https://www.instagram.com/'+esc(p.instagram)+'/" target="_blank" rel="noopener">Instagram</a>':'')+'</div></div>'+
 '</div></section>';
}
function contact(p){
 var maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.naziv+", "+p.adresa);
 return '<section class="sec" id="kontakt" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Kontakt</span><h2>Javite nam se</h2></div></div><div class="contact">'+
 '<div class="cbox wa"><span class="lbl">WhatsApp i mobitel</span><span class="v sel num">'+esc(p.telefon)+'</span><div class="acts"><a class="btn btn-sm" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener">'+I.wa+'Otvori chat</a></div></div>'+
 '<div class="cbox"><span class="lbl">Adresa</span><span class="v">'+esc(p.adresa)+'</span><div class="acts"><a class="btn btn-sm btn-ghost" href="'+esc(maps)+'" target="_blank" rel="noopener">Upute na karti</a></div></div>'+
 '<div class="cbox"><span class="lbl">Radno vrijeme</span><span class="v">'+esc(p.radnoVrijeme||"Po dogovoru, javite se porukom")+'</span></div>'+
 '<div class="cbox"><span class="lbl">'+(p.email?"E-mail":"Društvene mreže")+'</span><span class="v sel">'+esc(p.email||(p.instagram?"@"+p.instagram:""))+'</span>'+
 (p.instagram&&!p.email?'<div class="acts"><a class="btn btn-sm btn-ghost" href="https://www.instagram.com/'+esc(p.instagram)+'/" target="_blank" rel="noopener">Otvori Instagram</a></div>':'')+'</div>'+
 '</div></div></section>';
}
function credits(){
 var seen={},out=[];
 state.vozila.forEach(function(v){if(!v.foto||!v.slika)return;var k=v.foto.izvor;if(seen[k])return;seen[k]=1;
  out.push('<a href="'+esc(v.foto.izvor)+'" target="_blank" rel="noopener">'+esc(carName(v))+'</a>: '+esc(v.foto.autor)+', '+esc(v.foto.licenca));});
 if(!out.length)return '';
 return '<details class="credits"><summary>Izvori fotografija (Wikimedia Commons)</summary><p>'+out.join(' · ')+'</p></details>';
}
function footer(p){
 return '<footer class="foot-note"><div class="wrap"><span>© '+new Date().getFullYear()+' '+esc(p.naziv)+' · '+esc(p.adresa)+'</span>'+(canEdit?'<button class="linkbtn" data-act="open-panel">Uredi stranicu</button>':'')+'</div><div class="wrap">'+credits()+'</div></footer>';
}

/* ---------- admin panel ---------- */
function blankCar(){return {id:"",marka:"",model:"",kategorija:"Osobni automobil",godina:"",mjenjac:"Manualni",gorivo:"Dizel",sjedala:5,nosivost:"",klima:true,cijena:null,kolicina:"",opis:"",slika:"",dostupno:true};}
var edit=blankCar();
function aField(id,label,html,cls){return '<div class="f'+(cls?" "+cls:"")+'"><label for="'+id+'">'+label+'</label>'+html+'</div>';}
function sel(id,arr,val){return '<select id="'+id+'">'+arr.map(function(a){return opt(a,a||"—",a===val);}).join("")+'</select>';}
function panel(){
 var p=state.postavke, body;
 if(ui.tab==="vozila"){
  body='<div class="alist">'+(state.vozila.length?state.vozila.map(function(v){
   return '<div class="arow"><div class="th">'+pic(v)+'</div><div class="t"><b>'+esc(carName(v))+(v.primjer?' · primjer':'')+'</b><span class="num">'+esc(v.kategorija)+' · '+(hasPrice(v)?esc(v.cijena)+' €/dan':'cijena na upit')+' · '+(v.dostupno?"dostupno":"zauzeto")+'</span></div>'+
   '<div class="acts"><button class="btn btn-sm btn-ghost" data-toggle="'+esc(v.id)+'">'+(v.dostupno?"Označi zauzeto":"Označi dostupno")+'</button><button class="btn btn-sm btn-ghost" data-edit="'+esc(v.id)+'">Uredi</button>'+
   '<button class="btn btn-sm btn-danger" data-del="'+esc(v.id)+'">'+(ui.delArm===v.id?"Potvrdi brisanje":"Obriši")+'</button></div></div>';
  }).join(""):'<div class="empty">Još nema vozila. Dodajte prvo ispod.</div>')+'</div>'+
  '<form class="aform" id="af"><h3>'+(ui.editId?"Uredi vozilo":"Dodaj novo vozilo")+'</h3><div class="fgrid">'+
  aField("a-marka","Marka ili naziv",'<input id="a-marka" value="'+esc(edit.marka)+'" placeholder="npr. Renault">')+
  aField("a-model","Model",'<input id="a-model" value="'+esc(edit.model)+'" placeholder="npr. Trafic">')+
  '</div><div class="fgrid3" style="margin-top:12px">'+
  aField("a-kat","Vrsta",sel("a-kat",KATEGORIJE,edit.kategorija))+
  aField("a-mj","Mjenjač",sel("a-mj",MJENJAC,edit.mjenjac))+
  aField("a-go","Gorivo",sel("a-go",GORIVO,edit.gorivo))+
  aField("a-god","Godište",'<input id="a-god" type="number" min="1970" max="2100" value="'+esc(edit.godina)+'" placeholder="2022">')+
  aField("a-sj","Broj mjesta",'<input id="a-sj" type="number" min="0" max="20" value="'+esc(edit.sjedala)+'">')+
  aField("a-cij","Cijena €/dan",'<input id="a-cij" type="number" min="0" step="1" value="'+esc(edit.cijena==null?"":edit.cijena)+'" placeholder="prazno = na upit">')+
  '</div><div class="fgrid" style="margin-top:12px">'+
  aField("a-nos","Nosivost / dimenzije",'<input id="a-nos" value="'+esc(edit.nosivost)+'" placeholder="npr. 1.200 kg">')+
  aField("a-kol","Broj vozila (npr. 2 vozila)",'<input id="a-kol" value="'+esc(edit.kolicina||"")+'" placeholder="prazno = jedno vozilo">')+
  aField("a-opis","Kratki opis",'<input id="a-opis" value="'+esc(edit.opis)+'" placeholder="Za selidbe i prijevoz robe">')+
  aField("a-spec","Specifikacije (jedna po retku, Naziv: vrijednost)",'<textarea id="a-spec" placeholder="Prtljažnik: 640 L&#10;Duljina: 4,69 m">'+esc((edit.specifikacije||[]).map(function(r){return r[0]+": "+r[1];}).join("\n"))+'</textarea>',"full")+
  '</div><div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:14px"><label class="check"><input type="checkbox" id="a-kl"'+(edit.klima?" checked":"")+'>Klima uređaj</label><label class="check"><input type="checkbox" id="a-dos"'+(edit.dostupno?" checked":"")+'>Dostupno za najam</label></div>'+
  '<div class="f full" style="margin-top:14px"><label for="a-img">Fotografija</label><div class="imgdrop"><div class="prev">'+(ui.img?'<img src="'+esc(ui.img)+'" alt="">':draw(edit.kategorija))+'</div><input id="a-img" type="file" accept="image/*">'+(ui.img?'<button type="button" class="btn btn-sm btn-ghost" data-act="rm-img">Ukloni sliku</button>':'')+'</div><p class="hint">Bez fotografije prikazuje se crtež prema vrsti vozila. Slika se automatski smanjuje.</p></div>'+
  '<div class="row-actions"><button class="btn btn-red" type="submit">'+(ui.editId?"Spremi vozilo":"Dodaj vozilo")+'</button>'+(ui.editId?'<button type="button" class="btn btn-ghost" data-act="cancel-edit">Odustani</button>':'')+'</div></form>';
 } else {
  body='<form class="aform" id="sf"><div class="fgrid">'+
  aField("s-naziv","Naziv",'<input id="s-naziv" value="'+esc(p.naziv)+'">')+
  aField("s-grad","Grad",'<input id="s-grad" value="'+esc(p.grad)+'">')+
  aField("s-gradu","Grad u rečenici (u …)",'<input id="s-gradu" value="'+esc(p.gradU)+'" placeholder="Kutini">',"full")+
  aField("s-wa","WhatsApp broj (za upite)",'<input id="s-wa" type="tel" value="'+esc(p.whatsapp)+'" placeholder="38598222955">')+
  aField("s-tel","Broj za prikaz",'<input id="s-tel" value="'+esc(p.telefon)+'">')+
  aField("s-ustel","Broj za selidbe i transfere",'<input id="s-ustel" value="'+esc((p.usluge||{}).telefon||"")+'" placeholder="prazno = sekcija se ne prikazuje">')+
  aField("s-adr","Adresa",'<input id="s-adr" value="'+esc(p.adresa)+'">',"full")+
  aField("s-rv","Radno vrijeme",'<input id="s-rv" value="'+esc(p.radnoVrijeme)+'" placeholder="Pon–Pet 8–17, Sub 8–13">')+
  aField("s-mail","E-mail",'<input id="s-mail" type="email" value="'+esc(p.email)+'">')+
  aField("s-od","Najam već od (€/dan)",'<input id="s-od" value="'+esc(p.cijenaOd)+'" placeholder="25">')+
  aField("s-bv","Broj vozila (preko …)",'<input id="s-bv" value="'+esc(p.brojVozila)+'" placeholder="30">')+
  aField("s-god","Godina s vama (preko …)",'<input id="s-god" value="'+esc(p.godine)+'" placeholder="15">')+
  aField("s-ocj","Ocjena na Googleu",'<input id="s-ocj" value="'+esc(p.ocjena)+'" placeholder="4,8">')+
  aField("s-brr","Broj recenzija",'<input id="s-brr" type="number" min="0" value="'+esc(p.brojRecenzija)+'">')+
  aField("s-ig","Instagram korisničko ime",'<input id="s-ig" value="'+esc(p.instagram)+'">',"full")+
  aField("s-slog","Slogan",'<textarea id="s-slog">'+esc(p.slogan)+'</textarea>',"full")+
  aField("s-lok","Mjesta preuzimanja (jedno po retku)",'<textarea id="s-lok">'+esc((p.lokacije||[]).join("\n"))+'</textarea>',"full")+
  '</div><p class="hint">WhatsApp broj upišite s pozivnim brojem države, bez + i bez nule: 098 222 955 postaje 38598222955.</p>'+
  '<div class="row-actions"><button class="btn btn-red" type="submit">Primijeni</button></div></form>';
 }
 return '<div class="overlay" data-act="overlay"><div class="apanel" role="dialog" aria-modal="true" aria-label="Uređivanje stranice">'+
 '<div class="apanel-head"><h2>Uređivanje</h2><button class="btn btn-sm btn-ghost" data-act="close-panel">Zatvori</button></div>'+
 '<div class="tabs" role="tablist"><button role="tab" data-tab="vozila" aria-selected="'+(ui.tab==="vozila")+'">Vozila ('+state.vozila.length+')</button><button role="tab" data-tab="postavke" aria-selected="'+(ui.tab==="postavke")+'">Kontakt i podaci</button></div>'+
 body+
 '<div class="aform" style="margin-top:20px"><h3>Spremanje</h3><p class="hint" style="margin-top:0">Promjene vidite odmah u ovom pregledniku. Da ih vide kupci, preuzmite <b>site.js</b>, zamijenite njime datoteku <b>data/site.js</b> u repozitoriju i napravite commit i push.</p><div class="row-actions"><button class="btn btn-red" data-act="publish"'+(dirty?"":" disabled")+'>'+(dirty?"Preuzmi site.js":"Nema promjena")+'</button>'+(dirty?'<button class="btn btn-ghost" data-act="discard">Odbaci promjene</button>':'')+'</div>'+
 (ui.status?'<p class="status '+ui.statusKind+'" aria-live="polite">'+esc(ui.status)+'</p>':'')+'</div></div></div>';
}
function markDirty(msg){dirty=true;ui.status=msg||"";ui.statusKind="ok";}

/* ---------- events ---------- */
app.addEventListener("input",function(e){
 var t=e.target; if(!t.id)return;
 if(t.id.indexOf("zf-")===0||t.id.indexOf("pf-")===0){
  var o=t.id.charAt(0)==="z"?zf:pf, er=t.id.charAt(0)==="z"?zErr:pErr, k2=t.id.slice(3); o[k2]=t.value;
  var sa=document.getElementById(t.id.slice(0,3)+"send"); if(sa)sa.href=waHref(o===zf?zMsg():pMsg());
  if(er[k2]){delete er[k2];render();}
  return;
 }
 if(t.id.indexOf("bk-")!==0)return;
 var k=t.id.slice(3); form[k]=t.value;
 if(errors[k]){validate();render();return;}
 var s=document.getElementById("bk-sum"); if(s)s.innerHTML=summary(chosenCar(),days());
 var a=document.getElementById("bk-send"); if(a)a.href=waHref();
});
app.addEventListener("change",function(e){
 var t=e.target;
 if(t.id==="bk-vozilo"||t.id==="bk-lok"||t.id==="bk-mj"||t.id==="bk-d1"||t.id==="bk-d2"){form[t.id.slice(3)]=t.value;if(form.d2&&form.d1&&form.d2<form.d1)form.d2=form.d1;render();}
 if(t.id==="a-kat"){readEdit();render();}
 if(t.id==="a-img"&&t.files&&t.files[0]){readEdit();shrink(t.files[0]);}
});
app.addEventListener("submit",function(e){e.preventDefault();if(e.target.id==="af")saveCar();if(e.target.id==="sf")saveSettings();});
app.addEventListener("click",function(e){
 var t=e.target.closest("[data-slide],[data-gal],[data-act],[data-pick],[data-filter],[data-type],[data-edit],[data-del],[data-toggle],[data-tab],[data-tip],[data-tipgo],[data-car],[data-cnav],#bk-send,#zf-send,#pf-send");
 if(!t)return;
 if(t.id==="zf-send"||t.id==="pf-send"){
  var isZ=t.id==="zf-send", o=isZ?zf:pf, er={};
  if(!isZ&&o.tvrtka.trim().length<2)er.tvrtka="Upišite naziv tvrtke ili obrta.";
  if(o.ime.trim().length<2)er.ime="Upišite ime i prezime.";
  if(digits(o.tel).length<6)er.tel="Upišite broj na koji vas možemo kontaktirati.";
  if(isZ)zErr=er;else pErr=er;
  if(Object.keys(er).length){e.preventDefault();render();var bf=document.querySelector("#"+(isZ?"zf":"pf")+" .f.bad input");if(bf)bf.focus();return;}
  t.href=waHref(isZ?zMsg():pMsg());return;
 }
 if(t.dataset.car){openCar(t.dataset.car);return;}
 if(t.dataset.cnav){var ids=state.vozila.map(function(v){return v.id;}),ix=ids.indexOf(ui.car);openCar(ids[(ix+(+t.dataset.cnav)+ids.length)%ids.length]);return;}
 if(t.dataset.tip){form.tip=t.dataset.tip;errors={};render();return;}
 if(t.dataset.tipgo){form.tip=t.dataset.tipgo;errors={};render();document.getElementById("rezervacija").scrollIntoView({block:"start"});var fi=document.getElementById("bk-ime");if(fi)fi.focus({preventScroll:true});return;}
 if(t.id==="bk-send"){
  if(!validate()){e.preventDefault();ui.sent=false;render();var f=document.querySelector(".f.bad input,.f.bad select");if(f)f.focus();return;}
  t.href=waHref(); setTimeout(function(){ui.sent=true;render();},50); return;
 }
 if(t.dataset.slide){var sl=t.parentNode.querySelector(".slides");if(sl)sl.scrollBy({left:(+t.dataset.slide)*sl.clientWidth,behavior:"smooth"});return;}
 if(t.dataset.gal!=null){ui.lb=+t.dataset.gal;render();return;}
 if(t.dataset.pick){form.vozilo=t.dataset.pick;if(t.dataset.tipset)form.tip=t.dataset.tipset;closeCar(true);render();document.getElementById("rezervacija").scrollIntoView({block:"start"});var s=document.getElementById("bk-ime");if(s)s.focus({preventScroll:true});return;}
 if(t.dataset.type){filter=t.dataset.type;render();document.getElementById("vozila").scrollIntoView({block:"start"});return;}
 if(t.dataset.filter){filter=t.dataset.filter;render();return;}
 if(t.dataset.tab){ui.tab=t.dataset.tab;ui.status="";render();return;}
 if(t.dataset.edit){var v=byId(t.dataset.edit);edit=clone(v);ui.editId=v.id;ui.img=v.slika||"";render();var f2=document.getElementById("af");if(f2)f2.scrollIntoView({block:"start"});return;}
 if(t.dataset.toggle){var v2=byId(t.dataset.toggle);v2.dostupno=!v2.dostupno;markDirty();render();return;}
 if(t.dataset.del){
  var id=t.dataset.del;
  if(ui.delArm!==id){ui.delArm=id;render();setTimeout(function(){if(ui.delArm===id){ui.delArm=null;render();}},4000);return;}
  state.vozila=state.vozila.filter(function(v){return v.id!==id;});ui.delArm=null;if(form.vozilo===id)form.vozilo="";if(ui.editId===id){ui.editId=null;edit=blankCar();ui.img="";}
  markDirty("Vozilo obrisano.");render();return;
 }
 var a=t.dataset.act;
 if(a==="cm-close"){if(e.target===t||t.tagName==="BUTTON")closeCar();return;}
 if(a==="overlay"){if(e.target===t){ui.panel=false;render();}return;}
 if(a==="open-panel"){ui.panel=true;render();return;}
 if(a==="close-panel"){ui.panel=false;render();return;}
 if(a==="new-car"){ui.panel=true;ui.tab="vozila";render();return;}
 if(a==="cancel-edit"){ui.editId=null;edit=blankCar();ui.img="";render();return;}
 if(a==="rm-img"){readEdit();ui.img="";render();return;}
 if(a==="discard"){state=clone(saved);dirty=false;ui.status="Promjene odbačene.";ui.statusKind="ok";ui.editId=null;edit=blankCar();ui.img="";render();return;}
 if(a==="publish"){publish();return;}
 if(a==="lb-close"){if(e.target===t||t.tagName==="BUTTON"){ui.lb=null;render();}return;}
 if(a==="lb-prev"||a==="lb-next"){var n=(state.postavke.galerija||[]).length;ui.lb=(ui.lb+(a==="lb-next"?1:n-1))%n;render();return;}
});
document.addEventListener("keydown",function(e){if(ui.car){if(e.key==="Escape"){closeCar();return;}if(e.key==="ArrowRight"||e.key==="ArrowLeft"){var ids=state.vozila.map(function(v){return v.id;}),ix=ids.indexOf(ui.car);openCar(ids[(ix+(e.key==="ArrowRight"?1:-1)+ids.length)%ids.length]);return;}}if(e.key==="Escape"&&ui.lb!=null){ui.lb=null;render();return;}if(ui.lb!=null&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){var n=(state.postavke.galerija||[]).length;ui.lb=(ui.lb+(e.key==="ArrowRight"?1:n-1))%n;render();return;}if(e.key==="Escape"&&ui.panel){ui.panel=false;render();}});

function val(id){var el=document.getElementById(id);return el?el.value:"";}
function readEdit(){
 if(!document.getElementById("a-marka"))return;
 edit.marka=val("a-marka").trim();edit.model=val("a-model").trim();edit.kategorija=val("a-kat");edit.mjenjac=val("a-mj");edit.gorivo=val("a-go");
 edit.godina=parseInt(val("a-god"),10)||"";edit.sjedala=Math.max(0,parseInt(val("a-sj"),10)||0);
 var c=parseFloat(val("a-cij"));edit.cijena=c>0?c:null;
 edit.specifikacije=val("a-spec").split("\n").map(function(l){var i=l.indexOf(":");return i>0?[l.slice(0,i).trim(),l.slice(i+1).trim()]:null;}).filter(function(r){return r&&r[0]&&r[1];});
 edit.nosivost=val("a-nos").trim();edit.kolicina=val("a-kol").trim();edit.opis=val("a-opis").trim();
 edit.klima=document.getElementById("a-kl").checked;edit.dostupno=document.getElementById("a-dos").checked;
}
function saveCar(){
 readEdit();
 if(!edit.marka){ui.status="Upišite marku ili naziv vozila.";ui.statusKind="bad";render();return;}
 if((ui.img||"")!==(edit.slika||"")){delete edit.foto;delete edit.slika2;delete edit.ilustrativna;}
 edit.slika=ui.img||"";delete edit.primjer;
 if(ui.editId){var i=state.vozila.findIndex(function(v){return v.id===ui.editId;});state.vozila[i]=clone(edit);markDirty(carName(edit)+" je spremljen.");}
 else{edit.id="v"+Date.now().toString(36);state.vozila.push(clone(edit));markDirty(carName(edit)+" je dodan.");}
 ui.editId=null;edit=blankCar();ui.img="";render();
}
function saveSettings(){
 var p=state.postavke, wa=digits(val("s-wa"));
 if(wa.indexOf("00")===0)wa=wa.slice(2);
 if(wa.length<8){ui.status="WhatsApp broj nije ispravan. Upišite ga s pozivnim brojem, npr. 38598222955.";ui.statusKind="bad";render();return;}
 p.naziv=val("s-naziv").trim()||p.naziv;p.grad=val("s-grad").trim()||p.grad;p.gradU=val("s-gradu").trim();
 p.whatsapp=wa;p.telefon=val("s-tel").trim()||("+"+wa);
 var us=val("s-ustel").trim(),uw=digits(us);if(uw.indexOf("00")===0)uw=uw.slice(2);if(uw.charAt(0)==="0")uw="385"+uw.slice(1);p.usluge={telefon:us,whatsapp:us?uw:""};p.adresa=val("s-adr").trim();p.radnoVrijeme=val("s-rv").trim();p.email=val("s-mail").trim();
 p.cijenaOd=val("s-od").trim();p.brojVozila=val("s-bv").trim();p.godine=val("s-god").trim();
 p.ocjena=val("s-ocj").trim();p.brojRecenzija=parseInt(val("s-brr"),10)||0;p.instagram=val("s-ig").trim().replace(/^@/,"");p.slogan=val("s-slog").trim();
 p.lokacije=val("s-lok").split("\n").map(function(s){return s.trim();}).filter(Boolean);
 if(p.lokacije.indexOf(form.lok)<0)form.lok=p.lokacije[0]||"";
 markDirty("Podaci primijenjeni.");render();
}
function shrink(file){
 var r=new FileReader();
 r.onload=function(){var img=new Image();img.onload=function(){
  var s=Math.min(1,960/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);ui.img=c.toDataURL("image/jpeg",0.74);render();
 };img.onerror=function(){ui.status="Ovu sliku nije moguće učitati. Pokušajte s JPG ili PNG datotekom.";ui.statusKind="bad";render();};img.src=r.result;};
 r.readAsDataURL(file);
}

/* ---------- spremanje (preuzimanje site.js) ---------- */
function publish(){
 var txt="/* Podaci stranice M&I rent a car. Uređuje se na stranici preko #uredi ili ručno. */\nwindow.SITE_DATA = "+JSON.stringify(state,null,2)+";\n";
 try{
  var blob=new Blob([txt],{type:"text/javascript"}), a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="site.js"; document.body.appendChild(a); a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
  saved=clone(state);dirty=false;ui.status="site.js je preuzet. Zamijenite njime data/site.js u repozitoriju pa commit i push.";ui.statusKind="ok";
 }catch(e){ui.status="Preuzimanje nije uspjelo u ovom pregledniku.";ui.statusKind="bad";}
 render();
}

render();

function checkEdit(){var on=location.hash==="#uredi";if(on!==canEdit){canEdit=on;render();}
 var m=location.hash.match(/^#vozilo-(.+)$/);if(m&&byId(m[1])&&ui.car!==m[1]){ui.car=m[1];render();}else if(!m&&ui.car){ui.car=null;render();}}
window.addEventListener("hashchange",checkEdit);checkEdit();
})();
