var App = window.App || (window.App = {});

App.NewInvoice = class NewInvoice {
  constructor() {
    this.form = {
      serie: 'F001',
      fecha_emision: App.todayISO(),
      tipo_moneda: 'PEN',
      forma_pago: 'Contado',
      observacion: '',
    };
    this.cliente = null;
    this.items = [];
    this.sending = false;
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
          + '<i data-lucide="file-text" class="w-7 h-7"></i> Nueva Factura'
        + '</h1>'
        + '<form id="f-form" style="display: flex; flex-direction: column; gap: 1.5rem;">'
          + '<div class="card">'
            + '<h2 class="section-title">Datos del documento</h2>'
            + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-4">'
              + '<div><label class="label">Serie</label>'
                + '<input id="f-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" maxlength="4" required /></div>'
              + '<div><label class="label">Fecha emisión</label>'
                + '<input id="f-fecha" type="date" class="input" value="' + App.escapeHtml(f.fecha_emision) + '" required /></div>'
              + '<div><label class="label">Moneda</label>'
                + '<select id="f-moneda" class="input">'
                  + '<option value="PEN"' + (f.tipo_moneda === 'PEN' ? ' selected' : '') + '>PEN (Soles)</option>'
                  + '<option value="USD"' + (f.tipo_moneda === 'USD' ? ' selected' : '') + '>USD (Dólares)</option>'
                  + '<option value="EUR"' + (f.tipo_moneda === 'EUR' ? ' selected' : '') + '>EUR (Euros)</option>'
                + '</select></div>'
              + '<div><label class="label">Forma de pago</label>'
                + '<select id="f-pago" class="input">'
                  + '<option value="Contado"' + (f.forma_pago === 'Contado' ? ' selected' : '') + '>Contado</option>'
                  + '<option value="Credito"' + (f.forma_pago === 'Credito' ? ' selected' : '') + '>Crédito</option>'
                + '</select></div>'
            + '</div>'
          + '</div>'
          + '<div class="card">'
            + '<h2 class="section-title">Cliente</h2>'
            + '<div id="f-client-selector">' + App.clientSelectorHTML(this.cliente, 'Seleccionar cliente (RUC)...') + '</div>'
            + (this.cliente && this.cliente.direccion
              ? '<p style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.5rem; padding-left: 0.25rem;">' + App.escapeHtml(this.cliente.direccion) + '</p>'
              : '')
          + '</div>'
          + '<div class="card">'
            + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">'
              + '<h2 class="section-title" style="margin-bottom: 0;">Productos / Servicios</h2>'
              + '<button type="button" id="f-add-prod" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar producto</button>'
            + '</div>'
            + '<div id="f-items-table"></div>'
          + '</div>'
          + '<div class="card">'
            + '<label class="label">Observaciones (opcional)</label>'
            + '<textarea id="f-obs" class="input" rows="2" placeholder="Comentarios adicionales...">' + App.escapeHtml(f.observacion) + '</textarea>'
          + '</div>'
          + '<div style="display: flex; justify-content: flex-end; gap: 0.5rem;">'
            + '<button type="submit" id="f-submit" class="btn-primary" ' + (this.sending ? 'disabled' : '') + '>'
              + (this.sending
                ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Emitiendo...'
                : '<i data-lucide="check" class="w-4 h-4"></i> Emitir Factura')
            + '</button>'
          + '</div>'
        + '</form>'
        + '<style>'
          + '@media (min-width: 640px) { .form-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }'
          + '@media (min-width: 768px) { .form-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }'
        + '</style>'
      + '</div>';

    var itemsRoot = this.container.querySelector('#f-items-table');
    itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
    var self = this;
    App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);

    App.refreshIcons();
  }

  _bind() {
    var self = this;
    this.container.querySelector('#f-serie').addEventListener('input', function (e) {
      self.form.serie = e.target.value.toUpperCase();
      e.target.value = self.form.serie;
    });
    this.container.querySelector('#f-fecha').addEventListener('input', function (e) { self.form.fecha_emision = e.target.value; });
    this.container.querySelector('#f-moneda').addEventListener('change', function (e) {
      self.form.tipo_moneda = e.target.value;
      self._refreshItemsTable();
    });
    this.container.querySelector('#f-pago').addEventListener('change', function (e) { self.form.forma_pago = e.target.value; });
    this.container.querySelector('#f-obs').addEventListener('input', function (e) { self.form.observacion = e.target.value; });

    this.container.querySelector('#f-add-prod').addEventListener('click', function () { self._openProductPicker(); });

    App.bindClientSelector(this.container.querySelector('#f-client-selector'), {
      onOpenPicker: function () { self._openClientPicker(); },
      onClear: function () { self.cliente = null; self._renderHTML(); self._bind(); },
    });

    this.container.querySelector('#f-form').addEventListener('submit', function (e) {
      e.preventDefault();
      self._submit();
    });
  }

  _refreshItemsTable() {
    var self = this;
    var itemsRoot = this.container.querySelector('#f-items-table');
    itemsRoot.innerHTML = App.itemsTableHTML(this.items, this.form.tipo_moneda);
    App.bindItemsTable(itemsRoot, function () { return self.items; }, function (n) { self.items = n; }, this.form.tipo_moneda);
    App.refreshIcons();
  }

  _openProductPicker() {
    var self = this;
    var picker = new App.ProductPicker({
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
    });
    picker.render(document.body);
  }

  _openClientPicker() {
    var self = this;
    var picker = new App.ClientPicker({
      onSelect: function (c) { self.cliente = c; self._renderHTML(); self._bind(); },
    });
    picker.render(document.body);
  }

  async _submit() {
    if (!this.cliente) { alert('Selecciona un cliente'); return; }
    if (this.items.length === 0) { alert('Agrega al menos un producto'); return; }

    var payload = Object.assign({}, this.form, {
      cliente: {
        tipo_doc: this.cliente.tipo_doc,
        num_doc: this.cliente.num_doc,
        razon_social: this.cliente.razon_social,
        direccion: this.cliente.direccion || '',
        email: this.cliente.email,
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
      var res = await App.api.crearFactura(payload);
      this._showResponse(res, null);
      this.cliente = null;
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
    new App.ResponseModal({ response: response, error: error, tipo: 'facturas' }).render(document.body);
  }
};
