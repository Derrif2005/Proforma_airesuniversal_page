// js/ui.js
// Helpers visuales del formulario: números, autosize, filas, totales, fecha.

function parseNum(str){
  if(!str) return 0;
  const n = parseFloat(String(str).replace(/[^\d.-]/g,''));
  return isNaN(n) ? 0 : n;
}

function formatNum(n){
  const rounded = Math.round(n || 0);
  const neg = rounded < 0;
  const s = Math.abs(rounded).toString();
  let out = '';
  for(let i=0; i<s.length; i++){
    const posFromEnd = s.length - i;
    out += s[i];
    if(posFromEnd > 1 && posFromEnd % 3 === 1){ out += ','; }
  }
  return (neg ? '-' : '') + out;
}

function getTextWidth(text, font){
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text).width;
}

function autosizeInput(el){
  if(el.classList.contains('desc')) return;
  el.classList.add('autosize');
  const cs = window.getComputedStyle(el);
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const text = el.value.length ? el.value : (el.placeholder || '');
  const width = getTextWidth(text, font) + 16;
  el.style.width = Math.max(width, 18) + 'px';
}

function autoResizeDesc(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight + 2) + 'px';
}

function autosizeAll(scope){
  (scope || document).querySelectorAll('input[type="text"]').forEach(autosizeInput);
  (scope || document).querySelectorAll('textarea.desc').forEach(autoResizeDesc);
}

document.addEventListener('input', (e)=>{
  if(e.target.matches('input[type="text"]')) autosizeInput(e.target);
  if(e.target.matches('textarea.desc')) autoResizeDesc(e.target);
});

let descResizeTimer;
window.addEventListener('resize', ()=>{
  clearTimeout(descResizeTimer);
  descResizeTimer = setTimeout(()=>{
    document.querySelectorAll('textarea.desc').forEach(autoResizeDesc);
  }, 120);
});

function setToday(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const f = document.getElementById('fecha');
  if(f) f.value = dd + '/' + mm + '/' + yyyy;
}

function toggleEmptyMsg(){
  const body = document.getElementById('itemsBody');
  const msg = document.getElementById('emptyMsg');
  if(body && msg) msg.style.display = body.rows.length ? 'none' : 'block';
}

function recalcRow(el){
  const row = el.closest('tr');
  const cant = parseNum(row.querySelector('.cant').value);
  const unit = parseNum(row.querySelector('.unit').value);
  const disc = parseNum(row.querySelector('.disc').value);
  const total = Math.max(0, cant * unit - disc);
  row.querySelector('.total').innerText = formatNum(total);
  recalcTotals();
}

function recalcTotals(){
  let subtotal = 0, ivaTotal = 0;
  const rows = document.querySelectorAll('#itemsBody tr');
  for(let i=0; i<rows.length; i++){
    const row = rows[i];
    const cant = parseNum(row.querySelector('.cant').value);
    const unit = parseNum(row.querySelector('.unit').value);
    const disc = parseNum(row.querySelector('.disc').value);
    const rowTotal = Math.max(0, cant * unit - disc);
    subtotal += rowTotal;
    if(row.querySelector('.iva-check').checked) ivaTotal += rowTotal * 0.13;
  }
  const total = subtotal + ivaTotal;
  const s = document.getElementById('subtotal');
  const i = document.getElementById('iva');
  const t = document.getElementById('total');
  if(s) s.innerText = formatNum(subtotal);
  if(i) i.innerText = formatNum(ivaTotal);
  if(t) t.innerText = formatNum(total);
}

function delRow(btn){
  btn.closest('tr').remove();
  toggleEmptyMsg();
  recalcTotals();
}

function addRow(){
  const body = document.getElementById('itemsBody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="cell-desc" data-label="Descripción">
      <textarea class="desc" rows="1" placeholder="Descripción del servicio o producto"></textarea>
    </td>
    <td class="cell-cant" data-label="Cant">
      <input type="text" class="cant" value="1" inputmode="decimal" oninput="recalcRow(this)">
    </td>
    <td class="cell-unit" data-label="Precio Unit">
      <span class="cur">₡</span><input type="text" class="unit" value="0" inputmode="decimal" oninput="recalcRow(this)">
    </td>
    <td class="cell-disc" data-label="Descuento">
      <span class="cur">₡</span><input type="text" class="disc" value="0" inputmode="decimal" oninput="recalcRow(this)">
    </td>
    <td class="cell-iva" data-label="IVA 13%">
      <input type="checkbox" class="iva-check" checked onchange="recalcTotals()">
    </td>
    <td class="cell-total" data-label="Total">
      <span class="cur">₡</span><span class="total">0</span>
    </td>
    <td class="cell-del">
      <button class="del-row" onclick="delRow(this)">✕</button>
    </td>
  `;
  body.appendChild(row);
  toggleEmptyMsg();
  recalcTotals();
  autosizeAll(row);
}