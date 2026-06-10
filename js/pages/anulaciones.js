var App = window.App || (window.App = {});

var ANUL_TIPOS_DOC = [
  { cod: '01', label: 'Factura' },
  { cod: '07', label: 'Nota de Crédito' },
  { cod: '08', label: 'Nota de Débito' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Página: Anulaciones
// ──────────────────────────────────────────────────────────────────────────────
App.Anulaciones = class Anulaciones {
  constructor() {
    this.items = [];
    this.loading = true;
    this.error = null;
    this.refreshing = null;
    this.sending = null;
    this.container = null;
  }

  async render(container) {
    this.container = container;
    this._renderHTML();
    this._bind();
    await this._load();
  }

  _renderHTML() {
    this.container.innerHTML = ''
      + '<div>'
        + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; gap: 0.75rem; flex-wrap: wrap;">'
          + '<h1 class="page-title" style="margin-bottom: 0;">'
            + '<i data-lucide="ban" class="w-7 h-7"></i> Anulaciones'
          + '</h1>'
          + '<button id="an-new" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nueva Anulación</button>'
        + '</div>'
        + '<div style="margin-bottom: 1.25rem; padding: 1rem; background: rgb(239 246 255); border-radius: 0.75rem; display: flex; gap: 0.75rem; font-size: 0.875rem; color: rgb(30 64 175);">'
          + '<i data-lucide="info" style="width: 20px; height: 20px; flex-shrink: 0; color: rgb(59 130 246); margin-top: 0.125rem;"></i>'
          + '<div><strong>Comunicación de Baja</strong> — Anula facturas, notas de crédito y notas de débito ya enviadas a SUNAT. Plazo máximo: 7 días desde la emisión. Para anular <strong>boletas</strong> usa el módulo <a data-path="/resumenes" style="text-decoration: underline; font-weight: 600; cursor: pointer;">Resúmenes Diarios</a>.</div>'
        + '</div>'
        + '<div class="card">'
          + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">'
            + '<h2 class="section-title" style="margin-bottom: 0;">Historial</h2>'
            + '<button id="an-reload" class="btn-ghost text-sm">'
              + '<i data-lucide="refresh-ccw" class="w-4 h-4 ' + (this.loading ? 'icon-spin' : '') + '"></i> Actualizar'
            + '</button>'
          + '</div>'
          + '<div id="an-body">' + this._bodyHTML() + '</div>'
        + '</div>'
      + '</div>';

    App.refreshIcons();
  }

  _bodyHTML() {
    if (this.loading) {
      return '<div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">'
        + '<i data-lucide="loader-2" class="w-5 h-5 icon-spin"></i> Cargando...</div>';
    }
    if (this.error) {
      return '<div style="padding: 1rem; background: rgb(254 242 242); color: rgb(185 28 28); border-radius: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">'
        + '<i data-lucide="x-circle" class="w-5 h-5"></i> ' + App.escapeHtml(this.error) + '</div>';
    }
    if (this.items.length === 0) {
      return '<div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184);">'
        + 'Sin anulaciones registradas. Crea la primera con "Nueva Anulación".</div>';
    }

    var self = this;
    var rows = this.items.map(function (a) { return self._rowHTML(a); }).join('');
    return '<div class="table-wrap">'
      + '<table class="table-std" style="min-width: 800px;">'
        + '<thead><tr>'
          + '<th>Identificador</th><th>Fecha</th>'
          + '<th style="text-align: right;">Docs</th><th>Estado SUNAT</th>'
          + '<th>Ticket</th><th></th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
      + '</table></div>';
  }

  _rowHTML(a) {
    var fecha = (a.fecha_generacion || a.fecha_referencia || '').slice(0, 10) || '—';
    var totalDocs = a.total_documentos != null ? a.total_documentos : (a.detalles ? a.detalles.length : '—');
    var isRefreshing = this.refreshing === a.id;
    var isSending = this.sending === a.id;

    var enviarBtn = a.estado_sunat === 'pendiente'
      ? '<button type="button" data-enviar="' + a.id + '" ' + (isSending ? 'disabled' : '') + ' '
          + 'style="color: rgb(21 128 61); background: transparent; border: none; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; margin-right: 0.25rem;">'
          + '<i data-lucide="' + (isSending ? 'loader-2' : 'send') + '" class="w-[14px] h-[14px] ' + (isSending ? 'icon-spin' : '') + '"></i> Enviar'
        + '</button>'
      : '';

    return '<tr>'
      + '<td class="font-mono font-bold" style="color: rgb(15 23 42);">' + App.escapeHtml(a.identifier) + '</td>'
      + '<td style="color: rgb(71 85 105);">' + App.escapeHtml(fecha) + '</td>'
      + '<td style="text-align: right; font-weight: 700;">' + totalDocs + '</td>'
      + '<td>' + App.estadoBadgeHTML(a.estado_sunat) + '</td>'
      + '<td class="text-xs font-mono" style="color: rgb(100 116 139);">' + App.escapeHtml(a.ticket || '—') + '</td>'
      + '<td style="white-space: nowrap;">'
        + enviarBtn
        + '<button type="button" data-refresh="' + a.id + '" ' + (isRefreshing ? 'disabled' : '') + ' '
          + 'style="color: rgb(37 99 235); background: transparent; border: none; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">'
          + '<i data-lucide="' + (isRefreshing ? 'loader-2' : 'refresh-ccw') + '" class="w-[14px] h-[14px] ' + (isRefreshing ? 'icon-spin' : '') + '"></i> Refrescar'
        + '</button>'
      + '</td>'
      + '</tr>';
  }

  _bind() {
    var self = this;
    this.container.querySelector('#an-new').addEventListener('click', function () { self._openModal(); });
    this.container.querySelector('#an-reload').addEventListener('click', function () { self._load(); });

    var infoLink = this.container.querySelector('[data-path="/resumenes"]');
    if (infoLink) {
      infoLink.addEventListener('click', function () {
        window.location.hash = '#/resumenes';
      });
    }

    this._bindTableButtons();
  }

  _bindTableButtons() {
    var self = this;
    this.container.querySelectorAll('[data-refresh]').forEach(function (btn) {
      btn.addEventListener('click', function () { self._refrescar(parseInt(btn.dataset.refresh, 10)); });
    });
    this.container.querySelectorAll('[data-enviar]').forEach(function (btn) {
      btn.addEventListener('click', function () { self._enviar(parseInt(btn.dataset.enviar, 10)); });
    });
  }

  _refreshBody() {
    this.container.querySelector('#an-body').innerHTML = this._bodyHTML();
    App.refreshIcons();
    this._bindTableButtons();
  }

  async _load() {
    this.loading = true;
    this.error = null;
    this._refreshBody();
    try {
      var res = await App.api.listarAnulaciones();
      this.items = res.data || [];
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
      this._refreshBody();
    }
  }

  async _refrescar(id) {
    this.refreshing = id;
    this._refreshBody();
    try {
      await App.api.estadoAnulacion(id);
      await this._load();
    } catch (e) {
      alert('Error al refrescar: ' + e.message);
    } finally {
      this.refreshing = null;
      this._refreshBody();
    }
  }

  async _enviar(id) {
    this.sending = id;
    this._refreshBody();
    try {
      await App.api.enviarAnulacion(id);
      await this._load();
    } catch (e) {
      alert('Error al enviar: ' + e.message);
    } finally {
      this.sending = null;
      this._refreshBody();
    }
  }

  _openModal() {
    var self = this;
    new App.NuevaAnulacionModal({
      onSuccess: function () { self._load(); },
    }).render(document.body);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Nueva Anulación
// ──────────────────────────────────────────────────────────────────────────────
App.NuevaAnulacionModal = class NuevaAnulacionModal {
  constructor(opts) {
    this.onSuccess = opts.onSuccess;
    this.detalles = [this._detalleVacio()];
    this.fechaGen = App.todayISO();
    this.fechaCom = App.todayISO();
    this.sending = false;
    this.response = null;
    this.error = null;
    this.overlay = null;
  }

  _detalleVacio() {
    return { tipo_documento: '01', serie: '', correlativo: '', motivo: '' };
  }

  render(container) {
    container.insertAdjacentHTML('beforeend', this._html());
    this.overlay = container.lastElementChild;
    this._bind();
    App.refreshIcons();
  }

  _refresh() {
    var parent = this.overlay.parentNode;
    var next = document.createElement('div');
    next.innerHTML = this._html();
    parent.replaceChild(next.firstElementChild, this.overlay);
    this.overlay = parent.lastElementChild;
    this._bind();
    App.refreshIcons();
  }

  _tiposOpts(selected) {
    return ANUL_TIPOS_DOC.map(function (t) {
      return '<option value="' + t.cod + '"' + (t.cod === selected ? ' selected' : '') + '>'
        + t.cod + ' – ' + t.label + '</option>';
    }).join('');
  }

  _detalleRowHTML(d, idx) {
    return '<div data-row="' + idx + '" style="background: rgb(248 250 252); border: 1px solid rgb(226 232 240); border-radius: 0.75rem; padding: 0.75rem;">'
      + '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-end;">'
        + '<div style="flex: 0 0 9rem;">'
          + '<label class="label" style="font-size: 0.75rem;">Tipo doc.</label>'
          + '<select class="input text-sm" data-field="tipo_documento" data-row="' + idx + '">'
            + this._tiposOpts(d.tipo_documento)
          + '</select>'
        + '</div>'
        + '<div style="flex: 0 0 5.5rem;">'
          + '<label class="label" style="font-size: 0.75rem;">Serie</label>'
          + '<input class="input font-mono text-sm" placeholder="F001" maxlength="4" data-field="serie" data-row="' + idx + '" value="' + App.escapeHtml(d.serie) + '" />'
        + '</div>'
        + '<div style="flex: 0 0 5.5rem;">'
          + '<label class="label" style="font-size: 0.75rem;">Correlativo</label>'
          + '<input class="input text-sm" placeholder="123" data-field="correlativo" data-row="' + idx + '" value="' + App.escapeHtml(d.correlativo) + '" />'
        + '</div>'
        + '<div style="flex: 1; min-width: 8rem;">'
          + '<label class="label" style="font-size: 0.75rem;">Motivo</label>'
          + '<input class="input text-sm" placeholder="Error en datos del cliente" maxlength="255" data-field="motivo" data-row="' + idx + '" value="' + App.escapeHtml(d.motivo) + '" />'
        + '</div>'
        + (this.detalles.length > 1
          ? '<button type="button" data-remove="' + idx + '" style="flex-shrink: 0; padding: 0.375rem; color: rgb(248 113 113); background: transparent; border: none; cursor: pointer; border-radius: 0.5rem;">'
              + '<i data-lucide="trash-2" class="w-4 h-4"></i></button>'
          : '')
      + '</div>'
    + '</div>';
  }

  _html() {
    if (this.response) return this._successHTML();

    var self = this;
    var detallesHTML = this.detalles.map(function (d, i) { return self._detalleRowHTML(d, i); }).join('');

    var errorHTML = this.error
      ? '<div style="margin-top: 0.75rem; padding: 0.75rem; background: rgb(254 242 242); border-radius: 0.75rem; font-size: 0.875rem; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" class="w-4 h-4" style="flex-shrink: 0;"></i><span>' + App.escapeHtml(this.error) + '</span></div>'
      : '';

    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
        + '<div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" data-stop="1">'
          + '<div style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgb(241 245 249);">'
            + '<h2 style="font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">'
              + '<i data-lucide="ban" style="width: 20px; height: 20px; color: rgb(239 68 68);"></i> Nueva Anulación'
            + '</h2>'
            + '<button id="nam-close" style="color: rgb(148 163 184); background: transparent; border: none; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem;">'
              + '<i data-lucide="x" class="w-5 h-5"></i>'
            + '</button>'
          + '</div>'
          + '<div style="padding: 1.25rem; overflow: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem;">'
            + '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">'
              + '<div><label class="label">Fecha de generación</label>'
                + '<input id="nam-fecha-gen" type="date" class="input" value="' + App.escapeHtml(this.fechaGen) + '" max="' + App.todayISO() + '" /></div>'
              + '<div><label class="label">Fecha de comunicación</label>'
                + '<input id="nam-fecha-com" type="date" class="input" value="' + App.escapeHtml(this.fechaCom) + '" max="' + App.todayISO() + '" /></div>'
            + '</div>'
            + '<div>'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">'
                + '<label class="label" style="margin-bottom: 0;">Documentos a anular</label>'
                + '<button type="button" id="nam-add" class="btn-secondary text-sm" style="display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.625rem;">'
                  + '<i data-lucide="plus" class="w-3.5 h-3.5"></i> Agregar documento'
                + '</button>'
              + '</div>'
              + '<div id="nam-detalles" style="display: flex; flex-direction: column; gap: 0.5rem;">'
                + detallesHTML
              + '</div>'
              + '<p style="font-size: 0.75rem; color: rgb(148 163 184); margin-top: 0.5rem;">Plazo máximo: 7 días desde la fecha de emisión del documento original.</p>'
            + '</div>'
            + errorHTML
          + '</div>'
          + '<div style="padding: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem; background: rgb(248 250 252); border-radius: 0 0 1rem 1rem;">'
            + '<button id="nam-cancel" class="btn-secondary text-sm">Cancelar</button>'
            + '<button id="nam-submit" class="btn-danger text-sm" ' + (this.sending ? 'disabled' : '') + '>'
              + (this.sending
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Enviando...'
                : '<i data-lucide="ban" class="w-4 h-4"></i> Enviar Anulación')
            + '</button>'
          + '</div>'
        + '</div>'
      + '</div>';
  }

  _successHTML() {
    var r = this.response;
    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
        + '<div class="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" data-stop="1">'
          + '<div style="display: flex; align-items: center; gap: 0.5rem; color: rgb(21 128 61); font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 0.5rem;">'
            + '<i data-lucide="check-circle-2" class="w-5 h-5"></i> Anulación creada'
          + '</div>'
          + '<h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem;">' + App.escapeHtml(r.message) + '</h2>'
          + '<div style="background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.375rem;">'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Identificador:</span><span class="font-mono font-bold">' + App.escapeHtml((r.data && r.data.identifier) || '—') + '</span></div>'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Documentos:</span><span style="font-weight: 700;">' + ((r.data && r.data.total_documentos) || '—') + '</span></div>'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Estado:</span>' + App.estadoBadgeHTML(r.data && r.data.estado_sunat) + '</div>'
            + (r.data && r.data.ticket ? '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Ticket SUNAT:</span><span class="font-mono text-xs">' + App.escapeHtml(r.data.ticket) + '</span></div>' : '')
          + '</div>'
          + '<button id="nam-success-close" class="btn-primary" style="width: 100%; margin-top: 1rem;">Cerrar</button>'
        + '</div>'
      + '</div>';
  }

  _bind() {
    var self = this;

    if (this.response) {
      this.overlay.querySelector('#nam-success-close').addEventListener('click', function () {
        self.overlay.remove();
        if (self.onSuccess) self.onSuccess();
      });
      return;
    }

    this.overlay.addEventListener('click', function (e) {
      var card = self.overlay.querySelector('[data-stop]');
      if (card && !card.contains(e.target)) self._close();
    });

    this.overlay.querySelector('#nam-close').addEventListener('click', function () { self._close(); });
    this.overlay.querySelector('#nam-cancel').addEventListener('click', function () { self._close(); });

    this.overlay.querySelector('#nam-fecha-gen').addEventListener('input', function (e) {
      self.fechaGen = e.target.value;
      self.fechaCom = e.target.value;
      self.overlay.querySelector('#nam-fecha-com').value = e.target.value;
    });
    this.overlay.querySelector('#nam-fecha-com').addEventListener('input', function (e) {
      self.fechaCom = e.target.value;
    });

    this.overlay.querySelector('#nam-add').addEventListener('click', function () {
      self.detalles.push(self._detalleVacio());
      self._refresh();
    });

    this.overlay.querySelectorAll('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(el.dataset.row, 10);
        var field = el.dataset.field;
        self.detalles[idx][field] = field === 'serie' ? el.value.toUpperCase() : el.value;
        if (field === 'serie') el.value = el.value.toUpperCase();
      });
      el.addEventListener('change', function () {
        var idx = parseInt(el.dataset.row, 10);
        self.detalles[idx][el.dataset.field] = el.value;
      });
    });

    this.overlay.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.remove, 10);
        self.detalles.splice(idx, 1);
        self._refresh();
      });
    });

    this.overlay.querySelector('#nam-submit').addEventListener('click', function () { self._submit(); });
  }

  async _submit() {
    this.error = null;
    if (this.detalles.length === 0) { this.error = 'Agrega al menos un documento.'; this._refresh(); return; }
    var invalid = this.detalles.find(function (d) { return !d.serie.trim() || !d.correlativo.trim() || !d.motivo.trim(); });
    if (invalid) { this.error = 'Completa todos los campos de cada documento (serie, correlativo y motivo).'; this._refresh(); return; }

    var payload = {
      fecha_generacion: this.fechaGen,
      fecha_comunicacion: this.fechaCom,
      detalles: this.detalles.map(function (d) {
        return {
          tipo_documento: d.tipo_documento,
          serie: d.serie.trim().toUpperCase(),
          correlativo: d.correlativo.trim(),
          motivo: d.motivo.trim(),
        };
      }),
    };

    this.sending = true;
    this._refresh();

    try {
      var res = await App.api.crearAnulacion(payload);
      this.response = res;
    } catch (e) {
      this.error = e.message;
    } finally {
      this.sending = false;
      this._refresh();
    }
  }

  _close() {
    if (this.overlay) this.overlay.remove();
  }
};
