/* ---------- durum ---------- */
let state = {
  taraflar: [],
  kalemler: [],
  idc: 0
};
const nid = ()=> (++state.idc);

/* ---------- kod yardımcıları ---------- */
const H = UYAP_DATA.hiyerarsi;
const XML_PARA_ADI = {
  PRBRMTL:'TL - Türk Lirası',
  PRBRMUSD:'USD - Amerikan Doları',
  PRBRMEUR:'EUR - Euro'
};
function fillSelect(el, arr, valKey, txtKey, sel){
  el.innerHTML = arr.map(o=>`<option value="${o[valKey]}"${o[valKey]===sel?' selected':''}>${o[txtKey]}</option>`).join('');
}
function curTuru(){ return document.getElementById('takipTuru').value; }
function curYol(){
  const t=H[curTuru()]; const yk=document.getElementById('takipYolu').value;
  return t.yollar.find(y=>y.kod===yk) || t.yollar[0];
}
function ilamliMi(){ return curTuru()==='0'; }
function syncTakipUI(){
  document.getElementById('ilamSection').style.display=ilamliMi()?'':'none';
  document.getElementById('kalemSecNum').textContent=ilamliMi()?'5':'4';
  document.getElementById('talepSecNum').textContent=ilamliMi()?'6':'5';
}
function uyumluKalemleriYukle(){
  const secenekler=kalemKodOptions();
  state.kalemler.forEach(k=>{
    if(!secenekler.some(s=>s.kod===k.kod)){
      const ilk=secenekler[0]; k.kod=ilk.kod; k.ad=ilk.ad; k.turu=ilk.turu; k.tip=ilk.tip;
    }
  });
}

/* ---------- cascade ---------- */
function initTuru(){
  const el=document.getElementById('takipTuru');
  el.innerHTML = Object.entries(H).map(([k,v])=>`<option value="${k}"${k==='1'?' selected':''}>${v.ad}</option>`).join('');
  el.onchange=()=>{fillYol();uyumluKalemleriYukle();syncTakipUI();renderKalemler();render();};
}
function fillYol(){
  const t=H[curTuru()]; const el=document.getElementById('takipYolu');
  el.innerHTML = t.yollar.map((y,i)=>`<option value="${y.kod}"${i===0?' selected':''}>${y.ad}</option>`).join('');
  el.onchange=()=>{fillSekli();fillMahiyet();render();};
  fillSekli(); fillMahiyet();
}
function fillSekli(){
  const y=curYol(); const el=document.getElementById('takipSekli');
  el.innerHTML = y.sekli.map((s,i)=>`<option value="${s.kod}"${i===0?' selected':''}>${s.ad}</option>`).join('');
  el.onchange=render;
}
function fillMahiyet(){
  const y=curYol(); const wrap=document.getElementById('mahiyetWrap');
  const el=document.getElementById('mahiyetKodu');
  if(!y.mahiyet.length){ wrap.style.display='none'; el.innerHTML=''; return; }
  wrap.style.display='';
  el.innerHTML = y.mahiyet.map((m,i)=>`<option value="${m.kod}"${i===0?' selected':''}>${m.kod} — ${m.aciklama}</option>`).join('');
  el.onchange=render;
}

/* ---------- taraf ---------- */
function addTaraf(rolKod){
  const id=nid();
  state.taraflar.push({id,tip:'kisi',rol:rolKod,adi:'',soyadi:'',cinsiyet:'E',
    kurumAdi:'',kamuOzel:'O',tc:'',vergiNo:'',mersis:'',iban:'',ilKodu:'',ilceKodu:'',adres:''});
  if(rolKod==='22') state.kalemler.forEach(k=>{ k.borclular=Array.from(new Set([...(k.borclular||[]),id])); });
  renderTaraflar(); renderKalemler(); render();
}
function rmTaraf(id){ state.taraflar=state.taraflar.filter(t=>t.id!==id); state.kalemler.forEach(k=>{if(String(k.alacakli)===String(id))k.alacakli='';k.borclular=(k.borclular||[]).filter(x=>String(x)!==String(id));}); renderTaraflar(); renderKalemler(); render(); }
function setT(id,k,v){ const t=state.taraflar.find(x=>x.id===id); if(t){t[k]=v;if(k==='ilKodu')t.ilceKodu='';if(k==='tip'||k==='ilKodu'||k==='rol'){renderTaraflar();renderKalemler();}render();} }

function renderTaraflar(){
  const roller = UYAP_DATA.roller;
  const ilOpt = '<option value="">— İl seç —</option>'+UYAP_ILLER.map(i=>`<option value="${i.kod}">${i.ad}</option>`).join('');
  document.getElementById('taraflar').innerHTML = state.taraflar.map(t=>{
    const isAl = t.rol==='21';
    const chip = isAl?'<span class="chip al">Alacaklı</span>':(t.rol==='22'?'<span class="chip bo">Borçlu</span>':'<span class="chip ka">Taraf</span>');
    const rolSel = `<select onchange="setT(${t.id},'rol',this.value)">${roller.map(r=>`<option value="${r.kod}"${r.kod===t.rol?' selected':''}>${r.ad}</option>`).join('')}</select>`;
    const kisiFields = `
      <div class="row c2">
        <div class="field"><label>Adı</label><input type="text" value="${esc(t.adi)}" oninput="setT(${t.id},'adi',this.value)"></div>
        <div class="field"><label>Soyadı</label><input type="text" value="${esc(t.soyadi)}" oninput="setT(${t.id},'soyadi',this.value)"></div>
      </div>
      <div class="row c3">
        <div class="field"><label>T.C. Kimlik No</label><input type="text" class="mono" maxlength="11" value="${esc(t.tc)}" oninput="setT(${t.id},'tc',this.value)"></div>
        <div class="field"><label>Vergi No</label><input type="text" class="mono" maxlength="10" value="${esc(t.vergiNo)}" oninput="setT(${t.id},'vergiNo',this.value)"></div>
        <div class="field"><label>Cinsiyet</label><select onchange="setT(${t.id},'cinsiyet',this.value)"><option value="E"${t.cinsiyet==='E'?' selected':''}>Erkek</option><option value="K"${t.cinsiyet==='K'?' selected':''}>Kadın</option></select></div>
      </div>`;
    const kurumFields = `
      <div class="field"><label>Kurum / Unvan</label><input type="text" value="${esc(t.kurumAdi)}" oninput="setT(${t.id},'kurumAdi',this.value)"></div>
      <div class="row c3">
        <div class="field"><label>Vergi No</label><input type="text" class="mono" value="${esc(t.vergiNo)}" oninput="setT(${t.id},'vergiNo',this.value)"></div>
        <div class="field"><label>MERSİS No</label><input type="text" class="mono" value="${esc(t.mersis)}" oninput="setT(${t.id},'mersis',this.value)"></div>
        <div class="field"><label>Kamu/Özel</label><select onchange="setT(${t.id},'kamuOzel',this.value)"><option value="O"${t.kamuOzel==='O'?' selected':''}>Özel</option><option value="K"${t.kamuOzel==='K'?' selected':''}>Kamu</option></select></div>
      </div>`;
    return `<div class="entry">
      <div class="entry-top">${chip}${rolSel}
        <button class="rm" type="button" onclick="rmTaraf(${t.id})" title="Kaldır" aria-label="Tarafı kaldır"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4h10M6 4V2h4v2m-5 0 .7 9h4.6l.7-9M7 7v3M9 7v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></div>
      <div class="seg" style="margin-bottom:13px">
        <button class="${t.tip==='kisi'?'on':''}" onclick="setT(${t.id},'tip','kisi')">Gerçek Kişi</button>
        <button class="${t.tip==='kurum'?'on':''}" onclick="setT(${t.id},'tip','kurum')">Tüzel Kişi</button>
      </div>
      ${t.tip==='kisi'?kisiFields:kurumFields}
      <div class="row c3">
        <div class="field"><label>İl</label><select onchange="setT(${t.id},'ilKodu',this.value)">${ilOpt.replace(`value="${t.ilKodu}"`,`value="${t.ilKodu}" selected`)}</select></div>
        <div class="field"><label>İlçe</label><select onchange="setT(${t.id},'ilceKodu',this.value)"${t.ilKodu?'':' disabled'}><option value="">— İlçe seç —</option>${(UYAP_ILLER.find(i=>i.kod===String(t.ilKodu))?.ilceler||[]).map(i=>`<option value="${i.kod}"${i.kod===String(t.ilceKodu)?' selected':''}>${i.ad}</option>`).join('')}</select></div>
        <div class="field"><label>IBAN — TR sonrası 24 hane (opsiyonel)</label><input type="text" class="mono" maxlength="24" value="${esc(t.iban)}" oninput="setT(${t.id},'iban',this.value)"></div>
      </div>
      <div class="field"><label>Açık Adres</label><input type="text" value="${esc(t.adres)}" oninput="setT(${t.id},'adres',this.value)"></div>
    </div>`;
  }).join('');
}

/* ---------- alacak kalemi ---------- */
function kalemKodOptions(){
  const yaygin = ['7168','11009','10753','8705','9728','5','7180','7177','7179','6913'];
  const arr = UYAP_DATA.alacakKalem.filter(a=>(curTuru()==='1'?a.ilamsiz:!a.ilamsiz)&&a.tip==='0');
  arr.sort((a,b)=>{ const ia=yaygin.indexOf(a.kod), ib=yaygin.indexOf(b.kod); return (ia===-1?99:ia)-(ib===-1?99:ib) || a.ad.localeCompare(b.ad,'tr'); });
  return arr;
}
function addKalem(){
  const first = kalemKodOptions()[0];
  state.kalemler.push({id:nid(),kod:first.kod,ad:first.ad,turu:first.turu,tip:first.tip,
    tutar:'',para:'PRBRMTL',alacakli:state.taraflar.find(t=>t.rol==='21')?.id||'',borclular:state.taraflar.filter(t=>t.rol==='22').map(t=>t.id),faizAcik:first.turu==='1',faizTip:'FAIZT00002',faizOran:'',faizBas:''});
  renderKalemler(); render();
}
function rmKalem(id){ state.kalemler=state.kalemler.filter(k=>k.id!==id); renderKalemler(); render(); }
function setK(id,k,v){ const it=state.kalemler.find(x=>x.id===id); if(it){
  it[k]=v;
  if(k==='kod'){ const meta=UYAP_DATA.alacakKalem.find(a=>a.kod===v); if(meta){it.ad=meta.ad;it.turu=meta.turu;it.tip=meta.tip;} }
  if(k==='faizAcik') renderKalemler();
  render();
} }
function toggleKBorclu(id,borcluId,checked){
  const it=state.kalemler.find(x=>x.id===id); if(!it)return;
  const ids=new Set((it.borclular||[]).map(String));
  if(checked)ids.add(String(borcluId));else ids.delete(String(borcluId));
  it.borclular=[...ids]; renderKalemler(); render();
}

function renderKalemler(){
  const kodOpts = kalemKodOptions();
  const paraOpts = UYAP_DATA.para;
  const faizOpts = UYAP_DATA.faiz;
  const alacaklilar=state.taraflar.filter(t=>t.rol==='21');
  const borclular=state.taraflar.filter(t=>t.rol==='22');
  const tarafAdi=t=>t.tip==='kisi'?`${t.adi} ${t.soyadi}`.trim()||`Taraf #${t.id}`:t.kurumAdi||`Taraf #${t.id}`;
  document.getElementById('kalemler').innerHTML = state.kalemler.map((k,idx)=>{
    const turAd = k.turu==='2'?'Faiz':(k.turu==='1'?'Asıl/Alacak':'Masraf/Diğer');
    const kodSel = `<select onchange="setK(${k.id},'kod',this.value)">${kodOpts.map(o=>`<option value="${o.kod}"${o.kod===k.kod?' selected':''}>${o.ad} (${o.kod})</option>`).join('')}</select>`;
    const paraSel = `<select onchange="setK(${k.id},'para',this.value)">${paraOpts.slice(0,3).map(o=>`<option value="${o.kod}"${o.kod===k.para?' selected':''}>${o.ad}</option>`).join('')+'<option disabled>──────</option>'+paraOpts.slice(3).map(o=>`<option value="${o.kod}"${o.kod===k.para?' selected':''}>${o.ad}</option>`).join('')}</select>`;
    const seciliBorclular=(k.borclular||[]).map(String);
    const tarafSecimi = `<div class="row c2"><div class="field"><label>İlgili alacaklı</label><select onchange="setK(${k.id},'alacakli',this.value)"><option value="">— seç —</option>${alacaklilar.map(t=>`<option value="${t.id}"${String(t.id)===String(k.alacakli)?' selected':''}>${esc(tarafAdi(t))}</option>`).join('')}</select></div><div class="field"><label>İlgili borçlular</label><div class="check-list">${borclular.length?borclular.map(t=>`<label class="faiztgl"><input type="checkbox"${seciliBorclular.includes(String(t.id))?' checked':''} onchange="toggleKBorclu(${k.id},'${t.id}',this.checked)">${esc(tarafAdi(t))}</label>`).join(''):'<span class="hint">Önce borçlu ekleyin</span>'}</div></div></div>`;
    const faizInner = k.faizAcik?`
      <div class="row c3" style="margin-top:11px">
        <div class="field"><label>Faiz Türü</label><select onchange="setK(${k.id},'faizTip',this.value)">${faizOpts.map(f=>`<option value="${f.kod}"${f.kod===k.faizTip?' selected':''}>${f.ad}</option>`).join('')}</select></div>
        <div class="field"><label>Oran % (opsiyonel)</label><input type="text" class="mono" value="${esc(k.faizOran)}" oninput="setK(${k.id},'faizOran',this.value)" placeholder="değişken"></div>
        <div class="field"><label>Başlangıç (GG/AA/YYYY)</label><input type="text" class="mono" value="${esc(k.faizBas)}" oninput="setK(${k.id},'faizBas',this.value)" placeholder="Boş bırak = takip tarihinden itibaren"></div>
      </div>`:'';
    return `<div class="entry">
      <div class="entry-top"><span class="chip ka">Kalem ${idx+1} · ${turAd}</span>
        <button class="rm" type="button" onclick="rmKalem(${k.id})" title="Kaldır" aria-label="Kalemi kaldır"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4h10M6 4V2h4v2m-5 0 .7 9h4.6l.7-9M7 7v3M9 7v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></div>
      <div class="field"><label>Alacak Kalemi</label>${kodSel}</div>
      <div class="row c2">
        <div class="field"><label>Tutar</label><input type="text" class="mono" value="${esc(k.tutar)}" oninput="setK(${k.id},'tutar',this.value)" placeholder="15000,00"></div>
        <div class="field"><label>Para Birimi</label>${paraSel}</div>
      </div>
      ${tarafSecimi}
      <div class="faizbox">
        <label class="faiztgl"><input type="checkbox" ${k.faizAcik?'checked':''} onchange="setK(${k.id},'faizAcik',this.checked)"> Bu kaleme faiz ekle</label>
        ${faizInner}
      </div>
    </div>`;
  }).join('');
}

/* ---------- vekil ---------- */
document.getElementById('vekilAktif').onchange=function(){
  document.getElementById('vekilBody').style.display=this.checked?'':'none'; render();
};
document.getElementById('vekilHatirla').onchange=render;
['vAdi','vSoyadi','vTc','vBaro','vTbb','vVergi','vAdres'].forEach(id=>{
  document.getElementById(id).addEventListener('input',render);
});
['dosyaTipi','bk84','bsmv','kkdf','dosyaBel','aciklama48e9','rehinIpotek15Aciklama','digerAlacakAciklama','digerAlacakTarih'].forEach(id=>{
  document.getElementById(id).addEventListener('input',render);
});
['ilamiVerenMahkeme','ilamTarihi','ilamKararNoYil','ilamKararSira','ilamDosyaNoYil','ilamDosyaSira','kesinlesmeTarih','ilamAciklama'].forEach(id=>{
  document.getElementById(id).addEventListener('input',render);
});
document.getElementById('talepOto').onchange=render;
document.getElementById('talep').addEventListener('input',()=>{ /* elle düzenlenmişse dokunma */ });

/* ---------- yardımcılar ---------- */
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function ilAdi(kod){ return UYAP_ILLER.find(i=>i.kod===String(kod))?.ad||''; }
function ilceAdi(ilKodu,ilceKodu){ return UYAP_ILLER.find(i=>i.kod===String(ilKodu))?.ilceler.find(i=>i.kod===String(ilceKodu))?.ad||''; }
function parseTutar(v){
  let s=String(v||'').trim().replace(/\s/g,'');
  if(!s)return NaN;
  if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}(?:\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  return /^\d+(?:\.\d{1,2})?$/.test(s)?Number(s):NaN;
}
function toplamTutar(){ return state.kalemler.reduce((s,k)=>s+(Number.isFinite(parseTutar(k.tutar))?parseTutar(k.tutar):0),0); }
function fmtTL(n){ return n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function xmlTutar(v){ const n=parseTutar(v); return Number.isFinite(n)?n.toFixed(2).replace('.',','):''; }
function tcKimlikGecerli(tc){
  if(!/^\d{11}$/.test(tc)||tc[0]==='0')return false;
  const d=[...tc].map(Number);
  const tek=d[0]+d[2]+d[4]+d[6]+d[8], cift=d[1]+d[3]+d[5]+d[7];
  return ((tek*7-cift)%10+10)%10===d[9] && d.slice(0,10).reduce((a,b)=>a+b,0)%10===d[10];
}
function vergiNoGecerli(no){ return /^\d{10}$/.test(no); }
function xmlBuyuk(s){ return String(s??'').toLocaleUpperCase('tr-TR'); }

const formIds=['dosyaTipi','takipTuru','takipYolu','takipSekli','mahiyetKodu','bk84','bsmv','kkdf','dosyaBel','aciklama48e9','rehinIpotek15Aciklama','digerAlacakAciklama','digerAlacakTarih','vekilAktif','vekilHatirla','vAdi','vSoyadi','vTc','vBaro','vTbb','vVergi','vAdres','ilamiVerenMahkeme','ilamTarihi','ilamKararNoYil','ilamKararSira','ilamDosyaNoYil','ilamDosyaSira','kesinlesmeTarih','ilamAciklama','talepOto','talep'];
let taslakKaydiniAtla=false;
function formVerisi(){ return Object.fromEntries(formIds.map(id=>{const e=document.getElementById(id);return [id,e?.type==='checkbox'?e.checked:e?.value||''];})); }
function formVerisiniUygula(form){ formIds.forEach(id=>{const e=document.getElementById(id);if(!e||form[id]===undefined)return;e.type==='checkbox'?e.checked=Boolean(form[id]):e.value=form[id];}); document.getElementById('vekilBody').style.display=document.getElementById('vekilAktif').checked?'':'none'; }
function taslagiKaydet(){
  if(taslakKaydiniAtla){taslakKaydiniAtla=false;return;}
  try{
    const form=formVerisi(); localStorage.setItem('etakip_taslak',JSON.stringify({state,form}));
    if(form.vekilHatirla) localStorage.setItem('etakip_vekil',JSON.stringify({vAdi:form.vAdi,vSoyadi:form.vSoyadi,vTc:form.vTc,vBaro:form.vBaro,vTbb:form.vTbb,vVergi:form.vVergi,vAdres:form.vAdres}));
  }catch(e){}
}
function vekiliYukle(){ try{const v=JSON.parse(localStorage.getItem('etakip_vekil')||'null');if(v){Object.entries(v).forEach(([id,deger])=>{const e=document.getElementById(id);if(e)e.value=deger;});document.getElementById('vekilHatirla').checked=true;}}catch(e){} }
function taslagiYukle(){
  try{
    const d=JSON.parse(localStorage.getItem('etakip_taslak')||'null'); if(!d)return false;
    state=d.state&&Array.isArray(d.state.taraflar)&&Array.isArray(d.state.kalemler)?d.state:state;
    state.kalemler.forEach(k=>{if(!Array.isArray(k.borclular))k.borclular=k.borclu?[k.borclu]:[];});
    const f=d.form||{}; const tur=document.getElementById('takipTuru'); tur.value=f.takipTuru||'1'; fillYol();
    document.getElementById('takipYolu').value=f.takipYolu||document.getElementById('takipYolu').value; fillSekli(); fillMahiyet();
    document.getElementById('takipSekli').value=f.takipSekli||document.getElementById('takipSekli').value; document.getElementById('mahiyetKodu').value=f.mahiyetKodu||document.getElementById('mahiyetKodu').value;
    formVerisiniUygula(f); return true;
  }catch(e){return false;}
}
function temizleTaslak(){ try{localStorage.removeItem('etakip_taslak');}catch(e){} location.reload(); }

/* ---------- talep metni ---------- */
function talepMetni(){
  const top=toplamTutar();
  const para=UYAP_DATA.para.find(p=>p.kod===state.kalemler[0]?.para)?.ad.split(' — ')[0] || 'TL';
  return `${fmtTL(top)} ${para} asıl alacak ve fer'ileri toplamının; takip tarihinden itibaren işleyecek yasal faizi, icra masrafları ve vekalet ücreti ile birlikte tahsili talebidir. Fazlaya ilişkin haklarımız saklıdır. TBK m.100 gereğince kısmi ödemeler öncelikle işlemiş faiz, masraf ve fer'ilere mahsup edilecektir.`;
}

/* ---------- XML üretimi ---------- */
function buildXML(){
  const g=id=>document.getElementById(id).value;
  const at=(k,v)=>{
    const temiz=String(v??'').trim().replace(/\s+/g,' ');
    return temiz ? ` ${k}="${xmlEsc(temiz)}"` : '';
  };
  const L=[]; let did=0;
  L.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  L.push(`<exchangeData>`);
  L.push(`  <exchangeHeader versiyon="1.2"/>`);
  L.push(`  <dosyalar>`);

  const mahiyetOn = document.getElementById('mahiyetWrap').style.display!=='none';
  const talep = document.getElementById('talepOto').checked ? talepMetni() : g('talep');

  let d=`  <dosya id="dosya_1"`;
  d+=at('dosyaTipi',g('dosyaTipi'));
  d+=` dosyaTuru="0" takipTuru="${curTuru()}" takipYolu="${g('takipYolu')}" takipSekli="${g('takipSekli')}"`;
  if(mahiyetOn) d+=at('mahiyetKodu',g('mahiyetKodu'));
  d+=` BK84MaddeUygulansin="${g('bk84')}" BSMVUygulansin="${g('bsmv')}" KKDFUygulansin="${g('kkdf')}"`;
  d+=at('aciklama48e9',g('aciklama48e9'));
  d+=at('dosyaBelirleyicisi',g('dosyaBel'));
  d+=at('rehinIpotek15Aciklama',g('rehinIpotek15Aciklama'));
  d+=at('alacaklininTalepEttigiHak',talep);
  d+=`>`;
  L.push(d);

  // taraflar
  let ti=0;
  state.taraflar.forEach(t=>{
    ti++; const kkb=`kkb_${ti}`, adrId=`adr_${ti}`;
    const ad = t.tip==='kisi'
      ? [t.adi,t.soyadi].map(s=>String(s??'').trim()).filter(Boolean).join(' ')
      : String(t.kurumAdi??'').trim();
    L.push(`    <taraf id="taraf_${t.id}">`);
    L.push(`      <kisiKurumBilgileri id="${kkb}"${at('ad',xmlBuyuk(ad))}>`);
    if(t.tip==='kisi'){
      L.push(`        <kisiTumBilgileri id="kisi_${ti}"${at('adi',xmlBuyuk(t.adi))}${at('soyadi',xmlBuyuk(t.soyadi))}${at('tcKimlikNo',t.tc)}${at('vergiNo',t.vergiNo)} cinsiyeti="${t.cinsiyet}"/>`);
    }else{
      L.push(`        <kurum id="kurum_${ti}"${at('kurumAdi',xmlBuyuk(t.kurumAdi))}${at('vergiNo',t.vergiNo)}${at('mersisNo',t.mersis)} kamuOzel="${t.kamuOzel}" harcDurumu="1"/>`);
    }
    const adresTuru=t.tip==='kurum'?'ADRTR00002':'ADRTR00001';
    const adresTuruAciklama=t.tip==='kurum'?'Yurt İçi İşyeri Adresi':'Yurt İçi İkametgah Adresi';
    L.push(`        <adres id="${adrId}" adresTuru="${adresTuru}" adresTuruAciklama="${adresTuruAciklama}"${at('ilKodu',t.ilKodu)}${at('il',ilAdi(t.ilKodu))}${at('ilceKodu',t.ilceKodu)}${at('ilce',ilceAdi(t.ilKodu,t.ilceKodu))}${at('adres',t.adres)}/>`);
    L.push(`      </kisiKurumBilgileri>`);
    const r=UYAP_DATA.roller.find(x=>x.kod===t.rol)||{ad:''};
    L.push(`      <rolTur rolID="${t.rol}" Rol="${xmlEsc(r.ad)}"/>`);
    if(t.iban) L.push(`      <iban no="${xmlEsc(t.iban)}"/>`);
    L.push(`    </taraf>`);
  });

  // vekil
  if(document.getElementById('vekilAktif').checked){
    const va=g('vAdi'),vs=g('vSoyadi'),vt=g('vTc'),vb=g('vBaro'),vtbb=g('vTbb'),vv=g('vVergi'),vad=g('vAdres');
    L.push(`    <VekilKisi id="vekil_1">`);
    L.push(`      <vekil id="v_1"${at('adi',xmlBuyuk(va))}${at('soyadi',xmlBuyuk(vs))}${at('tcKimlikNo',vt)}${at('vergiNo',vv)}${at('baroNo',vb)}${at('tbbNo',vtbb)} vekilTipi="B" kurumAvukatiMi="H" sigortaliMi="H" borcluVekiliMi="H"/>`);
    L.push(`      <kisiTumBilgileri id="vkisi_1"${at('adi',xmlBuyuk(va))}${at('soyadi',xmlBuyuk(vs))}${at('tcKimlikNo',vt)}/>`);
    if(vad) L.push(`      <adres id="vadr_1" adresTuru="ADRTR00002"${at('adres',vad)}/>`);
    L.push(`    </VekilKisi>`);
  }

  // Alacak kalemleri: İlamsız takipte digerAlacak, ilamlı takipte ilam altında yer alır.
  if(state.kalemler.length){
    const ilamli=ilamliMi();
    if(ilamli){
      L.push(`    <ilam id="ilam_1"${at('ilamiVerenMahkeme',g('ilamiVerenMahkeme'))}${at('ilamTarihi',g('ilamTarihi'))}${at('ilamKararNoYil',g('ilamKararNoYil'))}${at('ilamKararSira',g('ilamKararSira'))}${at('ilamDosyaNoYil',g('ilamDosyaNoYil'))}${at('ilamDosyaSira',g('ilamDosyaSira'))}${at('kesinlesmeTarih',g('kesinlesmeTarih'))}${at('ilamAciklama',g('ilamAciklama'))}>`);
    }else{
      const top=xmlTutar(toplamTutar());
      const paraAdi=XML_PARA_ADI[state.kalemler[0].para]||'';
      L.push(`    <digerAlacak id="da_1"${at('digerAlacakAciklama',g('digerAlacakAciklama'))}${at('tarih',g('digerAlacakTarih'))} tutar="${top}" tutarTur="${state.kalemler[0].para}"${at('tutarAdi',paraAdi)}>`);
    }
    let ki=0;
    state.kalemler.forEach(k=>{
      ki++;
      const kalemTutar=xmlTutar(k.tutar);
      let a=`      <alacakKalemi id="ak_${ki}"${at('alacakKalemKod',k.kod)}${at('alacakKalemAdi',k.ad)}${at('alacakKalemKodAciklama',k.ad)}${at('alacakKalemTutar',kalemTutar)}${at('alacakKalemIlkTutar',kalemTutar)}${at('tutarTur',k.para)}${at('tutarAdi',XML_PARA_ADI[k.para]||'')}${at('alacakKalemTip',k.tip)}${at('alacakKalemKodTuru',k.turu)}`;
      if(k.faizAcik){
        a+=`>`; L.push(a);
        if(String(k.alacakli||'').trim()) L.push(`        <ref to="taraf" id="taraf_${k.alacakli}"/>`);
        (k.borclular||[]).filter(id=>String(id||'').trim()).forEach(id=>L.push(`        <ref to="taraf" id="taraf_${id}"/>`));
        let f=`        <faiz id="f_${ki}"${at('faizTipKod',k.faizTip)}`;
        const fn=UYAP_DATA.faiz.find(x=>x.kod===k.faizTip); if(fn)f+=at('faizTipKodAciklama',fn.ad);
        f+=at('faizOran',k.faizOran)+at('baslangicTarihi',k.faizBas)+` faizSureTip="SRBRM00003"/>`;
        L.push(f);
        L.push(`      </alacakKalemi>`);
      }else{
        a+=`>`; L.push(a);
        if(String(k.alacakli||'').trim()) L.push(`        <ref to="taraf" id="taraf_${k.alacakli}"/>`);
        (k.borclular||[]).filter(id=>String(id||'').trim()).forEach(id=>L.push(`        <ref to="taraf" id="taraf_${id}"/>`));
        L.push(`      </alacakKalemi>`);
      }
    });
    L.push(ilamli ? `    </ilam>` : `    </digerAlacak>`);
  }

  L.push(`  </dosya>`);
  L.push(`  </dosyalar>`);
  L.push(`</exchangeData>`);
  return L.join('\n');
}
function xmlEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- doğrulama ---------- */
function validate(){
  const errs=[], oks=[], warns=[];
  const al=state.taraflar.filter(t=>t.rol==='21');
  const bo=state.taraflar.filter(t=>t.rol==='22');
  (al.length?oks:errs).push(`En az bir alacaklı${al.length?' ('+al.length+')':' yok'}`);
  (bo.length?oks:errs).push(`En az bir borçlu${bo.length?' ('+bo.length+')':' yok'}`);
  // taraf kimlik kontrolü
  let kimlikOk=true;
  state.taraflar.forEach(t=>{
    if(t.tip==='kisi'){ if(!(t.adi&&t.soyadi)) kimlikOk=false; }
    else { if(!t.kurumAdi) kimlikOk=false; }
  });
  if(state.taraflar.length) (kimlikOk?oks:errs).push(kimlikOk?'Taraf ad/unvan bilgileri tam':'Bazı taraflarda ad/unvan eksik');
  state.taraflar.forEach((t,i)=>{
    if(!(t.ilKodu&&t.ilceKodu&&String(t.adres||'').trim())) errs.push(`Taraf ${i+1}: il, ilçe ve açık adres zorunlu`);
  });
  // kalem
  const kOk = state.kalemler.length>0 && state.kalemler.every(k=>Number.isFinite(parseTutar(k.tutar))&&al.some(t=>String(t.id)===String(k.alacakli))&&(k.borclular||[]).some(id=>bo.some(t=>String(t.id)===String(id))));
  const tekPara = new Set(state.kalemler.map(k=>k.para)).size<=1;
  (kOk?oks:errs).push(kOk?`Alacak kalemleri (${state.kalemler.length}) · toplam ${fmtTL(toplamTutar())} TL`:'Her alacak kaleminde tutar, alacaklı ve borçlu seçin');
  (tekPara?oks:errs).push(tekPara?'Tek para birimi kullanılıyor':'Bir XML talebinde tüm alacak kalemleri aynı para biriminde olmalı');
  state.taraflar.forEach((t,i)=>{ if(t.iban && !/^\d{24}$/.test(t.iban.replace(/\s/g,''))) errs.push(`Taraf ${i+1}: IBAN, TR sonrası 24 rakam olmalı`); });
  state.taraflar.forEach((t,i)=>{
    if(t.tc&&!tcKimlikGecerli(t.tc)) errs.push(`Taraf ${i+1}: T.C. kimlik numarası geçersiz`);
    if(t.vergiNo&&!vergiNoGecerli(t.vergiNo)) errs.push(`Taraf ${i+1}: vergi no 10 hane olmalı`);
  });
  const vekilAktif=document.getElementById('vekilAktif').checked;
  const vTc=document.getElementById('vTc').value.trim();
  const vVergi=document.getElementById('vVergi').value.trim();
  const vBaro=document.getElementById('vBaro').value.trim();
  const vAdres=document.getElementById('vAdres').value.trim();
  if(vekilAktif){
    if(vTc&&!tcKimlikGecerli(vTc)) errs.push('Vekil: T.C. kimlik numarası geçersiz');
    if(vVergi&&!vergiNoGecerli(vVergi)) errs.push('Vekil: vergi no 10 hane olmalı');
    if(!vBaro) errs.push('Vekil: baro sicil no zorunlu');
    if(!(vTc||vVergi)) errs.push('Vekil: T.C. kimlik no veya vergi no zorunlu');
    if(!vAdres) warns.push('Vekil: büro adresi boş');
  }
  state.kalemler.forEach((k,i)=>{ if(k.faizAcik&&k.faizBas&&!/^\d{2}\/\d{2}\/\d{4}$/.test(k.faizBas)) errs.push(`Kalem ${i+1}: faiz başlangıcı GG/AA/YYYY biçiminde olmalı`); });
  const talepMetniKontrol=document.getElementById('talepOto').checked?talepMetni():document.getElementById('talep').value;
  if(!state.kalemler.some(k=>k.faizAcik)&&/faiz/i.test(talepMetniKontrol)) warns.push('Talep metninde faiz geçiyor ancak hiçbir kaleme faiz eklenmedi — takip faizsiz açılır');
  if(ilamliMi()){
    const mahkeme=document.getElementById('ilamiVerenMahkeme').value.trim();
    const tarih=document.getElementById('ilamTarihi').value.trim();
    const yil=document.getElementById('ilamKararNoYil').value.trim();
    const sira=document.getElementById('ilamKararSira').value.trim();
    const kesin=document.getElementById('kesinlesmeTarih').value.trim();
    const esasYil=document.getElementById('ilamDosyaNoYil').value.trim();
    const esasSira=document.getElementById('ilamDosyaSira').value.trim();
    if(!(mahkeme&&/^\d{2}\/\d{2}\/\d{4}$/.test(tarih)&&/^\d{4}$/.test(yil)&&sira&&/^\d{4}$/.test(esasYil)&&esasSira)) errs.push('İlamlı takip için merci, ilam tarihi, karar ve esas bilgileri gerekli');
    if(kesin&&!/^\d{2}\/\d{2}\/\d{4}$/.test(kesin)) errs.push('Kesinleşme tarihi GG/AA/YYYY biçiminde olmalı');
    if(!errs.some(e=>e.startsWith('İlamlı'))) oks.push('İlam bilgileri tam');
  }
  // mahiyet
  if(document.getElementById('mahiyetWrap').style.display!=='none'){
    oks.push('Takip mahiyeti seçili');
  }
  return {errs,oks,warns,valid:errs.length===0};
}

/* ---------- render ---------- */
function highlightXml(x){
  return xmlEsc(x)
    .replace(/(&lt;\?[\s\S]*?\?&gt;)/g,'<span class="dec">$1</span>')
    .replace(/(&lt;!DOCTYPE[\s\S]*?&gt;)/g,'<span class="dec">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z][\w]*)/g,'$1<span class="tag">$2</span>')
    .replace(/([\w]+)=(&quot;.*?&quot;)/g,'<span class="at">$1</span>=<span class="val">$2</span>');
}
function render(){
  const xml=buildXML();
  document.getElementById('xmlOut').innerHTML=highlightXml(xml);
  window._xml=xml;
  // talep textarea senkron
  if(document.getElementById('talepOto').checked){
    document.getElementById('talep').value=talepMetni();
    document.getElementById('talep').readOnly=true;
  }else{ document.getElementById('talep').readOnly=false; }
  // durum
  const v=validate();
  document.getElementById('status').innerHTML =
    v.oks.map(o=>`<div class="st-line st-ok"><span class="st-ico">✓</span>${esc(o)}</div>`).join('')+
    v.errs.map(e=>`<div class="st-line st-err"><span class="st-ico">!</span>${esc(e)}</div>`).join('')+
    v.warns.map(w=>`<div class="st-line st-warn"><span class="st-ico">!</span>${esc(w)}</div>`).join('');
    v.errs.map(e=>`<div class="st-line st-err"><span class="st-ico">!</span>${esc(e)}</div>`).join('');
  document.getElementById('pvDot').style.background = v.valid?'#5fbf9f':'#d98a8a';
  document.getElementById('dlBtn').disabled=!v.valid;
  document.getElementById('dlBtn').textContent = v.valid?'XML dosyasını indir':'Eksik alanları tamamlayın';
  taslagiKaydet();
}

function downloadXml(){
  const blob=new Blob([window._xml],{type:'application/xml;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  const bel=document.getElementById('dosyaBel').value.replace(/[^\w\-]/g,'')||'takip';
  a.href=url; a.download=`etakip_${bel}.xml`; a.click(); URL.revokeObjectURL(url);
}
function copyXml(){ navigator.clipboard.writeText(window._xml).then(()=>{
  const b=event.currentTarget||event.target; const o=b.innerHTML;
  b.innerHTML='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Kopyalandı';
  setTimeout(()=>b.innerHTML=o,1400);
}); }

/* ---------- başlat ---------- */
initTuru(); fillYol(); syncTakipUI();
if(!taslagiYukle()){ vekiliYukle(); addTaraf('21'); addTaraf('22'); addKalem(); }
syncTakipUI(); renderTaraflar(); renderKalemler();
render();
