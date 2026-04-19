var App = window.App || (window.App = {});

App.ClientPicker = class ClientPicker {
  constructor(opts) {
    this.onSelect = opts.onSelect;
    this.onClose = opts.onClose;
    this.query = '';
    this.searching = false;
    this.apiResult = null;
    this.error = null;
    this.overlay = null;
  }

  _filtered() {
    var q = this.query.toLowerCase().trim();
    if (!q) return App.CLIENTES_DEMO;
    return App.CLIENTES_DEMO.filter(function (c) {
      return c.razon_social.toLowerCase().includes(q) || c.num_doc.includes(q);
    });
  }

  async _buscarEnApi() {
    var numero = this.query.trim();
    if (!/^\d{8,11}$/.test(numero)) {
      this.error = 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos).';
      this._refresh();
      return;
    }
    var tipo = numero.length === 11 ? '6' : '1';
    this.searching = true;
    this.error = null;
    this.apiResult = null;
    this._refresh();
    try {
      var res = await App.api.buscarDocumento(tipo, numero);
      this.apiResult = res.data;
    } catch (e) {
      this.error = e.message || 'No se encontró el documento.';
    } finally {
      this.searching = false;
      this._refresh();
    }
  }

  _html() {
    var self = this;
    var apiResultHTML = this.apiResult ? (
      '<div class="mx-4 mt-3 p-4 rounded-lg" style="background: rgb(240 253 244);">'
      + '<div class="text-xs mb-1 flex items-center gap-1" style="color: rgb(21 128 61);">'
      + '<i data-lucide="check-circle-2" class="w-3 h-3"></i> Encontrado vía ' + App.escapeHtml(this.apiResult.fuente || 'API')
      + '</div>'
      + '<div class="font-semibold">' + App.escapeHtml(this.apiResult.razon_social) + '</div>'
      + '<div class="text-sm" style="color: rgb(71 85 105);">'
      + (this.apiResult.tipo_doc === '6' ? 'RUC' : 'DNI') + ': ' + App.escapeHtml(this.apiResult.num_doc)
      + '</div>'
      + (this.apiResult.direccion ? '<div class="text-sm" style="color: rgb(100 116 139);">' + App.escapeHtml(this.apiResult.direccion) + '</div>' : '')
      + '<button id="cp-usar-api" class="btn-primary text-sm" style="margin-top: 0.75rem;">Usar este cliente</button>'
      + '</div>'
    ) : '';

    var errorHTML = this.error
      ? '<div class="mx-4 mt-3 p-3 rounded-lg text-sm" style="background: rgb(254 242 242); color: rgb(185 28 28);">' + App.escapeHtml(this.error) + '</div>'
      : '';

    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(0 0 0 / 0.5);">'
        + '<div class="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" data-stop="1">'
          + '<div class="p-4 flex items-center justify-between">'
            + '<h2 class="text-lg font-semibold flex items-center gap-2">'
            + '<i data-lucide="search" class="w-5 h-5"></i> Seleccionar cliente</h2>'
            + '<button id="cp-close" style="color: rgb(148 163 184);"><i data-lucide="x" class="w-5 h-5"></i></button>'
          + '</div>'
          + '<div class="p-4 flex gap-2">'
            + '<input id="cp-query" type="text" autofocus placeholder="RUC / DNI / Razón social..." class="input flex-1" value="' + App.escapeHtml(this.query) + '" />'
            + '<button id="cp-buscar" class="btn-secondary" ' + (this.searching ? 'disabled' : '') + ' style="white-space: nowrap;">'
            + (this.searching ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Buscando...' : 'Buscar SUNAT/RENIEC')
            + '</button>'
          + '</div>'
          + errorHTML
          + apiResultHTML
          + '<div class="flex-1 overflow-auto">'
            + '<div class="px-4 py-2 text-xs uppercase" style="color: rgb(148 163 184);">Clientes frecuentes</div>'
            + '<table class="table-std">'
              + '<thead><tr><th>Tipo</th><th>Documento</th><th>Razón Social</th><th></th></tr></thead>'
              + '<tbody>'
              + this._filtered().map(function (c) {
                var tipo = c.tipo_doc === '6' ? 'RUC' : c.tipo_doc === '1' ? 'DNI' : App.escapeHtml(c.tipo_doc);
                return '<tr>'
                  + '<td>' + tipo + '</td>'
                  + '<td class="font-mono">' + App.escapeHtml(c.num_doc) + '</td>'
                  + '<td>' + App.escapeHtml(c.razon_social) + '</td>'
                  + '<td><button class="btn-primary text-xs" style="padding: 0.25rem 0.75rem;" data-use="' + App.escapeHtml(c.num_doc) + '">Usar</button></td>'
                  + '</tr>';
              }).join('')
              + '</tbody>'
            + '</table>'
          + '</div>'
        + '</div>'
      + '</div>';
  }

  render(container) {
    container.insertAdjacentHTML('beforeend', this._html());
    this.overlay = container.lastElementChild;
    this._bind();
    App.refreshIcons();
    var q = this.overlay.querySelector('#cp-query');
    if (q) q.focus();
  }

  _refresh() {
    var parent = this.overlay.parentNode;
    var newHTML = this._html();
    this.overlay.outerHTML = newHTML;
    this.overlay = parent.lastElementChild;
    this._bind();
    App.refreshIcons();
  }

  _bind() {
    var self = this;
    this.overlay.addEventListener('click', function (e) {
      var inner = self.overlay.querySelector('[data-stop]');
      if (!inner.contains(e.target)) self._close();
    });

    this.overlay.querySelector('#cp-close').addEventListener('click', function () { self._close(); });

    var q = this.overlay.querySelector('#cp-query');
    q.addEventListener('input', function (e) { self.query = e.target.value; });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); self._buscarEnApi(); }
    });

    this.overlay.querySelector('#cp-buscar').addEventListener('click', function () { self._buscarEnApi(); });

    var usarApi = this.overlay.querySelector('#cp-usar-api');
    if (usarApi) {
      usarApi.addEventListener('click', function () {
        self.onSelect(self.apiResult);
        self._close();
      });
    }

    this.overlay.querySelectorAll('[data-use]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = App.CLIENTES_DEMO.find(function (x) { return x.num_doc === btn.dataset.use; });
        if (c) {
          self.onSelect(c);
          self._close();
        }
      });
    });
  }

  _close() {
    if (this.overlay) this.overlay.remove();
    if (this.onClose) this.onClose();
  }
};
