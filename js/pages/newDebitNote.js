var App = window.App || (window.App = {});

(function () {
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

  App.NewDebitNote = class NewDebitNote {
    constructor() {
      this.form = {
        serie: 'FD01',
        fecha_emision: App.todayISO(),
        tipo_moneda: 'PEN',
        doc_afectado_tipo: '01',
        doc_afectado_serie: 'F001',
        doc_afectado_correlativo: '',
        cod_motivo: '01',
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
      var motivosOpts = MOTIVOS_ND.map(function (m) {
        return '<option value="' + m.cod + '"' + (f.cod_motivo === m.cod ? ' selected' : '') + '>' + m.cod + ' - ' + m.desc + '</option>';
      }).join('');

      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title">'
            + '<i data-lucide="trending-up" class="w-7 h-7"></i> Nueva Nota de Débito'
          + '</h1>'
          + '<form id="nd-form" style="display: flex; flex-direction: column; gap: 1.5rem;">'
            + '<div class="card">'
              + '<h2 class="section-title">Datos del documento</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-4">'
                + '<div><label class="label">Serie ND</label>'
                  + '<input id="nd-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" maxlength="4" required />'
                  + '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.25rem;">Ej: FD01 (para factura), BD01 (para boleta)</p></div>'
                + '<div><label class="label">Fecha</label>'
                  + '<input id="nd-fecha" type="date" class="input" value="' + App.escapeHtml(f.fecha_emision) + '" required /></div>'
                + '<div><label class="label">Moneda</label>'
                  + '<select id="nd-moneda" class="input">'
                    + '<option value="PEN"' + (f.tipo_moneda === 'PEN' ? ' selected' : '') + '>PEN</option>'
                    + '<option value="USD"' + (f.tipo_moneda === 'USD' ? ' selected' : '') + '>USD</option>'
                  + '</select></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Documento afectado</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-3">'
                + '<div><label class="label">Tipo</label>'
                  + '<select id="nd-afec-tipo" class="input">'
                    + '<option value="01"' + (f.doc_afectado_tipo === '01' ? ' selected' : '') + '>01 - Factura</option>'
                    + '<option value="03"' + (f.doc_afectado_tipo === '03' ? ' selected' : '') + '>03 - Boleta</option>'
                  + '</select></div>'
                + '<div><label class="label">Serie</label>'
                  + '<input id="nd-afec-serie" class="input font-mono" value="' + App.escapeHtml(f.doc_afectado_serie) + '" maxlength="4" required /></div>'
                + '<div><label class="label">Correlativo</label>'
                  + '<input id="nd-afec-corr" class="input" value="' + App.escapeHtml(f.doc_afectado_correlativo) + '" required /></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Motivo (Cat. 10)</h2>'
              + '<div style="display: flex; flex-direction: column; gap: 1rem;">'
                + '<select id="nd-cod-motivo" class="input">' + motivosOpts + '</select>'
                + '<textarea id="nd-des-motivo" class="input" rows="2" placeholder="Ej: Intereses moratorios por 30 días de atraso" maxlength="250" required>' + App.escapeHtml(f.des_motivo) + '</textarea>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Cliente</h2>'
              + '<div id="nd-client-selector">' + App.clientSelectorHTML(this.cliente, 'Cliente del documento original...') + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">'
                + '<h2 class="section-title" style="margin-bottom: 0;">Ítems del monto adicional</h2>'
                + '<button type="button" id="nd-add-prod" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar</button>'
              + '</div>'
              + '<div id="nd-items-table"></div>'
              + '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.75rem;">Los ítems representan el monto <strong>adicional</strong> a cobrar (ND aumenta, NC resta).</p>'
            + '</div>'
            + '<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
              + App.pdfFormatPickerHTML(this.pdfFormat)
              + '<button type="submit" id="nd-submit" class="btn-primary" ' + (this.sending ? 'disabled' : '') + '>'
                + (this.sending
                  ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Emitiendo...'
                  : '<i data-lucide="check" class="w-4 h-4"></i> Emitir Nota de Débito')
              + '</button>'
            + '</div>'
          + '</form>'
          + '<style>'
            + '@media (min-width: 640px) { .form-grid-3 { grid-template-columns: repeat(3, 1fr) !important; } .form-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }'
            + '@media (min-width: 768px) { .form-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }'
          + '</style>'
        + '</div>';

      var itemsRoot = this.container.querySelector('#nd-items-table');
      itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
      var self = this;
      App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);

      App.refreshIcons();
    }

    _bind() {
      var self = this;
      var f = this.form;

      this.container.querySelector('#nd-serie').addEventListener('input', function (e) {
        f.serie = e.target.value.toUpperCase();
        e.target.value = f.serie;
      });
      this.container.querySelector('#nd-fecha').addEventListener('input', function (e) { f.fecha_emision = e.target.value; });
      this.container.querySelector('#nd-moneda').addEventListener('change', function (e) {
        f.tipo_moneda = e.target.value;
        self._refreshItemsTable();
      });
      this.container.querySelector('#nd-afec-tipo').addEventListener('change', function (e) { f.doc_afectado_tipo = e.target.value; });
      this.container.querySelector('#nd-afec-serie').addEventListener('input', function (e) {
        f.doc_afectado_serie = e.target.value.toUpperCase();
        e.target.value = f.doc_afectado_serie;
      });
      this.container.querySelector('#nd-afec-corr').addEventListener('input', function (e) { f.doc_afectado_correlativo = e.target.value; });
      this.container.querySelector('#nd-cod-motivo').addEventListener('change', function (e) { f.cod_motivo = e.target.value; });
      this.container.querySelector('#nd-des-motivo').addEventListener('input', function (e) { f.des_motivo = e.target.value; });

      this.container.querySelector('#nd-add-prod').addEventListener('click', function () { self._openProductPicker(); });

      App.bindClientSelector(this.container.querySelector('#nd-client-selector'), {
        onSelect: function (c) { self.cliente = c; self._renderHTML(); self._bind(); },
        onClear: function () { self.cliente = null; self._renderHTML(); self._bind(); },
      });

      App.bindPdfFormatPicker(this.container, function () { return self.pdfFormat; }, function (v) { self.pdfFormat = v; });

      this.container.querySelector('#nd-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self._submit();
      });
    }

    _refreshItemsTable() {
      var self = this;
      var itemsRoot = this.container.querySelector('#nd-items-table');
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
        var res = await App.api.crearNotaDebito(payload);
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
      new App.ResponseModal({ response: response, error: error, tipo: 'notas-debito', pdfFormat: this.pdfFormat }).render(document.body);
    }
  };
})();
