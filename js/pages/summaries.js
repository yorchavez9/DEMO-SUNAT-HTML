var App = window.App || (window.App = {});

App.Summaries = class Summaries {
  constructor() {
    this.items = [];
    this.loading = true;
    this.error = null;
    this.refreshing = null;
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
            + '<i data-lucide="file-stack" class="w-7 h-7"></i> Resúmenes Diarios'
          + '</h1>'
          + '<button id="s-new" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nuevo resumen</button>'
        + '</div>'
        + '<div class="card">'
          + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">'
            + '<h2 class="section-title" style="margin-bottom: 0;">Historial</h2>'
            + '<button id="s-reload" class="btn-ghost text-sm">'
              + '<i data-lucide="refresh-ccw" class="w-4 h-4 ' + (this.loading ? 'icon-spin' : '') + '"></i> Actualizar'
            + '</button>'
          + '</div>'
          + '<div id="s-body">' + this._bodyHTML() + '</div>'
        + '</div>'
      + '</div>';

    App.refreshIcons();
  }

  _bodyHTML() {
    if (this.loading) {
      return '<div class="table-wrap"><div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">'
        + '<i data-lucide="loader-2" class="w-5 h-5 icon-spin"></i> Cargando...</div></div>';
    }
    if (this.error) {
      return '<div class="table-wrap"><div style="padding: 1rem; background: rgb(254 242 242); color: rgb(185 28 28); border-radius: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">'
        + '<i data-lucide="x-circle" class="w-5 h-5"></i> ' + App.escapeHtml(this.error) + '</div></div>';
    }
    if (this.items.length === 0) {
      return '<div class="table-wrap"><div style="text-align: center; padding: 2.5rem 0; color: rgb(148 163 184);">'
        + 'Sin resúmenes. Crea el primero con el botón "Nuevo resumen".</div></div>';
    }

    var self = this;
    var rows = this.items.map(function (s) { return self._rowHTML(s); }).join('');
    return '<div class="table-wrap">'
      + '<table class="table-std" style="min-width: 700px;">'
        + '<thead><tr>'
          + '<th>Identificador</th><th>Tipo</th><th>Fecha ref.</th>'
          + '<th style="text-align: right;">Docs</th><th>Estado SUNAT</th>'
          + '<th>Ticket</th><th></th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
      + '</table>'
      + '</div>';
  }

  _rowHTML(s) {
    var esAnulacion = s.tipo === 'anulacion';
    var badgeStyle = esAnulacion
      ? 'background: rgb(254 226 226); color: rgb(185 28 28);'
      : 'background: rgb(219 234 254); color: rgb(29 78 216);';
    var refreshing = this.refreshing === s.id;

    return '<tr>'
      + '<td class="font-mono font-bold" style="color: rgb(15 23 42);">' + App.escapeHtml(s.identifier) + '</td>'
      + '<td>'
        + '<span class="badge" style="' + badgeStyle + '">'
          + '<i data-lucide="' + (esAnulacion ? 'ban' : 'send') + '" class="w-3 h-3" style="margin-right: 0.25rem;"></i>'
          + (esAnulacion ? 'Anulación' : 'Envío')
        + '</span>'
      + '</td>'
      + '<td style="color: rgb(71 85 105);">' + App.escapeHtml(s.fecha_referencia) + '</td>'
      + '<td style="text-align: right; font-weight: 700;">' + App.escapeHtml(s.total_documentos) + '</td>'
      + '<td>' + App.estadoBadgeHTML(s.estado_sunat) + '</td>'
      + '<td class="text-xs font-mono" style="color: rgb(100 116 139);">' + App.escapeHtml(s.ticket || '—') + '</td>'
      + '<td>'
        + '<button type="button" data-refresh="' + s.id + '" ' + (refreshing ? 'disabled' : '') + ' '
          + 'style="color: rgb(37 99 235); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; background: transparent; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem;">'
          + '<i data-lucide="' + (refreshing ? 'loader-2' : 'refresh-ccw') + '" class="w-[14px] h-[14px] ' + (refreshing ? 'icon-spin' : '') + '"></i> Refrescar'
        + '</button>'
      + '</td>'
      + '</tr>';
  }

  _bind() {
    var self = this;
    this.container.querySelector('#s-new').addEventListener('click', function () { self._openNewSummaryModal(); });
    this.container.querySelector('#s-reload').addEventListener('click', function () { self._load(); });
    this._bindRefreshButtons();
  }

  _bindRefreshButtons() {
    var self = this;
    this.container.querySelectorAll('[data-refresh]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.dataset.refresh, 10);
        self._refrescar(id);
      });
    });
  }

  _refreshBody() {
    this.container.querySelector('#s-body').innerHTML = this._bodyHTML();
    App.refreshIcons();
    this._bindRefreshButtons();
  }

  async _load() {
    this.loading = true;
    this.error = null;
    this._refreshBody();
    try {
      var res = await App.api.listarResumenes();
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
      await App.api.estadoResumen(id);
      await this._load();
    } catch (e) {
      alert('Error al refrescar: ' + e.message);
    } finally {
      this.refreshing = null;
      this._refreshBody();
    }
  }

  _openNewSummaryModal() {
    var self = this;
    new App.NewSummaryModal({
      onClose: function () {},
      onSuccess: function () { self._load(); },
    }).render(document.body);
  }
};

// ──────────────────────────────────────────────────────────────────
// Modal: Nuevo Resumen (envío o anulación)
// ──────────────────────────────────────────────────────────────────
App.NewSummaryModal = class NewSummaryModal {
  constructor(opts) {
    this.onClose = opts.onClose;
    this.onSuccess = opts.onSuccess;

    this.modo = 'envio';
    this.fecha = App.todayISO();
    this.boletasParaAnular = [];
    this.boletasDisponibles = [];
    this.loadingBoletas = false;
    this.sending = false;
    this.response = null;
    this.error = null;

    this.overlay = null;
  }

  render(container) {
    this.container = container;
    container.insertAdjacentHTML('beforeend', this._html());
    this.overlay = container.lastElementChild;
    this._bind();
    App.refreshIcons();
  }

  _refresh() {
    var parent = this.overlay.parentNode;
    this.overlay.outerHTML = this._html();
    this.overlay = parent.lastElementChild;
    this._bind();
    App.refreshIcons();
  }

  _html() {
    if (this.response) return this._successHTML();

    var anulMode = this.modo === 'anulacion';
    // Modo seleccionado: bg coloreado + ring via box-shadow; no seleccionado: bg gris
    var envioStyle = this.modo === 'envio'
      ? 'background: rgb(219 234 254); box-shadow: 0 0 0 2px rgb(37 99 235);'
      : 'background: rgb(241 245 249);';
    var anulStyle = this.modo === 'anulacion'
      ? 'background: rgb(254 226 226); box-shadow: 0 0 0 2px rgb(220 38 38);'
      : 'background: rgb(241 245 249);';

    var errorHTML = this.error ? (
      '<div style="margin-top: 1rem; padding: 0.75rem; background: rgb(254 242 242); border-radius: 0.75rem; font-size: 0.875rem; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
      + '<i data-lucide="x-circle" class="w-4 h-4" style="flex-shrink: 0;"></i>'
      + '<span>' + App.escapeHtml(this.error) + '</span></div>'
    ) : '';

    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
        + '<div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" data-stop="1">'
          + '<div class="p-5 flex items-center justify-between">'
            + '<h2 class="text-lg font-bold flex items-center gap-2">'
              + '<i data-lucide="file-stack" class="w-5 h-5"></i> Nuevo Resumen'
            + '</h2>'
            + '<button id="nsm-close" style="color: rgb(148 163 184);">'
              + '<i data-lucide="x" class="w-5 h-5"></i>'
            + '</button>'
          + '</div>'
          + '<div class="p-5 overflow-auto flex-1">'
            + '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">'
              + '<button type="button" data-modo="envio" style="padding: 1rem; border-radius: 0.75rem; ' + envioStyle + ' text-align: left; cursor: pointer; transition: all 0.15s; border: none;">'
                + '<i data-lucide="send" class="w-5 h-5" style="margin-bottom: 0.25rem; color: ' + (this.modo === 'envio' ? 'rgb(37 99 235)' : 'rgb(148 163 184)') + ';"></i>'
                + '<div style="font-weight: 700; font-size: 0.875rem;">Envío</div>'
                + '<div style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.125rem;">Enviar boletas pendientes del día a SUNAT</div>'
              + '</button>'
              + '<button type="button" data-modo="anulacion" style="padding: 1rem; border-radius: 0.75rem; ' + anulStyle + ' text-align: left; cursor: pointer; transition: all 0.15s; border: none;">'
                + '<i data-lucide="ban" class="w-5 h-5" style="margin-bottom: 0.25rem; color: ' + (this.modo === 'anulacion' ? 'rgb(220 38 38)' : 'rgb(148 163 184)') + ';"></i>'
                + '<div style="font-weight: 700; font-size: 0.875rem;">Anulación</div>'
                + '<div style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.125rem;">Anular boletas ya aceptadas por SUNAT</div>'
              + '</button>'
            + '</div>'
            + '<div style="margin-bottom: 1rem;">'
              + '<label class="label">' + (anulMode ? 'Fecha del resumen' : 'Fecha de boletas a enviar') + '</label>'
              + '<input id="nsm-fecha" type="date" class="input" value="' + App.escapeHtml(this.fecha) + '" max="' + App.todayISO() + '" />'
              + '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.25rem;">'
                + (anulMode
                  ? 'Plazo: hasta 7 días desde la emisión de las boletas'
                  : 'Toma todas las boletas con esa fecha en estado pendiente')
              + '</p>'
            + '</div>'
            + (anulMode ? this._anulacionHTML() : '')
            + errorHTML
          + '</div>'
          + '<div class="p-4 flex justify-end gap-2 rounded-b-2xl" style="background: rgb(248 250 252);">'
            + '<button id="nsm-cancel" class="btn-secondary text-sm">Cancelar</button>'
            + '<button id="nsm-submit" class="' + (anulMode ? 'btn-danger' : 'btn-primary') + ' text-sm" ' + (this.sending ? 'disabled' : '') + '>'
              + (this.sending
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Enviando...'
                : anulMode
                  ? '<i data-lucide="ban" class="w-4 h-4"></i> Crear anulación'
                  : '<i data-lucide="send" class="w-4 h-4"></i> Crear resumen')
            + '</button>'
          + '</div>'
        + '</div>'
      + '</div>';
  }

  _anulacionHTML() {
    var self = this;
    var contenido;
    if (this.loadingBoletas) {
      contenido = '<div style="text-align: center; padding: 1.5rem 0; color: rgb(148 163 184); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">'
        + '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Cargando boletas...</div>';
    } else if (this.boletasDisponibles.length === 0) {
      contenido = '<div style="text-align: center; padding: 1.5rem 0; color: rgb(148 163 184); background: rgb(248 250 252); border-radius: 0.75rem;">'
        + 'No hay boletas aceptadas para anular</div>';
    } else {
      contenido = '<div style="background: rgb(248 250 252); border-radius: 0.75rem; max-height: 18rem; overflow: auto;">'
        + this.boletasDisponibles.map(function (b) {
          var sel = self.boletasParaAnular.find(function (x) { return x.id === b.id; });
          var bgSel = sel ? 'background: rgb(254 242 242);' : '';
          var motivoInput = sel
            ? '<input type="text" data-motivo-id="' + b.id + '" class="input" style="margin-top: 0.5rem; margin-left: 1.75rem; width: calc(100% - 1.75rem);" placeholder="Motivo de la anulación..." value="' + App.escapeHtml(sel.motivo) + '" maxlength="255" />'
            : '';

          return '<div style="padding: 0.75rem; ' + bgSel + '">'
            + '<label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">'
              + '<input type="checkbox" data-boleta-id="' + b.id + '" ' + (sel ? 'checked' : '') + ' style="margin-top: 0.25rem; width: 1rem; height: 1rem; border-radius: 0.25rem;" />'
              + '<div style="flex: 1; min-width: 0;">'
                + '<div style="display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;">'
                  + '<span class="font-mono font-bold" style="color: rgb(15 23 42);">' + App.escapeHtml(b.numero_completo) + '</span>'
                  + '<span class="text-xs" style="color: rgb(100 116 139);">' + App.escapeHtml((b.fecha_emision || '').slice(0, 10)) + '</span>'
                  + '<span class="font-bold" style="color: rgb(51 65 85);">'
                    + App.fmtMoney((b.totales && b.totales.total) || 0, b.tipo_moneda)
                  + '</span>'
                + '</div>'
                + '<div class="text-xs" style="color: rgb(100 116 139); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'
                  + App.escapeHtml((b.cliente && b.cliente.razon_social) || '—')
                + '</div>'
              + '</div>'
            + '</label>'
            + motivoInput
          + '</div>';
        }).join('')
        + '</div>';
    }

    var contador = this.boletasParaAnular.length > 0
      ? '<p style="font-size: 0.75rem; color: rgb(71 85 105); margin-top: 0.5rem; font-weight: 600;">'
        + this.boletasParaAnular.length + ' boleta' + (this.boletasParaAnular.length !== 1 ? 's' : '')
        + ' seleccionada' + (this.boletasParaAnular.length !== 1 ? 's' : '') + '</p>'
      : '';

    return '<div><label class="label">Boletas aceptadas disponibles para anular</label>' + contenido + contador + '</div>';
  }

  _successHTML() {
    var r = this.response;
    return ''
      + '<div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgb(15 23 42 / 0.6); backdrop-filter: blur(4px);">'
        + '<div class="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" data-stop="1">'
          + '<div style="display: flex; align-items: center; gap: 0.5rem; color: rgb(21 128 61); font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 0.5rem;">'
            + '<i data-lucide="check-circle-2" class="w-5 h-5"></i> Éxito'
          + '</div>'
          + '<h2 class="text-lg font-bold" style="margin-bottom: 0.75rem;">' + App.escapeHtml(r.message) + '</h2>'
          + '<div style="background: rgb(248 250 252); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem;">'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Identificador:</span><span class="font-mono font-bold">' + App.escapeHtml(r.data && r.data.identifier) + '</span></div>'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Acción:</span><span style="font-weight: 600; text-transform: capitalize;">' + App.escapeHtml(r.data && r.data.accion) + '</span></div>'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Documentos:</span><span style="font-weight: 700;">' + App.escapeHtml(r.data && r.data.total_documentos) + '</span></div>'
            + '<div style="display: flex; justify-content: space-between;"><span style="color: rgb(100 116 139);">Estado:</span>' + App.estadoBadgeHTML(r.data && r.data.estado_sunat) + '</div>'
          + '</div>'
          + '<button id="nsm-success-close" class="btn-primary" style="width: 100%; margin-top: 1rem;">Cerrar</button>'
        + '</div>'
      + '</div>';
  }

  _bind() {
    var self = this;

    if (this.response) {
      this.overlay.querySelector('#nsm-success-close').addEventListener('click', function () { self._closeSuccess(); });
      return;
    }

    this.overlay.querySelector('#nsm-close').addEventListener('click', function () { self._close(); });
    this.overlay.querySelector('#nsm-cancel').addEventListener('click', function () { self._close(); });

    this.overlay.querySelectorAll('[data-modo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.modo = btn.dataset.modo;
        if (self.modo === 'anulacion') self._loadBoletas();
        self._refresh();
      });
    });

    this.overlay.querySelector('#nsm-fecha').addEventListener('input', function (e) { self.fecha = e.target.value; });

    this.overlay.querySelectorAll('[data-boleta-id]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = parseInt(cb.dataset.boletaId, 10);
        var boleta = self.boletasDisponibles.find(function (b) { return b.id === id; });
        var exists = self.boletasParaAnular.find(function (x) { return x.id === id; });
        if (exists) {
          self.boletasParaAnular = self.boletasParaAnular.filter(function (x) { return x.id !== id; });
        } else if (boleta) {
          self.boletasParaAnular.push({ id: boleta.id, motivo: '', numero: boleta.numero_completo });
        }
        self._refresh();
      });
    });

    this.overlay.querySelectorAll('[data-motivo-id]').forEach(function (input) {
      input.addEventListener('input', function (e) {
        var id = parseInt(input.dataset.motivoId, 10);
        var b = self.boletasParaAnular.find(function (x) { return x.id === id; });
        if (b) b.motivo = e.target.value;
      });
    });

    this.overlay.querySelector('#nsm-submit').addEventListener('click', function () { self._submit(); });
  }

  async _loadBoletas() {
    this.loadingBoletas = true;
    try {
      var res = await App.api.listarBoletas('?estado=aceptado&por_pagina=50');
      this.boletasDisponibles = (res.data && res.data.datos) || [];
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loadingBoletas = false;
      this._refresh();
    }
  }

  async _submit() {
    this.error = null;

    if (this.modo === 'anulacion') {
      if (this.boletasParaAnular.length === 0) {
        this.error = 'Selecciona al menos una boleta para anular';
        this._refresh();
        return;
      }
      var sinMotivo = this.boletasParaAnular.find(function (b) { return !b.motivo.trim(); });
      if (sinMotivo) {
        this.error = 'Falta motivo para boleta ' + sinMotivo.numero;
        this._refresh();
        return;
      }
    }

    var payload = { fecha_resumen: this.fecha };
    if (this.modo === 'anulacion') {
      payload.anular = this.boletasParaAnular.map(function (b) {
        return { id: b.id, motivo: b.motivo, tipo_documento: '03' };
      });
    }

    this.sending = true;
    this._refresh();

    try {
      var res = await App.api.crearResumen(payload);
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
    if (this.onClose) this.onClose();
  }

  _closeSuccess() {
    if (this.overlay) this.overlay.remove();
    if (this.onSuccess) this.onSuccess();
  }
};
