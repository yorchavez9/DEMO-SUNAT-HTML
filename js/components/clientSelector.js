var App = window.App || (window.App = {});

App.clientSelectorHTML = function (cliente, placeholder) {
  placeholder = placeholder || 'Seleccionar cliente...';
  var has = !!cliente;
  var borderStyle = has
    ? 'background: rgb(219 234 254);'
    : 'background: rgb(241 245 249);';

  var tipoLabel = has
    ? (cliente.tipo_doc === '6' ? 'RUC' : cliente.tipo_doc === '1' ? 'DNI' : cliente.tipo_doc === '0' ? 'S/D' : cliente.tipo_doc)
    : '';

  var contenidoCliente = has ? (
    '<div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">'
    + '<span class="badge font-mono" style="background: rgb(241 245 249); color: rgb(51 65 85); font-size: 11px;">'
    + App.escapeHtml(tipoLabel) + ' ' + App.escapeHtml(cliente.num_doc)
    + '</span>'
    + '<span class="text-sm font-semibold" style="color: rgb(15 23 42); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'
    + App.escapeHtml(cliente.razon_social) + '</span>'
    + '</div>'
  ) : (
    '<span style="flex: 1; font-size: 0.875rem; color: rgb(148 163 184); font-weight: 400;">'
    + App.escapeHtml(placeholder) + '</span>'
  );

  var acciones = ''
    + '<div style="display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0;" data-actions="1">'
    + (has
      ? '<button type="button" class="cs-clear" title="Limpiar" style="padding: 0.25rem; border-radius: 0.375rem; color: rgb(148 163 184); background: transparent; border: none; cursor: pointer;">'
        + '<i data-lucide="x" class="w-4 h-4"></i></button>'
      : '')
    + '<button type="button" class="cs-search" title="Buscar cliente" style="padding: 0.25rem; border-radius: 0.375rem; color: rgb(100 116 139); background: transparent; border: none; cursor: pointer;">'
    + '<i data-lucide="search" class="w-4 h-4"></i></button>'
    + '</div>';

  return ''
    + '<div class="cs-root" data-cs="1" style="' + borderStyle
    + ' display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.625rem 0.875rem;'
    + ' border-radius: 0.75rem; cursor: pointer; transition: all 0.15s;">'
    + '<span style="flex-shrink: 0; color: ' + (has ? 'rgb(37 99 235)' : 'rgb(148 163 184)') + ';">'
    + '<i data-lucide="user" class="w-[18px] h-[18px]"></i></span>'
    + contenidoCliente
    + acciones
    + '</div>';
};

App.bindClientSelector = function (container, opts) {
  opts = opts || {};
  var root = container.querySelector('[data-cs]') || container;

  root.addEventListener('click', function (e) {
    var actions = root.querySelector('[data-actions]');
    if (actions && actions.contains(e.target)) return;
    if (opts.onOpenPicker) opts.onOpenPicker();
  });

  var searchBtn = root.querySelector('.cs-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (opts.onOpenPicker) opts.onOpenPicker();
    });
  }

  var clearBtn = root.querySelector('.cs-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (opts.onClear) opts.onClear();
    });
  }
};
