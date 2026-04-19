var App = window.App || (window.App = {});

(function () {
  var PDF_FORMATS = [
    { value: 'ticket-80', label: 'Ticket 80mm', icon: 'printer' },
    { value: 'ticket-58', label: 'Ticket 58mm', icon: 'printer' },
    { value: 'a5', label: 'A5', icon: 'file-text' },
    { value: 'a4', label: 'A4', icon: 'file-text' },
  ];

  var TIPOS_SIN_CDR = ['guias-remision'];

  App.ResponseModal = class ResponseModal {
    constructor(opts) {
      this.response = opts.response;
      this.error = opts.error;
      this.tipo = opts.tipo;
      this.onClose = opts.onClose;

      this.success = !this.error && this.response && this.response.success;
      this.data = this.response && this.response.data;
      this.docId = this.data && this.data.id;
      this.numeroCompleto = (this.data && this.data.numero_completo)
        || (this.data ? (this.data.serie + '-' + this.data.correlativo) : 'documento');

      this.canShowPdf = this.success && this.docId && this.tipo;
      this.hasCdr = this.canShowPdf && TIPOS_SIN_CDR.indexOf(this.tipo) === -1;

      this.pdfBlobUrl = null;
      this.pdfFormat = 'ticket-80';
      this.loadingPdf = false;
      this.downloading = null;
      this.overlay = null;
    }

    async render(container) {
      container.insertAdjacentHTML('beforeend', this._html());
      this.overlay = container.lastElementChild;
      this._bind();
      App.refreshIcons();

      if (this.canShowPdf) this._loadPdf(this.pdfFormat);
    }

    _headerHTML() {
      var ok = this.success;
      var bg = ok
        ? 'background: rgb(240 253 244);'
        : 'background: rgb(254 242 242);';
      var color = ok ? 'color: rgb(21 128 61);' : 'color: rgb(185 28 28);';
      var iconName = ok ? 'check-circle-2' : 'x-circle';
      var label = ok ? 'Éxito' : 'Error';
      var title = ok ? this.response.message : ((this.error && this.error.message) || 'Error desconocido');

      return ''
        + '<div class="px-5 py-4 rounded-t-2xl" style="' + bg + '">'
          + '<div class="flex items-start justify-between gap-4">'
            + '<div class="min-w-0">'
              + '<div class="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style="' + color + '">'
                + '<i data-lucide="' + iconName + '" class="w-4 h-4"></i> ' + label
              + '</div>'
              + '<h2 class="text-base md:text-lg font-bold mt-1 tracking-tight" style="color: rgb(15 23 42);">'
                + App.escapeHtml(title)
              + '</h2>'
            + '</div>'
            + '<button id="rm-close-x" class="p-1 rounded-lg flex-shrink-0" style="color: rgb(100 116 139);">'
              + '<i data-lucide="x" class="w-5 h-5"></i>'
            + '</button>'
          + '</div>'
        + '</div>';
    }

    _infoLineHTML() {
      if (!this.success || !this.data) return '';
      var d = this.data;
      var total = (d.totales && d.totales.total) != null ? d.totales.total : d.mto_imp_venta;
      var estado = (d.sunat && d.sunat.estado) || d.sunat_status;
      return ''
        + '<div class="mb-3 flex items-center gap-2 text-sm" style="flex-wrap: wrap;">'
          + '<span class="font-bold font-mono" style="color: rgb(37 99 235);">' + App.escapeHtml(this.numeroCompleto) + '</span>'
          + (d.cliente ? '<span style="color: rgb(203 213 225);">·</span>'
              + '<span class="font-semibold" style="color: rgb(51 65 85); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'
              + App.escapeHtml(d.cliente.razon_social) + '</span>' : '')
          + (total !== undefined ? '<span style="color: rgb(203 213 225);">·</span>'
              + '<span class="font-bold" style="color: rgb(15 23 42);">'
              + App.escapeHtml(d.tipo_moneda || 'PEN') + ' ' + parseFloat(total).toFixed(2) + '</span>' : '')
          + (estado ? App.estadoBadgeHTML(estado) : '')
        + '</div>';
    }

    _pdfToolbarHTML() {
      if (!this.canShowPdf) return '';
      var self = this;
      var buttons = PDF_FORMATS.map(function (f) {
        var active = self.pdfFormat === f.value;
        var style = active
          ? 'background: rgb(37 99 235); color: white; box-shadow: 0 1px 2px rgb(59 130 246 / 0.3);'
          : 'background: rgb(241 245 249); color: rgb(51 65 85);';
        return '<button type="button" data-format="' + f.value + '" ' + (self.loadingPdf ? 'disabled' : '')
          + ' style="' + style + ' display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 700; border-radius: 0.5rem; transition: all 0.15s; cursor: pointer; border: none;">'
          + '<i data-lucide="' + f.icon + '" class="w-3.5 h-3.5"></i> ' + f.label + '</button>';
      }).join('');

      return ''
        + '<div style="background: rgb(248 250 252); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;" class="sm:flex-row sm:items-center">'
          + '<div style="display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; flex: 1;">'
            + '<span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(100 116 139); margin-right: 0.25rem;">Formato:</span>'
            + buttons
          + '</div>'
          + '<button type="button" id="rm-dl-pdf" class="btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.75rem;" ' + (this.downloading === 'pdf' ? 'disabled' : '') + '>'
            + (this.downloading === 'pdf'
              ? '<i data-lucide="loader-2" class="w-3.5 h-3.5 icon-spin"></i> Descargando...'
              : '<i data-lucide="download" class="w-3.5 h-3.5"></i> PDF')
          + '</button>'
        + '</div>';
    }

    _bodyHTML() {
      if (!this.success) {
        var errorsHTML = (this.error && this.error.errors) ? (
          '<div class="p-4 rounded-xl mb-4" style="background: rgb(254 242 242);">'
          + '<div class="text-sm font-bold mb-2" style="color: rgb(153 27 27);">Errores de validación:</div>'
          + '<pre class="text-xs font-mono" style="color: rgb(185 28 28); white-space: pre-wrap;">'
          + App.escapeHtml(JSON.stringify(this.error.errors, null, 2)) + '</pre></div>'
        ) : '';

        var jsonSrc = this.error && this.error.data ? this.error.data : { error: this.error && this.error.message };

        return ''
          + '<div class="overflow-auto flex-1 p-5">'
            + errorsHTML
            + '<details class="mt-3">'
              + '<summary style="cursor: pointer; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgb(148 163 184); user-select: none;">Ver respuesta completa (JSON)</summary>'
              + '<pre style="margin-top: 0.5rem; padding: 0.75rem; background: rgb(15 23 42); color: rgb(134 239 172); font-size: 0.75rem; border-radius: 0.5rem; overflow: auto; max-height: 15rem;" class="font-mono">'
              + App.escapeHtml(JSON.stringify(jsonSrc, null, 2)) + '</pre>'
            + '</details>'
          + '</div>';
      }

      var cdrBtn = this.hasCdr ? (
        '<button type="button" id="rm-dl-cdr" class="btn-secondary text-sm" ' + (this.downloading === 'cdr' ? 'disabled' : '') + '>'
        + (this.downloading === 'cdr'
          ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Descargando CDR...'
          : '<i data-lucide="file-archive" class="w-4 h-4"></i> Descargar CDR')
        + '</button>'
      ) : '';

      var pdfBlock = this.canShowPdf ? (
        '<div style="background: rgb(248 250 252); border-radius: 0.75rem; overflow: hidden; margin-bottom: 1rem;">'
        + this._pdfToolbarHTML()
        + '<div id="rm-pdf-viewer" style="position: relative; background: rgb(241 245 249); height: 500px;">'
          + '<div id="rm-pdf-loader" style="position: absolute; inset: 0; display: ' + (this.loadingPdf ? 'flex' : 'none') + '; align-items: center; justify-content: center; background: rgb(255 255 255 / 0.8); z-index: 10;">'
            + '<i data-lucide="loader-2" class="w-6 h-6 icon-spin" style="color: rgb(37 99 235);"></i>'
          + '</div>'
          + '<iframe id="rm-pdf-iframe" title="PDF ' + App.escapeHtml(this.numeroCompleto) + '" style="width: 100%; height: 100%; border: 0; display: ' + (this.pdfBlobUrl ? 'block' : 'none') + ';" src="' + (this.pdfBlobUrl || '') + '"></iframe>'
          + '<div id="rm-pdf-empty" style="display: ' + (this.pdfBlobUrl || this.loadingPdf ? 'none' : 'flex') + '; align-items: center; justify-content: center; height: 100%; color: rgb(148 163 184); font-size: 0.875rem;">PDF no disponible</div>'
        + '</div>'
        + '</div>'
        + '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">'
          + '<button type="button" id="rm-dl-xml" class="btn-secondary text-sm" ' + (this.downloading === 'xml' ? 'disabled' : '') + '>'
            + (this.downloading === 'xml'
              ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Descargando XML...'
              : '<i data-lucide="file-code" class="w-4 h-4"></i> Descargar XML')
          + '</button>'
          + cdrBtn
        + '</div>'
      ) : '';

      return ''
        + '<div class="overflow-auto flex-1 p-5">'
          + this._infoLineHTML()
          + pdfBlock
          + '<details class="mt-3">'
            + '<summary style="cursor: pointer; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgb(148 163 184); user-select: none;">Ver respuesta completa (JSON)</summary>'
            + '<pre style="margin-top: 0.5rem; padding: 0.75rem; background: rgb(15 23 42); color: rgb(134 239 172); font-size: 0.75rem; border-radius: 0.5rem; overflow: auto; max-height: 15rem;" class="font-mono">'
            + App.escapeHtml(JSON.stringify(this.response, null, 2)) + '</pre>'
          + '</details>'
        + '</div>';
    }

    _html() {
      return ''
        + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
          + '<div class="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl" data-stop="1">'
            + this._headerHTML()
            + this._bodyHTML()
            + '<div class="p-4 flex justify-end rounded-b-2xl" style="background: rgb(248 250 252);">'
              + '<button id="rm-close" class="btn-primary">Cerrar</button>'
            + '</div>'
          + '</div>'
        + '</div>';
    }

    _bind() {
      var self = this;
      this.overlay.querySelector('#rm-close-x').addEventListener('click', function () { self._close(); });
      this.overlay.querySelector('#rm-close').addEventListener('click', function () { self._close(); });

      this.overlay.querySelectorAll('[data-format]').forEach(function (btn) {
        btn.addEventListener('click', function () { self._loadPdf(btn.dataset.format); });
      });

      var dlPdf = this.overlay.querySelector('#rm-dl-pdf');
      if (dlPdf) dlPdf.addEventListener('click', function () { self._descargar('pdf'); });

      var dlXml = this.overlay.querySelector('#rm-dl-xml');
      if (dlXml) dlXml.addEventListener('click', function () { self._descargar('xml'); });

      var dlCdr = this.overlay.querySelector('#rm-dl-cdr');
      if (dlCdr) dlCdr.addEventListener('click', function () { self._descargar('cdr'); });
    }

    _refreshBody() {
      var parent = this.overlay.parentNode;
      this.overlay.outerHTML = this._html();
      this.overlay = parent.lastElementChild;
      this._bind();
      App.refreshIcons();
    }

    async _loadPdf(format) {
      if (!this.canShowPdf) return;
      this.loadingPdf = true;
      this.pdfFormat = format;
      this._refreshBody();
      try {
        var blob = await App.api.descargarPdf(this.tipo, this.docId, format);
        if (this.pdfBlobUrl) URL.revokeObjectURL(this.pdfBlobUrl);
        this.pdfBlobUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.error('Error cargando PDF:', e);
      } finally {
        this.loadingPdf = false;
        this._refreshBody();
      }
    }

    async _descargar(kind) {
      if (!this.docId) return;
      this.downloading = kind;
      this._refreshBody();
      try {
        var blob, filename;
        if (kind === 'pdf') {
          blob = await App.api.descargarPdf(this.tipo, this.docId, this.pdfFormat);
          filename = this.numeroCompleto + '-' + this.pdfFormat + '.pdf';
        } else if (kind === 'xml') {
          blob = await App.api.descargarXml(this.tipo, this.docId);
          filename = this.numeroCompleto + '.xml';
        } else if (kind === 'cdr') {
          blob = await App.api.descargarCdr(this.tipo, this.docId);
          filename = 'R-' + this.numeroCompleto + '.zip';
        }
        App.descargarBlob(blob, filename);
      } catch (e) {
        alert('Error al descargar ' + kind.toUpperCase() + ': ' + e.message);
      } finally {
        this.downloading = null;
        this._refreshBody();
      }
    }

    _close() {
      if (this.pdfBlobUrl) URL.revokeObjectURL(this.pdfBlobUrl);
      if (this.overlay) this.overlay.remove();
      if (this.onClose) this.onClose();
    }
  };
})();
