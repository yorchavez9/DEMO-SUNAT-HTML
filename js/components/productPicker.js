var App = window.App || (window.App = {});

App.ProductPicker = class ProductPicker {
  constructor(opts) {
    this.onSelect = opts.onSelect;
    this.onClose = opts.onClose;
    this.query = '';
    this.overlay = null;
  }

  _filtered() {
    var q = this.query.toLowerCase().trim();
    if (!q) return App.PRODUCTOS_DEMO;
    return App.PRODUCTOS_DEMO.filter(function (p) {
      return p.descripcion.toLowerCase().includes(q)
        || p.codigo.toLowerCase().includes(q)
        || p.categoria.toLowerCase().includes(q);
    });
  }

  _rowsHTML() {
    var filtered = this._filtered();
    if (filtered.length === 0) {
      return '<div class="p-8 text-center" style="color: rgb(148 163 184);">Sin resultados</div>';
    }
    return ''
      + '<table class="table-std">'
        + '<thead style="position: sticky; top: 0;"><tr>'
          + '<th>Código</th><th>Descripción</th><th>Und</th>'
          + '<th style="text-align: right;">Precio</th><th></th>'
        + '</tr></thead>'
        + '<tbody>'
        + filtered.map(function (p) {
          return '<tr>'
            + '<td class="font-mono text-xs">' + App.escapeHtml(p.codigo) + '</td>'
            + '<td><div>' + App.escapeHtml(p.descripcion) + '</div>'
            + '<div class="text-xs" style="color: rgb(148 163 184);">' + App.escapeHtml(p.categoria) + '</div></td>'
            + '<td class="text-xs">' + (function(cod) { var u = (App.SUNAT_UNITS||[]).find(function(x){return x.cod===cod;}); return u ? u.sym : App.escapeHtml(cod); })(p.unidad) + '</td>'
            + '<td class="text-right font-semibold">S/ ' + p.precio_unitario.toFixed(2) + '</td>'
            + '<td><button class="btn-primary text-xs" style="padding: 0.25rem 0.75rem;" data-code="' + App.escapeHtml(p.codigo) + '">Agregar</button></td>'
            + '</tr>';
        }).join('')
        + '</tbody>'
      + '</table>';
  }

  _html() {
    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(0 0 0 / 0.5);">'
        + '<div class="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col" data-stop="1">'
          + '<div class="p-4 flex items-center justify-between">'
            + '<h2 class="text-lg font-semibold flex items-center gap-2">'
              + '<i data-lucide="search" class="w-5 h-5"></i> Seleccionar producto'
            + '</h2>'
            + '<button id="pp-close" style="color: rgb(148 163 184);">'
              + '<i data-lucide="x" class="w-5 h-5"></i></button>'
          + '</div>'
          + '<div class="p-4">'
            + '<input id="pp-query" type="text" autofocus placeholder="Buscar por nombre, código o categoría..." class="input" value="' + App.escapeHtml(this.query) + '" />'
          + '</div>'
          + '<div class="flex-1 overflow-auto" id="pp-rows">' + this._rowsHTML() + '</div>'
        + '</div>'
      + '</div>';
  }

  render(container) {
    container.insertAdjacentHTML('beforeend', this._html());
    this.overlay = container.lastElementChild;
    this._bind();
    App.refreshIcons();
    var q = this.overlay.querySelector('#pp-query');
    if (q) q.focus();
  }

  _bind() {
    var self = this;
    this.overlay.addEventListener('click', function (e) {
      var inner = self.overlay.querySelector('[data-stop]');
      if (!inner.contains(e.target)) self._close();
    });

    this.overlay.querySelector('#pp-close').addEventListener('click', function () { self._close(); });

    this.overlay.querySelector('#pp-query').addEventListener('input', function (e) {
      self.query = e.target.value;
      self._refreshRows();
    });

    this._bindRowButtons();
  }

  _bindRowButtons() {
    var self = this;
    this.overlay.querySelectorAll('[data-code]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prod = App.PRODUCTOS_DEMO.find(function (p) { return p.codigo === btn.dataset.code; });
        if (prod) {
          self.onSelect(prod);
          self._close();
        }
      });
    });
  }

  _refreshRows() {
    this.overlay.querySelector('#pp-rows').innerHTML = this._rowsHTML();
    App.refreshIcons();
    this._bindRowButtons();
  }

  _close() {
    if (this.overlay) this.overlay.remove();
    if (this.onClose) this.onClose();
  }
};
