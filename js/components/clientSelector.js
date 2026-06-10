var App = window.App || (window.App = {});

App.clientSelectorHTML = function (cliente, placeholder) {
  placeholder = placeholder || 'Ingrese RUC o DNI...';

  if (cliente) {
    var tipoLabel = cliente.tipo_doc === '6' ? 'RUC' : cliente.tipo_doc === '1' ? 'DNI' : 'S/D';
    return ''
      + '<div class="cs-selected" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; border-radius: 0.75rem; background: rgb(239 246 255); border: 1px solid rgb(191 219 254);">'
        + '<i data-lucide="check-circle-2" style="width: 20px; height: 20px; color: rgb(59 130 246); flex-shrink: 0;"></i>'
        + '<div style="flex: 1; min-width: 0;">'
          + '<div style="font-size: 11px; font-weight: 700; font-family: monospace; color: rgb(100 116 139); text-transform: uppercase; letter-spacing: 0.03em;">'
            + App.escapeHtml(tipoLabel) + ' ' + App.escapeHtml(cliente.num_doc)
          + '</div>'
          + '<div style="font-size: 0.875rem; font-weight: 600; color: rgb(15 23 42); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'
            + App.escapeHtml(cliente.razon_social)
          + '</div>'
          + (cliente.direccion
            ? '<div style="font-size: 0.75rem; color: rgb(148 163 184); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'
                + App.escapeHtml(cliente.direccion) + '</div>'
            : '')
        + '</div>'
        + '<button type="button" class="cs-clear" title="Cambiar cliente" style="padding: 0.375rem; border-radius: 0.5rem; color: rgb(148 163 184); background: transparent; border: none; cursor: pointer; flex-shrink: 0;">'
          + '<i data-lucide="x" class="w-4 h-4"></i>'
        + '</button>'
      + '</div>';
  }

  return ''
    + '<div style="display: flex; flex-direction: column; gap: 0.375rem;">'
      + '<div style="display: flex; gap: 0.5rem;">'
        + '<input id="cs-input" type="text" inputmode="numeric" pattern="[0-9]*" class="input flex-1" placeholder="' + App.escapeHtml(placeholder) + '" maxlength="11" />'
        + '<button type="button" id="cs-btn" class="btn-secondary" style="white-space: nowrap; display: flex; align-items: center; gap: 0.375rem;">'
          + '<i data-lucide="search" class="w-4 h-4"></i> Buscar'
        + '</button>'
      + '</div>'
      + '<div id="cs-error" style="display: none; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: rgb(220 38 38); padding: 0 0.125rem;">'
        + '<i data-lucide="alert-circle" class="w-4 h-4" style="flex-shrink: 0;"></i>'
        + '<span id="cs-error-msg"></span>'
      + '</div>'
    + '</div>';
};

App.bindClientSelector = function (container, opts) {
  opts = opts || {};

  var clearBtn = container.querySelector('.cs-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (opts.onClear) opts.onClear();
    });
    return;
  }

  var input  = container.querySelector('#cs-input');
  var btn    = container.querySelector('#cs-btn');
  var errBox = container.querySelector('#cs-error');
  var errMsg = container.querySelector('#cs-error-msg');

  if (!input || !btn) return;

  input.addEventListener('input', function () {
    input.value = input.value.replace(/\D/g, '');
    if (errBox) errBox.style.display = 'none';
  });

  function showError(msg) {
    errMsg.textContent = msg;
    errBox.style.display = 'flex';
    App.refreshIcons();
  }

  async function buscar() {
    var numero = input.value.trim();
    if (!/^\d{8,11}$/.test(numero)) {
      showError('Ingresa un DNI (8 dígitos) o RUC (11 dígitos).');
      return;
    }
    var tipo = numero.length === 11 ? '6' : '1';
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Buscando...';
    errBox.style.display = 'none';
    App.refreshIcons();
    try {
      var res = await App.api.buscarDocumento(tipo, numero);
      if (opts.onSelect) opts.onSelect(res.data);
    } catch (e) {
      showError(e.message || 'No se encontró el documento.');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="search" class="w-4 h-4"></i> Buscar';
      App.refreshIcons();
    }
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); buscar(); }
  });
  btn.addEventListener('click', buscar);
};
