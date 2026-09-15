// js/init.js
// Arranque de la aplicación.

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addRowBtnBottom')?.addEventListener('click', addRow);

  bloquearSheet();
  setToday();
  toggleEmptyMsg();
  recalcTotals();
  autosizeAll();
  mostrarVista('dashboard');
});