const LABELS={prec_abr_may:"Lluvia abr–may",prec_cv:"Variabilidad de la lluvia",lon:"Longitud",lat:"Latitud",amplitud_termica:"Amplitud térmica",pendiente_media:"Pendiente media",pl_msavi_abr_may:"MSAVI abr–may (Planet)",log_area:"Área (log)",s2_msi_max:"Estrés hídrico MSI máx (S2)",tmin_min_mes:"Tmín mensual más baja",pl_evi_abr_may:"EVI abr–may (Planet)",tmin_media:"Tmín media",s2_ndti_jun_jul:"NDTI jun–jul (S2)",pl_lai_oct:"LAI octubre (Planet)",s2_lai_ago_sep:"LAI ago–sep (S2)",prec_total_ciclo:"Lluvia total del ciclo",elevacion_media:"Elevación media",pl_ndvi_max:"NDVI máximo (Planet)",gdd_ciclo:"Grados‑día del ciclo"};
const UNITS={prec_abr_may:"mm",prec_total_ciclo:"mm",amplitud_termica:"°C",tmin_min_mes:"°C",pendiente_media:"°",elevacion_media:"m",gdd_ciclo:"°C·d"};
const FICHA_VARS=["prec_abr_may","prec_cv","amplitud_termica","pendiente_media","pl_msavi_abr_may","tmin_min_mes","pl_ndvi_max","elevacion_media"];
const NS="http://www.w3.org/2000/svg";
const $=s=>document.querySelector(s);
const fmt=(v,d=2)=>v==null?"–":Number(v).toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d});
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const P=DATA.pred, T=DATA.train;
P.forEach(p=>{p.nearAvg=sum(p.near,n=>n.real)/p.near.length;p.niv=p.y>=4.3?"hi":p.y>=3.5?"mid":"lo"});
P.slice().sort((a,b)=>b.y-a.y).forEach((p,i)=>p.rank=i+1);
const NIV={hi:"Alto",mid:"Medio",lo:"Bajo"};
const Q=["--q1","--q2","--q3","--q4","--q5","--q6"];
const yMin=Math.min(...P.map(p=>p.y)), yMax=Math.max(...P.map(p=>p.y));
const qcol=y=>`var(${Q[Math.min(5,Math.floor((y-yMin)/(yMax-yMin+1e-9)*6))]})`;
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
const tip=$("#tip");
function showTip(ev,html){tip.innerHTML=html;tip.hidden=false;const w=tip.offsetWidth,h=tip.offsetHeight;let x=ev.clientX+14,y=ev.clientY+14;if(x+w>innerWidth-8)x=ev.clientX-w-14;if(y+h>innerHeight-8)y=ev.clientY-h-14;tip.style.left=x+"px";tip.style.top=y+"px"}
function hideTip(){tip.hidden=true}
const TOT={prod:sum(P,p=>p.prod),area:sum(P,p=>p.area)};TOT.yw=TOT.prod/TOT.area;TOT.r2=DATA.ens.r2;

const track=$("#track"), slides=[...document.querySelectorAll(".slide")], N=slides.length;
let cur=0, timer=null;
slides.forEach((s,i)=>{
  s.setAttribute("aria-label",`${i+1} de ${N}: ${s.dataset.title}`);
  const t=document.createElement("button");t.className="tab";t.textContent=s.dataset.title;t.onclick=()=>go(i,true);$("#tabs").appendChild(t);
  const d=document.createElement("button");d.className="dot";d.setAttribute("aria-label",`Ir a ${s.dataset.title}`);d.onclick=()=>go(i,true);$("#dots").appendChild(d);
});
function go(i,user){
  i=((i%N)+N)%N;
  if(user)stopPlay();
  cur=i;track.style.transform=`translateX(${-100*i}%)`;
  slides.forEach((s,k)=>{s.classList.toggle("is-active",k===i);s.setAttribute("aria-hidden",k!==i);s.inert=k!==i});
  document.querySelectorAll(".tab").forEach((t,k)=>t.setAttribute("aria-current",k===i));
  document.querySelectorAll(".dot").forEach((t,k)=>t.setAttribute("aria-current",k===i));
  $("#counter").textContent=`${String(i+1).padStart(2,"0")} / ${String(N).padStart(2,"0")}`;
    $("#prog").style.width=`${(i+1)/N*100}%`;
  const tab=document.querySelectorAll(".tab")[i];if(tab)tab.scrollIntoView({block:"nearest",inline:"center"});
  slides[i].scrollTop=0;
  if(i===1)countUp();
  hideTip();
  try{history.replaceState(null,"",`#d${i+1}`)}catch(e){}
}
$("#prev").onclick=()=>go(cur-1,true);
$("#next").onclick=()=>go(cur+1,true);
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(+b.dataset.go,true));
document.addEventListener("keydown",e=>{
  if(e.target.matches("input,textarea,select"))return;
  if(e.key==="ArrowRight"||e.key==="PageDown"){e.preventDefault();go(cur+1,true)}
  else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();go(cur-1,true)}
  else if(e.key==="Home"){go(0,true)}else if(e.key==="End"){go(N-1,true)}
});
let sx=null,sy=null;
$("#viewport").addEventListener("touchstart",e=>{if(e.target.closest(".tbl-wrap"))return sx=null;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
$("#viewport").addEventListener("touchend",e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4)go(cur+(dx<0?1:-1),true);sx=null},{passive:true});
function setPlayIcon(on){$("#play-ic").innerHTML=on?'<path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor"/>':'<path d="M3 1.5v9l7-4.5z" fill="currentColor"/>';$("#play").setAttribute("aria-pressed",on);$("#play span").textContent=on?"Pausar":"Presentar"}
function stopPlay(){if(timer){clearInterval(timer);timer=null;setPlayIcon(false)}}
$("#play").onclick=()=>{if(timer){stopPlay();return}setPlayIcon(true);timer=setInterval(()=>go(cur+1),7000)};

function proj(list,W,H,pad){
  let lo0=Math.min(...list.map(p=>p.lon)),lo1=Math.max(...list.map(p=>p.lon)),la0=Math.min(...list.map(p=>p.lat)),la1=Math.max(...list.map(p=>p.lat));
  const padD=Math.max(lo1-lo0,la1-la0,0.02)*0.06;lo0-=padD;lo1+=padD;la0-=padD;la1+=padD;
  const k=Math.cos((la0+la1)/2*Math.PI/180);
  const s=Math.min((W-2*pad)/((lo1-lo0)*k||1),(H-2*pad)/((la1-la0)||1));
  const ox=(W-(lo1-lo0)*k*s)/2, oy=(H-(la1-la0)*s)/2;
  return {X:lon=>ox+(lon-lo0)*k*s,Y:lat=>H-oy-(lat-la0)*s,s,k,lo0,lo1,la0,la1};
}
function constel(){
  const svg=$("#constel"),W=560,H=480;
  const all=T.concat(P),{X,Y,s,k}=proj(all,W,H,40);
  const {lo0,lo1,la0,la1}=proj(all,W,H,40),gg=el("g",{},svg),stp=0.1;
  for(let v=Math.ceil(lo0/stp)*stp;v<=lo1;v+=stp){const x=X(v);if(x<44||x>W-10)continue;el("line",{x1:x,x2:x,y1:10,y2:H-34,stroke:"var(--grid)"},gg);el("text",{x:x,y:H-18,"text-anchor":"middle"},gg).textContent=v.toFixed(2)+"°"}
  for(let v=Math.ceil(la0/stp)*stp;v<=la1;v+=stp){const y=Y(v);if(y<14||y>H-40)continue;el("line",{x1:52,x2:W-10,y1:y,y2:y,stroke:"var(--grid)"},gg);el("text",{x:0,y:y+4},gg).textContent=v.toFixed(2)+"°"}
  const g=el("g",{},svg);
  const ms=[...new Set(P.map(p=>p.mun))];
  T.forEach(t=>el("circle",{cx:X(t.lon),cy:Y(t.lat),r:3.6,class:"tr-pt"},g));
  P.slice().sort((a,b)=>a.y-b.y).forEach(p=>{
    const c=el("circle",{cx:X(p.lon),cy:Y(p.lat),r:6.5,fill:qcol(p.y),class:"pt",tabindex:0,role:"button","aria-label":`${p.id}, ${fmt(p.y)} t/ha`},g);
    c.addEventListener("mousemove",e=>{c.setAttribute("r",9);showTip(e,`<b>${p.id}</b> · ${p.mun}<br>${fmt(p.y)} t/ha predichas<br>Toca para ver su ficha`)});
    c.addEventListener("mouseleave",()=>{c.setAttribute("r",6.5);hideTip()});
    const f=()=>{select(p.id);go(2,true)};c.addEventListener("click",f);c.addEventListener("keydown",e=>{if(e.key==="Enter")f()});
  });
  const placed=[];
  ms.map(m=>{const ps=all.filter(p=>p.mun===m);return {m,n:P.filter(p=>p.mun===m).length,x:Math.max(...ps.map(p=>X(p.lon))),y:sum(ps,p=>Y(p.lat))/ps.length,xmin:Math.min(...ps.map(p=>X(p.lon)))}})
    .sort((a,b)=>b.n-a.n).forEach(o=>{
      let x=o.x+12,anchor="start";
      if(x>W-150){x=o.xmin-12;anchor="end"}
      let y=o.y;while(placed.some(py=>Math.abs(py-y)<30))y+=30;placed.push(y);
      el("text",{x,y:y-2,"text-anchor":anchor,class:"munlab"},svg).textContent=o.m.replace(" de Mariano Arista","");
      el("text",{x,y:y+13,"text-anchor":anchor,class:"munsub"},svg).textContent=`${o.n} por predecir`;
    });
  const kmPx=s*k/101,km=10;
  el("line",{x1:W-20-km*kmPx,x2:W-20,y1:22,y2:22,stroke:"var(--ink-2)","stroke-width":2},svg);
  el("text",{x:W-20,y:14,"text-anchor":"end"},svg).textContent="10 km";
}
$("#h-prod").textContent=fmt(TOT.prod,1);$("#h-y").textContent=fmt(TOT.yw);$("#h-a").textContent=fmt(TOT.area,1);

const big=P.slice().sort((a,b)=>b.area-a.area)[0];
$("#k-y-sub").textContent=`ponderado por área · rango ${fmt(yMin)}–${fmt(yMax)} t/ha`;
$("#k-a-sub").textContent=`59 parcelas · la mayor es ${big.id} con ${fmt(big.area,1)} ha`;
$("#k-e-sub").textContent=`error típico ${fmt(DATA.ens.rmse)} t/ha · sin modelo sería ${fmt(DATA.ens.base)}`;
$("#k-meter").style.width=(DATA.ens.r2*100)+"%";
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function countUp(){
  document.querySelectorAll("[data-count]").forEach(n=>{
    const end=TOT[n.dataset.count],d=+n.dataset.dec;
    if(reduce){n.textContent=fmt(end,d);return}
    const t0=performance.now(),dur=1100;
    const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);n.textContent=fmt(end*e,d);if(p<1)requestAnimationFrame(step)};
    requestAnimationFrame(step);
  });
}
document.querySelectorAll("[data-count]").forEach(n=>n.textContent=fmt(TOT[n.dataset.count],+n.dataset.dec));

const st={mun:"",q:"",tr:true,sel:null,sortK:"y",sortD:-1};
const muns=[...new Set(P.map(p=>p.mun))].sort((a,b)=>P.filter(p=>p.mun===b).length-P.filter(p=>p.mun===a).length);
function chips(){
  const box=$("#mun-chips");box.innerHTML="";
  [["","Todos",P.length]].concat(muns.map(m=>[m,m,P.filter(p=>p.mun===m).length])).forEach(([v,l,n])=>{
    const b=document.createElement("button");b.className="chip-btn";b.textContent=`${l} · ${n}`;b.setAttribute("aria-pressed",st.mun===v);
    b.onclick=()=>{st.mun=v;const f=byMun();if(f.length&&!f.some(p=>p.id===st.sel))st.sel=f.slice().sort((a,b)=>b.prod-a.prod)[0].id;renderMap()};box.appendChild(b)});
}
const byMun=()=>P.filter(p=>!st.mun||p.mun===st.mun);
$("#f-tr").onchange=e=>{st.tr=e.target.checked;drawMap()};
function select(id){st.sel=id;const p=P.find(x=>x.id===id);if(st.mun&&p&&p.mun!==st.mun)st.mun="";renderMap()}
function renderMap(){chips();drawMap();ficha()}

function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const f=x/p;return (f<1.5?1:f<3.5?2:f<7.5?5:10)*p}
function drawMap(){
  const svg=$("#map");svg.innerHTML="";
  const W=720,H=500,pad=30,list=byMun();
  let ref=list.slice();if(st.tr&&st.mun)ref=ref.concat(T.filter(t=>t.mun===st.mun));
  const {X,Y,s,k,lo0,lo1,la0,la1}=proj(ref,W,H,pad);
  const g=el("g",{},svg),step=niceStep((lo1-lo0)/4);
  for(let v=Math.ceil(lo0/step)*step;v<=lo1;v+=step){const x=X(v);if(x<pad/2||x>W-pad/2)continue;el("line",{x1:x,x2:x,y1:pad/2,y2:H-pad/2,stroke:"var(--grid)"},g);el("text",{x:x,y:H-6,"text-anchor":"middle"},g).textContent=v.toFixed(2)+"°"}
  for(let v=Math.ceil(la0/step)*step;v<=la1;v+=step){const y=Y(v);if(y<pad/2||y>H-pad/2)continue;el("line",{x1:pad/2,x2:W-pad/2,y1:y,y2:y,stroke:"var(--grid)"},g);el("text",{x:4,y:y-4},g).textContent=v.toFixed(2)+"°"}
  const kmPx=s*k/101,km=niceStep((W*0.18)/kmPx);
  el("line",{x1:W-pad-km*kmPx,x2:W-pad,y1:pad,y2:pad,stroke:"var(--ink-2)","stroke-width":2},svg);
  el("text",{x:W-pad,y:pad-6,"text-anchor":"end"},svg).textContent=`${km} km`;
  if(st.tr){const gt=el("g",{},svg);T.forEach(t=>{const c=el("circle",{cx:X(t.lon),cy:Y(t.lat),r:4.5,class:"tr-pt"},gt);
    c.addEventListener("mousemove",e=>showTip(e,`<b>${t.id}</b> · entrenamiento<br>${t.mun}<br>Real <b>${fmt(t.real)}</b> t/ha · CV <b>${fmt(t.cv)}</b>`));c.addEventListener("mouseleave",hideTip)})}
  const gp=el("g",{},svg);
  list.slice().sort((a,b)=>(a.id===st.sel)-(b.id===st.sel)).forEach(p=>{
    const on=p.id===st.sel;
    if(on)el("circle",{cx:X(p.lon),cy:Y(p.lat),r:18,fill:"var(--gold)","fill-opacity":.15},gp);
    const c=el("circle",{cx:X(p.lon),cy:Y(p.lat),r:on?9:6.5,fill:qcol(p.y),class:"pt"+(on?" sel":""),tabindex:0,role:"button","aria-label":`${p.id}, ${fmt(p.y)} t/ha`},gp);
    c.addEventListener("mousemove",e=>showTip(e,`<b>${p.id}</b> · ${p.mun}<br>Predicho <b>${fmt(p.y)}</b> t/ha<br>${fmt(p.area)} ha · ${fmt(p.prod,1)} t`));
    c.addEventListener("mouseleave",hideTip);
    c.addEventListener("click",()=>select(p.id));
    c.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(p.id)}});
  });
}

const trainVals={};FICHA_VARS.forEach(v=>{trainVals[v]=T.map(t=>t.vars[v]).filter(x=>x!=null).sort((a,b)=>a-b)});
const pct=(v,arr)=>{let i=0;while(i<arr.length&&arr[i]<v)i++;return i/arr.length};
function ficha(){
  const box=$("#ficha"),p=P.find(x=>x.id===st.sel);
  if(!p){box.innerHTML=`<p class="note">Toca una parcela en el mapa para ver su ficha.</p>`;return}
  const munT=T.filter(t=>t.mun===p.mun),munAvg=munT.length?sum(munT,t=>t.real)/munT.length:null;
  const lo=2.0,hi=5.59;
  box.innerHTML=`
  <div><div class="id">${p.id} · ${p.mun}</div>
    <div class="big"><span class="v">${fmt(p.y)}</span><span class="u">t/ha</span><span class="chip ${p.niv}">${p.niv==="hi"?"▲":p.niv==="lo"?"▼":"●"} ${NIV[p.niv]}</span></div></div>
  <div class="facts">
    <div class="fact"><span class="k">Área</span><span class="v">${fmt(p.area)} ha</span></div>
    <div class="fact"><span class="k">Producción</span><span class="v">${fmt(p.prod,1)} t</span></div>
    <div class="fact"><span class="k">Lugar</span><span class="v">${p.rank} de ${P.length}</span></div>
  </div>
  <div><div class="sec-t">Frente al rango observado</div>
    <svg viewBox="0 0 300 46" style="width:100%;height:auto;display:block" aria-hidden="true">
      <rect x="0" y="18" width="300" height="8" rx="4" fill="var(--line-2)"/>
      ${munAvg!=null?`<line x1="${(munAvg-lo)/(hi-lo)*300}" x2="${(munAvg-lo)/(hi-lo)*300}" y1="11" y2="33" stroke="var(--s2)" stroke-width="2.5"/>`:""}
      <circle cx="${(p.y-lo)/(hi-lo)*300}" cy="22" r="7" fill="var(--gold)" stroke="var(--panel)" stroke-width="2"/>
      <text x="0" y="44">2.0</text><text x="300" y="44" text-anchor="end">5.59 t/ha</text>
    </svg>
    <div class="legend"><span><i class="sw" style="background:var(--gold)"></i>Esta parcela</span>${munAvg!=null?`<span><i class="sw" style="background:var(--s2)"></i>Media real en ${p.mun}: ${fmt(munAvg)}</span>`:""}</div></div>
  <div><div class="sec-t">Variables clave · percentil vs. entrenamiento</div>
    ${FICHA_VARS.map(v=>{const x=p.vars[v],q=x==null?null:pct(x,trainVals[v]),d=Math.abs(x)>=100?0:Math.abs(x)>=10?1:2;
      return `<div class="vrow"><span>${LABELS[v]}</span><span class="strip" title="Percentil ${q==null?"–":Math.round(q*100)}"><b></b>${q==null?"":`<i style="left:${(q*100).toFixed(1)}%"></i>`}</span><span class="val">${fmt(x,d)}${UNITS[v]?" "+UNITS[v]:""}</span></div>`}).join("")}</div>
  <div><div class="sec-t">Parcelas de entrenamiento más cercanas</div>
    <div class="near">${p.near.map(n=>`<div><span class="num">${n.id}</span><span class="num">${fmt(n.km,1)} km</span><span class="num">${fmt(n.real)} t/ha</span></div>`).join("")}</div></div>`;
}

function table(){
  const q=st.q.trim().toUpperCase(),k=st.sortK,d=st.sortD;
  const list=P.filter(p=>!q||p.id.toUpperCase().includes(q)||p.mun.toUpperCase().includes(q))
    .sort((a,b)=>(typeof a[k]==="string"?a[k].localeCompare(b[k]):a[k]-b[k])*d);
  $("#f-count").textContent=`${list.length} parcela${list.length===1?"":"s"}`;
  $("#tbl tbody").innerHTML=list.map(p=>`<tr data-id="${p.id}" tabindex="0">
    <td class="r rank">${p.rank}</td><td class="num">${p.id}</td><td>${p.mun}</td><td class="r num">${fmt(p.area)}</td>
    <td class="r"><div class="cellbar"><span class="bar" style="width:${(p.y/yMax*90).toFixed(0)}px;background:${qcol(p.y)}"></span><span class="num">${fmt(p.y)}</span></div></td>
    <td class="r num">${fmt(p.prod,1)}</td><td class="r num">${fmt(p.nearAvg)}</td></tr>`).join("")||`<tr><td colspan="7" class="note">Ninguna parcela coincide.</td></tr>`;
  document.querySelectorAll("#tbl tbody tr[data-id]").forEach(tr=>{const f=()=>{select(tr.dataset.id);go(2,true)};tr.onclick=f;tr.onkeydown=e=>{if(e.key==="Enter")f()}});
  document.querySelectorAll("#tbl th").forEach(th=>th.setAttribute("aria-sort",th.dataset.k===k?(d>0?"ascending":"descending"):"none"));
}
document.querySelectorAll("#tbl th").forEach(th=>th.onclick=()=>{const k=th.dataset.k;if(st.sortK===k)st.sortD*=-1;else{st.sortK=k;st.sortD=(k==="id"||k==="mun"||k==="rank")?1:-1}table()});
$("#f-q").oninput=e=>{st.q=e.target.value;table()};

function municipios(){
  const rows=muns.map(m=>{const ps=P.filter(p=>p.mun===m),ts=T.filter(t=>t.mun===m);
    return {m,n:ps.length,prod:sum(ps,p=>p.prod),area:sum(ps,p=>p.area),y:sum(ps,p=>p.prod)/sum(ps,p=>p.area),real:ts.length?sum(ts,t=>t.real)/ts.length:null,nt:ts.length}}).sort((a,b)=>b.prod-a.prod);
  const sc=v=>(v/5.5*100).toFixed(1)+"%";
  $("#mun-list").innerHTML=rows.map(r=>`<button class="mun" data-m="${r.m}">
    <span class="nm">${r.m}<small>${r.n} parcela${r.n>1?"s":""} · ${fmt(r.area,1)} ha</small></span>
    <span class="bars"><div style="width:${sc(r.y)};background:var(--s1)" title="Predicho ${fmt(r.y)} t/ha"></div>${r.real!=null?`<div style="width:${sc(r.real)};background:var(--s2)" title="Real ${fmt(r.real)} t/ha (${r.nt} parcelas)"></div>`:""}</span>
    <span class="tot">${fmt(r.prod,1)} t<small>${fmt(r.y)} t/ha</small></span></button>`).join("");
  document.querySelectorAll(".mun").forEach(b=>{
    const r=rows.find(x=>x.m===b.dataset.m);
    b.addEventListener("mousemove",e=>showTip(e,`<b>${r.m}</b><br>Predicho ${fmt(r.y)} t/ha · ${fmt(r.prod,1)} t<br>${r.real!=null?`Real histórico ${fmt(r.real)} t/ha (${r.nt})`:"Sin parcelas de entrenamiento"}`));
    b.addEventListener("mouseleave",hideTip);
    b.onclick=()=>{st.mun=r.m;st.sel=P.filter(p=>p.mun===r.m).sort((a,b)=>b.prod-a.prod)[0].id;renderMap();go(2,true)}});
}

const roundBar=(x,y,w,h)=>w>4?`M${x},${y} h${w-4} a4,4 0 0 1 4,4 v${h-8} a4,4 0 0 1 -4,4 h${-(w-4)} z`:`M${x},${y} h${w} v${h} h${-w} z`;
function axes(svg,{x0,x1,y0,y1,L,R,Tp,B,W,H,xt,yt,xl,yl}){
  const X=v=>L+(v-x0)/(x1-x0)*(W-L-R), Y=v=>H-B-(v-y0)/(y1-y0)*(H-Tp-B);
  yt.forEach(v=>{el("line",{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:"var(--line-2)"},svg);el("text",{x:L-8,y:Y(v)+4,"text-anchor":"end"},svg).textContent=v.toFixed(1)});
  xt.forEach(v=>{el("text",{x:X(v),y:H-B+16,"text-anchor":"middle"},svg).textContent=v.toFixed(1)});
  el("line",{x1:L,x2:W-R,y1:H-B,y2:H-B,stroke:"var(--line)"},svg);
  el("text",{x:(L+W-R)/2,y:H-4,"text-anchor":"middle"},svg).textContent=xl;
  el("text",{x:12,y:(Tp+H-B)/2,"text-anchor":"middle",transform:`rotate(-90 12 ${(Tp+H-B)/2})`},svg).textContent=yl;
  return {X,Y};
}
function chartVal(){
  const svg=$("#ch-val"),W=560,H=420;
  const {X,Y}=axes(svg,{x0:1.8,x1:5.8,y0:1.8,y1:5.8,L:46,R:12,Tp:12,B:42,W,H,xt:[2,3,4,5],yt:[2,3,4,5],xl:"Rendimiento real (t/ha)",yl:"Predicho en validación (t/ha)"});
  const r=DATA.ens.rmse;
  el("polygon",{points:[[1.8,1.8+r],[5.8-r,5.8],[5.8,5.8],[5.8,5.8-r],[1.8+r,1.8],[1.8,1.8]].map(([a,b])=>`${X(a)},${Y(b)}`).join(" "),fill:"var(--gold)","fill-opacity":.08},svg);
  el("line",{x1:X(1.8),y1:Y(1.8),x2:X(5.8),y2:Y(5.8),stroke:"var(--ink-3)","stroke-dasharray":"4 4"},svg);
  T.forEach(t=>{const c=el("circle",{cx:X(t.real),cy:Y(t.cv),r:5,fill:"var(--gold)","fill-opacity":.8,stroke:"var(--panel)","stroke-width":1.2},svg);
    const h=el("circle",{cx:X(t.real),cy:Y(t.cv),r:10,fill:"transparent"},svg);
    h.addEventListener("mousemove",e=>{c.setAttribute("r",8);showTip(e,`<b>${t.id}</b> · ${t.mun}<br>Real <b>${fmt(t.real)}</b> · Predicho <b>${fmt(t.cv)}</b><br>Error ${t.cv-t.real>=0?"+":""}${fmt(t.cv-t.real)} t/ha`)});
    h.addEventListener("mouseleave",()=>{c.setAttribute("r",5);hideTip()})});
  el("text",{x:X(2.0),y:Y(5.55)},svg).textContent=`MAE ${fmt(DATA.ens.mae)} · R² ${fmt(DATA.ens.r2)}`;
  $("#i-rmse").innerHTML=`±${fmt(r)}<span style="font-size:.4em;color:var(--ink-2);font-weight:600"> t/ha</span>`;
  $("#i-base").textContent=`Sin modelo, prediciendo siempre el promedio, el error sería ±${fmt(DATA.ens.base)} t/ha. El modelo explica el ${Math.round(DATA.ens.r2*100)} % de la variación entre parcelas.`;
}
function chartMod(){
  const svg=$("#ch-mod"),W=560,H=400,L=132,R=48,Tp=10,B=36;
  const M=DATA.models.slice().sort((a,b)=>a.RMSE-b.RMSE),x1=0.9,X=v=>L+v/x1*(W-L-R);
  const rowH=(H-Tp-B)/M.length,bh=Math.min(18,rowH/3);
  [0,0.2,0.4,0.6,0.8].forEach(v=>{el("line",{x1:X(v),x2:X(v),y1:Tp,y2:H-B,stroke:"var(--line-2)"},svg);el("text",{x:X(v),y:H-B+16,"text-anchor":"middle"},svg).textContent=v.toFixed(1)});
  el("text",{x:(L+W-R)/2,y:H-4,"text-anchor":"middle"},svg).textContent="RMSE (t/ha)";
  const top3=M.slice(0,3).map(m=>m.modelo);
  M.forEach((m,i)=>{
    const yc=Tp+rowH*i+rowH/2;
    el("text",{x:L-10,y:yc+4,"text-anchor":"end",style:"fill:var(--ink);font-family:var(--f-body);font-size:13px"},svg).textContent=m.modelo+(top3.includes(m.modelo)?" ★":"");
    [["RMSE","var(--s1)","CV aleatoria",-1],["RMSE_espacial","var(--s2)","CV espacial",1]].forEach(([k,c,lab,o])=>{
      const y=yc+(o<0?-bh-1:1),w=X(m[k])-L;
      el("path",{d:roundBar(L,y,w,bh),fill:c},svg);
      el("text",{x:L+w+5,y:y+bh-4},svg).textContent=m[k].toFixed(2);
      const h=el("rect",{x:L,y:y,width:Math.max(w,30),height:bh,fill:"transparent"},svg);
      h.addEventListener("mousemove",e=>showTip(e,`<b>${m.modelo}</b> · ${lab}<br>RMSE <b>${fmt(m[k],3)}</b> t/ha<br>R² <b>${fmt(k==="RMSE"?m.R2:m.R2_espacial,3)}</b>`));
      h.addEventListener("mouseleave",hideTip)});
  });
  const b=DATA.ens.base;
  el("line",{x1:X(b),x2:X(b),y1:Tp,y2:H-B,stroke:"var(--ink-3)","stroke-dasharray":"4 4"},svg);
  el("text",{x:X(b)-4,y:Tp+10,"text-anchor":"end"},svg).textContent=`media ${b.toFixed(2)}`;
}
function chartImp(){
  const svg=$("#ch-imp"),W=560,H=430,L=196,R=50,Tp=6,B=36;
  const I=DATA.imp.slice(0,12),mx=0.22,X=v=>L+v/mx*(W-L-R);
  const rowH=(H-Tp-B)/I.length,bh=Math.min(18,rowH-8);
  [0,0.05,0.1,0.15,0.2].forEach(v=>{el("line",{x1:X(v),x2:X(v),y1:Tp,y2:H-B,stroke:"var(--line-2)"},svg);el("text",{x:X(v),y:H-B+16,"text-anchor":"middle"},svg).textContent=v.toFixed(2)});
  el("text",{x:(L+W-R)/2,y:H-4,"text-anchor":"middle"},svg).textContent="Aumento del RMSE al permutar (t/ha)";
  I.forEach((d,i)=>{const y=Tp+rowH*i+(rowH-bh)/2,w=Math.max(X(d.importancia)-L,2);
    el("text",{x:L-10,y:y+bh-4,"text-anchor":"end",style:`fill:${i<2?"var(--ink)":"var(--ink-2)"};font-family:var(--f-body);font-size:13px`},svg).textContent=LABELS[d.variable]||d.variable;
    el("path",{d:roundBar(L,y,w,bh),fill:i<2?"var(--gold)":"var(--q3)"},svg);
    el("text",{x:L+w+5,y:y+bh-4},svg).textContent=d.importancia.toFixed(3);
    const h=el("rect",{x:0,y:Tp+rowH*i,width:W,height:rowH,fill:"transparent"},svg);
    h.addEventListener("mousemove",e=>showTip(e,`<b>${d.variable}</b><br>${LABELS[d.variable]||""}<br>Importancia ${d.importancia.toFixed(4)} t/ha`));h.addEventListener("mouseleave",hideTip)});
  $("#i-imp").innerHTML=`+${DATA.imp[0].importancia.toFixed(2)}<span style="font-size:.4em;color:var(--ink-2);font-weight:600"> t/ha</span>`;
}
function chartHist(){
  const svg=$("#ch-hist"),W=560,H=400,L=46,R=12,Tp=12,B=42;
  const bins=[];for(let a=2.0;a<5.75-1e-9;a+=0.25)bins.push(a);
  const last=bins[bins.length-1];
  const cnt=arr=>bins.map(a=>arr.filter(v=>(v>=a&&v<a+0.25)||(a===last&&v>=a)).length/arr.length*100);
  const real=cnt(T.map(t=>t.real)),pred=cnt(P.map(p=>p.y));
  const ymax=Math.ceil(Math.max(...real,...pred)/10)*10,yt=[];for(let v=0;v<=ymax;v+=10)yt.push(v);
  const X=v=>L+(v-2)/3.75*(W-L-R),Y=v=>H-B-v/ymax*(H-Tp-B);
  yt.forEach(v=>{el("line",{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:"var(--line-2)"},svg);el("text",{x:L-8,y:Y(v)+4,"text-anchor":"end"},svg).textContent=v+"%"});
  [2,2.5,3,3.5,4,4.5,5,5.5].forEach(v=>el("text",{x:X(v),y:H-B+16,"text-anchor":"middle"},svg).textContent=v.toFixed(1));
  el("text",{x:(L+W-R)/2,y:H-4,"text-anchor":"middle"},svg).textContent="Rendimiento (t/ha)";
  const bw=(X(2.25)-X(2))/2-2;
  bins.forEach((a,i)=>{[[real[i],"var(--s2)",0,"Real (entrenamiento)",T.length],[pred[i],"var(--s1)",1,"Predicho",P.length]].forEach(([v,c,o,lab,n])=>{
    const x=X(a)+1+o*(bw+2),y=Y(v),h=H-B-y;
    if(h>0)el("path",{d:h>4?`M${x},${H-B} v${-(h-4)} a4,4 0 0 1 4,-4 h${bw-8} a4,4 0 0 1 4,4 v${h-4} z`:`M${x},${H-B} v${-h} h${bw} v${h} z`,fill:c},svg);
    const hit=el("rect",{x:x,y:Tp,width:bw+2,height:H-B-Tp,fill:"transparent"},svg);
    hit.addEventListener("mousemove",e=>showTip(e,`<b>${a.toFixed(2)}–${(a+0.25).toFixed(2)}</b> t/ha<br>${lab}: <b>${v.toFixed(1)} %</b> (${Math.round(v*n/100)} de ${n})`));hit.addEventListener("mouseleave",hideTip)})});
  el("line",{x1:L,x2:W-R,y1:H-B,y2:H-B,stroke:"var(--line)"},svg);
  const nh=P.filter(p=>p.niv==="hi").length,nm=P.filter(p=>p.niv==="mid").length,nl=P.filter(p=>p.niv==="lo").length;
  $("#i-niv").innerHTML=`${nh}<span style="font-size:.4em;color:var(--ink-2);font-weight:600"> de 59</span>`;
  $("#i-niv-t").innerHTML=`parcelas con rendimiento <b style="color:var(--hi)">alto</b> (≥ 4.3 t/ha). Otras ${nm} quedan en nivel <b style="color:var(--mid)">medio</b> (3.5–4.3) y ${nl} en <b style="color:var(--lo)">bajo</b> (&lt; 3.5).`;
}

st.sel=P.slice().sort((a,b)=>b.prod-a.prod)[0].id;
constel();renderMap();table();municipios();chartVal();chartMod();chartImp();chartHist();
const m=/^#d(\d+)$/.exec(location.hash);
go(m?(+m[1]-1):0);
