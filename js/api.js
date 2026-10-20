/* Lapisan API — semua komunikasi ke Google Apps Script lewat fetch() */
async function call(fn, ...args){
  if(!GAS_URL || GAS_URL.indexOf('ISI_')===0) throw new Error('GAS_URL belum diisi di js/config.js');
  const res = fn==='publikLaporan'
    ? await fetch(GAS_URL + '?action=publik')
    // WAJIB text/plain: Content-Type JSON memicu preflight CORS yang diblok GAS
    : await fetch(GAS_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({fn, args})});
  if(!res.ok) throw new Error('Server merespons ' + res.status);
  return res.json();
}
