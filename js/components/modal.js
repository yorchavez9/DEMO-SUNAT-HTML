var App = window.App || (window.App = {});

/**
 * Modal reutilizable por las pantallas de gestión (productos, clientes,
 * proveedores, compras, inventario). Devuelve solo el HTML: la página lo
 * concatena dentro de su propio innerHTML y luego llama a App.bindModal.
 *
 * opts: { icono, titulo, subtitulo, cuerpo, footer, ancho }
 */
App.modalHTML = function (opts) {
  var ancho = opts.ancho || '34rem';
  var subtitulo = opts.subtitulo
    ? '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.125rem;">' + opts.subtitulo + '</p>'
    : '';

  return ''
    + '<div data-modal-overlay class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgb(15 23 42 / 0.5);">'
      + '<div data-modal-box class="bg-white rounded-xl w-full" style="max-width: ' + ancho + '; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);">'
        + '<div style="padding: 1.125rem 1.25rem; border-bottom: 1px solid rgb(241 245 249); display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">'
          + '<div>'
            + '<h2 class="section-title" style="margin-bottom: 0;">'
              + (opts.icono ? '<i data-lucide="' + opts.icono + '" class="w-5 h-5"></i>' : '')
              + opts.titulo
            + '</h2>'
            + subtitulo
          + '</div>'
          + '<button type="button" data-modal-close style="color: rgb(148 163 184); background: transparent; border: none; cursor: pointer; padding: 0.25rem; flex-shrink: 0;">'
            + '<i data-lucide="x" class="w-5 h-5"></i>'
          + '</button>'
        + '</div>'
        + '<div style="padding: 1.25rem; overflow-y: auto; flex: 1;">' + opts.cuerpo + '</div>'
        + (opts.footer
          ? '<div style="padding: 1rem 1.25rem; border-top: 1px solid rgb(241 245 249); display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap;">' + opts.footer + '</div>'
          : '')
      + '</div>'
    + '</div>';
};

/** Cierra con la X, con clic fuera de la caja y con Escape. */
App.bindModal = function (container, onClose) {
  var overlay = container.querySelector('[data-modal-overlay]');
  if (!overlay) return;

  var box = overlay.querySelector('[data-modal-box]');

  overlay.querySelectorAll('[data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', onClose);
  });

  overlay.addEventListener('mousedown', function (e) {
    if (!box.contains(e.target)) onClose();
  });

  function onKey(e) {
    if (e.key !== 'Escape') return;
    document.removeEventListener('keydown', onKey);
    onClose();
  }
  document.addEventListener('keydown', onKey);

  var primer = overlay.querySelector('input, select, textarea');
  if (primer) primer.focus();
};

/** Confirmación con el mismo look que el resto del sistema. */
App.confirmarHTML = function (opts) {
  return App.modalHTML({
    icono: opts.icono || 'alert-triangle',
    titulo: opts.titulo,
    ancho: '26rem',
    cuerpo: '<p style="color: rgb(51 65 85); font-size: 0.9375rem; line-height: 1.6;">' + opts.mensaje + '</p>',
    footer: ''
      + '<button type="button" data-modal-close class="btn-secondary">Cancelar</button>'
      + '<button type="button" data-confirmar class="btn-danger">'
        + '<i data-lucide="' + (opts.iconoAccion || 'trash-2') + '" class="w-4 h-4"></i> ' + (opts.textoAccion || 'Eliminar')
      + '</button>',
  });
};
