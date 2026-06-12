var App = window.App || (window.App = {});

App.escapeHtml = function (value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

App.fmtMoney = function (value, moneda) {
  moneda = moneda || 'PEN';
  var n = parseFloat(value) || 0;
  var simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';
  return simbolo + ' ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

App.fmtNumber = function (value, decimals) {
  var d = decimals === undefined ? 2 : decimals;
  var n = parseFloat(value) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

App.todayISO = function () {
  return new Date().toISOString().split('T')[0];
};

App.tomorrowISO = function () {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0];
};

App.descargarBlob = function (blob, filename) {
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 500);
};

App.estadoBadgeHTML = function (estado) {
  var colors = {
    pendiente: 'background-color: rgb(254 249 195); color: rgb(133 77 14);',
    enviado: 'background-color: rgb(219 234 254); color: rgb(30 64 175);',
    procesando: 'background-color: rgb(219 234 254); color: rgb(30 64 175);',
    aceptado: 'background-color: rgb(220 252 231); color: rgb(22 101 52);',
    rechazado: 'background-color: rgb(254 226 226); color: rgb(153 27 27);',
    anulado: 'background-color: rgb(243 244 246); color: rgb(75 85 99);',
    anulacion_en_proceso: 'background-color: rgb(255 237 213); color: rgb(154 52 18);',
  };
  var labels = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    procesando: 'Procesando',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
    anulado: 'Anulado',
    anulacion_en_proceso: 'Anulación en proceso',
  };
  var style = colors[estado] || 'background-color: rgb(241 245 249); color: rgb(51 65 85);';
  var label = labels[estado] || estado || '—';
  return '<span class="badge" style="' + style + '">' + App.escapeHtml(label) + '</span>';
};

App.pdfFormatPickerHTML = function (current) {
  var formats = [
    { value: 'ticket-80', label: 'Ticket 80mm' },
    { value: 'ticket-58', label: 'Ticket 58mm' },
    { value: 'a5', label: 'A5' },
    { value: 'a4', label: 'A4' },
  ];
  var buttons = formats.map(function (f) {
    var active = current === f.value;
    var bg = active ? 'rgb(37 99 235)' : 'rgb(241 245 249)';
    var color = active ? 'white' : 'rgb(51 65 85)';
    return '<button type="button" data-pdf-format="' + f.value + '" style="background:' + bg + ';color:' + color + ';padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:700;border-radius:0.5rem;border:none;cursor:pointer;">'
      + f.label + '</button>';
  }).join('');
  return '<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">'
    + '<span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:rgb(100 116 139);">Formato PDF:</span>'
    + buttons
    + '</div>';
};

App.bindPdfFormatPicker = function (container, getFormat, setFormat) {
  container.querySelectorAll('[data-pdf-format]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFormat(btn.dataset.pdfFormat);
      container.querySelectorAll('[data-pdf-format]').forEach(function (b) {
        var active = b.dataset.pdfFormat === getFormat();
        b.style.background = active ? 'rgb(37 99 235)' : 'rgb(241 245 249)';
        b.style.color = active ? 'white' : 'rgb(51 65 85)';
      });
    });
  });
};

App.refreshIcons = function () {
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons({ nameAttr: 'data-lucide' });
  }
};

App.normalizeAnulacion = function (a) {
  if (!a) return a;
  var estadoSunat =
    a.sunat_status != null ? a.sunat_status :
    a.estado_sunat != null ? a.estado_sunat :
    (a.sunat && a.sunat.estado != null ? a.sunat.estado :
    (a.estado != null ? a.estado : null));
  return Object.assign({}, a, {
    estado_sunat: estadoSunat,
    sunat_description: a.sunat_description || (a.sunat && a.sunat.descripcion) || null,
    ticket: a.ticket != null ? a.ticket : (a.sunat && a.sunat.ticket != null ? a.sunat.ticket : null),
  });
};
