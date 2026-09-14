// js/pdf.js
function configurarImpresionA4() {
  if (document.getElementById("cotizaciones-print-style")) return;

  const style = document.createElement("style");
  style.id = "cotizaciones-print-style";
  style.textContent = `
    @page { size: A4 portrait; margin: 10mm; }

    @media print {
      html, body {
        background: #fff !important;
        width: 210mm;
        margin: 0;
      }

      .no-print, button {
        display: none !important;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        display: table-header-group;
      }

      tr, .quote-card, .client-card, .totals {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      td, th, input, textarea {
        overflow-wrap: anywhere;
        word-break: break-word;
      }
    }
  `;
  document.head.appendChild(style);
}

function elementoPDF() {
  return document.querySelector(".sheet") ||
         document.querySelector("#cotizacion") ||
         document.querySelector("main") ||
         document.body;
}

async function generarPDF(nombreArchivo = "cotizacion.pdf") {
  configurarImpresionA4();

  const elemento = elementoPDF();

  const opciones = {
    margin: [8, 8, 8, 8],
    filename: nombreArchivo,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: ["tr", ".quote-card", ".client-card", ".totals"]
    }
  };

  return html2pdf().set(opciones).from(elemento).save();
}
