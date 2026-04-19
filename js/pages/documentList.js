var App = window.App || (window.App = {});

(function () {
  var LABELS = {
    'facturas':        { titulo: 'Facturas',         icon: 'file-text',       method: 'listarFacturas',     hasCdr: true  },
    'boletas':         { titulo: 'Boletas',          icon: 'receipt',         method: 'listarBoletas',      hasCdr: true  },
    'notas-credito':   { titulo: 'Notas de Crédito', icon: 'trending-down',   method: 'listarNotasCredito', hasCdr: true  },
    'notas-debito':    { titulo: 'Notas de Débito',  icon: 'trending-up',     method: 'listarNotasDebito',  hasCdr: true  },
    'guias-remision':  { titulo: 'Guías de Remisión',icon: 'truck',           method: 'listarGuias',        hasCdr: false },
  };

  App.DocumentList = class DocumentList {
    constructor(tipo) {
      this.tipo = tipo;
      this.config = LABELS[tipo] || LABELS['facturas'];
      this.docs = [];
      this.loading = true;
      this.error = null;
      this.filtro = { estado: '', buscar: '' };
      this.downloading = null;
      this.container = null;
    }

    async render(container) {
      this.container = container;
      this._renderHTML();
      this._bind();
      await this._load();
    }

    _renderHTML() {
      var f = this.filtro;
      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title">'
            + '<i data-lucide="' + this.config.icon + '" class="w-7 h-7"></i> ' + App.escapeHtml(this.config.titulo)
          + '</h1>'
          + '<div class="card" style="margin-bottom: 1rem;">'
            + '<div style="display: flex; flex-direction: column; gap: 0.75rem;" class="filter-row">'
              + '<div style="flex: 1;">'
                + '<label class="label">Buscar</label>'
                + '<input id="dl-buscar" class="input" placeholder="Serie, correlativo, cliente..." value="' + App.escapeHtml(f.buscar) + '" />'
              + '</div>'
              + '<div>'
                + '<label class="label">Estado SUNAT</label>'
                + '<select id="dl-estado" class="input">'
                  + '<option value=""' + (f.estado === '' ? ' selected' : '') + '>Todos</option>'
                  + '<option value="pendiente"' + (f.estado === 'pendiente' ? ' selected' : '') + '>Pendiente</option>'
                  + '<option value="enviado"' + (f.estado === 'enviado' ? ' selected' : '') + '>Enviado</option>'
                  + '<option value="aceptado"' + (f.estado === 'aceptado' ? ' selected' : '') + '>Aceptado</option>'
                  + '<option value="rechazado"' + (f.estado === 'rechazado' ? ' selected' : '') + '>Rechazado</option>'
                  + '<option value="anulado"' + (f.estado === 'anulado' ? ' selected' : '') + '>Anulado</option>'
                + '</select>'
              + '</div>'
              + '<button id="dl-filtrar" class="btn-primary"><i data-lucide="search" class="w-4 h-4"></i> Filtrar</button>'
            + '</div>'
            + '<style>@media (min-width: 640px) { .filter-row { flex-direction: row !important; align-items: flex-end !important; } }</style>'
          + '</div>'
          + '<div class="card" id="dl-body">' + this._bodyHTML() + '</div>'
        + '</div>';

      App.refreshIcons();
    }

    _bodyHTML() {
      if (this.loading) {
        return '<div style="text-align: center; padding: 2rem 0; color: rgb(148 163 184); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">'
          + '<i data-lucide="loader-2" class="w-5 h-5 icon-spin"></i> Cargando...</div>';
      }
      if (this.error) {
        return '<div style="padding: 1rem; background: rgb(254 242 242); color: rgb(185 28 28); border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" class="w-5 h-5"></i> ' + App.escapeHtml(this.error) + '</div>';
      }
      if (this.docs.length === 0) {
        return '<div style="text-align: center; padding: 2rem 0; color: rgb(148 163 184);">Sin documentos</div>';
      }

      var self = this;
      var rows = this.docs.map(function (d) { return self._rowHTML(d); }).join('');
      return '<div class="table-wrap">'
        + '<table class="table-std">'
          + '<thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th>'
          + '<th style="text-align: right;">Total</th><th>Estado</th><th>Acciones</th></tr></thead>'
          + '<tbody>' + rows + '</tbody>'
        + '</table>'
        + '</div>';
    }

    _rowHTML(d) {
      var total = (d.totales && d.totales.total != null) ? d.totales.total
                : (d.mto_imp_venta != null ? d.mto_imp_venta
                : (d.monto_total != null ? d.monto_total : 0));
      var estado = (d.sunat && d.sunat.estado) || d.sunat_status || null;
      var clienteNombre = (d.cliente && d.cliente.razon_social)
        || d.client_razon_social
        || (d.destinatario && d.destinatario.razon_social)
        || '-';
      var numero = d.numero_completo || (d.serie + '-' + d.correlativo);
      var self = this;

      function actionBtn(kind, icon, label, color) {
        var key = d.id + '_' + kind;
        var loading = self.downloading === key;
        return '<button type="button" data-download="' + kind + '" data-id="' + d.id + '" ' + (loading ? 'disabled' : '') + ' '
          + 'title="Descargar ' + label + '" '
          + 'style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 0.375rem; ' + color + ' background: transparent; border: none; cursor: pointer;">'
          + (loading
            ? '<i data-lucide="loader-2" class="w-[14px] h-[14px] icon-spin"></i>'
            : '<i data-lucide="' + icon + '" class="w-[14px] h-[14px]"></i>')
          + ' ' + label + '</button>';
      }

      return '<tr>'
        + '<td class="font-mono font-semibold" style="color: rgb(15 23 42);">' + App.escapeHtml(numero) + '</td>'
        + '<td style="color: rgb(71 85 105);">' + App.escapeHtml((d.fecha_emision || '').slice(0, 10)) + '</td>'
        + '<td style="max-width: 20rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + App.escapeHtml(clienteNombre) + '</td>'
        + '<td style="text-align: right; font-weight: 700; color: rgb(15 23 42);">' + App.escapeHtml(d.tipo_moneda || 'PEN') + ' ' + parseFloat(total).toFixed(2) + '</td>'
        + '<td>' + App.estadoBadgeHTML(estado) + '</td>'
        + '<td><div style="display: flex; align-items: center; gap: 0.25rem;">'
          + actionBtn('pdf', 'file-text', 'PDF', 'color: rgb(37 99 235);')
          + actionBtn('xml', 'file-code', 'XML', 'color: rgb(71 85 105);')
          + (this.config.hasCdr ? actionBtn('cdr', 'file-archive', 'CDR', 'color: rgb(217 119 6);') : '')
        + '</div></td>'
        + '</tr>';
    }

    _refreshBody() {
      this.container.querySelector('#dl-body').innerHTML = this._bodyHTML();
      App.refreshIcons();
      this._bindDownloads();
    }

    _bind() {
      var self = this;
      this.container.querySelector('#dl-buscar').addEventListener('input', function (e) { self.filtro.buscar = e.target.value; });
      this.container.querySelector('#dl-estado').addEventListener('change', function (e) { self.filtro.estado = e.target.value; });
      this.container.querySelector('#dl-filtrar').addEventListener('click', function () { self._load(); });
      this._bindDownloads();
    }

    _bindDownloads() {
      var self = this;
      this.container.querySelectorAll('[data-download]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var kind = btn.dataset.download;
          var id = parseInt(btn.dataset.id, 10);
          var doc = self.docs.find(function (d) { return d.id === id; });
          if (doc) self._descargar(doc, kind);
        });
      });
    }

    async _load() {
      this.loading = true;
      this.error = null;
      this._refreshBody();

      try {
        var params = new URLSearchParams();
        if (this.filtro.estado) params.append('estado', this.filtro.estado);
        if (this.filtro.buscar) params.append('buscar', this.filtro.buscar);
        var query = params.toString() ? ('?' + params.toString()) : '';
        var res = await App.api[this.config.method](query);
        this.docs = Array.isArray(res.data) ? res.data : ((res.data && res.data.data) || []);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        this._refreshBody();
      }
    }

    async _descargar(doc, kind) {
      var key = doc.id + '_' + kind;
      this.downloading = key;
      this._refreshBody();

      try {
        var numero = doc.numero_completo || (doc.serie + '-' + doc.correlativo);
        var blob, filename;
        if (kind === 'pdf') {
          blob = await App.api.descargarPdf(this.tipo, doc.id, 'a4');
          filename = numero + '.pdf';
        } else if (kind === 'xml') {
          blob = await App.api.descargarXml(this.tipo, doc.id);
          filename = numero + '.xml';
        } else if (kind === 'cdr') {
          blob = await App.api.descargarCdr(this.tipo, doc.id);
          filename = 'R-' + numero + '.zip';
        }
        App.descargarBlob(blob, filename);
      } catch (e) {
        alert('Error al descargar ' + kind.toUpperCase() + ': ' + e.message);
      } finally {
        this.downloading = null;
        this._refreshBody();
      }
    }
  };
})();
