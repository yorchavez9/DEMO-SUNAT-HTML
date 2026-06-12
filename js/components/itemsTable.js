var App = window.App || (window.App = {});

App.SUNAT_UNITS = [
  { cod: 'NIU', sym: 'UND',   desc: 'Unidad' },
  { cod: 'ZZ',  sym: 'SERV',  desc: 'Servicio' },
  { cod: 'HUR', sym: 'HR',    desc: 'Hora' },
  { cod: 'BX',  sym: 'CAJ',   desc: 'Caja' },
  { cod: 'GLL', sym: 'GL',    desc: 'Galón' },
  { cod: 'GRM', sym: 'GR',    desc: 'Gramos' },
  { cod: 'KGM', sym: 'KG',    desc: 'Kilos' },
  { cod: 'LTR', sym: 'LT',    desc: 'Litro' },
  { cod: 'MTR', sym: 'M',     desc: 'Metro' },
  { cod: 'FOT', sym: 'PIE',   desc: 'Pies' },
  { cod: 'INH', sym: 'INCH',  desc: 'Pulgadas' },
  { cod: 'YRD', sym: 'YD',    desc: 'Yarda' },
  { cod: 'TNE', sym: 'TNL',   desc: 'Toneladas' },
  { cod: 'DZN', sym: 'DOC',   desc: 'Docena' },
  { cod: 'QD',  sym: '1/4 DOC', desc: 'Cuarto de docena' },
  { cod: 'PK',  sym: 'PQT',   desc: 'Paquete' },
  { cod: 'MTQ', sym: 'M3',    desc: 'Metro cúbico' },
  { cod: 'HD',  sym: '1/2 DOC', desc: 'Media docena' },
  { cod: 'PR',  sym: 'PAR',   desc: 'Par' },
  { cod: 'JG',  sym: 'JARR',  desc: 'Jarra' },
  { cod: 'JR',  sym: 'FCO',   desc: 'Frasco' },
  { cod: 'KT',  sym: 'KIT',   desc: 'Kit' },
  { cod: 'CH',  sym: 'ENV',   desc: 'Envase' },
  { cod: 'AV',  sym: 'CAPS',  desc: 'Cápsula' },
  { cod: 'CT',  sym: 'CTON',  desc: 'Cartón' },
  { cod: 'CY',  sym: 'CIL',   desc: 'Cilindro' },
  { cod: 'BE',  sym: 'FARD',  desc: 'Fardo' },
  { cod: 'BG',  sym: 'BOLS',  desc: 'Bolsa' },
  { cod: 'BJ',  sym: 'BALD',  desc: 'Balde' },
  { cod: 'SET', sym: 'JGO',   desc: 'Juego' },
  { cod: 'BLL', sym: 'BRL',   desc: 'Barril' },
  { cod: 'RM',  sym: 'RESM',  desc: 'Resma' },
  { cod: 'BO',  sym: 'BOT',   desc: 'Botellas' },
  { cod: 'SA',  sym: 'SCO',   desc: 'Saco' },
  { cod: 'BT',  sym: 'TORN',  desc: 'Tornillo' },
  { cod: 'C62', sym: 'PZ',    desc: 'Piezas' },
  { cod: 'U2',  sym: 'BLIST', desc: 'Tableta o blister' },
  { cod: 'CA',  sym: 'LT',    desc: 'Latas' },
  { cod: 'CEN', sym: 'CTO',   desc: 'Centenar o ciento' },
  { cod: 'CMT', sym: 'CM',    desc: 'Centímetro' },
  { cod: 'CMK', sym: 'CM2',   desc: 'Centímetro cuadrado' },
  { cod: 'CMQ', sym: 'CM3',   desc: 'Centímetro cúbico' },
  { cod: 'DZP', sym: 'DOC2',  desc: 'Docena de paquetes' },
  { cod: 'FTK', sym: 'PIE2',  desc: 'Pies cuadrados' },
  { cod: 'FTQ', sym: 'PIE3',  desc: 'Pies cúbicos' },
  { cod: 'GLI', sym: 'GL',    desc: 'Galón inglés' },
  { cod: 'HT',  sym: '1/2 H', desc: 'Media hora' },
  { cod: 'KTM', sym: 'KM',    desc: 'Kilómetro' },
  { cod: 'KWH', sym: 'KWxH',  desc: 'Kilovatio hora' },
  { cod: 'MWH', sym: 'MWxH',  desc: 'Megavatio hora' },
  { cod: 'LBR', sym: 'LB',    desc: 'Libras' },
  { cod: 'LEF', sym: 'HOJA',  desc: 'Hoja' },
  { cod: 'MGM', sym: 'MG',    desc: 'Miligramos' },
  { cod: 'MIL', sym: 'MIL',   desc: 'Millar' },
  { cod: 'MLT', sym: 'ML',    desc: 'Mililitro' },
  { cod: 'MMT', sym: 'MM',    desc: 'Milímetro' },
  { cod: 'MMK', sym: 'MM2',   desc: 'Milímetro cuadrado' },
  { cod: 'MMQ', sym: 'MM3',   desc: 'Milímetro cúbico' },
  { cod: 'MTK', sym: 'M2',    desc: 'Metro cuadrado' },
  { cod: 'ONZ', sym: 'ONZ',   desc: 'Onzas' },
  { cod: 'PF',  sym: 'PAL',   desc: 'Paletas' },
  { cod: 'PG',  sym: 'PLAC',  desc: 'Placas' },
  { cod: 'RD',  sym: 'VAR',   desc: 'Varilla' },
  { cod: 'RL',  sym: 'CRR',   desc: 'Carrete' },
  { cod: 'SEC', sym: 'SEG',   desc: 'Segundo' },
  { cod: 'ST',  sym: 'PLGO',  desc: 'Pliego' },
  { cod: 'TU',  sym: 'TB',    desc: 'Tubos' },
  { cod: 'UM',  sym: 'MILL',  desc: 'Millón' },
];

App.sunatUnitsSelectHTML = function (value, idx) {
  var selected = value || 'NIU';
  return '<select class="input-inline text-xs" data-field="unidad" data-idx="' + idx + '">'
    + App.SUNAT_UNITS.map(function (u) {
      return '<option value="' + u.cod + '"' + (u.cod === selected ? ' selected' : '') + '>' + u.cod + ' - ' + u.sym + '</option>';
    }).join('')
    + '</select>';
};

// opts: { showDescuentos: false }
App.itemsTableHTML = function (items, moneda, opts) {
  moneda = moneda || 'PEN';
  opts = opts || {};
  var showDescuentos = !!opts.showDescuentos;
  var simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  if (items.length === 0) {
    return '<div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184); background: rgb(248 250 252); border-radius: 0.75rem; font-weight: 500;">'
      + 'Sin productos. Haz clic en "Agregar producto" arriba.</div>';
  }

  var totales = items.reduce(function (acc, it) {
    var c = parseFloat(it.cantidad) || 0;
    var p = parseFloat(it.precio_unitario) || 0;
    var d = showDescuentos ? (parseFloat(it.descuento_monto) || 0) : 0;
    var subtotal = c * p - d;
    var afe = it.tip_afe_igv || '10';
    if (afe === '10') {
      var bg = subtotal / 1.18;
      acc.baseGravada += bg;
      acc.igv += subtotal - bg;
    } else if (afe === '20' || afe === '30') {
      acc.baseNoGravada += subtotal;
    }
    acc.subtotal += subtotal;
    return acc;
  }, { subtotal: 0, baseGravada: 0, baseNoGravada: 0, igv: 0 });

  var rows = items.map(function (it, idx) {
    var subtotal = (parseFloat(it.cantidad) || 0) * (parseFloat(it.precio_unitario) || 0);
    var descuento = showDescuentos ? (parseFloat(it.descuento_monto) || 0) : 0;
    var total = subtotal - descuento;
    return ''
      + '<tr>'
      + '<td>'
        + '<input class="input-inline" data-field="descripcion" data-idx="' + idx + '" value="' + App.escapeHtml(it.descripcion || '') + '" />'
        + (it.codigo ? '<div class="text-xs font-semibold" style="padding: 0 0.5rem; margin-top: 0.125rem; color: rgb(148 163 184);">' + App.escapeHtml(it.codigo) + '</div>' : '')
      + '</td>'
      + '<td>' + App.sunatUnitsSelectHTML(it.unidad, idx) + '</td>'
      + '<td><input type="number" min="0" step="any" class="input-inline text-right" data-field="cantidad" data-idx="' + idx + '" value="' + App.escapeHtml(it.cantidad == null ? '' : String(it.cantidad)) + '" /></td>'
      + '<td><input type="number" min="0" step="any" class="input-inline text-right" data-field="precio_unitario" data-idx="' + idx + '" value="' + App.escapeHtml(it.precio_unitario == null ? '' : String(it.precio_unitario)) + '" /></td>'
      + '<td><select class="input-inline text-xs" data-field="tip_afe_igv" data-idx="' + idx + '">'
        + '<option value="10"' + (it.tip_afe_igv === '10' ? ' selected' : '') + '>Gravado</option>'
        + '<option value="20"' + (it.tip_afe_igv === '20' ? ' selected' : '') + '>Exonerado</option>'
        + '<option value="30"' + (it.tip_afe_igv === '30' ? ' selected' : '') + '>Inafecto</option>'
        + '<option value="40"' + (it.tip_afe_igv === '40' ? ' selected' : '') + '>Exportación</option>'
      + '</select></td>'
      + (showDescuentos
        ? '<td><input type="number" min="0" step="0.01" class="input-inline text-right" style="color: rgb(234 88 12);" data-field="descuento_monto" data-idx="' + idx + '" value="' + (it.descuento_monto != null ? App.escapeHtml(String(it.descuento_monto)) : '') + '" placeholder="0.00" /></td>'
        : '')
      + '<td class="text-right font-bold" data-total style="color: rgb(15 23 42);">' + simbolo + ' ' + total.toFixed(2) + '</td>'
      + '<td><button type="button" data-remove="' + idx + '" style="color: rgb(239 68 68); padding: 0.25rem; border-radius: 0.375rem; background: transparent; border: none; cursor: pointer;">'
        + '<i data-lucide="x" class="w-4 h-4"></i></button></td>'
      + '</tr>';
  }).join('');

  var summary = '<div style="width: 100%; max-width: 20rem; background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; font-size: 0.875rem;">'
    + (totales.baseGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Gravadas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseGravada.toFixed(2) + '</span></div>' : '')
    + (totales.baseNoGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Exoneradas/Inafectas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseNoGravada.toFixed(2) + '</span></div>' : '')
    + (totales.igv > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">IGV (18%):</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.igv.toFixed(2) + '</span></div>' : '')
    + '<div style="display: flex; justify-content: space-between; padding-top: 0.75rem; margin-top: 0.5rem; border-top: 1px solid rgb(226 232 240); font-size: 1.125rem;"><span style="font-weight: 800; color: rgb(15 23 42);">TOTAL ítems:</span><span style="font-weight: 800; color: rgb(37 99 235);">' + simbolo + ' ' + totales.subtotal.toFixed(2) + '</span></div>'
    + '</div>';

  return ''
    + '<div class="table-wrap">'
      + '<table class="table-std" style="min-width: 700px;">'
        + '<thead><tr>'
          + '<th>Descripción</th><th style="width: 8rem;">Und</th>'
          + '<th style="width: 6rem; text-align: right;">Cantidad</th>'
          + '<th style="width: 7rem; text-align: right;">Precio Unit.</th>'
          + '<th style="width: 7rem;">IGV</th>'
          + (showDescuentos ? '<th style="width: 6rem; text-align: right; color: rgb(234 88 12);">Desc.</th>' : '')
          + '<th style="width: 7rem; text-align: right;">Total</th>'
          + '<th style="width: 3rem;"></th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
      + '</table>'
    + '</div>'
    + '<div style="margin-top: 1.25rem; display: flex; justify-content: flex-end;">' + summary + '</div>';
};

// opts: { showDescuentos: false }
App.bindItemsTable = function (container, getItems, setItems, moneda, opts) {
  moneda = moneda || 'PEN';
  opts = opts || {};
  var showDescuentos = !!opts.showDescuentos;
  var simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  function fullRefresh() {
    container.innerHTML = App.itemsTableHTML(getItems(), moneda, opts);
    App.refreshIcons();
    attach();
  }

  function updateLiveTotals() {
    var items = getItems();
    var totales = items.reduce(function (acc, it) {
      var c = parseFloat(it.cantidad) || 0;
      var p = parseFloat(it.precio_unitario) || 0;
      var d = showDescuentos ? (parseFloat(it.descuento_monto) || 0) : 0;
      var subtotal = c * p - d;
      var afe = it.tip_afe_igv || '10';
      if (afe === '10') { var bg = subtotal / 1.18; acc.baseGravada += bg; acc.igv += subtotal - bg; }
      else if (afe === '20' || afe === '30') { acc.baseNoGravada += subtotal; }
      acc.subtotal += subtotal;
      return acc;
    }, { subtotal: 0, baseGravada: 0, baseNoGravada: 0, igv: 0 });

    var rows = container.querySelectorAll('tbody tr');
    items.forEach(function (it, idx) {
      var row = rows[idx];
      if (!row) return;
      var c = parseFloat(it.cantidad) || 0;
      var p = parseFloat(it.precio_unitario) || 0;
      var d = showDescuentos ? (parseFloat(it.descuento_monto) || 0) : 0;
      var cell = row.querySelector('[data-total]');
      if (cell) cell.textContent = simbolo + ' ' + (c * p - d).toFixed(2);
    });

    var summaryWrap = container.querySelector(':scope > div:last-child');
    if (summaryWrap) {
      summaryWrap.innerHTML = ''
        + '<div style="width: 100%; max-width: 20rem; background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; font-size: 0.875rem;">'
        + (totales.baseGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Gravadas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseGravada.toFixed(2) + '</span></div>' : '')
        + (totales.baseNoGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Exoneradas/Inafectas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseNoGravada.toFixed(2) + '</span></div>' : '')
        + (totales.igv > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">IGV (18%):</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.igv.toFixed(2) + '</span></div>' : '')
        + '<div style="display: flex; justify-content: space-between; padding-top: 0.75rem; margin-top: 0.5rem; border-top: 1px solid rgb(226 232 240); font-size: 1.125rem;"><span style="font-weight: 800; color: rgb(15 23 42);">TOTAL ítems:</span><span style="font-weight: 800; color: rgb(37 99 235);">' + simbolo + ' ' + totales.subtotal.toFixed(2) + '</span></div>'
        + '</div>';
    }
  }

  function attach() {
    container.querySelectorAll('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(el.dataset.idx, 10);
        var field = el.dataset.field;
        var items = getItems();
        items[idx] = Object.assign({}, items[idx], { [field]: el.value });
        setItems(items);
        if (['cantidad', 'precio_unitario', 'descuento_monto'].includes(field)) updateLiveTotals();
      });
      el.addEventListener('change', function () {
        var f = el.dataset.field;
        if (f === 'tip_afe_igv' || f === 'unidad') {
          var idx = parseInt(el.dataset.idx, 10);
          var items = getItems();
          items[idx] = Object.assign({}, items[idx], { [f]: el.value });
          setItems(items);
          if (f === 'tip_afe_igv') updateLiveTotals();
        }
      });
    });

    container.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.remove, 10);
        var items = getItems().filter(function (_, i) { return i !== idx; });
        setItems(items);
        fullRefresh();
      });
    });
  }

  attach();
  return { refresh: fullRefresh };
};
