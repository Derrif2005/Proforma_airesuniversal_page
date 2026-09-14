// js/app.js

/* =========================================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================================= */
function mostrarVista(nombre){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const vista = document.getElementById('view-' + nombre);
  if(vista) vista.classList.add('active');

  document.querySelectorAll('.sidebar .nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === nombre);
  });

  if(nombre === 'dashboard') cargarDashboard();
  if(nombre === 'lista') cargarCotizaciones();
  if(nombre === 'nueva' && !window.cotizacionEditandoId){
    bloquearSheet();
  }
}

/* =========================================================
   BLOQUEO / EDICIÓN DEL SHEET
   ========================================================= */
function bloquearSheet(){
  document.getElementById('sheet').classList.add('locked');
  const g = document.getElementById('btnGuardar');
  const ge = document.getElementById('btnGenerar');
  if(g) g.disabled = true;
  if(ge) ge.disabled = false;
}

function activarEdicion(){
  document.getElementById('sheet').classList.remove('locked');
  const g = document.getElementById('btnGuardar');
  const ge = document.getElementById('btnGenerar');
  if(g) g.disabled = false;
  if(ge) ge.disabled = true;

  if(document.querySelectorAll('#itemsBody tr').length === 0){
    addRow();
  }
  document.querySelector('#sheet input')?.focus();
}

/* =========================================================
   CRUD SUPABASE
   ========================================================= */
async function listarCotizaciones() {
  const { data, error } = await db
    .from("cotizaciones")
    .select("*, cotizacion_detalles(*)")
    .order("id", { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

async function obtenerCotizacion(id) {
  const { data, error } = await db
    .from("cotizaciones")
    .select("*, cotizacion_detalles(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function crearCotizacion(cotizacion, detalles) {
  const { data, error } = await db
    .from("cotizaciones")
    .insert(cotizacion)
    .select()
    .single();
  if (error) throw error;

  const filas = detalles.map(d => ({
    cotizacion_id: data.id,
    descripcion: d.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    descuento: d.descuento,
    aplica_iva: d.aplica_iva,
    total: d.total
  }));

  if (filas.length) {
    const { error: detalleError } = await db.from("cotizacion_detalles").insert(filas);
    if (detalleError) {
      await db.from("cotizaciones").delete().eq("id", data.id);
      throw detalleError;
    }
  }
  return obtenerCotizacion(data.id);
}

async function actualizarCotizacion(id, cotizacion, detalles) {
  const { error } = await db.from("cotizaciones").update(cotizacion).eq("id", id);
  if (error) throw error;

  const { error: deleteError } = await db
    .from("cotizacion_detalles").delete().eq("cotizacion_id", id);
  if (deleteError) throw deleteError;

  const filas = detalles.map(d => ({
    cotizacion_id: id,
    descripcion: d.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    descuento: d.descuento,
    aplica_iva: d.aplica_iva,
    total: d.total
  }));

  if (filas.length) {
    const { error: detalleError } = await db.from("cotizacion_detalles").insert(filas);
    if (detalleError) throw detalleError;
  }
  return obtenerCotizacion(id);
}

async function eliminarCotizacion(id) {
  const { error } = await db.from("cotizaciones").delete().eq("id", id);
  if (error) throw error;
}

async function buscarCotizaciones(texto) {
  const valor = (texto || "").trim();
  if (!valor) return listarCotizaciones();

  const { data, error } = await db
    .from("cotizaciones")
    .select("*, cotizacion_detalles(*)")
    .or(`cliente.ilike.%${valor}%,numero.ilike.%${valor}%`)
    .order("id", { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

/* =========================================================
   HELPERS
   ========================================================= */
function formatoDinero(valor) {
  return Number(valor || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   NUEVA COTIZACIÓN / LIMPIAR
   ========================================================= */
function nuevaCotizacion(){
  window.cotizacionEditandoId = null;

  ['cliente','telefono','direccion','vendedor','observacion'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('itemsBody').innerHTML = '';
  document.getElementById('quoteNum').value = 'AUTOMÁTICO';
  document.getElementById('validDays').value = '15';

  if(typeof setToday === 'function') setToday();
  if(typeof toggleEmptyMsg === 'function') toggleEmptyMsg();
  if(typeof recalcTotals === 'function') recalcTotals();

  bloquearSheet();
  mostrarVista('nueva');
}

/* =========================================================
   LISTA (con botones ver/editar/borrar/pdf)
   ========================================================= */
async function cargarCotizaciones() {
  const body = document.getElementById("crudBody");
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" class="crud-empty">Cargando...</td></tr>';

  const datos = await listarCotizaciones();
  if (!datos.length) {
    body.innerHTML = '<tr><td colspan="5" class="crud-empty">No hay cotizaciones guardadas.</td></tr>';
    return;
  }
  body.innerHTML = datos.map(c => `
    <tr>
      <td>${escapeHtml(c.numero)}</td>
      <td>${escapeHtml(c.fecha)}</td>
      <td>${escapeHtml(c.cliente)}</td>
      <td>₡ ${formatoDinero(c.total)}</td>
      <td>
        <button class="btn-ver" type="button" onclick="verCotizacion(${c.id})">Ver</button>
        <button class="btn-edit" type="button" onclick="editarCotizacion(${c.id})">Editar</button>
        <button class="btn-del" type="button" onclick="borrarCotizacion(${c.id})">Eliminar</button>
        <button class="btn-pdf" type="button" onclick="pdfCotizacion(${c.id})">PDF</button>
      </td>
    </tr>
  `).join("");
}

async function buscarDesdePanel() {
  const texto = document.getElementById("crudSearch")?.value || "";
  const datos = await buscarCotizaciones(texto);
  const body = document.getElementById("crudBody");
  if (!datos.length) {
    body.innerHTML = '<tr><td colspan="5" class="crud-empty">No se encontraron cotizaciones.</td></tr>';
    return;
  }
  body.innerHTML = datos.map(c => `
    <tr>
      <td>${escapeHtml(c.numero)}</td>
      <td>${escapeHtml(c.fecha)}</td>
      <td>${escapeHtml(c.cliente)}</td>
      <td>₡ ${formatoDinero(c.total)}</td>
      <td>
        <button class="btn-ver" type="button" onclick="verCotizacion(${c.id})">Ver</button>
        <button class="btn-edit" type="button" onclick="editarCotizacion(${c.id})">Editar</button>
        <button class="btn-del" type="button" onclick="borrarCotizacion(${c.id})">Eliminar</button>
        <button class="btn-pdf" type="button" onclick="pdfCotizacion(${c.id})">PDF</button>
      </td>
    </tr>
  `).join("");
}

async function verCotizacion(id) {
  const c = await obtenerCotizacion(id);
  alert(
    `Cotización: ${c.numero}\n` +
    `Fecha: ${c.fecha}\n` +
    `Cliente: ${c.cliente}\n` +
    `Teléfono: ${c.telefono}\n` +
    `Dirección: ${c.direccion}\n` +
    `Vendedor: ${c.vendedor}\n` +
    `Total: ₡ ${formatoDinero(c.total)}`
  );
}

async function editarCotizacion(id) {
  const c = await obtenerCotizacion(id);

  document.getElementById('cliente').value = c.cliente || '';
  document.getElementById('telefono').value = c.telefono || '';
  document.getElementById('direccion').value = c.direccion || '';
  document.getElementById('vendedor').value = c.vendedor || '';
  document.getElementById('observacion').value = c.observacion || '';
  document.getElementById('quoteNum').value = c.numero;
  document.getElementById('validDays').value = c.dias_validez || 15;

  const body = document.getElementById('itemsBody');
  body.innerHTML = '';
  (c.cotizacion_detalles || []).forEach(d => {
    addRow();
    const last = body.lastElementChild;
    last.querySelector('.desc').value = d.descripcion || '';
    last.querySelector('.cant').value = d.cantidad;
    last.querySelector('.unit').value = d.precio_unitario;
    last.querySelector('.disc').value = d.descuento;
    last.querySelector('.iva-check').checked = d.aplica_iva;
    recalcRow(last.querySelector('.cant'));
  });

  toggleEmptyMsg();
  recalcTotals();
  autosizeAll(body);

  window.cotizacionEditandoId = id;
  activarEdicion();
  mostrarVista('nueva');
}

async function borrarCotizacion(id) {
  const c = await obtenerCotizacion(id);
  if (!confirm(`¿Eliminar la cotización ${c.numero}?`)) return;
  try {
    await eliminarCotizacion(id);
    await cargarCotizaciones();
    cargarDashboard();
  } catch (error) {
    alert("No se pudo eliminar la cotización: " + error.message);
  }
}

async function pdfCotizacion(id) {
  const c = await obtenerCotizacion(id);
  window.cotizacionPDFData = c;
  if (typeof generarPDF === "function") {
    await generarPDF(`${c.numero}.pdf`);
  } else {
    alert("La función de PDF todavía no está disponible.");
  }
}

/* =========================================================
   GUARDAR COTIZACIÓN
   ========================================================= */
async function guardarCotizacion(){
  const btn = document.getElementById('btnGuardar');
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = '⏳ Guardando...';

  try{
    const cabecera = {
      cliente: document.getElementById('cliente')?.value || '',
      telefono: document.getElementById('telefono')?.value || '',
      direccion: document.getElementById('direccion')?.value || '',
      vendedor: document.getElementById('vendedor')?.value || '',
      observacion: document.getElementById('observacion')?.value || '',
      dias_validez: parseInt(document.getElementById('validDays').value || 15, 10),
      subtotal: parseNum(document.getElementById('subtotal').innerText),
      iva: parseNum(document.getElementById('iva').innerText),
      total: parseNum(document.getElementById('total').innerText)
    };

    const detalles = [...document.querySelectorAll('#itemsBody tr')].map(tr => ({
      descripcion: tr.querySelector('.desc').value,
      cantidad: parseNum(tr.querySelector('.cant').value),
      precio_unitario: parseNum(tr.querySelector('.unit').value),
      descuento: parseNum(tr.querySelector('.disc').value),
      aplica_iva: tr.querySelector('.iva-check').checked,
      total: parseNum(tr.querySelector('.total').innerText)
    })).filter(d => d.descripcion.trim() || d.total > 0);

    if(!cabecera.cliente.trim()){ alert('Debes indicar el nombre del cliente.'); return; }
    if(!detalles.length){ alert('Debes agregar al menos una línea.'); return; }

    let resultado;
    if(window.cotizacionEditandoId){
      resultado = await actualizarCotizacion(window.cotizacionEditandoId, cabecera, detalles);
    } else {
      resultado = await crearCotizacion(cabecera, detalles);
    }

    document.getElementById('quoteNum').value = resultado.numero;
    window.cotizacionEditandoId = resultado.id;

    alert('✅ Cotización guardada: ' + resultado.numero);
    bloquearSheet();
    cargarCotizaciones();
    cargarDashboard();
  } catch(err){
    console.error(err);
    alert('Error al guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */
async function cargarDashboard(){
  const datos = await listarCotizaciones();
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  let total = datos.length, delMes = 0, montoTotal = 0, montoMes = 0;

  datos.forEach(c => {
    const monto = Number(c.total || 0);
    montoTotal += monto;
    const f = new Date(c.fecha);
    if(f.getMonth() === mesActual && f.getFullYear() === anioActual){
      delMes++; montoMes += monto;
    }
  });

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statMes').textContent = delMes;
  document.getElementById('statMonto').textContent = '₡ ' + formatoDinero(montoTotal);
  document.getElementById('statMontoMes').textContent = '₡ ' + formatoDinero(montoMes);

  const recientes = datos.slice(0, 5);
  const tbody = document.getElementById('dashRecientes');
  tbody.innerHTML = recientes.length
    ? recientes.map(c => `
        <tr>
          <td>${escapeHtml(c.numero)}</td>
          <td>${escapeHtml(c.fecha)}</td>
          <td>${escapeHtml(c.cliente)}</td>
          <td>₡ ${formatoDinero(c.total)}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" class="crud-empty">Sin datos.</td></tr>';
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  bloquearSheet();
  mostrarVista('dashboard');
});