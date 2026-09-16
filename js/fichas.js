// js/fichas.js
// Fichas técnicas: mismo patrón que js/app.js (cotizaciones), pero para
// las fichas técnicas de servicio que se entregan al cliente como
// respaldo del trabajo realizado.

/* =========================================================
   BLOQUEO / EDICIÓN DEL SHEET DE FICHA
   ========================================================= */
function bloquearSheetFicha(){
  document.getElementById('sheetFicha').classList.add('locked');
  const g = document.getElementById('btnGuardarFicha');
  const ge = document.getElementById('btnGenerarFicha');
  if(g) g.disabled = true;
  if(ge) ge.disabled = false;
}

function activarEdicionFicha(){
  document.getElementById('sheetFicha').classList.remove('locked');
  const g = document.getElementById('btnGuardarFicha');
  const ge = document.getElementById('btnGenerarFicha');
  if(g) g.disabled = false;
  if(ge) ge.disabled = true;
  document.querySelector('#sheetFicha input')?.focus();
}

function setTodayFicha(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const f = document.getElementById('fFecha');
  if(f) f.value = dd + '/' + mm + '/' + yyyy;
}

/* =========================================================
   CRUD SUPABASE
   ========================================================= */
async function listarFichas() {
  const { data, error } = await db
    .from("fichas_tecnicas")
    .select("*")
    .order("id", { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

async function obtenerFicha(id) {
  const { data, error } = await db
    .from("fichas_tecnicas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function crearFicha(ficha) {
  const { data, error } = await db
    .from("fichas_tecnicas")
    .insert(ficha)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function actualizarFicha(id, ficha) {
  const { data, error } = await db
    .from("fichas_tecnicas")
    .update(ficha)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function eliminarFicha(id) {
  const { error } = await db.from("fichas_tecnicas").delete().eq("id", id);
  if (error) throw error;
}

async function buscarFichas(texto) {
  const valor = (texto || "").trim();
  if (!valor) return listarFichas();

  const { data, error } = await db
    .from("fichas_tecnicas")
    .select("*")
    .or(`cliente.ilike.%${valor}%,numero.ilike.%${valor}%,tecnico.ilike.%${valor}%`)
    .order("id", { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

/* =========================================================
   NUEVA FICHA / LIMPIAR
   ========================================================= */
function nuevaFicha(){
  window.fichaEditandoId = null;

  const campos = [
    'fCliente','fCedula','fTelefono','fDireccion','fContacto','fTecnico',
    'fActivo','fPersonaCargo','fReferencia','fMarca','fModelo','fTipoEquipo',
    'fBtu','fGarantia','fRefrigerante','fVoltaje','fAmperaje','fAntes',
    'fDespues','fUbicacion'
  ];
  campos.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });

  const areas = ['fMateriales','fObservaciones'];
  areas.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });

  ['fInstalacion','fMantPrev','fMantCorr'].forEach(id => {
    const el = document.getElementById(id); if(el) el.checked = false;
  });

  document.getElementById('fichaNum').value = 'AUTOMÁTICO';
  setTodayFicha();
  autosizeAll(document.getElementById('sheetFicha'));

  bloquearSheetFicha();
  mostrarVista('fichaNueva');
}

/* =========================================================
   LLENAR EL SHEET CON LOS DATOS DE UNA FICHA
   ========================================================= */
function llenarSheetFicha(f){
  document.getElementById('fichaNum').value = f.numero;
  document.getElementById('fFecha').value = f.fecha ? formatoFechaFicha(f.fecha) : '';

  document.getElementById('fCliente').value = f.cliente || '';
  document.getElementById('fCedula').value = f.cliente_cedula || '';
  document.getElementById('fTelefono').value = f.telefono || '';
  document.getElementById('fDireccion').value = f.direccion || '';
  document.getElementById('fContacto').value = f.contacto || '';
  document.getElementById('fTecnico').value = f.tecnico || '';
  document.getElementById('fActivo').value = f.activo || '';
  document.getElementById('fPersonaCargo').value = f.persona_cargo || '';
  document.getElementById('fReferencia').value = f.referencia || '';

  document.getElementById('fMarca').value = f.marca || '';
  document.getElementById('fModelo').value = f.modelo || '';
  document.getElementById('fTipoEquipo').value = f.tipo_equipo || '';
  document.getElementById('fBtu').value = f.capacidad_btu || '';
  document.getElementById('fGarantia').value = f.tiempo_garantia || '';
  document.getElementById('fRefrigerante').value = f.tipo_refrigerante || '';
  document.getElementById('fVoltaje').value = f.voltaje || '';
  document.getElementById('fAmperaje').value = f.amperaje || '';
  document.getElementById('fAntes').value = f.lectura_antes || '';
  document.getElementById('fDespues').value = f.lectura_despues || '';

  document.getElementById('fInstalacion').checked = !!f.instalacion;
  document.getElementById('fMantPrev').checked = !!f.mant_preventivo;
  document.getElementById('fMantCorr').checked = !!f.mant_correctivo;

  document.getElementById('fUbicacion').value = f.ubicacion_equipo || '';
  document.getElementById('fMateriales').value = f.materiales_utilizados || '';
  document.getElementById('fObservaciones').value = f.observaciones || '';

  autosizeAll(document.getElementById('sheetFicha'));
}

function formatoFechaFicha(fechaISO){
  const partes = String(fechaISO).split('-');
  if(partes.length !== 3) return fechaISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaAISO(texto){
  const partes = String(texto || '').trim().split('/');
  if(partes.length === 3){
    const [dd, mm, yyyy] = partes;
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  return new Date().toISOString().slice(0,10);
}

/* =========================================================
   LISTA (con botones ver/editar/borrar/pdf)
   ========================================================= */
function filaFicha(f){
  return `
    <tr>
      <td>${escapeHtml(f.numero)}</td>
      <td>${escapeHtml(f.fecha)}</td>
      <td>${escapeHtml(f.cliente)}</td>
      <td>${escapeHtml(f.marca)} ${escapeHtml(f.modelo)}</td>
      <td>${escapeHtml(f.tecnico)}</td>
      <td>
        <button class="btn-ver" type="button" onclick="verFicha(${f.id})">Ver</button>
        <button class="btn-edit" type="button" onclick="editarFicha(${f.id})">Editar</button>
        <button class="btn-del" type="button" onclick="borrarFicha(${f.id})">Eliminar</button>
        <button class="btn-pdf" type="button" onclick="pdfFicha(${f.id})">PDF</button>
      </td>
    </tr>`;
}

async function cargarFichas() {
  const body = document.getElementById("fichaCrudBody");
  if (!body) return;
  body.innerHTML = '<tr><td colspan="6" class="crud-empty">Cargando...</td></tr>';

  const datos = await listarFichas();
  if (!datos.length) {
    body.innerHTML = '<tr><td colspan="6" class="crud-empty">No hay fichas técnicas guardadas.</td></tr>';
    return;
  }
  body.innerHTML = datos.map(filaFicha).join("");
}

async function buscarFichaDesdePanel() {
  const texto = document.getElementById("fichaSearch")?.value || "";
  const datos = await buscarFichas(texto);
  const body = document.getElementById("fichaCrudBody");
  if (!datos.length) {
    body.innerHTML = '<tr><td colspan="6" class="crud-empty">No se encontraron fichas técnicas.</td></tr>';
    return;
  }
  body.innerHTML = datos.map(filaFicha).join("");
}

async function verFicha(id) {
  const f = await obtenerFicha(id);
  alert(
    `Ficha: ${f.numero}\n` +
    `Fecha: ${f.fecha}\n` +
    `Cliente: ${f.cliente}\n` +
    `Teléfono: ${f.telefono}\n` +
    `Técnico: ${f.tecnico}\n` +
    `Equipo: ${f.marca} ${f.modelo} (${f.tipo_equipo})\n` +
    `Materiales: ${f.materiales_utilizados || '-'}`
  );
}

async function editarFicha(id) {
  const f = await obtenerFicha(id);
  llenarSheetFicha(f);
  window.fichaEditandoId = id;
  activarEdicionFicha();
  mostrarVista('fichaNueva');
}

async function borrarFicha(id) {
  const f = await obtenerFicha(id);
  if (!confirm(`¿Eliminar la ficha técnica ${f.numero}?`)) return;
  try {
    await eliminarFicha(id);
    await cargarFichas();
  } catch (error) {
    alert("No se pudo eliminar la ficha técnica: " + error.message);
  }
}

async function pdfFicha(id) {
  try{
    const f = await obtenerFicha(id);
    llenarSheetFicha(f);
    window.fichaEditandoId = id;
    mostrarVista('fichaNueva');
    bloquearSheetFicha();
    // Se espera un instante a que el navegador termine de pintar el
    // formulario recién llenado antes de capturarlo para el PDF.
    await new Promise(r => setTimeout(r, 60));
    await handleDownloadFicha();
  } catch(err){
    console.error(err);
    alert('No se pudo generar el PDF de la ficha: ' + err.message);
  }
}

/* =========================================================
   GUARDAR FICHA
   ========================================================= */
async function guardarFicha(){
  const btn = document.getElementById('btnGuardarFicha');
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = '⏳ Guardando...';

  try{
    const ficha = {
      fecha: fechaAISO(document.getElementById('fFecha').value),
      cliente: document.getElementById('fCliente')?.value || '',
      cliente_cedula: document.getElementById('fCedula')?.value || '',
      telefono: document.getElementById('fTelefono')?.value || '',
      direccion: document.getElementById('fDireccion')?.value || '',
      contacto: document.getElementById('fContacto')?.value || '',
      tecnico: document.getElementById('fTecnico')?.value || '',
      activo: document.getElementById('fActivo')?.value || '',
      persona_cargo: document.getElementById('fPersonaCargo')?.value || '',
      referencia: document.getElementById('fReferencia')?.value || '',
      marca: document.getElementById('fMarca')?.value || '',
      modelo: document.getElementById('fModelo')?.value || '',
      tipo_equipo: document.getElementById('fTipoEquipo')?.value || '',
      capacidad_btu: document.getElementById('fBtu')?.value || '',
      instalacion: document.getElementById('fInstalacion').checked,
      mant_preventivo: document.getElementById('fMantPrev').checked,
      mant_correctivo: document.getElementById('fMantCorr').checked,
      tiempo_garantia: document.getElementById('fGarantia')?.value || '',
      tipo_refrigerante: document.getElementById('fRefrigerante')?.value || '',
      voltaje: document.getElementById('fVoltaje')?.value || '',
      amperaje: document.getElementById('fAmperaje')?.value || '',
      lectura_antes: document.getElementById('fAntes')?.value || '',
      lectura_despues: document.getElementById('fDespues')?.value || '',
      ubicacion_equipo: document.getElementById('fUbicacion')?.value || '',
      materiales_utilizados: document.getElementById('fMateriales')?.value || '',
      observaciones: document.getElementById('fObservaciones')?.value || ''
    };

    if(!ficha.cliente.trim()){ alert('Debes indicar el nombre del cliente.'); return; }

    let resultado;
    if(window.fichaEditandoId){
      resultado = await actualizarFicha(window.fichaEditandoId, ficha);
    } else {
      resultado = await crearFicha(ficha);
    }

    document.getElementById('fichaNum').value = resultado.numero;
    window.fichaEditandoId = resultado.id;

    alert('✅ Ficha técnica guardada: ' + resultado.numero);
    bloquearSheetFicha();
    cargarFichas();
  } catch(err){
    console.error(err);
    alert('Error al guardar la ficha técnica: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

/* =========================================================
   PDF DE LA FICHA (misma técnica que las cotizaciones)
   ========================================================= */
function buildFileNameFicha(){
  const num = (document.getElementById('fichaNum').value || '0001').trim();
  return `Ficha-${num || '0001'}.pdf`;
}

async function generatePdfBlobFicha(){
  document.body.classList.add('generating-pdf');
  const sheet = document.getElementById('sheetFicha');
  const opt = {
    margin: 0,
    filename: buildFileNameFicha(),
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  try{
    return await html2pdf().set(opt).from(sheet).outputPdf('blob');
  } finally {
    document.body.classList.remove('generating-pdf');
  }
}

async function handleDownloadFicha(){
  try{
    const blob = await generatePdfBlobFicha();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFileNameFicha();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch(err){
    console.error(err);
    alert('No se pudo generar el PDF de la ficha técnica.');
  }
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  bloquearSheetFicha();
  setTodayFicha();
});
