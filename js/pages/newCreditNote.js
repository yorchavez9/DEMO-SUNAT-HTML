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

  App.NewCreditNote = class NewCreditNote {
    constructor() {
      this.form = {
        serie: 'FC01',
        fecha_emision: App.todayISO(),
        tipo_moneda: 'PEN',
        doc_afectado_tipo: '01',
        doc_afectado_serie: 'F001',
        doc_afectado_correlativo: '',
        cod_motivo: '06',
        des_motivo: '',
      };
      this.cliente = null;
      this.items = [];
      this.sending = false;
      this.pdfFormat = 'ticket-80';
      this.container = null;
    }

    render(container) {
      this.container = container;
      this._renderHTML();
      this._bind();
    }

    _renderHTML() {
      var f = this.form;
      var motivosOpts = MOTIVOS_NC.map(function (m) {
        return '<option value="' + m.cod + '"' + (f.cod_motivo === m.cod ? ' selected' : '') + '>' + m.cod + ' - ' + m.desc + '</option>';
      }).join('');

      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title">'
            + '<i data-lucide="trending-down" class="w-7 h-7"></i> Nueva Nota de Crédito'
          + '</h1>'
          + '<form id="nc-form" style="display: flex; flex-direction: column; gap: 1.5rem;">'
            + '<div class="card">'
              + '<h2 class="section-title">Datos del documento</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-4">'
                + '<div><label class="label">Serie NC</label>'
                  + '<input id="nc-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" maxlength="4" required />'
                  + '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.25rem;">Ej: FC01 (para factura), BC01 (para boleta)</p></div>'
                + '<div><label class="label">Fecha</label>'
                  + '<input id="nc-fecha" type="date" class="input" value="' + App.escapeHtml(f.fecha_emision) + '" required /></div>'
                + '<div><label class="label">Moneda</label>'
                  + '<select id="nc-moneda" class="input">'
                    + '<option value="PEN"' + (f.tipo_moneda === 'PEN' ? ' selected' : '') + '>PEN</option>'
                    + '<option value="USD"' + (f.tipo_moneda === 'USD' ? ' selected' : '') + '>USD</option>'
                  + '</select></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Documento afectado</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-3">'
                + '<div><label class="label">Tipo</label>'
                  + '<select id="nc-afec-tipo" class="input">'
                    + '<option value="01"' + (f.doc_afectado_tipo === '01' ? ' selected' : '') + '>01 - Factura</option>'
                    + '<option value="03"' + (f.doc_afectado_tipo === '03' ? ' selected' : '') + '>03 - Boleta</option>'
                    + '<option value="12"' + (f.doc_afectado_tipo === '12' ? ' selected' : '') + '>12 - Ticket</option>'
                  + '</select></div>'
                + '<div><label class="label">Serie</label>'
                  + '<input id="nc-afec-serie" class="input font-mono" value="' + App.escapeHtml(f.doc_afectado_serie) + '" maxlength="4" required /></div>'
                + '<div><label class="label">Correlativo</label>'
                  + '<input id="nc-afec-corr" class="input" value="' + App.escapeHtml(f.doc_afectado_correlativo) + '" placeholder="123" required /></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Motivo de la nota</h2>'
              + '<div style="display: flex; flex-direction: column; gap: 1rem;">'
                + '<div><label class="label">Código motivo (Cat. 09)</label>'
                  + '<select id="nc-cod-motivo" class="input">' + motivosOpts + '</select></div>'
                + '<div><label class="label">Descripción del motivo</label>'
                  + '<textarea id="nc-des-motivo" class="input" rows="2" placeholder="Ej: Devolución por defecto de fábrica" maxlength="250" required>' + App.escapeHtml(f.des_motivo) + '</textarea></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Cliente</h2>'
              + '<div id="nc-client-selector">' + App.clientSelectorHTML(this.cliente, 'Cliente del documento original...') + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">'
                + '<h2 class="section-title" style="margin-bottom: 0;">Ítems afectados</h2>'
                + '<button type="button" id="nc-add-prod" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar</button>'
              + '</div>'
              + '<div id="nc-items-table"></div>'
              + '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.75rem;">Los ítems representan lo que se está revertiendo. Para anulación total, incluye los mismos ítems de la factura original.</p>'
            + '</div>'
            + '<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
              + App.pdfFormatPickerHTML(this.pdfFormat)
              + '<button type="submit" id="nc-submit" class="btn-primary" ' + (this.sending ? 'disabled' : '') + '>'
                + (this.sending
                  ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Emitiendo...'
                  : '<i data-lucide="check" class="w-4 h-4"></i> Emitir Nota de Crédito')
              + '</button>'
            + '</div>'
          + '</form>'
          + '<style>'
            + '@media (min-width: 640px) { .form-grid-3 { grid-template-columns: repeat(3, 1fr) !important; } .form-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }'
            + '@media (min-width: 768px) { .form-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }'
          + '</style>'
        + '</div>';

      var itemsRoot = this.container.querySelector('#nc-items-table');
      itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
      var self = this;
      App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);

      App.refreshIcons();
    }

    _bind() {
      var self = this;
      var f = this.form;

      this.container.querySelector('#nc-serie').addEventListener('input', function (e) {
        f.serie = e.target.value.toUpperCase();
        e.target.value = f.serie;
      });
      this.container.querySelector('#nc-fecha').addEventListener('input', function (e) { f.fecha_emision = e.target.value; });
      this.container.querySelector('#nc-moneda').addEventListener('change', function (e) {
        f.tipo_moneda = e.target.value;
        self._refreshItemsTable();
      });
      this.container.querySelector('#nc-afec-tipo').addEventListener('change', function (e) { f.doc_afectado_tipo = e.target.value; });
      this.container.querySelector('#nc-afec-serie').addEventListener('input', function (e) {
        f.doc_afectado_serie = e.target.value.toUpperCase();
        e.target.value = f.doc_afectado_serie;
      });
      this.container.querySelector('#nc-afec-corr').addEventListener('input', function (e) { f.doc_afectado_correlativo = e.target.value; });
      this.container.querySelector('#nc-cod-motivo').addEventListener('change', function (e) { f.cod_motivo = e.target.value; });
      this.container.querySelector('#nc-des-motivo').addEventListener('input', function (e) { f.des_motivo = e.target.value; });

      this.container.querySelector('#nc-add-prod').addEventListener('click', function () { self._openProductPicker(); });

      App.bindClientSelector(this.container.querySelector('#nc-client-selector'), {
        onOpenPicker: function () { self._openClientPicker(); },
        onClear: function () { self.cliente = null; self._renderHTML(); self._bind(); },
      });

      App.bindPdfFormatPicker(this.container, function () { return self.pdfFormat; }, function (v) { self.pdfFormat = v; });

      this.container.querySelector('#nc-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self._submit();
      });
    }

    _refreshItemsTable() {
      var self = this;
      var itemsRoot = this.container.querySelector('#nc-items-table');
      itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
      App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);
      App.refreshIcons();
    }

    _openProductPicker() {
      var self = this;
      new App.ProductPicker({
        onSelect: function (p) {
          self.items.push({
            codigo: p.codigo,
            descripcion: p.descripcion,
            unidad: p.unidad,
            cantidad: 1,
            precio_unitario: p.precio_unitario,
            tip_afe_igv: p.tip_afe_igv || '10',
          });
          self._refreshItemsTable();
        },
      }).render(document.body);
    }

    _openClientPicker() {
      var self = this;
      new App.ClientPicker({
        onSelect: function (c) { self.cliente = c; self._renderHTML(); self._bind(); },
      }).render(document.body);
    }

    async _submit() {
      if (!this.cliente) { alert('Selecciona un cliente'); return; }
      if (this.items.length === 0) { alert('Agrega al menos un ítem'); return; }
      if (!this.form.des_motivo.trim()) { alert('Describe el motivo'); return; }

      var payload = Object.assign({}, this.form, {
        cliente: {
          tipo_doc: this.cliente.tipo_doc,
          num_doc: this.cliente.num_doc,
          razon_social: this.cliente.razon_social,
          direccion: this.cliente.direccion || '',
        },
        items: this.items.map(function (it) {
          return Object.assign({}, it, {
            cantidad: parseFloat(it.cantidad),
            precio_unitario: parseFloat(it.precio_unitario),
          });
        }),
      });

      this.sending = true;
      this._renderHTML();
      this._bind();

      try {
        var res = await App.api.crearNotaCredito(payload);
        this._showResponse(res, null);
        this.items = [];
        this.form.doc_afectado_correlativo = '';
        this.form.des_motivo = '';
      } catch (e) {
        this._showResponse(null, e);
      } finally {
        this.sending = false;
        this._renderHTML();
        this._bind();
      }
    }

    _showResponse(response, error) {
      new App.ResponseModal({ response: response, error: error, tipo: 'notas-credito', pdfFormat: this.pdfFormat }).render(document.body);
    }
  };
})();
