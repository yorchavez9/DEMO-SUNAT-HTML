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
  return simbolo + ' ' + n.toFixed(2);
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
    anulado: 'background-color: rgb(243 244 246); color: rgb(31 41 55);',
    anulacion_en_proceso: 'background-color: rgb(255 237 213); color: rgb(154 52 18);',
  };
  var style = colors[estado] || 'background-color: rgb(241 245 249); color: rgb(51 65 85);';
  return '<span class="badge" style="' + style + '">' + App.escapeHtml(estado || '—') + '</span>';
};

App.refreshIcons = function () {
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons({ nameAttr: 'data-lucide' });
  }
};
