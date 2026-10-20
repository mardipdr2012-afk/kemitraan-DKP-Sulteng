/* SIKAKON — SPA instan: render lokal 0ms, data dari cache lokal lalu disegarkan di latar belakang */
const TAHAP=['Pengajuan','Verifikasi','Penelaahan','Presentasi','Persetujuan','Perjanjian','Monitoring'];
const PERAN={admin:'Administrator',mitra:'Mitra Konservasi',bidang:'Petugas Bidang PRL',uptd:'Petugas UPTD',kepala_uptd:'Kepala UPTD'};
const AKSI_TAHAP={2:['admin','bidang'],3:['admin','bidang','uptd'],4:['admin','bidang'],5:['admin'],6:['admin','kepala_uptd']};
const LOGO='https://res.cloudinary.com/quangqh7/image/upload/f_auto,q_auto/Untitled_design_3',COVER=id=>'https://drive.google.com/thumbnail?id='+id+'&sz=w800';let PUB=[];
const JENIS=['Proposal Program','Peta / Sketsa Zona','Dokumen Legalitas','Pakta Integritas','Rencana Kerja Tahunan','Surat Dukungan','Dokumen Tambahan'];
const WAJIB=['Proposal Program','Peta / Sketsa Zona'];
const PERAN_AKUN=['admin','bidang','uptd','kepala_uptd','mitra'];
const LABEL_LANJUT={2:'Verifikasi Lengkap → Penelaahan',3:'Layak → Presentasi',4:'Presentasi Selesai → Persetujuan',5:'Setujui Kemitraan',6:'PKS Ditandatangani → Monitoring'};
const KAWASAN=['KKPD Morowali','KKPD Banggai Kepulauan','KKPD Teluk Tomini','KKPD Teluk Palu'];
const ZONA=['Zona Inti','Zona Pemanfaatan Terbatas','Zona Tradisional','Zona Rehabilitasi','Zona Lainnya'];
const D0=['dashboard','Dashboard Utama','bi-grid'];
const IM=[['mitra','Data Calon Mitra','bi-people'],['pengajuan','Daftar Pengajuan','bi-folder2-open'],['verifikasi','Verifikasi Persyaratan','bi-clipboard-check'],['penelaahan','Penelaahan','bi-search'],['presentasi','Presentasi & BA','bi-easel'],['keputusan','Persetujuan','bi-award'],['perjanjian','Perjanjian (PKS)','bi-patch-check'],['monitoring','Monitoring & Monev','bi-activity'],['laporan','Laporan Kegiatan','bi-journal-richtext']];
const MENU={admin:[D0,['mitraverif','Verifikasi Mitra','bi-shield-check'],['akun','Kelola Akun','bi-person-gear']].concat(IM),
 mitra:[['dashboard','Dashboard','bi-grid'],['pengajuan','Pengajuan Saya','bi-folder2-open'],['buat','Buat Pengajuan','bi-plus-circle'],['perjanjian','Perjanjian Kemitraan','bi-patch-check'],['laporan','Laporan Kegiatan','bi-journal-richtext']],
 bidang:[D0].concat(IM),uptd:[D0].concat(IM),kepala_uptd:[D0].concat(IM)};
const STAGE_PAGE={verifikasi:2,penelaahan:3,presentasi:4,keputusan:5,perjanjian:6,monitoring:7};
const S={token:null,user:null,pengajuan:[],mitra:[],akun:[],dok:[],jadwal:[],laporan:[],editAkun:null,konfirm:null,ver:0,page:'dashboard',sel:null,q:'',year:new Date().getFullYear(),fSt:'',fKw:'',hist:[]};
let chart=null,busy=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const tgl=d=>d?new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-';
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const ses={get:()=>{try{return sessionStorage.getItem('sk_t')}catch(e){return null}},set:v=>{try{v?sessionStorage.setItem('sk_t',v):sessionStorage.removeItem('sk_t')}catch(e){}}};
function toast(m,err){const t=$('toast');t.textContent=m;t.className='toast on'+(err?' err':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='toast',3200)}
function setSync(s){const e=$('sync');e.textContent=s==='ok'?'● SINKRON':s==='run'?'◌ MENYINKRON':'▲ OFFLINE';e.className='pill mono '+(s==='ok'?'teal':s==='run'?'amb':'red')}
function pill(st){const c=/Perbaikan|Ditolak/.test(st)?'red':/Menunggu|Penelaahan|Penyusunan/.test(st)?'amb':/Aktif|Disetujui/.test(st)?'teal':'';return `<span class="pill ${c}">${esc(st).toUpperCase()}</span>`}

/* ── Panggilan server ── */
/* call() ada di js/api.js (fetch ke GAS) */
function authLost(){ses.set(null);store.del('sk_cache');S.token=null;showAuth();toast('Sesi berakhir, silakan masuk kembali.',1)}
function terapkan(d){Object.assign(S,{user:d.user,pengajuan:d.pengajuan,mitra:d.mitra,akun:d.akun||[],dok:d.dokumen||[],jadwal:d.jadwal||[],laporan:d.laporan||[],ver:d.version});store.set('sk_cache',{user:d.user,pengajuan:d.pengajuan,mitra:d.mitra,akun:S.akun,dok:S.dok,jadwal:S.jadwal,laporan:S.laporan,ver:d.version})}
async function segarkan(){
  if(!S.token||busy)return;setSync('run');
  try{const r=await call('bootstrapApp',S.token,S.ver);
    if(r.auth)return authLost();
    if(r.success&&!r.data.same){terapkan(r.data);render()}
    setSync(r.success?'ok':'off')}catch(e){setSync('off')}
}
/* Aksi optimistis: UI berubah seketika, server menyusul; gagal → rollback */
async function aksi(nama,payload,optim){
  const snap=JSON.stringify(S.pengajuan);if(optim){optim();render()}
  busy=true;setSync('run');
  try{const r=await call('api',S.token,nama,payload);busy=false;
    if(r.auth)return authLost();
    if(!r.success){S.pengajuan=JSON.parse(snap);render();setSync('ok');toast(r.message,1);return r}
    S.ver=0;setSync('ok');await segarkan();return r}
  catch(e){busy=false;S.pengajuan=JSON.parse(snap);render();setSync('off');toast('Gagal terhubung: '+e.message,1)}
}

/* ── Auth ── */
function showAuth(t){$('boot').hidden=1;$('app').hidden=1;$('home').hidden=1;$('auth').hidden=0;authTab(t||'login')}
function authTab(t){$('fLogin').hidden=t!=='login';$('fDaftar').hidden=t==='login';$('tLogin').className=t==='login'?'on':'';$('tDaftar').className=t==='login'?'':'on'}
async function doLoginUI(e){e.preventDefault();const b=e.target.querySelector('button');b.disabled=1;
  try{const r=await call('doLogin',$('lEmail').value,$('lPass').value);
    if(!r.success)toast(r.message,1);else{S.token=r.data.token;ses.set(S.token);terapkan(r.data);masuk()}}
  catch(x){toast('Gagal: '+x.message,1)}b.disabled=0}
async function doDaftarUI(e){e.preventDefault();const b=e.target.querySelector('button');b.disabled=1;
  try{const r=await call('doRegister',{nama:$('dNama').value,lembaga:$('dLembaga').value,jenis:$('dJenis').value,email:$('dEmail').value,pass:$('dPass').value});
    if(!r.success)toast(r.message,1);else{toast('Pendaftaran terkirim. Menunggu verifikasi Administrator.');e.target.reset();authTab('login')}}
  catch(x){toast('Gagal: '+x.message,1)}b.disabled=0}
function doLogoutUI(){call('doLogout',S.token).catch(()=>{});ses.set(null);store.del('sk_cache');S.token=null;S.hist=[];showHome()}
function masuk(){$('home').hidden=1;$('boot').hidden=1;$('auth').hidden=1;$('app').hidden=0;
  $('uNama').textContent=S.user.Nama;$('uPeran').textContent=PERAN[S.user.Peran];$('avSide').textContent=S.user.Nama.split(' ').map(w=>w[0]).slice(0,2).join('');
  S.page='dashboard';S.sel=null;render();setSync('ok')}

/* ── Navigasi SPA (sinkron, tanpa server, URL tidak berubah) ── */
function go(p,id,back){if(!back&&S.page)S.hist.push([S.page,S.sel]);S.page=p;S.sel=id||null;S.q='';$('q').value='';toggleSide(false);render();window.scrollTo(0,0)}
function kembali(){const h=S.hist.pop();if(h){S.page=h[0];S.sel=h[1];render()}else go('pengajuan')}
function toggleSide(o){$('side').classList.toggle('show',o);$('ov').classList.toggle('show',o)}
function cari(v){S.q=v.toLowerCase();if(!['pengajuan','mitra','mitraverif','verifikasi','penelaahan','presentasi','keputusan','perjanjian','monitoring'].includes(S.page))S.page='pengajuan';clearTimeout(cari._t);cari._t=setTimeout(render,120)}
function render(){
  if(!S.user)return;const m=MENU[S.user.Peran];
  const tahapCnt=n=>S.pengajuan.filter(x=>x.Tahap==n&&!/Perbaikan|Ditolak/.test(x.Status)).length;
  $('nav').innerHTML=m.map(([k,l,i])=>{const b=k==='mitraverif'?S.mitra.filter(x=>x.Status==='Menunggu Verifikasi').length:STAGE_PAGE[k]&&S.user.Peran!=='mitra'&&STAGE_PAGE[k]<7?tahapCnt(STAGE_PAGE[k]):0;
    return `<button class="nv ${S.page===k||(S.page==='detail'&&k==='pengajuan')?'on':''}" onclick="go('${k}')"><i class="bi ${i}"></i>${l}${b?`<span class="bd">${b}</span>`:''}</button>`}).join('');
  const P={dashboard,pengajuan:()=>daftar(S.pengajuan,'Daftar Pengajuan'),mitra,mitraverif:mitra,akun:akunPage,buat:formBuat,detail,laporan,presentasi:()=>jadwalPage('Presentasi'),monitoring:()=>jadwalPage('Monitoring'),perjanjian:pks};
  let h;if(P[S.page])h=P[S.page]();else if(STAGE_PAGE[S.page]){const n=STAGE_PAGE[S.page];h=daftar(S.pengajuan.filter(x=>S.user.Peran==='mitra'&&S.page==='perjanjian'?x.Tahap>=6:x.Tahap==n),(m.find(a=>a[0]===S.page)||[0,S.page])[1],true)}
  $('view').innerHTML=h;if(S.page==='dashboard')grafik();if(S.page==='buat')pulihDraf()}

/* ── Dashboard: semua angka dihitung dari data ── */
function dashboard(){
  const P=S.pengajuan,c=f=>P.filter(f).length,thn=[...new Set(P.map(x=>x.Tahun).concat([S.year]))].sort();
  const bln=new Date().getMonth(),baru=c(x=>new Date(x.Tanggal).getMonth()===bln&&new Date(x.Tanggal).getFullYear()===new Date().getFullYear());
  const k=[['Total Pengajuan',P.length,''],['Pengajuan Baru (bulan ini)',baru,''],['Perlu Perbaikan',c(x=>x.Status==='Perlu Perbaikan'),'warn'],['Dalam Penelaahan',c(x=>x.Tahap==3&&x.Status!=='Perlu Perbaikan'),''],['PKS / Perjanjian',c(x=>x.Tahap>=6),''],['Program Aktif',c(x=>x.Tahap==7),'']];
  return `<div class="ph"><div><h1>Selamat datang, ${esc(S.user.Nama.split(',')[0])}</h1><span class="muted">${PERAN[S.user.Peran]} · ${esc(S.user.Lembaga||'')}</span></div></div>
  <div class="grid kpis" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${k.map(a=>`<div class="card kpi ${a[2]}"><small>${a[0]}</small><b class="mono">${a[1]}</b></div>`).join('')}</div>
  <div class="grid two"><div class="card"><header><h2>Pengajuan per Bulan</h2><select style="width:auto" onchange="S.year=+this.value;render()">${thn.map(y=>`<option ${y==S.year?'selected':''}>${y}</option>`).join('')}</select></header><div class="cb" style="height:280px"><canvas id="cv"></canvas></div></div>
  <div class="card"><header><h2>Pipeline Tahapan</h2></header><div class="cb">${TAHAP.map((t,i)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9"><span>${i+1}. ${t}</span><b class="mono">${c(x=>x.Tahap==i+1)}</b></div>`).join('')}</div></div></div>
  ${jadwalMini()}
  ${daftar(P.filter(x=>/Perbaikan|Menunggu/.test(x.Status)).slice(0,5),'Perlu Tindakan',true,true)}`}
function grafik(){const e=$('cv');if(!e||!window.Chart)return;if(chart)chart.destroy();
  const d=Array(12).fill(0);S.pengajuan.filter(x=>x.Tahun==S.year).forEach(x=>d[new Date(x.Tanggal).getMonth()]++);
  chart=new Chart(e,{type:'bar',data:{labels:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],datasets:[{label:'Pengajuan',data:d,backgroundColor:'#0B2A4A',borderRadius:4}]},options:{maintainAspectRatio:false,animation:{duration:200},plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}})}

/* ── Tabel pengajuan (pencarian & filter lokal, instan) ── */
function daftar(list,judul,stage,mini){
  let L=list.filter(x=>(!S.q||[x.Nomor,x.Lembaga,x.Judul,x.Kawasan].join(' ').toLowerCase().includes(S.q))&&(!S.fSt||x.Status===S.fSt)&&(!S.fKw||x.Kawasan===S.fKw));
  const sts=[...new Set(list.map(x=>x.Status))];
  return `<div class="card" style="margin-bottom:24px"><header><h2>${esc(judul)} <span class="pill">${L.length}</span></h2>${!mini&&S.user.Peran==='mitra'?`<button class="btn sm sec" style="margin:0" onclick="go('buat')">+ Buat Pengajuan</button>`:''}</header>
  ${mini?'':`<div class="flt"><select onchange="S.fSt=this.value;render()"><option value="">Semua Status</option>${sts.map(s=>`<option ${s===S.fSt?'selected':''}>${esc(s)}</option>`).join('')}</select><select onchange="S.fKw=this.value;render()"><option value="">Semua Kawasan</option>${KAWASAN.map(s=>`<option ${s===S.fKw?'selected':''}>${s}</option>`).join('')}</select><button class="btn sm" onclick="S.fSt='';S.fKw='';render()">Reset</button></div>`}
  <div class="tw">${L.length?`<table><thead><tr><th>No. Registrasi</th><th>Lembaga & Program</th><th>Kawasan / Zona</th><th>Tahap</th><th>Status</th></tr></thead><tbody>${L.map(x=>`<tr onclick="go('detail','${x.ID}')"><td class="mono">${esc(x.Nomor||'DRAF')}</td><td><b>${esc(x.Judul)}</b><br><small>${esc(x.Lembaga)} · ${rp(x.Anggaran)}</small></td><td>${esc(x.Kawasan)}<br><small>${esc(x.Zona)}</small></td><td class="mono">${x.Tahap}/7 ${TAHAP[x.Tahap-1]||'Draf'}</td><td>${pill(x.Status)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Belum ada data.</div>'}</div></div>`}

/* ── Detail & alur tahapan ── */
function detail(){
  const x=S.pengajuan.find(a=>a.ID===S.sel);if(!x)return '<div class="empty">Pengajuan tidak ditemukan.</div>';
  const role=S.user.Peran,rev=x.Status==='Perlu Perbaikan',tol=x.Status==='Ditolak';
  const bisa=(AKSI_TAHAP[x.Tahap]||[]).includes(role)&&!rev&&!tol;
  const mitraEdit=role==='mitra'&&(x.Status==='Draf'||rev);
  return `<button class="btn sm" onclick="kembali()">← Kembali</button>
  <div class="ph" style="margin-top:16px"><div><span class="mono muted">${esc(x.Nomor||'DRAF')}</span><h1>${esc(x.Judul)}</h1><span class="muted">${esc(x.Lembaga)} · ${esc(x.Kawasan)} · ${esc(x.Zona)}</span></div>${pill(x.Status)}</div>
  <div class="card" style="margin-bottom:24px"><header><h2>Alur 7 Tahapan Kemitraan</h2></header><div class="cb steps">${TAHAP.map((t,i)=>`<div class="st ${i+1<x.Tahap||x.Tahap==7&&i==6&&0?'done':''} ${i+1==x.Tahap?'cur':''}"><b>${i+1}</b>${t}</div>`).join('')}</div></div>
  <div class="card"><header><h2>Ringkasan</h2></header><div class="cb"><div class="row2"><div><small>Anggaran Diusulkan</small><p class="mono">${rp(x.Anggaran)}</p></div><div><small>Tanggal Pengajuan</small><p>${tgl(x.Tanggal)}</p></div></div>
  ${x.Catatan?`<div class="note"><b>Catatan Petugas:</b> ${esc(x.Catatan)}</div>`:''}
  ${(AKSI_TAHAP[x.Tahap]||[]).includes(role)&&!tol?`<label>Catatan (wajib untuk permintaan perbaikan)</label><textarea id="cat"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
   ${bisa?`<button class="btn sec" style="margin:0" onclick="lanjut('${x.ID}')">${LABEL_LANJUT[x.Tahap]}</button>`:''}
   ${['admin','bidang','uptd'].includes(role)&&!rev?`<button class="btn bad" onclick="revisi('${x.ID}')">Minta Perbaikan ke Mitra</button>`:''}
   ${role==='admin'&&!tol?`<button class="btn bad" onclick="tolakP('${x.ID}')">Tolak</button>`:''}</div>`:''}
  ${mitraEdit?`<button class="btn sec" onclick="go('buat','${x.ID}')">${rev?'Perbaiki & Kirim Ulang':'Lanjutkan Draf'}</button>`:''}</div></div>${berkasPanel(x)}`}
function lanjut(id){const n=+S.pengajuan.find(a=>a.ID===id).Tahap+1,c=$('cat')?$('cat').value:'';
  const ST={3:'Dalam Penelaahan',4:'Menunggu Presentasi',5:'Menunggu Persetujuan',6:'Penyusunan PKS',7:'Aktif / Monitoring'};
  aksi('lanjut',{id,catatan:c},()=>{const x=S.pengajuan.find(a=>a.ID===id);x.Tahap=n;x.Status=ST[n];x.Catatan=c});toast('Dilanjutkan ke tahap '+n)}
function revisi(id){const c=$('cat').value.trim();if(!c)return toast('Isi catatan perbaikan terlebih dahulu.',1);
  aksi('minta_revisi',{id,catatan:c},()=>{const x=S.pengajuan.find(a=>a.ID===id);x.Status='Perlu Perbaikan';x.Catatan=c});toast('Permintaan perbaikan dikirim')}
function tolakP(id){const c=$('cat').value.trim();aksi('tolak',{id,catatan:c},()=>{const x=S.pengajuan.find(a=>a.ID===id);x.Status='Ditolak';x.Catatan=c})}

/* ── Formulir pengajuan + autosave draf lokal ── */
function formBuat(){const x=S.pengajuan.find(a=>a.ID===S.sel)||{};
  return `<div class="ph"><h1>${x.ID?'Ubah Pengajuan':'Formulir Pengajuan Program'}</h1><span class="pill teal">DRAF TERSIMPAN OTOMATIS</span></div>
  ${x.Catatan?`<div class="note"><b>Catatan verifikator:</b> ${esc(x.Catatan)}</div>`:''}
  <form class="card" onsubmit="kirimForm(event,false)" oninput="simpanDraf()"><div class="cb"><label>Judul Program *</label><input id="fJudul" required value="${esc(x.Judul)}">
  <div class="row2"><div><label>Kawasan Konservasi *</label><select id="fKw" required>${KAWASAN.map(k=>`<option ${k===x.Kawasan?'selected':''}>${k}</option>`).join('')}</select></div><div><label>Zona *</label><select id="fZn" required>${ZONA.map(k=>`<option ${k===x.Zona?'selected':''}>${k}</option>`).join('')}</select></div></div>
  <label>Total Rencana Anggaran (Rp) *</label><input id="fAng" type="number" min="0" required value="${esc(x.Anggaran)}">
  <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button type="button" class="btn" onclick="kirimForm(event,true)">Simpan Draf</button><button class="btn sec" style="margin:0" type="submit">Ajukan Sekarang</button></div></div></form>${x.ID?berkasPanel(x):'<div class="note">Simpan draf terlebih dahulu untuk mengunggah berkas persyaratan.</div>'}`}
function ambilForm(){return{judul:$('fJudul').value.trim(),kawasan:$('fKw').value,zona:$('fZn').value,anggaran:$('fAng').value}}
function simpanDraf(){if(S.sel)return;store.set('sk_draft',ambilForm())}
function pulihDraf(){const d=!S.sel&&store.get('sk_draft');if(d){$('fJudul').value=d.judul||'';$('fKw').value=d.kawasan;$('fZn').value=d.zona;$('fAng').value=d.anggaran||''}}
async function kirimForm(e,draf){e.preventDefault();const f=ambilForm();
  if(!f.judul||f.anggaran==='')return toast('Lengkapi judul dan anggaran.',1);
  const r=await aksi('simpanPengajuan',Object.assign(f,{ID:S.sel,draf}),null);
  if(r&&r.success){store.del('sk_draft');if(draf){S.sel=r.data.ID;render();toast('Draf disimpan. Silakan unggah berkas persyaratan.')}else{toast('Pengajuan terkirim');S.hist=[];go('pengajuan')}}}

/* ── Data mitra, verifikasi akun (Admin) ── */
function mitra(){const adm=S.user.Peran==='admin',v=S.page==='mitraverif';
  const L=S.mitra.filter(x=>(!v||x.Status==='Menunggu Verifikasi')&&(!S.q||[x.Nama,x.Lembaga,x.Email].join(' ').toLowerCase().includes(S.q)));
  return `<div class="ph"><h1>${v?'Verifikasi Pendaftaran Mitra':'Data Calon Mitra & Mitra Resmi'}</h1></div><div class="card"><div class="tw">${L.length?`<table><thead><tr><th>Lembaga</th><th>Jenis</th><th>Penanggung Jawab</th><th>Status</th>${adm?'<th>Aksi</th>':''}</tr></thead><tbody>${L.map(x=>`<tr style="cursor:default"><td><b>${esc(x.Lembaga)}</b></td><td>${esc(x.JenisMitra)}</td><td>${esc(x.Nama)}<br><small class="mono">${esc(x.Email)}</small></td><td>${pill(x.Status)}</td>${adm?`<td>${x.Status==='Menunggu Verifikasi'?`<button class="btn sm sec" onclick="verif('${x.ID}',1)">Setujui</button> <button class="btn sm bad" onclick="verif('${x.ID}',0)">Tolak</button>`:''}</td>`:''}</tr>`).join('')}</tbody></table>`:'<div class="empty">Tidak ada data.</div>'}</div></div>`}
async function verif(id,s){const m=S.mitra.find(a=>a.ID===id),old=m.Status;m.Status=s?'Aktif':'Ditolak';render();
  const r=await call('api',S.token,'verifMitra',{id,setuju:!!s}).catch(()=>({success:false,message:'Gagal terhubung'}));
  if(r.auth)return authLost();if(!r.success){m.Status=old;render();toast(r.message,1)}else{S.ver=0;segarkan();toast(s?'Mitra disetujui':'Pendaftaran ditolak')}}

/* ── Laporan: ekspor CSV dari data lokal ── */
function ekspor(){const rows=[['Nomor','Lembaga','Judul','Kawasan','Zona','Anggaran','Tahap','Status','Tanggal']].concat(S.pengajuan.map(x=>[x.Nomor,x.Lembaga,x.Judul,x.Kawasan,x.Zona,x.Anggaran,x.Tahap,x.Status,tgl(x.Tanggal)]));
  const csv=rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='sikakon-pengajuan.csv';a.click()}

/* ── Berkas persyaratan (unggah ke Drive, pratinjau modal, verifikasi) ── */
const pillDok=s=>`<span class="pill ${s==='Sesuai'||s==='Ada'?'teal':/Tidak/.test(s)?'red':'amb'}">${esc(s).toUpperCase()}</span>`;
const ukur=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.ceil(b/1024)+' KB';
function berkasPanel(x){
  const D=S.dok.filter(d=>d.PengajuanID===x.ID),role=S.user.Peran,edit=role==='mitra'&&(x.Status==='Draf'||x.Status==='Perlu Perbaikan'),cek=['admin','bidang'].includes(role);
  return `<div class="card" style="margin-top:24px"><header><h2>Berkas Persyaratan <span class="pill mono">${D.length}/30</span></h2><small>Maks. 5 MB · PDF / JPG / PNG / ZIP</small></header><div class="cb">
  ${edit?WAJIB.filter(j=>!D.some(d=>d.Jenis===j)).map(j=>`<div class="note">Wajib diunggah: <b>${j}</b></div>`).join(''):''}
  ${role==='admin'&&x.Tahap>=5?`<div class="note"><b>Surat Perjanjian bertanda tangan (Kadis & Kepala UPTD)</b><br><input id="uFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onchange="unggah('${x.ID}')"><input type="hidden" id="uJenis" value="Surat Perjanjian (TTD)"><div id="uInfo" class="hint"></div></div>`:''}
  ${edit?`<div class="row2"><div><label>Jenis Berkas</label><select id="uJenis">${JENIS.map(j=>`<option>${j}</option>`).join('')}</select></div><div><label>Pilih Berkas</label><input id="uFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.zip" onchange="unggah('${x.ID}')"></div></div><div id="uInfo" class="hint"></div>`:''}
  ${D.length?`<div class="tw"><table><thead><tr><th>Jenis</th><th>Berkas</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${D.map(d=>`<tr style="cursor:default"><td>${esc(d.Jenis)}</td><td>${esc(d.Nama)}<br><small class="mono">${ukur(d.Ukuran)}</small>${d.Catatan?`<br><small>${esc(d.Catatan)}</small>`:''}</td><td>${pillDok(d.Status)}</td><td style="white-space:nowrap">${String(d.ID).startsWith('tmp')?'':`<button class="btn sm" onclick="bukaBerkas('${d.ID}')">Lihat</button> <button class="btn sm" onclick="bukaBerkas('${d.ID}',1)">Unduh</button>`}${edit||role==='admin'&&d.Jenis==='Surat Perjanjian (TTD)'?` <button class="btn sm bad" onclick="hapusBerkas('${d.ID}')">Hapus</button>`:''}${cek?` <select style="width:auto;height:32px" onchange="verDok('${d.ID}',this.value)">${['Belum Diperiksa','Ada','Tidak Ada','Sesuai','Tidak Sesuai'].map(o=>`<option ${o===d.Status?'selected':''}>${o}</option>`).join('')}</select>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada berkas.</div>'}</div></div>`}
function segarPaksa(){S.ver=0;segarkan()}
async function unggah(id){const f=$('uFile').files[0];if(!f)return;
  const ok=['application/pdf','image/jpeg','image/png','application/zip','application/x-zip-compressed'];
  if(!ok.includes(f.type))return toast('Jenis berkas tidak diizinkan.',1);
  if(f.size>5*1048576)return toast('Ukuran berkas melebihi 5 MB.',1);
  if(S.dok.filter(d=>d.PengajuanID===id).length>=30)return toast('Maksimal 30 berkas per pengajuan.',1);
  const jenis=$('uJenis').value,mime=f.type==='application/x-zip-compressed'?'application/zip':f.type;$('uInfo').textContent='Mengunggah '+f.name+'…';
  const data=await new Promise((a,b)=>{const r=new FileReader();r.onload=()=>a(r.result.split(',')[1]);r.onerror=b;r.readAsDataURL(f)});
  const r=await aksi('unggahBerkas',{id,jenis,nama:f.name,mime,data},()=>S.dok.push({ID:'tmp'+Date.now(),PengajuanID:id,Jenis:jenis,Nama:f.name,Ukuran:f.size,Status:'Mengunggah…',Mime:mime}));
  if(r&&r.success)toast('Berkas terunggah');else segarPaksa()}
async function bukaBerkas(id,unduh){toast('Membuka berkas…');
  const r=await call('ambilBerkas',S.token,id).catch(e=>({success:false,message:e.message}));
  if(r.auth)return authLost();if(!r.success)return toast(r.message,1);
  const d=r.data,url=URL.createObjectURL(new Blob([Uint8Array.from(atob(d.data),c=>c.charCodeAt(0))],{type:d.mime}));
  if(unduh||!/pdf|image/.test(d.mime)){const a=document.createElement('a');a.href=url;a.download=d.nama;a.click();return}
  $('pvT').textContent=d.nama;$('pvD').hidden=0;$('pvB').innerHTML=d.mime==='application/pdf'?`<iframe src="${url}"></iframe>`:`<img src="${url}" alt="">`;$('pvD').onclick=()=>bukaBerkas(id,1);$('pv').hidden=0}
async function hapusBerkas(id){const r=await aksi('hapusBerkas',{id},()=>{S.dok=S.dok.filter(d=>d.ID!==id)});if(!r||!r.success)segarPaksa()}
async function verDok(id,status){const r=await aksi('verifDokumen',{id,status,catatan:($('cat')||{}).value||''},()=>{const d=S.dok.find(a=>a.ID===id);if(d)d.Status=status});if(!r||!r.success)segarPaksa();else toast('Status berkas: '+status)}

/* ── Kelola Akun (Admin) ── */
function akunPage(){const e=S.akun.find(a=>a.ID===S.editAkun)||{},L=S.akun.filter(x=>!S.q||[x.Nama,x.Email,x.Lembaga].join(' ').toLowerCase().includes(S.q));
  return `<div class="ph"><h1>Kelola Akun</h1><span class="pill teal">${S.akun.length} AKUN</span></div>
  <form class="card" style="margin-bottom:24px" onsubmit="simpanAkun(event)"><header><h2>${e.ID?'Ubah Akun':'Tambah Akun'}</h2></header><div class="cb"><div class="row2">
  <div><label>Nama Lengkap *</label><input id="aNama" required value="${esc(e.Nama)}"></div><div><label>Email *</label><input id="aEmail" type="email" required value="${esc(e.Email)}"></div>
  <div><label>Peran *</label><select id="aPeran">${PERAN_AKUN.map(p=>`<option value="${p}" ${p===e.Peran?'selected':''}>${PERAN[p]}</option>`).join('')}</select></div><div><label>Lembaga / Unit</label><input id="aLem" value="${esc(e.Lembaga)}"></div>
  <div><label>Status</label><select id="aSt">${['Aktif','Menunggu Verifikasi','Ditolak','Nonaktif'].map(p=>`<option ${p===(e.Status||'Aktif')?'selected':''}>${p}</option>`).join('')}</select></div><div><label>Kata Sandi ${e.ID?'(kosongkan jika tidak diganti)':'*'}</label><input id="aPass" type="password" minlength="8" ${e.ID?'':'required'} autocomplete="new-password"></div></div>
  <div style="display:flex;gap:8px;margin-top:16px"><button class="btn sec" style="margin:0" type="submit">Simpan Akun</button>${e.ID?'<button type="button" class="btn" onclick="S.editAkun=null;render()">Batal</button>':''}</div></div></form>
  <div class="card"><div class="tw"><table><thead><tr><th>Nama</th><th>Peran</th><th>Lembaga</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${L.map(x=>`<tr style="cursor:default"><td><b>${esc(x.Nama)}</b><br><small class="mono">${esc(x.Email)}</small></td><td>${PERAN[x.Peran]||esc(x.Peran)}</td><td>${esc(x.Lembaga)}</td><td>${pill(x.Status)}</td><td style="white-space:nowrap"><button class="btn sm" onclick="S.editAkun='${x.ID}';render();window.scrollTo(0,0)">Ubah</button> ${x.ID===S.user.ID?'':`<button class="btn sm bad" onclick="hapusAkunUI('${x.ID}')">${S.konfirm===x.ID?'Yakin hapus?':'Hapus'}</button>`}</td></tr>`).join('')}</tbody></table></div></div>`}
async function simpanAkun(e){e.preventDefault();
  const r=await aksi('simpanAkun',{ID:S.editAkun,nama:$('aNama').value.trim(),email:$('aEmail').value,peran:$('aPeran').value,lembaga:$('aLem').value,status:$('aSt').value,pass:$('aPass').value},null);
  if(r&&r.success){S.editAkun=null;render();toast('Akun tersimpan')}}
async function hapusAkunUI(id){if(S.konfirm!==id){S.konfirm=id;render();setTimeout(()=>{if(S.konfirm===id){S.konfirm=null;render()}},4000);return}
  S.konfirm=null;S.akun=S.akun.filter(a=>a.ID!==id);render();const r=await aksi('hapusAkun',{id},null);if(!r||!r.success)segarPaksa();else toast('Akun dihapus')}

/* ── Logo: hapus latar putih (flood-fill dari tepi) ── */
function logoBersih(){const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{try{const w=Math.min(256,im.width),h=Math.round(im.height*w/im.width),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h),p=d.data,seen=new Uint8Array(w*h),q=[],lt=i=>p[i*4]>225&&p[i*4+1]>225&&p[i*4+2]>225,push=i=>{if(!seen[i]&&lt(i)){seen[i]=1;q.push(i)}};
  for(let i=0;i<w;i++){push(i);push((h-1)*w+i)}for(let j=0;j<h;j++){push(j*w);push(j*w+w-1)}
  while(q.length){const i=q.pop(),px=i%w;p[i*4+3]=0;if(px>0)push(i-1);if(px<w-1)push(i+1);if(i>=w)push(i-w);if(i<w*(h-1))push(i+w)}
  x.putImageData(d,0,0);const u=c.toDataURL('image/png');document.querySelectorAll('.logo').forEach(e=>e.src=u)}catch(e){}};im.src=LOGO}

/* ── Beranda majalah (publik): tampil dari cache lokal, lalu disegarkan ── */
function showHome(){$('boot').hidden=1;$('app').hidden=1;$('auth').hidden=1;$('home').hidden=0;const c=store.get('sk_pub');if(c)isiHome(c);
  call('publikLaporan').then(r=>{if(r.success){store.set('sk_pub',r.data);isiHome(r.data)}else if(!c)isiHome([])}).catch(()=>{if(!c)isiHome([])})}
function isiHome(L){PUB=L;const f=L[0],img=x=>x.CoverID?`<img src="${COVER(x.CoverID)}" alt="" loading="lazy">`:'<div class="nocov"></div>';
  $('mag').innerHTML=!f?'<div class="card empty">Belum ada laporan kegiatan yang terbit.</div>':`<article class="feat" onclick="baca(0)">${img(f)}<div class="ft"><span class="pill teal">${esc(f.Kawasan||'KONSERVASI').toUpperCase()}</span><h1>${esc(f.Judul)}</h1><p>${esc(f.Ringkasan)}</p><small>${esc(f.Lembaga)} · ${tgl(f.Tanggal)}</small></div></article>
  <div class="mgrid">${L.slice(1).map((x,i)=>`<article class="mc" onclick="baca(${i+1})">${img(x)}<div><span class="pill">${esc(x.Kawasan||'')}</span><h2>${esc(x.Judul)}</h2><p class="muted">${esc(x.Ringkasan)}</p><small>${esc(x.Lembaga)} · ${tgl(x.Tanggal)}</small></div></article>`).join('')}</div>`}
function baca(i){tampilArtikel(PUB[i])}
function tampilArtikel(x){$('pvT').textContent=x.Judul;$('pvD').hidden=1;$('pvB').innerHTML=`<div class="art">${x.CoverID?`<img src="${COVER(x.CoverID)}" alt="">`:''}<small>${esc(x.Lembaga)} · ${esc(x.Kawasan)} · ${tgl(x.Tanggal)}</small><p><b>${esc(x.Ringkasan)}</b></p>${String(x.Isi).split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}</div>`;$('pv').hidden=0}

/* ── Laporan Kegiatan (majalah): Mitra menulis, Admin menerbitkan ── */
function laporan(){const r=S.user.Peran,adm=r==='admin',L=S.laporan.slice().sort((a,b)=>new Date(b.Tanggal)-new Date(a.Tanggal)),sp=s=>`<span class="pill ${s==='Terbit'?'teal':s==='Ditolak'?'red':'amb'}">${esc(s).toUpperCase()}</span>`;
  return `<div class="ph"><h1>Laporan Kegiatan</h1><button class="btn" onclick="ekspor()">Unduh CSV Pengajuan</button></div>
  ${r==='mitra'?`<form class="card" style="margin-bottom:24px" onsubmit="kirimLaporan(event)"><header><h2>Tulis Laporan untuk Majalah</h2></header><div class="cb"><label>Judul *</label><input id="lJ" required maxlength="150"><div class="row2"><div><label>Kawasan</label><select id="lK">${KAWASAN.map(k=>`<option>${k}</option>`).join('')}</select></div><div><label>Foto Sampul (opsional)</label><input id="lC" type="file" accept="image/*"></div></div><label>Ringkasan * (maks. 300 karakter)</label><textarea id="lR" required maxlength="300"></textarea><label>Isi Laporan * (min. 50 karakter)</label><textarea id="lI" style="height:180px" required maxlength="8000"></textarea><button class="btn sec" type="submit">Kirim ke Admin</button></div></form>`:''}
  <div class="card"><header><h2>${r==='mitra'?'Laporan Saya':'Laporan dari Mitra'} <span class="pill">${L.length}</span></h2></header><div class="tw">${L.length?`<table><thead><tr><th>Judul</th><th>Lembaga</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${L.map(x=>`<tr style="cursor:default"><td><b>${esc(x.Judul)}</b><br><small>${esc(x.Kawasan)}</small></td><td>${esc(x.Lembaga)}</td><td>${tgl(x.Tanggal)}</td><td>${sp(x.Status)}</td><td style="white-space:nowrap"><button class="btn sm" onclick="tampilArtikel(S.laporan.find(a=>a.ID==='${x.ID}'))">Baca</button>${adm?` ${x.Status!=='Terbit'?`<button class="btn sm sec" onclick="tinjau('${x.ID}',1)">Terbitkan</button>`:''} ${x.Status==='Menunggu Tinjauan'?`<button class="btn sm bad" onclick="tinjau('${x.ID}',0)">Tolak</button>`:''} <button class="btn sm bad" onclick="hapusLap('${x.ID}')">Hapus</button>`:''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Belum ada laporan.</div>'}</div></div>`}
function kecil(f){return new Promise((ok,no)=>{const im=new Image();im.onload=()=>{const s=Math.min(1,1200/im.width),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.82).split(',')[1])};im.onerror=no;im.src=URL.createObjectURL(f)})}
async function kirimLaporan(e){e.preventDefault();const f=$('lC').files[0];let cover=null;
  if(f){if(!/^image\//.test(f.type))return toast('Sampul harus berupa gambar.',1);cover={mime:'image/jpeg',data:await kecil(f)}}
  const r=await aksi('simpanLaporan',{judul:$('lJ').value,kawasan:$('lK').value,ringkasan:$('lR').value,isi:$('lI').value,cover},null);if(r&&r.success)toast('Laporan terkirim, menunggu tinjauan Admin')}
async function tinjau(id,setuju){const r=await aksi('tinjauLaporan',{id,setuju},null);if(r&&r.success)toast(setuju?'Laporan diterbitkan di beranda':'Laporan ditolak')}
async function hapusLap(id){S.laporan=S.laporan.filter(a=>a.ID!==id);render();const r=await aksi('hapusLaporan',{id},null);if(!r||!r.success)segarPaksa()}

/* ── Jadwal Presentasi (tahap 4) & Monitoring Lapangan (tahap 7), ditentukan Admin ── */
const nmP=id=>{const x=S.pengajuan.find(a=>a.ID===id);return x?`${esc(x.Lembaga)}<br><small>${esc(x.Judul)}</small>`:'-'};
function jadwalMini(){const L=S.jadwal.filter(j=>j.Status==='Terjadwal').sort((a,b)=>new Date(a.Tanggal)-new Date(b.Tanggal)).slice(0,4);
  return `<div class="card" style="margin-bottom:24px"><header><h2>Jadwal Mendatang</h2></header><div class="cb">${L.length?L.map(j=>`<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #F1F5F9"><span class="pill teal">${esc(j.Jenis).toUpperCase()}</span><div style="flex:1">${nmP(j.PengajuanID)}</div><div class="mono">${tgl(j.Tanggal)} ${esc(j.Jam)}<br><small>${esc(j.Tempat)}</small></div></div>`).join(''):'<span class="muted">Belum ada jadwal.</span>'}</div></div>`}
function jadwalPage(jenis){const adm=S.user.Peran==='admin',pres=jenis==='Presentasi',tahap=pres?4:7,JL=S.jadwal.filter(j=>j.Jenis===jenis).sort((a,b)=>new Date(a.Tanggal)-new Date(b.Tanggal)),cand=S.pengajuan.filter(x=>x.Tahap==tahap&&!/Perbaikan|Ditolak/.test(x.Status));
  return `<div class="ph"><h1>${pres?'Presentasi & Berita Acara':'Monitoring & Monev Lapangan'}</h1></div>
  ${adm?`<form class="card" style="margin-bottom:24px" onsubmit="simpanJadwal(event,'${jenis}')"><header><h2>Tentukan Jadwal ${pres?'Presentasi':'Monitoring ke Lapangan'}</h2></header><div class="cb"><div class="row2"><div><label>Mitra / Program *</label><select id="jP" required>${cand.length?cand.map(x=>`<option value="${x.ID}">${esc(x.Lembaga)} — ${esc(x.Judul)}</option>`).join(''):'<option value="">Tidak ada pengajuan pada tahap ini</option>'}</select></div><div><label>Tanggal *</label><input id="jT" type="date" required></div><div><label>Jam</label><input id="jJ" type="time"></div><div><label>${pres?'Tempat / Tautan Daring':'Lokasi Kunjungan'} *</label><input id="jL" required></div></div><label>${pres?'Catatan / Peserta':'Fokus pemeriksaan (kesesuaian dengan isi perjanjian)'}</label><textarea id="jC"></textarea><button class="btn sec" type="submit" ${cand.length?'':'disabled'}>Simpan Jadwal</button></div></form>`:''}
  <div class="card"><header><h2>Daftar Jadwal <span class="pill">${JL.length}</span></h2></header><div class="tw">${JL.length?`<table><thead><tr><th>Waktu</th><th>Mitra / Program</th><th>${pres?'Tempat':'Lokasi & Fokus'}</th><th>Status</th>${adm?'<th>Aksi</th>':''}</tr></thead><tbody>${JL.map(j=>`<tr style="cursor:default"><td class="mono">${tgl(j.Tanggal)}<br>${esc(j.Jam)}</td><td>${nmP(j.PengajuanID)}</td><td>${esc(j.Tempat)}${j.Catatan?`<br><small>${esc(j.Catatan)}</small>`:''}${j.Hasil?`<br><small><b>Hasil:</b> ${esc(j.Hasil)}</small>`:''}</td><td><span class="pill ${j.Status==='Selesai'?'teal':'amb'}">${esc(j.Status).toUpperCase()}</span></td>${adm?`<td style="min-width:200px">${j.Status==='Terjadwal'?`<input id="h${j.ID}" placeholder="${pres?'Hasil pembahasan (BA)':'Temuan lapangan'}" style="margin-bottom:6px"><button class="btn sm sec" onclick="selesaiJ('${j.ID}')">Selesai</button> `:''}<button class="btn sm bad" onclick="hapusJ('${j.ID}')">Hapus</button></td>`:''}</tr>`).join('')}</tbody></table>`:'<div class="empty">Belum ada jadwal.</div>'}</div></div>`}
async function simpanJadwal(e,jenis){e.preventDefault();const r=await aksi('simpanJadwal',{jenis,pengajuanId:$('jP').value,tanggal:$('jT').value,jam:$('jJ').value,tempat:$('jL').value,catatan:$('jC').value},null);if(r&&r.success)toast('Jadwal tersimpan')}
async function selesaiJ(id){const r=await aksi('selesaiJadwal',{id,hasil:$('h'+id).value},null);if(r&&r.success)toast('Jadwal ditandai selesai')}
async function hapusJ(id){S.jadwal=S.jadwal.filter(a=>a.ID!==id);render();const r=await aksi('hapusJadwal',{id},null);if(!r||!r.success)segarPaksa()}

/* ── Perjanjian PKS: mitra yang telah bekerja sama dengan dinas ── */
function pks(){const L=S.pengajuan.filter(x=>x.Tahap>=6&&x.Status!=='Ditolak'&&(!S.q||[x.Lembaga,x.Judul].join(' ').toLowerCase().includes(S.q))),ttd=x=>S.dok.find(d=>d.PengajuanID===x.ID&&d.Jenis==='Surat Perjanjian (TTD)');
  return `<div class="ph"><h1>Perjanjian Kerja Sama (PKS)</h1><span class="pill teal">${L.length} MITRA BERKERJA SAMA</span></div><div class="card"><div class="tw">${L.length?`<table><thead><tr><th>Mitra</th><th>Program & Kawasan</th><th>Anggaran</th><th>Status</th><th>Surat PKS</th></tr></thead><tbody>${L.map(x=>{const t=ttd(x);return `<tr onclick="go('detail','${x.ID}')"><td><b>${esc(x.Lembaga)}</b><br><small class="mono">${esc(x.Nomor)}</small></td><td>${esc(x.Judul)}<br><small>${esc(x.Kawasan)} · ${esc(x.Zona)}</small></td><td class="mono">${rp(x.Anggaran)}</td><td>${pill(x.Status)}</td><td>${t?`<button class="btn sm" onclick="event.stopPropagation();bukaBerkas('${t.ID}')">Lihat Surat</button>`:'<small>Belum ada</small>'}</td></tr>`}).join('')}</tbody></table>`:'<div class="empty">Belum ada mitra yang menjalin kerja sama.</div>'}</div></div>`}

/* ── Inisialisasi: tampil seketika dari cache lokal, lalu segarkan ── */
window.addEventListener('DOMContentLoaded',()=>{
  logoBersih();
  const t=ses.get(),c=store.get('sk_cache');
  if(t&&c&&c.user){S.token=t;Object.assign(S,{user:c.user,pengajuan:c.pengajuan,mitra:c.mitra||[],akun:c.akun||[],dok:c.dok||[],jadwal:c.jadwal||[],laporan:c.laporan||[],ver:c.ver});masuk();setSync('run');segarkan()}
  else showHome();
  setInterval(()=>{if(!document.hidden)segarkan()},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)segarkan()});
});