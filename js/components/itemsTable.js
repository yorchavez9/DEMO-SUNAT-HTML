var App = window.App || (window.App = {});

App.itemsTableHTML = function (items, moneda) {
  moneda = moneda || 'PEN';
  var simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  if (items.length === 0) {
    return '<div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184); background: rgb(248 250 252); border-radius: 0.75rem; font-weight: 500;">'
      + 'Sin productos. Haz clic en "Agregar producto" arriba.</div>';
  }

  var totales = items.reduce(function (acc, it) {
    var c = parseFloat(it.cantidad) || 0;
    var p = parseFloat(it.precio_unitario) || 0;
    var subtotal = c * p;
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
    var total = (parseFloat(it.cantidad) || 0) * (parseFloat(it.precio_unitario) || 0);
    return ''
      + '<tr>'
      + '<td>'
        + '<input class="input-inline" data-field="descripcion" data-idx="' + idx + '" value="' + App.escapeHtml(it.descripcion || '') + '" />'
        + (it.codigo ? '<div class="text-xs font-semibold" style="padding: 0 0.5rem; margin-top: 0.125rem; color: rgb(148 163 184);">' + App.escapeHtml(it.codigo) + '</div>' : '')
      + '</td>'
      + '<td><input class="input-inline font-mono text-xs" data-field="unidad" data-idx="' + idx + '" value="' + App.escapeHtml(it.unidad || '') + '" /></td>'
      + '<td><input type="number" min="0" step="any" class="input-inline text-right" data-field="cantidad" data-idx="' + idx + '" value="' + App.escapeHtml(it.cantidad == null ? '' : it.cantidad) + '" /></td>'
      + '<td><input type="number" min="0" step="any" class="input-inline text-right" data-field="precio_unitario" data-idx="' + idx + '" value="' + App.escapeHtml(it.precio_unitario == null ? '' : it.precio_unitario) + '" /></td>'
      + '<td><select class="input-inline text-xs" data-field="tip_afe_igv" data-idx="' + idx + '">'
        + '<option value="10"' + (it.tip_afe_igv === '10' ? ' selected' : '') + '>Gravado</option>'
        + '<option value="20"' + (it.tip_afe_igv === '20' ? ' selected' : '') + '>Exonerado</option>'
        + '<option value="30"' + (it.tip_afe_igv === '30' ? ' selected' : '') + '>Inafecto</option>'
        + '<option value="40"' + (it.tip_afe_igv === '40' ? ' selected' : '') + '>Exportación</option>'
      + '</select></td>'
      + '<td class="text-right font-bold" style="color: rgb(15 23 42);">' + simbolo + ' ' + total.toFixed(2) + '</td>'
      + '<td><button type="button" data-remove="' + idx + '" style="color: rgb(239 68 68); padding: 0.25rem; border-radius: 0.375rem; background: transparent; border: none; cursor: pointer;">'
        + '<i data-lucide="x" class="w-4 h-4"></i></button></td>'
      + '</tr>';
  }).join('');

  var summary = '<div style="width: 100%; max-width: 20rem; background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; font-size: 0.875rem;">'
    + (totales.baseGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Gravadas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseGravada.toFixed(2) + '</span></div>' : '')
    + (totales.baseNoGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Exoneradas/Inafectas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseNoGravada.toFixed(2) + '</span></div>' : '')
    + (totales.igv > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">IGV (18%):</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.igv.toFixed(2) + '</span></div>' : '')
    + '<div style="display: flex; justify-content: space-between; padding-top: 0.75rem; margin-top: 0.5rem; font-size: 1.125rem;"><span style="font-weight: 800; color: rgb(15 23 42);">TOTAL:</span><span style="font-weight: 800; color: rgb(37 99 235);">' + simbolo + ' ' + totales.subtotal.toFixed(2) + '</span></div>'
    + '</div>';

  return ''
    + '<div class="table-wrap">'
      + '<table class="table-std" style="min-width: 700px;">'
        + '<thead><tr>'
          + '<th>Descripción</th><th style="width: 5rem;">Und</th>'
          + '<th style="width: 6rem; text-align: right;">Cantidad</th>'
          + '<th style="width: 7rem; text-align: right;">Precio Unit.</th>'
          + '<th style="width: 7rem;">IGV</th>'
          + '<th style="width: 7rem; text-align: right;">Total</th>'
          + '<th style="width: 3rem;"></th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
      + '</table>'
    + '</div>'
    + '<div style="margin-top: 1.25rem; display: flex; justify-content: flex-end;">' + summary + '</div>';
};

App.bindItemsTable = function (container, getItems, setItems, moneda) {
  moneda = moneda || 'PEN';
  var simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  function fullRefresh() {
    container.innerHTML = App.itemsTableHTML(getItems(), moneda);
    App.refreshIcons();
    attach();
  }

  function updateLiveTotals() {
    var items = getItems();
    var totales = items.reduce(function (acc, it) {
      var c = parseFloat(it.cantidad) || 0;
      var p = parseFloat(it.precio_unitario) || 0;
      var subtotal = c * p;
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
      var cell = row.querySelector('td:nth-child(6)');
      if (cell) cell.textContent = simbolo + ' ' + (c * p).toFixed(2);
    });

    var summaryWrap = container.querySelector(':scope > div:last-child');
    if (summaryWrap) {
      summaryWrap.innerHTML = ''
        + '<div style="width: 100%; max-width: 20rem; background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; font-size: 0.875rem;">'
        + (totales.baseGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Gravadas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseGravada.toFixed(2) + '</span></div>' : '')
        + (totales.baseNoGravada > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">Op. Exoneradas/Inafectas:</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.baseNoGravada.toFixed(2) + '</span></div>' : '')
        + (totales.igv > 0 ? '<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="color: rgb(71 85 105); font-weight: 500;">IGV (18%):</span><span style="font-weight: 600;">' + simbolo + ' ' + totales.igv.toFixed(2) + '</span></div>' : '')
        + '<div style="display: flex; justify-content: space-between; padding-top: 0.75rem; margin-top: 0.5rem; font-size: 1.125rem;"><span style="font-weight: 800; color: rgb(15 23 42);">TOTAL:</span><span style="font-weight: 800; color: rgb(37 99 235);">' + simbolo + ' ' + totales.subtotal.toFixed(2) + '</span></div>'
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
        if (['cantidad', 'precio_unitario'].includes(field)) updateLiveTotals();
      });
      el.addEventListener('change', function () {
        if (el.dataset.field === 'tip_afe_igv') updateLiveTotals();
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
