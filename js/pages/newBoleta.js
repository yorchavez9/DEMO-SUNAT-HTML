var App = window.App || (window.App = {});

(function () {
  var CLIENTE_ANONIMO = { tipo_doc: '0', num_doc: '-', razon_social: 'CLIENTES VARIOS' };

  App.NewBoleta = class NewBoleta {
    constructor() {
      this.form = {
        serie: 'B001',
        fecha_emision: App.todayISO(),
        tipo_moneda: 'PEN',
        forma_pago: 'Contado',
        observacion: '',
      };
      this.cliente = Object.assign({}, CLIENTE_ANONIMO);
      this.items = [];
      this.cuotas = [];
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
      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title">'
            + '<i data-lucide="receipt" class="w-7 h-7"></i> Nueva Boleta'
          + '</h1>'
          + '<form id="b-form" style="display: flex; flex-direction: column; gap: 1.5rem;">'
            + '<div class="card">'
              + '<h2 class="section-title">Datos del documento</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-4">'
                + '<div><label class="label">Serie</label>'
                  + '<input id="b-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" maxlength="4" required /></div>'
                + '<div><label class="label">Fecha</label>'
                  + '<input id="b-fecha" type="date" class="input" value="' + App.escapeHtml(f.fecha_emision) + '" required /></div>'
                + '<div><label class="label">Moneda</label>'
                  + '<select id="b-moneda" class="input">'
                    + '<option value="PEN"' + (f.tipo_moneda === 'PEN' ? ' selected' : '') + '>PEN</option>'
                    + '<option value="USD"' + (f.tipo_moneda === 'USD' ? ' selected' : '') + '>USD</option>'
                  + '</select></div>'
                + '<div><label class="label">Forma de pago</label>'
                  + '<select id="b-pago" class="input">'
                    + '<option value="Contado"' + (f.forma_pago === 'Contado' ? ' selected' : '') + '>Contado</option>'
                    + '<option value="Credito"' + (f.forma_pago === 'Credito' ? ' selected' : '') + '>Crédito</option>'
                  + '</select></div>'
              + '</div>'
            + '</div>'
            + '<div id="b-cuotas-section" class="card" style="display: ' + (f.forma_pago === 'Credito' ? 'block' : 'none') + ';">'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">'
                + '<h2 class="section-title" style="margin-bottom: 0;">Cuotas de pago</h2>'
                + '<button type="button" id="b-add-cuota" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar cuota</button>'
              + '</div>'
              + '<div id="b-cuotas-rows">' + this._cuotasRowsHTML() + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Cliente</h2>'
              + '<div id="b-client-selector">' + App.clientSelectorHTML(this.cliente, 'Seleccionar cliente...') + '</div>'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; gap: 0.5rem; flex-wrap: wrap;">'
                + '<p style="font-size: 0.75rem; color: rgb(100 116 139);">Opcional identificar al cliente si el monto es menor a S/ 700.</p>'
                + '<button type="button" id="b-anonimo" style="font-size: 0.75rem; color: rgb(71 85 105); font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; background: transparent; border: none; cursor: pointer;">'
                  + '<i data-lucide="user-x" class="w-[14px] h-[14px]"></i> Usar cliente anónimo'
                + '</button>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">'
                + '<h2 class="section-title" style="margin-bottom: 0;">Productos</h2>'
                + '<button type="button" id="b-add-prod" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar producto</button>'
              + '</div>'
              + '<div id="b-items-table"></div>'
            + '</div>'
            + '<div class="card">'
              + '<label class="label">Observaciones</label>'
              + '<textarea id="b-obs" class="input" rows="2">' + App.escapeHtml(f.observacion) + '</textarea>'
            + '</div>'
            + '<div class="card" style="background: rgb(239 246 255);">'
              + '<div style="font-size: 0.75rem; font-weight: 700; color: rgb(30 58 138); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">¿Cómo emitir esta boleta?</div>'
              + '<p style="font-size: 0.75rem; color: rgb(71 85 105); margin-bottom: 0.75rem;">'
                + 'Lo más común es <strong>solo guardarla</strong> y al final del día enviar todas en lote vía Resumen Diario. '
                + 'Si necesitas enviarla a SUNAT inmediatamente, usa "Enviar a SUNAT".'
              + '</p>'
              + '<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
                + App.pdfFormatPickerHTML(this.pdfFormat)
                + '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">'
                  + '<button type="button" id="b-save" class="btn-secondary" ' + (this.sending ? 'disabled' : '') + '>'
                    + (this.sending
                      ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Guardando...'
                      : '<i data-lucide="save" class="w-4 h-4"></i> Solo guardar (pendiente)')
                  + '</button>'
                  + '<button type="button" id="b-send" class="btn-primary" ' + (this.sending ? 'disabled' : '') + '>'
                    + (this.sending
                      ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Enviando...'
                      : '<i data-lucide="send" class="w-4 h-4"></i> Enviar a SUNAT ahora')
                  + '</button>'
                + '</div>'
              + '</div>'
            + '</div>'
          + '</form>'
          + '<style>'
            + '@media (min-width: 640px) { .form-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }'
            + '@media (min-width: 768px) { .form-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }'
          + '</style>'
        + '</div>';

      var itemsRoot = this.container.querySelector('#b-items-table');
      itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
      var self = this;
      App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);

      App.refreshIcons();
    }

    _bind() {
      var self = this;
      this.container.querySelector('#b-serie').addEventListener('input', function (e) {
        self.form.serie = e.target.value.toUpperCase();
        e.target.value = self.form.serie;
      });
      this.container.querySelector('#b-fecha').addEventListener('input', function (e) { self.form.fecha_emision = e.target.value; });
      this.container.querySelector('#b-moneda').addEventListener('change', function (e) {
        self.form.tipo_moneda = e.target.value;
        self._refreshItemsTable();
      });
      this.container.querySelector('#b-pago').addEventListener('change', function (e) {
        self.form.forma_pago = e.target.value;
        var section = self.container.querySelector('#b-cuotas-section');
        if (section) section.style.display = e.target.value === 'Credito' ? 'block' : 'none';
      });
      var addCuotaBtn = this.container.querySelector('#b-add-cuota');
      if (addCuotaBtn) addCuotaBtn.addEventListener('click', function () { self._addCuota(); });
      this._bindCuotasRows();
      this.container.querySelector('#b-obs').addEventListener('input', function (e) { self.form.observacion = e.target.value; });

      this.container.querySelector('#b-anonimo').addEventListener('click', function () {
        self.cliente = Object.assign({}, CLIENTE_ANONIMO);
        self._renderHTML();
        self._bind();
      });

      this.container.querySelector('#b-add-prod').addEventListener('click', function () { self._openProductPicker(); });

      App.bindClientSelector(this.container.querySelector('#b-client-selector'), {
        onOpenPicker: function () { self._openClientPicker(); },
        onClear: function () {
          self.cliente = Object.assign({}, CLIENTE_ANONIMO);
          self._renderHTML();
          self._bind();
        },
      });

      this.container.querySelector('#b-save').addEventListener('click', function () { self._submit(true); });
      this.container.querySelector('#b-send').addEventListener('click', function () { self._submit(false); });
      this.container.querySelector('#b-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self._submit(true);
      });

      App.bindPdfFormatPicker(this.container, function () { return self.pdfFormat; }, function (v) { self.pdfFormat = v; });
    }

    _cuotasRowsHTML() {
      if (this.cuotas.length === 0) {
        return '<p style="font-size: 0.875rem; color: rgb(100 116 139);">Agrega al menos una cuota.</p>';
      }
      return this.cuotas.map(function (c, i) {
        return '<div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 0.5rem;">'
          + '<div style="flex: 1;"><label class="label">Fecha pago</label>'
            + '<input type="date" data-ci="' + i + '" data-cf="fecha_pago" class="input" value="' + App.escapeHtml(c.fecha_pago) + '" /></div>'
          + '<div style="flex: 1;"><label class="label">Monto</label>'
            + '<input type="number" data-ci="' + i + '" data-cf="monto" class="input" value="' + App.escapeHtml(String(c.monto)) + '" placeholder="0.00" min="0.01" step="0.01" /></div>'
          + '<button type="button" data-cd="' + i + '" style="padding: 0.375rem; color: rgb(239 68 68); background: transparent; border: none; cursor: pointer; flex-shrink: 0; margin-bottom: 2px;">'
            + '<i data-lucide="x" class="w-4 h-4"></i></button>'
        + '</div>';
      }).join('');
    }

    _refreshCuotasRows() {
      var rows = this.container.querySelector('#b-cuotas-rows');
      if (rows) {
        rows.innerHTML = this._cuotasRowsHTML();
        this._bindCuotasRows();
        App.refreshIcons();
      }
    }

    _bindCuotasRows() {
      var self = this;
      var rows = this.container.querySelector('#b-cuotas-rows');
      if (!rows) return;
      rows.querySelectorAll('[data-ci]').forEach(function (el) {
        el.addEventListener('input', function () {
          var idx = parseInt(el.dataset.ci);
          var field = el.dataset.cf;
          self.cuotas[idx][field] = el.value;
        });
      });
      rows.querySelectorAll('[data-cd]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.cd);
          self.cuotas.splice(idx, 1);
          self._refreshCuotasRows();
        });
      });
    }

    _addCuota() {
      var d = new Date();
      d.setMonth(d.getMonth() + 1);
      this.cuotas.push({ fecha_pago: d.toISOString().split('T')[0], monto: '' });
      this._refreshCuotasRows();
    }

    _refreshItemsTable() {
      var self = this;
      var itemsRoot = this.container.querySelector('#b-items-table');
      itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
      App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);
      App.refreshIcons();
    }

    _openProductPicker() {
      var self = this;
      new App.ProductPicker({
        onSelect: function (p) {
          var item = {
            codigo: p.codigo,
            cod_producto_sunat: p.cod_producto_sunat,
            descripcion: p.descripcion,
            unidad: p.unidad,
            cantidad: 1,
            precio_unitario: p.precio_unitario,
            tip_afe_igv: p.tip_afe_igv || '10',
          };
          if (p.icbper) { item.icbper = p.icbper; item.factor_icbper = p.factor_icbper; }
          self.items.push(item);
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

    async _submit(soloRegistro) {
      if (this.items.length === 0) { alert('Agrega al menos un producto'); return; }
      if (this.form.forma_pago === 'Credito' && this.cuotas.length === 0) {
        alert('Agrega al menos una cuota para el pago a crédito');
        return;
      }

      var payload = Object.assign({}, this.form,
        this.form.forma_pago === 'Credito' ? { cuotas: this.cuotas.map(function (c) { return { monto: parseFloat(c.monto), fecha_pago: c.fecha_pago }; }) } : {},
      {
        solo_registro: soloRegistro,
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
        var res = await App.api.crearBoleta(payload);
        this._showResponse(res, null);
        this.items = [];
        this.form.observacion = '';
      } catch (e) {
        this._showResponse(null, e);
      } finally {
        this.sending = false;
        this._renderHTML();
        this._bind();
      }
    }

    _showResponse(response, error) {
      new App.ResponseModal({ response: response, error: error, tipo: 'boletas', pdfFormat: this.pdfFormat }).render(document.body);
    }
  };
})();
