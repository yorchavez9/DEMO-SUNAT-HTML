var App = window.App || (window.App = {});

(function () {
  var MOTIVOS_TRASLADO = [
    { cod: '01', desc: 'Venta' },
    { cod: '02', desc: 'Compra' },
    { cod: '04', desc: 'Traslado entre establecimientos' },
    { cod: '08', desc: 'Importación' },
    { cod: '09', desc: 'Exportación' },
    { cod: '13', desc: 'Otros' },
  ];

  App.NewDispatchGuide = class NewDispatchGuide {
    constructor() {
      this.form = {
        serie: 'T001',
        fecha_emision: App.todayISO(),
        observacion: '',
        cod_traslado: '01',
        mod_traslado: '02',
        fecha_traslado: App.tomorrowISO(),
        peso_total: 10,
        und_peso_total: 'KGM',
        num_bultos: 1,
        partida_ubigeo: '150101',
        partida_direccion: 'AV. LIMA 123',
        llegada_ubigeo: '150101',
        llegada_direccion: '',
        vehiculo_placa: 'ABC-123',
        conductor_num_doc: '',
        conductor_nombres: '',
        conductor_apellidos: '',
        conductor_licencia: '',
        transportista_num_doc: '',
        transportista_razon_social: '',
      };
      this.destinatario = null;
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

    _itemsTableHTML() {
      if (this.items.length === 0) {
        return '<div style="text-align: center; padding: 2rem 0; color: rgb(148 163 184); background: rgb(248 250 252); border-radius: 0.5rem;">Sin productos</div>';
      }
      var rows = this.items.map(function (it, idx) {
        return '<tr>'
          + '<td>' + App.escapeHtml(it.descripcion) + '</td>'
          + '<td class="font-mono text-xs">' + App.escapeHtml(it.unidad) + '</td>'
          + '<td><input type="number" min="0" step="any" class="input-inline text-right" data-gitem-cantidad="' + idx + '" value="' + App.escapeHtml(it.cantidad) + '" /></td>'
          + '<td><button type="button" data-gitem-remove="' + idx + '" style="color: rgb(239 68 68); background: transparent; border: none; cursor: pointer;">'
          + '<i data-lucide="x" class="w-4 h-4"></i></button></td>'
          + '</tr>';
      }).join('');

      return '<div class="table-wrap">'
        + '<table class="table-std">'
          + '<thead><tr><th>Descripción</th><th style="width: 5rem;">Und</th>'
          + '<th style="width: 6rem; text-align: right;">Cantidad</th><th style="width: 3rem;"></th></tr></thead>'
          + '<tbody>' + rows + '</tbody>'
        + '</table>'
        + '</div>';
    }

    _renderHTML() {
      var f = this.form;
      var esPrivado = f.mod_traslado === '02';
      var motivosOpts = MOTIVOS_TRASLADO.map(function (m) {
        return '<option value="' + m.cod + '"' + (f.cod_traslado === m.cod ? ' selected' : '') + '>' + m.cod + ' - ' + m.desc + '</option>';
      }).join('');

      var bloqueTransporte = esPrivado ? (
        '<div class="card">'
        + '<h2 style="font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="car" class="w-5 h-5"></i> Vehículo + Conductor (traslado privado)</h2>'
        + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-2">'
          + '<div><label class="label">Placa</label>'
            + '<input id="g-placa" class="input font-mono" value="' + App.escapeHtml(f.vehiculo_placa) + '" maxlength="10" required placeholder="ABC-123" /></div>'
        + '</div>'
        + '<div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-2">'
          + '<div><label class="label">DNI conductor</label><input id="g-cond-dni" class="input font-mono" value="' + App.escapeHtml(f.conductor_num_doc) + '" maxlength="8" required /></div>'
          + '<div><label class="label">Licencia</label><input id="g-cond-lic" class="input font-mono" value="' + App.escapeHtml(f.conductor_licencia) + '" required /></div>'
          + '<div><label class="label">Nombres</label><input id="g-cond-nom" class="input" value="' + App.escapeHtml(f.conductor_nombres) + '" required /></div>'
          + '<div><label class="label">Apellidos</label><input id="g-cond-ape" class="input" value="' + App.escapeHtml(f.conductor_apellidos) + '" required /></div>'
        + '</div>'
        + '</div>'
      ) : (
        '<div class="card">'
        + '<h2 style="font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="truck" class="w-5 h-5"></i> Transportista (traslado público)</h2>'
        + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-2">'
          + '<div><label class="label">RUC transportista</label><input id="g-trans-ruc" class="input font-mono" value="' + App.escapeHtml(f.transportista_num_doc) + '" maxlength="11" required /></div>'
          + '<div><label class="label">Razón social</label><input id="g-trans-rs" class="input" value="' + App.escapeHtml(f.transportista_razon_social) + '" required /></div>'
        + '</div>'
        + '</div>'
      );

      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title"><i data-lucide="truck" class="w-7 h-7"></i> Nueva Guía de Remisión</h1>'
          + '<form id="g-form" style="display: flex; flex-direction: column; gap: 1.5rem;">'
            + '<div class="card">'
              + '<h2 class="section-title">Datos de la guía</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-4">'
                + '<div><label class="label">Serie</label><input id="g-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" maxlength="4" required /></div>'
                + '<div><label class="label">Fecha emisión</label><input id="g-fecha-emision" type="date" class="input" value="' + App.escapeHtml(f.fecha_emision) + '" required /></div>'
                + '<div><label class="label">Fecha traslado</label><input id="g-fecha-traslado" type="date" class="input" value="' + App.escapeHtml(f.fecha_traslado) + '" required /></div>'
                + '<div><label class="label">Motivo (Cat. 20)</label><select id="g-cod-traslado" class="input">' + motivosOpts + '</select></div>'
              + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Destinatario</h2>'
              + '<div id="g-dest-selector">' + App.clientSelectorHTML(this.destinatario, 'Seleccionar destinatario (RUC o DNI)...') + '</div>'
            + '</div>'
            + '<div class="card">'
              + '<h2 class="section-title">Traslado</h2>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1rem;" class="form-grid-2">'
                + '<div><label class="label">Modalidad</label>'
                  + '<select id="g-mod-traslado" class="input">'
                    + '<option value="02"' + (f.mod_traslado === '02' ? ' selected' : '') + '>02 - Privado (tu vehículo)</option>'
                    + '<option value="01"' + (f.mod_traslado === '01' ? ' selected' : '') + '>01 - Público (transportista)</option>'
                  + '</select></div>'
                + '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">'
                  + '<div><label class="label">Peso total</label><input id="g-peso" type="number" min="0.01" step="0.01" class="input" value="' + App.escapeHtml(f.peso_total) + '" required /></div>'
                  + '<div><label class="label">Unidad</label>'
                    + '<select id="g-peso-unidad" class="input">'
                      + '<option value="KGM"' + (f.und_peso_total === 'KGM' ? ' selected' : '') + '>KGM</option>'
                      + '<option value="TNE"' + (f.und_peso_total === 'TNE' ? ' selected' : '') + '>TNE</option>'
                    + '</select></div>'
                  + '<div><label class="label">Bultos</label><input id="g-bultos" type="number" min="1" class="input" value="' + App.escapeHtml(f.num_bultos) + '" /></div>'
                + '</div>'
              + '</div>'
              + '<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;" class="form-grid-2">'
                + '<div>'
                  + '<label class="label">Partida - Ubigeo</label><input id="g-partida-ubigeo" class="input font-mono" value="' + App.escapeHtml(f.partida_ubigeo) + '" maxlength="6" required />'
                  + '<label class="label" style="margin-top: 0.5rem;">Partida - Dirección</label>'
                  + '<input id="g-partida-dir" class="input" value="' + App.escapeHtml(f.partida_direccion) + '" required />'
                + '</div>'
                + '<div>'
                  + '<label class="label">Llegada - Ubigeo</label><input id="g-llegada-ubigeo" class="input font-mono" value="' + App.escapeHtml(f.llegada_ubigeo) + '" maxlength="6" required />'
                  + '<label class="label" style="margin-top: 0.5rem;">Llegada - Dirección</label>'
                  + '<input id="g-llegada-dir" class="input" value="' + App.escapeHtml(f.llegada_direccion) + '" placeholder="Dirección destino" required />'
                + '</div>'
              + '</div>'
            + '</div>'
            + bloqueTransporte
            + '<div class="card">'
              + '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">'
                + '<h2 class="section-title" style="margin-bottom: 0;">Productos a trasladar</h2>'
                + '<button type="button" id="g-add-prod" class="btn-primary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar</button>'
              + '</div>'
              + '<div id="g-items">' + this._itemsTableHTML() + '</div>'
            + '</div>'
            + '<div class="card"><label class="label">Observaciones</label>'
              + '<textarea id="g-obs" class="input" rows="2">' + App.escapeHtml(f.observacion) + '</textarea>'
            + '</div>'
            + '<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
              + App.pdfFormatPickerHTML(this.pdfFormat)
              + '<button type="submit" id="g-submit" class="btn-primary" ' + (this.sending ? 'disabled' : '') + '>'
                + (this.sending
                  ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Emitiendo...'
                  : '<i data-lucide="check" class="w-4 h-4"></i> Emitir Guía')
              + '</button>'
            + '</div>'
          + '</form>'
          + '<style>'
            + '@media (min-width: 640px) { .form-grid-2 { grid-template-columns: repeat(2, 1fr) !important; } .form-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }'
            + '@media (min-width: 768px) { .form-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }'
          + '</style>'
        + '</div>';

      App.refreshIcons();
    }

    _bind() {
      var self = this;
      var f = this.form;
      function set(id, field, upper) {
        var el = self.container.querySelector(id);
        if (!el) return;
        el.addEventListener('input', function (e) {
          f[field] = upper ? e.target.value.toUpperCase() : e.target.value;
          if (upper) e.target.value = f[field];
        });
      }

      set('#g-serie', 'serie', true);
      set('#g-fecha-emision', 'fecha_emision');
      set('#g-fecha-traslado', 'fecha_traslado');
      set('#g-peso', 'peso_total');
      set('#g-bultos', 'num_bultos');
      set('#g-partida-ubigeo', 'partida_ubigeo');
      set('#g-partida-dir', 'partida_direccion');
      set('#g-llegada-ubigeo', 'llegada_ubigeo');
      set('#g-llegada-dir', 'llegada_direccion');
      set('#g-placa', 'vehiculo_placa', true);
      set('#g-cond-dni', 'conductor_num_doc');
      set('#g-cond-lic', 'conductor_licencia');
      set('#g-cond-nom', 'conductor_nombres');
      set('#g-cond-ape', 'conductor_apellidos');
      set('#g-trans-ruc', 'transportista_num_doc');
      set('#g-trans-rs', 'transportista_razon_social');
      set('#g-obs', 'observacion');

      this.container.querySelector('#g-cod-traslado').addEventListener('change', function (e) { f.cod_traslado = e.target.value; });
      this.container.querySelector('#g-peso-unidad').addEventListener('change', function (e) { f.und_peso_total = e.target.value; });
      this.container.querySelector('#g-mod-traslado').addEventListener('change', function (e) {
        f.mod_traslado = e.target.value;
        self._renderHTML();
        self._bind();
      });

      this.container.querySelector('#g-add-prod').addEventListener('click', function () { self._openProductPicker(); });

      App.bindClientSelector(this.container.querySelector('#g-dest-selector'), {
        onOpenPicker: function () { self._openClientPicker(); },
        onClear: function () { self.destinatario = null; self._renderHTML(); self._bind(); },
      });

      this._bindItems();

      App.bindPdfFormatPicker(this.container, function () { return self.pdfFormat; }, function (v) { self.pdfFormat = v; });

      this.container.querySelector('#g-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self._submit();
      });
    }

    _bindItems() {
      var self = this;
      this.container.querySelectorAll('[data-gitem-cantidad]').forEach(function (el) {
        el.addEventListener('input', function (e) {
          var idx = parseInt(el.dataset.gitemCantidad, 10);
          self.items[idx].cantidad = e.target.value;
        });
      });
      this.container.querySelectorAll('[data-gitem-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.gitemRemove, 10);
          self.items = self.items.filter(function (_, i) { return i !== idx; });
          self._refreshItems();
        });
      });
    }

    _refreshItems() {
      this.container.querySelector('#g-items').innerHTML = this._itemsTableHTML();
      App.refreshIcons();
      this._bindItems();
    }

    _openProductPicker() {
      var self = this;
      new App.ProductPicker({
        onSelect: function (p) {
          self.items.push({
            codigo: p.codigo,
            descripcion: p.descripcion,
            cantidad: 1,
            unidad: p.unidad,
          });
          self._refreshItems();
        },
      }).render(document.body);
    }

    _openClientPicker() {
      var self = this;
      new App.ClientPicker({
        onSelect: function (c) { self.destinatario = c; self._renderHTML(); self._bind(); },
      }).render(document.body);
    }

    async _submit() {
      if (!this.destinatario) { alert('Selecciona un destinatario'); return; }
      if (this.items.length === 0) { alert('Agrega al menos un producto'); return; }

      var f = this.form;
      var payload = {
        serie: f.serie,
        fecha_emision: f.fecha_emision,
        observacion: f.observacion || undefined,
        destinatario: {
          tipo_doc: this.destinatario.tipo_doc,
          num_doc: this.destinatario.num_doc,
          razon_social: this.destinatario.razon_social,
        },
        cod_traslado: f.cod_traslado,
        mod_traslado: f.mod_traslado,
        fecha_traslado: f.fecha_traslado,
        peso_total: parseFloat(f.peso_total),
        und_peso_total: f.und_peso_total,
        num_bultos: parseInt(f.num_bultos, 10) || 1,
        partida_ubigeo: f.partida_ubigeo,
        partida_direccion: f.partida_direccion,
        llegada_ubigeo: f.llegada_ubigeo,
        llegada_direccion: f.llegada_direccion,
        items: this.items.map(function (it) {
          return {
            descripcion: it.descripcion,
            cantidad: parseFloat(it.cantidad),
            unidad: it.unidad,
            codigo: it.codigo,
          };
        }),
      };

      if (f.mod_traslado === '02') {
        payload.vehiculo = { placa: f.vehiculo_placa };
        payload.conductor = {
          tipo_doc: '1',
          num_doc: f.conductor_num_doc,
          tipo: 'Principal',
          nombres: f.conductor_nombres,
          apellidos: f.conductor_apellidos,
          licencia: f.conductor_licencia,
        };
      } else {
        payload.transportista = {
          tipo_doc: '6',
          num_doc: f.transportista_num_doc,
          razon_social: f.transportista_razon_social,
        };
      }

      this.sending = true;
      this._renderHTML();
      this._bind();

      try {
        var res = await App.api.crearGuia(payload);
        this._showResponse(res, null);
        this.items = [];
      } catch (e) {
        this._showResponse(null, e);
      } finally {
        this.sending = false;
        this._renderHTML();
        this._bind();
      }
    }

    _showResponse(response, error) {
      new App.ResponseModal({ response: response, error: error, tipo: 'guias-remision', pdfFormat: this.pdfFormat }).render(document.body);
    }
  };
})();
