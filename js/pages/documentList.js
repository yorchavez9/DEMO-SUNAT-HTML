var App = window.App || (window.App = {});

(function () {
  var MOTIVOS_NC = [
    { cod: '01', desc: 'Anulación de la operación' },
    { cod: '02', desc: 'Anulación por error en el RUC' },
    { cod: '03', desc: 'Corrección por error en la descripción' },
    { cod: '04', desc: 'Descuento global' },
    { cod: '05', desc: 'Descuento por ítem' },
    { cod: '06', desc: 'Devolución total/parcial' },
    { cod: '07', desc: 'Bonificación/Descuento' },
    { cod: '08', desc: 'Disminución en el valor' },
    { cod: '09', desc: 'Otros' },
  ];

  var MOTIVOS_ND = [
    { cod: '01', desc: 'Intereses por mora' },
    { cod: '02', desc: 'Aumento en el valor' },
    { cod: '03', desc: 'Penalidades / otros conceptos' },
    { cod: '04', desc: 'Ajustes de valor de exportación' },
    { cod: '05', desc: 'Ajustes por corrección de la moneda' },
    { cod: '06', desc: 'Ajustes por corrección de la cantidad' },
    { cod: '07', desc: 'Ajustes por descuentos no aplicados' },
    { cod: '08', desc: 'Ajustes por cargos adicionales' },
    { cod: '09', desc: 'Otros' },
    { cod: '11', desc: 'Ajustes de operaciones de exportación' },
    { cod: '12', desc: 'Ajustes afectos al IVAP' },
  ];

  var LABELS = {
    'facturas':        { titulo: 'Facturas',          icon: 'file-text',     method: 'listarFacturas',     hasCdr: true  },
    'boletas':         { titulo: 'Boletas',           icon: 'receipt',       method: 'listarBoletas',      hasCdr: true  },
    'notas-credito':   { titulo: 'Notas de Crédito',  icon: 'trending-down', method: 'listarNotasCredito', hasCdr: true  },
    'notas-debito':    { titulo: 'Notas de Débito',   icon: 'trending-up',   method: 'listarNotasDebito',  hasCdr: true  },
    'guias-remision':  { titulo: 'Guías de Remisión', icon: 'truck',         method: 'listarGuias',        hasCdr: false },
  };

  var TIPO_DOC_MAP = {
    'facturas':      '01',
    'boletas':       '03',
    'notas-credito': '07',
    'notas-debito':  '08',
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
            + '<style>'
            + '@media (min-width: 640px) { .filter-row { flex-direction: row !important; align-items: flex-end !important; } }'
            + '@media (min-width: 1024px) { .actions-mobile { display: none !important; } }'
            + '@media (max-width: 1023px) { .actions-desktop { display: none !important; } }'
            + '</style>'
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

      var pdfLoad = self.downloading === d.id + '_pdf';
      var xmlLoad = self.downloading === d.id + '_xml';
      var cdrLoad = self.downloading === d.id + '_cdr';
      var canAnular = !!TIPO_DOC_MAP[self.tipo] && estado !== 'anulado' && estado !== 'anulacion_en_proceso';
      var canNota = self.tipo === 'facturas' && estado !== 'anulado' && estado !== 'anulacion_en_proceso';

      var BTN_BASE = 'display:inline-flex;align-items:center;gap:0.25rem;font-size:0.75rem;font-weight:700;padding:0.25rem 0.5rem;border-radius:0.375rem;background:transparent;border:none;cursor:pointer;';
      var DD_BASE  = 'width:100%;text-align:left;display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.875rem;font-size:0.8125rem;font-weight:600;background:transparent;border:none;cursor:pointer;';

      function mkBtn(dataAttrs, icon, label, color, loading) {
        return '<button type="button" ' + dataAttrs + (loading ? ' disabled' : '') + ' style="' + BTN_BASE + 'color:' + color + ';">'
          + (loading ? '<i data-lucide="loader-2" class="w-[14px] h-[14px] icon-spin"></i>' : '<i data-lucide="' + icon + '" class="w-[14px] h-[14px]"></i>')
          + ' ' + label + '</button>';
      }

      function mkDdItem(dataAttrs, icon, label, color, loading) {
        return '<button type="button" ' + dataAttrs + (loading ? ' disabled' : '') + ' style="' + DD_BASE + 'color:' + color + ';">'
          + (loading ? '<i data-lucide="loader-2" class="w-[14px] h-[14px] icon-spin"></i>' : '<i data-lucide="' + icon + '" class="w-[14px] h-[14px]"></i>')
          + ' ' + label + '</button>';
      }

      var pdfA    = 'data-download="pdf" data-id="' + d.id + '" title="PDF"';
      var xmlA    = 'data-download="xml" data-id="' + d.id + '" title="XML"';
      var cdrA    = 'data-download="cdr" data-id="' + d.id + '" title="CDR"';
      var ncA     = 'data-nota="' + d.id + '" data-nota-tipo="credito" title="Nota Crédito"';
      var ndA     = 'data-nota="' + d.id + '" data-nota-tipo="debito"  title="Nota Débito"';
      var anularA = 'data-anular="' + d.id + '" title="Anular"';

      var inlineBtns = ''
        + mkBtn(pdfA, 'file-text', 'PDF', 'rgb(37 99 235)', pdfLoad)
        + mkBtn(xmlA, 'file-code', 'XML', 'rgb(71 85 105)', xmlLoad)
        + (self.config.hasCdr ? mkBtn(cdrA, 'file-archive', 'CDR', 'rgb(217 119 6)', cdrLoad) : '')
        + (canNota ? mkBtn(ncA, 'trending-down', 'NC', 'rgb(29 78 216)', false) : '')
        + (canNota ? mkBtn(ndA, 'trending-up',   'ND', 'rgb(180 83 9)', false) : '')
        + (canAnular ? mkBtn(anularA, 'ban', 'Anular', 'rgb(220 38 38)', false) : '');

      var ddId = 'row-dd-' + d.id;
      var ddItems = ''
        + mkDdItem(pdfA, 'file-text', 'PDF', 'rgb(37 99 235)', pdfLoad)
        + mkDdItem(xmlA, 'file-code', 'XML', 'rgb(71 85 105)', xmlLoad)
        + (self.config.hasCdr ? mkDdItem(cdrA, 'file-archive', 'CDR', 'rgb(217 119 6)', cdrLoad) : '')
        + (canNota ? mkDdItem(ncA, 'trending-down', 'Nota Crédito', 'rgb(29 78 216)', false) : '')
        + (canNota ? mkDdItem(ndA, 'trending-up',   'Nota Débito',  'rgb(180 83 9)', false) : '')
        + (canAnular ? mkDdItem(anularA, 'ban', 'Anular', 'rgb(220 38 38)', false) : '');

      return '<tr>'
        + '<td class="font-mono font-semibold" style="color:rgb(15 23 42);">' + App.escapeHtml(numero) + '</td>'
        + '<td style="color:rgb(71 85 105);">' + App.escapeHtml((d.fecha_emision || '').slice(0, 10)) + '</td>'
        + '<td style="max-width:20rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + App.escapeHtml(clienteNombre) + '</td>'
        + '<td style="text-align:right;font-weight:700;color:rgb(15 23 42);">' + App.fmtMoney(total, d.tipo_moneda) + '</td>'
        + '<td>' + App.estadoBadgeHTML(estado) + '</td>'
        + '<td style="position:relative;">'
          + '<div class="actions-desktop" style="display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap;">' + inlineBtns + '</div>'
          + '<div class="actions-mobile" style="position:relative;display:none;">'
            + '<button type="button" data-dd-toggle="' + ddId + '" '
              + 'style="display:inline-flex;align-items:center;padding:0.3rem 0.4rem;border-radius:0.375rem;color:rgb(100 116 139);background:transparent;border:none;cursor:pointer;">'
              + '<i data-lucide="more-vertical" class="w-4 h-4"></i>'
            + '</button>'
            + '<div id="' + ddId + '" class="row-dropdown" '
              + 'style="display:none;position:absolute;right:0;top:100%;min-width:9.5rem;background:white;border:1px solid rgb(226 232 240);border-radius:0.75rem;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:30;padding:0.25rem 0;overflow:hidden;">'
              + ddItems
            + '</div>'
          + '</div>'
        + '</td>'
        + '</tr>';
    }

    _refreshBody() {
      this.container.querySelector('#dl-body').innerHTML = this._bodyHTML();
      App.refreshIcons();
      this._bindDownloads();
      this._bindAnular();
      this._bindNota();
      this._bindDropdowns();
    }

    _bind() {
      var self = this;
      this.container.querySelector('#dl-buscar').addEventListener('input', function (e) { self.filtro.buscar = e.target.value; });
      this.container.querySelector('#dl-estado').addEventListener('change', function (e) { self.filtro.estado = e.target.value; });
      this.container.querySelector('#dl-filtrar').addEventListener('click', function () { self._load(); });
      this._bindDownloads();
      this._bindAnular();
      this._bindNota();
      this._bindDropdowns();
      document.addEventListener('click', function (e) {
        if (!e.target.closest('[data-dd-toggle]') && !e.target.closest('.row-dropdown')) {
          document.querySelectorAll('.row-dropdown').forEach(function (m) { m.style.display = 'none'; });
        }
      });
    }

    _bindDropdowns() {
      this.container.querySelectorAll('[data-dd-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var ddId = btn.dataset.ddToggle;
          var menu = document.getElementById(ddId);
          if (!menu) return;
          var isOpen = menu.style.display !== 'none';
          document.querySelectorAll('.row-dropdown').forEach(function (m) { m.style.display = 'none'; });
          if (!isOpen) menu.style.display = 'block';
        });
      });
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

    _bindAnular() {
      var self = this;
      this.container.querySelectorAll('[data-anular]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(btn.dataset.anular, 10);
          var doc = self.docs.find(function (d) { return d.id === id; });
          if (doc) self._openAnularModal(doc);
        });
      });
    }

    _openAnularModal(doc) {
      var self = this;
      var numero = doc.numero_completo || (doc.serie + '-' + doc.correlativo);
      var isBoleta = self.tipo === 'boletas';
      // La API espera correlativo sin ceros iniciales: "000040" → "40"
      var correlativoLimpio = doc.correlativo
        ? String(parseInt(doc.correlativo, 10) || doc.correlativo)
        : doc.correlativo;

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);';

      overlay.innerHTML = ''
        + '<div style="position:relative;background:white;border-radius:1rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);width:100%;max-width:28rem;">'
          + '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid rgb(241 245 249);display:flex;align-items:center;gap:0.75rem;">'
            + '<span style="width:2.25rem;height:2.25rem;background:rgb(254 226 226);color:rgb(220 38 38);border-radius:0.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
              + '<i data-lucide="ban" class="w-5 h-5"></i>'
            + '</span>'
            + '<div>'
              + '<h2 style="font-size:1rem;font-weight:700;color:rgb(15 23 42);">Anular documento</h2>'
              + '<p style="font-size:0.75rem;font-family:monospace;color:rgb(100 116 139);">' + App.escapeHtml(numero) + '</p>'
            + '</div>'
          + '</div>'
          + '<div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;">'
            + '<div id="modal-error" style="display:none;padding:0.75rem;background:rgb(254 242 242);color:rgb(185 28 28);border-radius:0.5rem;font-size:0.875rem;"></div>'
            + '<div>'
              + '<label class="label">Motivo de anulación <span style="color:rgb(239 68 68);">*</span></label>'
              + '<textarea id="modal-motivo" class="input" rows="3" style="resize:none;" placeholder="Describe el motivo de la anulación..."></textarea>'
            + '</div>'
            + (isBoleta
              ? '<p style="font-size:0.75rem;color:rgb(180 83 9);background:rgb(255 251 235);padding:0.5rem 0.75rem;border-radius:0.5rem;">Las boletas se anulan mediante un Resumen Diario enviado a SUNAT.</p>'
              : '')
          + '</div>'
          + '<div style="padding:1rem 1.5rem;border-top:1px solid rgb(241 245 249);display:flex;justify-content:flex-end;gap:0.5rem;">'
            + '<button id="modal-cancel" class="btn-secondary">Cancelar</button>'
            + '<button id="modal-confirm" class="btn-danger" style="display:inline-flex;align-items:center;gap:0.5rem;">'
              + '<i data-lucide="ban" class="w-4 h-4"></i> Confirmar anulación'
            + '</button>'
          + '</div>'
        + '</div>';

      document.body.appendChild(overlay);
      App.refreshIcons();

      var motivaEl = overlay.querySelector('#modal-motivo');
      var errorEl  = overlay.querySelector('#modal-error');
      var cancelBtn  = overlay.querySelector('#modal-cancel');
      var confirmBtn = overlay.querySelector('#modal-confirm');

      motivaEl.focus();

      function close() { document.body.removeChild(overlay); }

      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      cancelBtn.addEventListener('click', close);

      confirmBtn.addEventListener('click', async function () {
        var motivo = motivaEl.value.trim();
        if (!motivo) { errorEl.textContent = 'Ingresa el motivo de anulación.'; errorEl.style.display = 'block'; return; }
        errorEl.style.display = 'none';
        confirmBtn.disabled = true;
        cancelBtn.disabled  = true;
        confirmBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Anulando...';
        App.refreshIcons();
        try {
          var today = new Date().toISOString().slice(0, 10);
          if (isBoleta) {
            await App.api.crearResumen({ fecha_resumen: today, anular: [{ id: doc.id, motivo: motivo, tipo_documento: '03' }] });
          } else {
            var tipoCod = TIPO_DOC_MAP[self.tipo];
            await App.api.crearAnulacion({
              fecha_generacion: today,
              fecha_comunicacion: today,
              detalles: [{ tipo_documento: tipoCod, serie: doc.serie, correlativo: correlativoLimpio, motivo: motivo }],
            });
          }
          close();
          self._load();
        } catch (e) {
          var errMsg = e.message;
          if (e.errors) {
            var errs = Array.isArray(e.errors) ? e.errors : Object.values(e.errors).reduce(function(a, v) { return a.concat(v); }, []);
            if (errs.length) errMsg += '\n• ' + errs.join('\n• ');
          }
          errorEl.style.whiteSpace = 'pre-line';
          errorEl.textContent = errMsg;
          errorEl.style.display = 'block';
          confirmBtn.disabled = false;
          cancelBtn.disabled  = false;
          confirmBtn.innerHTML = '<i data-lucide="ban" class="w-4 h-4"></i> Confirmar anulación';
          App.refreshIcons();
        }
      });
    }

    _bindNota() {
      var self = this;
      this.container.querySelectorAll('[data-nota]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(btn.dataset.nota, 10);
          var tipoNota = btn.dataset.notaTipo;
          var doc = self.docs.find(function (d) { return d.id === id; });
          if (doc) self._openNotaModal(doc, tipoNota);
        });
      });
    }

    _openNotaModal(doc, tipoNota) {
      var self = this;
      var isCredito = tipoNota === 'credito';
      var today = new Date().toISOString().slice(0, 10);
      var corrLimpio = doc.correlativo ? String(parseInt(doc.correlativo, 10) || doc.correlativo) : '';
      var numero = doc.numero_completo || (doc.serie + '-' + doc.correlativo);

      var formData = {
        serie: isCredito ? 'FC01' : 'FD01',
        fecha_emision: today,
        tipo_moneda: doc.tipo_moneda || 'PEN',
        doc_afectado_tipo: '01',
        doc_afectado_serie: doc.serie || 'F001',
        doc_afectado_correlativo: corrLimpio,
        cod_motivo: isCredito ? '06' : '01',
        des_motivo: '',
      };
      var clienteState = doc.cliente ? {
        tipo_doc: doc.cliente.tipo_doc || '6',
        num_doc: doc.cliente.num_doc,
        razon_social: doc.cliente.razon_social,
        direccion: doc.cliente.direccion || '',
      } : null;
      var itemsState = [];
      var pdfFormat = 'a4';

      var motivos = isCredito ? MOTIVOS_NC : MOTIVOS_ND;
      var motivosOpts = motivos.map(function (m) {
        return '<option value="' + m.cod + '"' + (formData.cod_motivo === m.cod ? ' selected' : '') + '>' + m.cod + ' - ' + m.desc + '</option>';
      }).join('');

      var iconName = isCredito ? 'trending-down' : 'trending-up';
      var tipoLabel = isCredito ? 'Crédito' : 'Débito';
      var iconStyle = isCredito
        ? 'background:rgb(219 234 254);color:rgb(29 78 216);'
        : 'background:rgb(254 243 199);color:rgb(180 83 9);';

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:50;overflow-y:auto;';
      overlay.innerHTML = ''
        + '<div style="display:flex;min-height:100%;align-items:flex-start;justify-content:center;padding:1rem;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);">'
          + '<div style="position:relative;background:white;border-radius:1rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);width:100%;max-width:42rem;margin:2rem 0;">'
            + '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid rgb(241 245 249);display:flex;align-items:center;gap:0.75rem;">'
              + '<span style="width:2.25rem;height:2.25rem;' + iconStyle + 'border-radius:0.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
                + '<i data-lucide="' + iconName + '" class="w-5 h-5"></i>'
              + '</span>'
              + '<div>'
                + '<h2 style="font-size:1rem;font-weight:700;color:rgb(15 23 42);">Emitir Nota de ' + tipoLabel + '</h2>'
                + '<p style="font-size:0.75rem;font-family:monospace;color:rgb(100 116 139);">Ref: ' + App.escapeHtml(numero) + '</p>'
              + '</div>'
            + '</div>'
            + '<div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.25rem;">'
              + '<div id="nota-error" style="display:none;padding:0.75rem;background:rgb(254 242 242);color:rgb(185 28 28);border-radius:0.5rem;font-size:0.875rem;white-space:pre-line;"></div>'
              + '<div>'
                + '<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgb(148 163 184);margin-bottom:0.75rem;">Datos</p>'
                + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">'
                  + '<div><label class="label">Serie</label><input id="nota-serie" class="input font-mono" value="' + App.escapeHtml(formData.serie) + '" maxlength="4" />'
                    + '<p style="font-size:0.75rem;color:rgb(100 116 139);margin-top:0.25rem;">Ej: ' + (isCredito ? 'FC01' : 'FD01') + '</p></div>'
                  + '<div><label class="label">Fecha</label><input id="nota-fecha" type="date" class="input" value="' + App.escapeHtml(formData.fecha_emision) + '" /></div>'
                  + '<div><label class="label">Moneda</label><select id="nota-moneda" class="input"><option value="PEN"' + (formData.tipo_moneda === 'PEN' ? ' selected' : '') + '>PEN</option><option value="USD"' + (formData.tipo_moneda === 'USD' ? ' selected' : '') + '>USD</option></select></div>'
                + '</div>'
              + '</div>'
              + '<div>'
                + '<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgb(148 163 184);margin-bottom:0.75rem;">Documento afectado</p>'
                + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">'
                  + '<div><label class="label">Tipo</label><select id="nota-afec-tipo" class="input"><option value="01"' + (formData.doc_afectado_tipo === '01' ? ' selected' : '') + '>01 - Factura</option><option value="03"' + (formData.doc_afectado_tipo === '03' ? ' selected' : '') + '>03 - Boleta</option></select></div>'
                  + '<div><label class="label">Serie</label><input id="nota-afec-serie" class="input font-mono" value="' + App.escapeHtml(formData.doc_afectado_serie) + '" maxlength="4" /></div>'
                  + '<div><label class="label">Correlativo</label><input id="nota-afec-corr" class="input" value="' + App.escapeHtml(formData.doc_afectado_correlativo) + '" /></div>'
                + '</div>'
              + '</div>'
              + '<div>'
                + '<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgb(148 163 184);margin-bottom:0.75rem;">Motivo</p>'
                + '<div style="display:flex;flex-direction:column;gap:0.75rem;">'
                  + '<select id="nota-cod-motivo" class="input">' + motivosOpts + '</select>'
                  + '<textarea id="nota-des-motivo" class="input" rows="2" style="resize:none;" placeholder="Descripción del motivo..." maxlength="250"></textarea>'
                + '</div>'
              + '</div>'
              + '<div>'
                + '<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgb(148 163 184);margin-bottom:0.75rem;">Cliente</p>'
                + '<div id="nota-client-selector"></div>'
              + '</div>'
              + '<div>'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">'
                  + '<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgb(148 163 184);">Ítems afectados</p>'
                  + '<button type="button" id="nota-add-prod" class="btn-primary" style="font-size:0.75rem;display:inline-flex;align-items:center;gap:0.25rem;padding:0.375rem 0.75rem;"><i data-lucide="plus" class="w-[14px] h-[14px]"></i> Agregar</button>'
                + '</div>'
                + '<div id="nota-items-table"></div>'
                + '<p style="font-size:0.75rem;color:rgb(100 116 139);margin-top:0.5rem;">'
                  + (isCredito ? 'Ítems que se revierten (NC disminuye el monto).' : 'Ítems del monto adicional a cobrar (ND aumenta el monto).')
                + '</p>'
              + '</div>'
            + '</div>'
            + '<div style="padding:1rem 1.5rem;border-top:1px solid rgb(241 245 249);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">'
              + '<div id="nota-pdf-format">' + App.pdfFormatPickerHTML(pdfFormat) + '</div>'
              + '<div style="display:flex;gap:0.5rem;">'
                + '<button id="nota-cancel" class="btn-secondary">Cancelar</button>'
                + '<button id="nota-submit" class="btn-primary" style="display:inline-flex;align-items:center;gap:0.5rem;">'
                  + '<i data-lucide="' + iconName + '" class="w-4 h-4"></i> Emitir N' + (isCredito ? 'C' : 'D')
                + '</button>'
              + '</div>'
            + '</div>'
          + '</div>'
        + '</div>';

      document.body.appendChild(overlay);
      App.refreshIcons();

      var itemsRoot = overlay.querySelector('#nota-items-table');
      function refreshItemsTable() {
        itemsRoot.innerHTML = App.itemsTableHTML(itemsState, formData.tipo_moneda);
        App.bindItemsTable(itemsRoot, function () { return itemsState; }, function (n) { itemsState = n; }, formData.tipo_moneda);
        App.refreshIcons();
      }
      refreshItemsTable();

      function setupClientSelector() {
        var el = overlay.querySelector('#nota-client-selector');
        el.innerHTML = App.clientSelectorHTML(clienteState, 'RUC o DNI del cliente...');
        App.bindClientSelector(el, {
          onSelect: function (c) { clienteState = c; setupClientSelector(); },
          onClear: function () { clienteState = null; setupClientSelector(); },
        });
        App.refreshIcons();
      }
      setupClientSelector();

      App.bindPdfFormatPicker(overlay.querySelector('#nota-pdf-format'), function () { return pdfFormat; }, function (v) { pdfFormat = v; });

      overlay.querySelector('#nota-serie').addEventListener('input', function (e) { formData.serie = e.target.value.toUpperCase(); e.target.value = formData.serie; });
      overlay.querySelector('#nota-fecha').addEventListener('input', function (e) { formData.fecha_emision = e.target.value; });
      overlay.querySelector('#nota-moneda').addEventListener('change', function (e) { formData.tipo_moneda = e.target.value; refreshItemsTable(); });
      overlay.querySelector('#nota-afec-tipo').addEventListener('change', function (e) { formData.doc_afectado_tipo = e.target.value; });
      overlay.querySelector('#nota-afec-serie').addEventListener('input', function (e) { formData.doc_afectado_serie = e.target.value.toUpperCase(); e.target.value = formData.doc_afectado_serie; });
      overlay.querySelector('#nota-afec-corr').addEventListener('input', function (e) { formData.doc_afectado_correlativo = e.target.value; });
      overlay.querySelector('#nota-cod-motivo').addEventListener('change', function (e) { formData.cod_motivo = e.target.value; });
      overlay.querySelector('#nota-des-motivo').addEventListener('input', function (e) { formData.des_motivo = e.target.value; });

      overlay.querySelector('#nota-add-prod').addEventListener('click', function () {
        new App.ProductPicker({
          onSelect: function (p) {
            itemsState.push({ codigo: p.codigo, descripcion: p.descripcion, unidad: p.unidad, cantidad: 1, precio_unitario: p.precio_unitario, tip_afe_igv: p.tip_afe_igv || '10' });
            refreshItemsTable();
          },
        }).render(document.body);
      });

      function close() { document.body.removeChild(overlay); }

      overlay.querySelector('#nota-cancel').addEventListener('click', close);

      var errorEl = overlay.querySelector('#nota-error');
      var submitBtn = overlay.querySelector('#nota-submit');
      var cancelBtn = overlay.querySelector('#nota-cancel');

      submitBtn.addEventListener('click', async function () {
        if (!clienteState) { errorEl.textContent = 'Selecciona un cliente.'; errorEl.style.display = 'block'; return; }
        if (itemsState.length === 0) { errorEl.textContent = 'Agrega al menos un ítem.'; errorEl.style.display = 'block'; return; }
        if (!formData.des_motivo.trim()) { errorEl.textContent = 'Describe el motivo.'; errorEl.style.display = 'block'; return; }

        errorEl.style.display = 'none';
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Emitiendo...';
        App.refreshIcons();

        var payload = Object.assign({}, formData, {
          cliente: { tipo_doc: clienteState.tipo_doc, num_doc: clienteState.num_doc, razon_social: clienteState.razon_social, direccion: clienteState.direccion || '' },
          items: itemsState.map(function (it) {
            return Object.assign({}, it, { cantidad: parseFloat(it.cantidad), precio_unitario: parseFloat(it.precio_unitario) });
          }),
        });

        try {
          var res = isCredito
            ? await App.api.crearNotaCredito(payload)
            : await App.api.crearNotaDebito(payload);
          close();
          new App.ResponseModal({ response: res, error: null, tipo: isCredito ? 'notas-credito' : 'notas-debito', pdfFormat: pdfFormat }).render(document.body);
        } catch (e) {
          var errMsg = e.message;
          if (e.errors) {
            var errs = Array.isArray(e.errors) ? e.errors : Object.values(e.errors).reduce(function (a, v) { return a.concat(v); }, []);
            if (errs.length) errMsg += '\n• ' + errs.join('\n• ');
          }
          errorEl.textContent = errMsg;
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          cancelBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="' + iconName + '" class="w-4 h-4"></i> Emitir N' + (isCredito ? 'C' : 'D');
          App.refreshIcons();
        }
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
        this.docs = Array.isArray(res.data) ? res.data : ((res.data && res.data.datos) || []);
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
