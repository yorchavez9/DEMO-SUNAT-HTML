var App = window.App || (window.App = {});

(function () {
  App.ResponseModal = class ResponseModal {
    constructor(opts) {
      this.response = opts.response;
      this.error = opts.error;
      this.tipo = opts.tipo;
      this.onClose = opts.onClose;

      this.success = !this.error && this.response && this.response.success;
      this.data = this.response && this.response.data;
      this.docId = this.data && this.data.id;

      this.canShowPdf = this.success && this.docId && this.tipo;
      this.pdfFormat = opts.pdfFormat || 'ticket-80';
      this.pdfBlobUrl = null;
      this.loadingPdf = false;
      this.overlay = null;
    }

    async render(container) {
      container.insertAdjacentHTML('beforeend', this._html());
      this.overlay = container.lastElementChild;
      this._bind();
      App.refreshIcons();

      if (this.canShowPdf) this._loadPdf();
    }

    _html() {
      var inner = this.canShowPdf ? this._pdfHTML() : this._errorHTML();

      return ''
        + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
          + '<div style="position: relative; width: 100%; max-width: 42rem; height: 92vh;">'
          + '<button id="rm-close-x" style="position: absolute; top: 0.75rem; right: -3rem; z-index: 20; width: 2rem; height: 2rem; border-radius: 9999px; background: white; box-shadow: 0 2px 8px rgb(0 0 0 / 0.2); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgb(100 116 139);">'
            + '<i data-lucide="x" class="w-4 h-4"></i>'
          + '</button>'
          + '<div class="bg-white rounded-2xl w-full shadow-2xl overflow-hidden" style="height: 100%; display: flex; flex-direction: column;" data-stop="1">'
            + inner
          + '</div>'
        + '</div>';
    }

    _pdfHTML() {
      return ''
        + '<div style="flex: 1; position: relative;">'
          + '<div id="rm-pdf-loader" style="position: absolute; inset: 0; display: ' + (this.loadingPdf ? 'flex' : 'none') + '; align-items: center; justify-content: center; background: white; z-index: 10;">'
            + '<i data-lucide="loader-2" class="w-7 h-7 icon-spin" style="color: rgb(37 99 235);"></i>'
          + '</div>'
          + '<iframe id="rm-pdf-iframe" title="PDF" style="width: 100%; height: 100%; border: 0; display: ' + (this.pdfBlobUrl ? 'block' : 'none') + ';" src="' + (this.pdfBlobUrl || '') + '"></iframe>'
        + '</div>';
    }

    _errorHTML() {
      var msg = (this.error && this.error.message) || 'Error desconocido';
      var errorsBlock = (this.error && this.error.errors)
        ? '<pre style="font-size: 0.75rem; color: rgb(185 28 28); background: rgb(254 242 242); border-radius: 0.5rem; padding: 0.75rem; text-align: left; max-height: 15rem; overflow: auto; width: 100%; font-family: monospace; white-space: pre-wrap;">'
            + App.escapeHtml(JSON.stringify(this.error.errors, null, 2)) + '</pre>'
        : '';

      return ''
        + '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 0.75rem;">'
          + '<i data-lucide="x-circle" style="width: 2.5rem; height: 2.5rem; color: rgb(239 68 68);"></i>'
          + '<p style="color: rgb(51 65 85); font-weight: 600;">' + App.escapeHtml(msg) + '</p>'
          + errorsBlock
        + '</div>';
    }

    _bind() {
      var self = this;
      this.overlay.querySelector('#rm-close-x').addEventListener('click', function () { self._close(); });
      this.overlay.addEventListener('click', function (e) {
        if (!e.target.closest('[data-stop]')) self._close();
      });
    }

    _refreshPdf() {
      var modal = this.overlay.querySelector('[data-stop]');
      modal.innerHTML = this._pdfHTML();
      this._bind();
      App.refreshIcons();
    }

    async _loadPdf() {
      if (!this.canShowPdf) return;
      this.loadingPdf = true;
      this._refreshPdf();
      try {
        var blob = await App.api.descargarPdf(this.tipo, this.docId, this.pdfFormat);
        if (this.pdfBlobUrl) URL.revokeObjectURL(this.pdfBlobUrl);
        this.pdfBlobUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.error('Error cargando PDF:', e);
      } finally {
        this.loadingPdf = false;
        this._refreshPdf();
      }
    }

    _close() {
      if (this.pdfBlobUrl) URL.revokeObjectURL(this.pdfBlobUrl);
      if (this.overlay) this.overlay.remove();
      if (this.onClose) this.onClose();
    }
  };
})();
