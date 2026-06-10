var App = window.App || (window.App = {});

var CS_TIPOS_DOC = [
  { cod: '6', label: 'RUC' },
  { cod: '1', label: 'DNI' },
  { cod: '4', label: 'Carnet de extranjería' },
  { cod: '7', label: 'Pasaporte' },
  { cod: '0', label: 'Otros' },
];

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
      + '<button type="button" id="cs-manual-btn" style="display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: rgb(100 116 139); background: transparent; border: none; cursor: pointer; padding: 0; margin-top: 0.125rem;">'
        + '<i data-lucide="user-plus" style="width: 14px; height: 14px;"></i> Ingresar datos manualmente'
      + '</button>'
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

  var input    = container.querySelector('#cs-input');
  var btn      = container.querySelector('#cs-btn');
  var errBox   = container.querySelector('#cs-error');
  var errMsg   = container.querySelector('#cs-error-msg');
  var manualBtn = container.querySelector('#cs-manual-btn');

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

  if (manualBtn) {
    manualBtn.addEventListener('click', function () {
      App.openClientManualModal(function (data) {
        if (opts.onSelect) opts.onSelect(data);
      });
    });
  }
};

App.openClientManualModal = function (onConfirm) {
  var tiposOpts = CS_TIPOS_DOC.map(function (t) {
    return '<option value="' + t.cod + '">' + t.label + '</option>';
  }).join('');

  var html = ''
    + '<div id="cm-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem;">'
      + '<div id="cm-card" style="background: white; border-radius: 0.75rem; width: 100%; max-width: 28rem; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">'
        + '<div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid rgb(241 245 249);">'
          + '<h2 style="font-size: 0.9375rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">'
            + '<i data-lucide="user-plus" style="width: 20px; height: 20px; color: rgb(59 130 246);"></i> Ingresar cliente manualmente'
          + '</h2>'
          + '<button id="cm-close" type="button" style="color: rgb(148 163 184); background: transparent; border: none; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem;">'
            + '<i data-lucide="x" class="w-5 h-5"></i>'
          + '</button>'
        + '</div>'
        + '<form id="cm-form" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">'
          + '<div style="display: flex; gap: 0.75rem;">'
            + '<div style="flex: 0 0 auto; width: 11rem;">'
              + '<label class="label">Tipo de doc.</label>'
              + '<select id="cm-tipo" class="input">' + tiposOpts + '</select>'
            + '</div>'
            + '<div style="flex: 1;">'
              + '<label class="label">N° de documento</label>'
              + '<input id="cm-num" class="input font-mono" placeholder="20xxxxxxxxx" maxlength="11" required />'
            + '</div>'
          + '</div>'
          + '<div>'
            + '<label class="label">Razón social / Nombre</label>'
            + '<input id="cm-razon" class="input" placeholder="EMPRESA S.A.C." required />'
          + '</div>'
          + '<div>'
            + '<label class="label">Dirección <span style="color: rgb(148 163 184); font-weight: 400;">(opcional)</span></label>'
            + '<input id="cm-dir" class="input" placeholder="Av. Example 123, Lima" />'
          + '</div>'
          + '<div style="display: flex; gap: 0.5rem; padding-top: 0.5rem;">'
            + '<button type="submit" class="btn-primary" style="display: flex; align-items: center; gap: 0.375rem;">'
              + '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Confirmar'
            + '</button>'
            + '<button type="button" id="cm-cancel" class="btn-secondary">Cancelar</button>'
          + '</div>'
        + '</form>'
      + '</div>'
    + '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
  var overlay = document.getElementById('cm-overlay');
  App.refreshIcons();

  var numInput = overlay.querySelector('#cm-num');
  numInput.addEventListener('input', function () {
    numInput.value = numInput.value.replace(/\D/g, '');
  });

  var razonInput = overlay.querySelector('#cm-razon');
  razonInput.addEventListener('input', function () {
    razonInput.value = razonInput.value.toUpperCase();
  });

  function close() { overlay.remove(); }

  overlay.querySelector('#cm-close').addEventListener('click', close);
  overlay.querySelector('#cm-cancel').addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (!overlay.querySelector('#cm-card').contains(e.target)) close();
  });

  overlay.querySelector('#cm-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      tipo_doc: overlay.querySelector('#cm-tipo').value,
      num_doc: overlay.querySelector('#cm-num').value.trim(),
      razon_social: overlay.querySelector('#cm-razon').value.trim(),
      direccion: overlay.querySelector('#cm-dir').value.trim(),
    };
    onConfirm(data);
    close();
  });
};
