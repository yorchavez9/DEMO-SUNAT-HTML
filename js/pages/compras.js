var App = window.App || (window.App = {});

/**
 * Compras a proveedores. Al guardar una compra se suma stock al inventario
 * (un movimiento de entrada por línea) y el costo de compra pasa a ser el
 * costo del producto.
 */
(function () {
  var TIPOS_DOC = [
    { cod: '01', label: 'Factura' },
    { cod: '03', label: 'Boleta' },
    { cod: '12', label: 'Ticket' },
    { cod: '00', label: 'Otro' },
  ];

  function tipoDocLabel(cod) {
    var t = TIPOS_DOC.find(function (x) { return x.cod === cod; });
    return t ? t.label : cod;
  }

  function unidadSym(cod) {
    var u = (App.SUNAT_UNITS || []).find(function (x) { return x.cod === cod; });
    return u ? u.sym : cod;
  }

  App.Compras = class Compras {
    constructor() {
      this.container = null;
      this.router = null;
      this.vista = 'lista';
      this.form = null;      // borrador de compra
      this.items = [];
      this.viendo = null;    // compra abierta en el modal de detalle
      this.eliminando = null;
    }

    render(container, router) {
      this.container = container;
      this.router = router;
      this._renderHTML();
      this._bind();
    }

    _formVacio() {
      return {
        fecha: App.todayISO(),
        proveedor_id: '',
        tipo_doc: '01',
        serie: '',
        numero: '',
        observacion: '',
      };
    }

    _total() {
      return this.items.reduce(function (s, it) {
        return s + (Number(it.cantidad) || 0) * (Number(it.costo_unitario) || 0);
      }, 0);
    }

    // ─── Render ─────────────────────────────────────────────────
    _renderHTML() {
      this.container.innerHTML = (this.vista === 'nueva' ? this._nuevaHTML() : this._listaHTML())
        + (this.viendo ? this._detalleHTML() : '')
        + (this.eliminando ? this._confirmHTML() : '');
      App.refreshIcons();
    }

    _listaHTML() {
      var compras = App.DB.all('compras').slice().sort(function (a, b) {
        return String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id;
      });

      var totalMes = compras.reduce(function (s, c) { return s + Number(c.total || 0); }, 0);

      var tabla = compras.length === 0
        ? '<div style="padding: 3rem 1rem; text-align: center; color: rgb(148 163 184);">'
            + '<i data-lucide="shopping-cart" class="w-10 h-10" style="margin: 0 auto 0.75rem; display: block;"></i>'
            + 'Todavía no hay compras registradas.'
          + '</div>'
        : '<div class="table-wrap">'
            + '<table class="table-std">'
              + '<thead><tr>'
                + '<th>Fecha</th><th>Documento</th><th>Proveedor</th>'
                + '<th style="text-align: right;">Ítems</th>'
                + '<th style="text-align: right;">Total</th>'
                + '<th style="width: 5.5rem;"></th>'
              + '</tr></thead>'
              + '<tbody>'
              + compras.map(function (c) {
                return '<tr>'
                  + '<td class="text-xs">' + App.escapeHtml(c.fecha) + '</td>'
                  + '<td>'
                    + '<div class="font-mono text-xs" style="font-weight: 600;">' + App.escapeHtml(c.serie + '-' + c.numero) + '</div>'
                    + '<div class="text-xs" style="color: rgb(148 163 184);">' + App.escapeHtml(tipoDocLabel(c.tipo_doc)) + '</div>'
                  + '</td>'
                  + '<td>'
                    + '<div style="font-weight: 600;">' + App.escapeHtml(c.proveedor) + '</div>'
                    + '<div class="text-xs font-mono" style="color: rgb(148 163 184);">' + App.escapeHtml(c.proveedor_doc || '') + '</div>'
                  + '</td>'
                  + '<td class="text-right text-xs">' + c.items.length + '</td>'
                  + '<td class="text-right font-semibold">' + App.fmtMoney(c.total) + '</td>'
                  + '<td>'
                    + '<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">'
                      + '<button data-ver="' + c.id + '" title="Ver detalle" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(37 99 235); background: transparent; border: none; cursor: pointer;">'
                        + '<i data-lucide="eye" class="w-4 h-4"></i></button>'
                      + '<button data-borrar="' + c.id + '" title="Eliminar y revertir stock" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(220 38 38); background: transparent; border: none; cursor: pointer;">'
                        + '<i data-lucide="trash-2" class="w-4 h-4"></i></button>'
                    + '</div>'
                  + '</td>'
                  + '</tr>';
              }).join('')
              + '</tbody>'
            + '</table>'
          + '</div>';

      return ''
        + '<div>'
          + '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
            + '<h1 class="page-title"><i data-lucide="shopping-cart" class="w-7 h-7"></i> Compras</h1>'
            + '<button id="cp-nueva" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nueva compra</button>'
          + '</div>'
          + '<div class="card" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">'
            + '<span style="width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: rgb(255 237 213); color: rgb(194 65 12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">'
              + '<i data-lucide="receipt" class="w-5 h-5"></i>'
            + '</span>'
            + '<div>'
              + '<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(100 116 139);">Total comprado</div>'
              + '<div style="font-size: 1.25rem; font-weight: 800;">' + App.fmtMoney(totalMes) + '</div>'
            + '</div>'
          + '</div>'
          + '<div class="card" style="padding: 0;">' + tabla + '</div>'
        + '</div>';
    }

    _nuevaHTML() {
      var f = this.form;
      var proveedores = App.DB.proveedoresActivos();

      return ''
        + '<div>'
          + '<h1 class="page-title"><i data-lucide="shopping-cart" class="w-7 h-7"></i> Nueva compra</h1>'

          + '<div class="card" style="margin-bottom: 1rem;">'
            + '<h2 class="section-title"><i data-lucide="building-2" class="w-5 h-5"></i> Datos del documento</h2>'
            + '<div id="cp-error" style="display: none; padding: 0.75rem; margin-bottom: 1rem; background: rgb(254 242 242); border-radius: 0.5rem; color: rgb(185 28 28); font-size: 0.875rem;"></div>'
            + '<div style="display: grid; grid-template-columns: 1fr; gap: 0.875rem;" class="compra-grid">'
              + '<div style="grid-column: 1 / -1;">'
                + '<label class="label">Proveedor *</label>'
                + '<select id="c-proveedor" class="input js-select" data-search="true" data-placeholder="Selecciona un proveedor" data-search-placeholder="Buscar proveedor..." data-clearable="true">'
                  + '<option value="">— Selecciona un proveedor —</option>'
                  + proveedores.map(function (p) {
                    return '<option value="' + p.id + '"' + (String(p.id) === String(f.proveedor_id) ? ' selected' : '') + '>'
                      + App.escapeHtml(p.razon_social) + ' (' + App.escapeHtml(p.num_doc) + ')</option>';
                  }).join('')
                + '</select>'
                + (proveedores.length === 0
                  ? '<p class="text-xs" style="color: rgb(185 28 28); margin-top: 0.25rem;">No hay proveedores. Crea uno primero en la sección Proveedores.</p>'
                  : '')
              + '</div>'
              + '<div>'
                + '<label class="label">Tipo</label>'
                + '<select id="c-tipo-doc" class="input js-select">'
                  + TIPOS_DOC.map(function (t) {
                    return '<option value="' + t.cod + '"' + (t.cod === f.tipo_doc ? ' selected' : '') + '>' + t.label + '</option>';
                  }).join('')
                + '</select>'
              + '</div>'
              + '<div>'
                + '<label class="label">Serie *</label>'
                + '<input id="c-serie" class="input font-mono" value="' + App.escapeHtml(f.serie) + '" placeholder="F001" maxlength="4" />'
              + '</div>'
              + '<div>'
                + '<label class="label">Número *</label>'
                + '<input id="c-numero" class="input font-mono" value="' + App.escapeHtml(f.numero) + '" placeholder="4821" />'
              + '</div>'
              + '<div>'
                + '<label class="label">Fecha</label>'
                + '<input id="c-fecha" type="date" class="input" value="' + App.escapeHtml(f.fecha) + '" />'
              + '</div>'
            + '</div>'
            + '<style>@media (min-width: 768px) { .compra-grid { grid-template-columns: repeat(4, 1fr) !important; } }</style>'
            + '<div style="margin-top: 0.875rem;">'
              + '<label class="label">Observación</label>'
              + '<input id="c-observacion" class="input" value="' + App.escapeHtml(f.observacion) + '" placeholder="Opcional" />'
            + '</div>'
          + '</div>'

          + '<div class="card" style="margin-bottom: 1rem;">'
            + '<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">'
              + '<h2 class="section-title" style="margin-bottom: 0;"><i data-lucide="package" class="w-5 h-5"></i> Productos comprados</h2>'
              + '<button id="cp-agregar" class="btn-secondary text-sm"><i data-lucide="plus" class="w-4 h-4"></i> Agregar producto</button>'
            + '</div>'
            + '<div id="cp-items">' + this._itemsHTML() + '</div>'
          + '</div>'

          + '<div style="display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap;">'
            + '<button id="cp-cancelar" class="btn-secondary">Cancelar</button>'
            + '<button id="cp-guardar" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Registrar compra y sumar stock</button>'
          + '</div>'
        + '</div>';
    }

    _itemsHTML() {
      if (this.items.length === 0) {
        return '<div style="padding: 2rem 1rem; text-align: center; color: rgb(148 163 184); background: rgb(248 250 252); border-radius: 0.5rem;">'
          + 'Agrega los productos que estás comprando.'
          + '</div>';
      }

      var self = this;
      return ''
        + '<div class="table-wrap">'
          + '<table class="table-std">'
            + '<thead><tr>'
              + '<th>Producto</th><th>Und</th>'
              + '<th style="text-align: right; width: 6rem;">Cantidad</th>'
              + '<th style="text-align: right; width: 8rem;">Costo unit.</th>'
              + '<th style="text-align: right; width: 7rem;">Subtotal</th>'
              + '<th style="width: 2.5rem;"></th>'
            + '</tr></thead>'
            + '<tbody>'
            + this.items.map(function (it, idx) {
              var subtotal = (Number(it.cantidad) || 0) * (Number(it.costo_unitario) || 0);
              return '<tr>'
                + '<td>'
                  + '<div style="font-weight: 600; font-size: 0.8125rem;">' + App.escapeHtml(it.descripcion) + '</div>'
                  + '<div class="text-xs font-mono" style="color: rgb(148 163 184);">' + App.escapeHtml(it.codigo) + '</div>'
                + '</td>'
                + '<td class="text-xs">' + App.escapeHtml(unidadSym(it.unidad)) + '</td>'
                + '<td><input type="number" min="0" step="1" class="input-inline text-right" data-campo="cantidad" data-idx="' + idx + '" value="' + it.cantidad + '" /></td>'
                + '<td><input type="number" min="0" step="0.01" class="input-inline text-right" data-campo="costo_unitario" data-idx="' + idx + '" value="' + it.costo_unitario + '" /></td>'
                + '<td class="text-right font-semibold" data-subtotal="' + idx + '">' + App.fmtMoney(subtotal) + '</td>'
                + '<td>'
                  + '<button data-quitar="' + idx + '" title="Quitar" style="padding: 0.25rem; color: rgb(220 38 38); background: transparent; border: none; cursor: pointer;">'
                    + '<i data-lucide="x" class="w-4 h-4"></i></button>'
                + '</td>'
                + '</tr>';
            }).join('')
            + '</tbody>'
          + '</table>'
        + '</div>'
        + '<div style="display: flex; justify-content: flex-end; padding-top: 1rem; margin-top: 0.5rem; border-top: 1px solid rgb(241 245 249);">'
          + '<div style="text-align: right;">'
            + '<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(100 116 139);">Total de la compra</div>'
            + '<div id="cp-total" style="font-size: 1.5rem; font-weight: 800;">' + App.fmtMoney(self._total()) + '</div>'
          + '</div>'
        + '</div>';
    }

    _detalleHTML() {
      var c = this.viendo;
      var cuerpo = ''
        + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.875rem;">'
          + '<div><div class="text-xs" style="color: rgb(148 163 184);">Proveedor</div><div style="font-weight: 600;">' + App.escapeHtml(c.proveedor) + '</div></div>'
          + '<div><div class="text-xs" style="color: rgb(148 163 184);">RUC</div><div class="font-mono">' + App.escapeHtml(c.proveedor_doc || '—') + '</div></div>'
          + '<div><div class="text-xs" style="color: rgb(148 163 184);">Documento</div><div class="font-mono">' + App.escapeHtml(tipoDocLabel(c.tipo_doc) + ' ' + c.serie + '-' + c.numero) + '</div></div>'
          + '<div><div class="text-xs" style="color: rgb(148 163 184);">Fecha</div><div>' + App.escapeHtml(c.fecha) + '</div></div>'
        + '</div>'
        + (c.observacion ? '<p class="text-xs" style="color: rgb(100 116 139); margin-bottom: 1rem;">' + App.escapeHtml(c.observacion) + '</p>' : '')
        + '<div class="table-wrap">'
          + '<table class="table-std">'
            + '<thead><tr><th>Producto</th><th style="text-align: right;">Cant.</th><th style="text-align: right;">Costo</th><th style="text-align: right;">Subtotal</th></tr></thead>'
            + '<tbody>'
            + c.items.map(function (it) {
              return '<tr>'
                + '<td><div style="font-size: 0.8125rem;">' + App.escapeHtml(it.descripcion) + '</div>'
                + '<div class="text-xs font-mono" style="color: rgb(148 163 184);">' + App.escapeHtml(it.codigo) + '</div></td>'
                + '<td class="text-right">' + App.fmtNumber(it.cantidad, 0) + '</td>'
                + '<td class="text-right text-xs">' + App.fmtMoney(it.costo_unitario) + '</td>'
                + '<td class="text-right font-semibold">' + App.fmtMoney(it.subtotal) + '</td>'
                + '</tr>';
            }).join('')
            + '</tbody>'
          + '</table>'
        + '</div>'
        + '<div style="display: flex; justify-content: flex-end; margin-top: 1rem; font-size: 1.125rem; font-weight: 800;">'
          + 'Total: ' + App.fmtMoney(c.total)
        + '</div>';

      return App.modalHTML({
        icono: 'receipt',
        titulo: 'Compra ' + App.escapeHtml(c.serie + '-' + c.numero),
        ancho: '40rem',
        cuerpo: cuerpo,
        footer: '<button type="button" data-modal-close class="btn-secondary">Cerrar</button>',
      });
    }

    _confirmHTML() {
      var c = this.eliminando;
      return App.confirmarHTML({
        titulo: 'Eliminar compra',
        mensaje: 'Se eliminará la compra <strong>' + App.escapeHtml(c.serie + '-' + c.numero) + '</strong> y se '
          + '<strong>descontará del stock</strong> lo que había sumado.<br><br>Queda registrado en el historial de inventario.',
      });
    }

    // ─── Eventos ────────────────────────────────────────────────
    _bind() {
      var self = this;

      if (this.vista === 'lista') {
        this.container.querySelector('#cp-nueva').addEventListener('click', function () {
          self.vista = 'nueva';
          self.form = self._formVacio();
          self.items = [];
          self._rerender();
        });

        this.container.querySelectorAll('[data-ver]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            self.viendo = App.DB.find('compras', btn.dataset.ver);
            self._rerender();
          });
        });
        this.container.querySelectorAll('[data-borrar]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            self.eliminando = App.DB.find('compras', btn.dataset.borrar);
            self._rerender();
          });
        });
      } else {
        this.container.querySelector('#cp-cancelar').addEventListener('click', function () {
          self.vista = 'lista';
          self._rerender();
        });
        this.container.querySelector('#cp-guardar').addEventListener('click', function () { self._guardar(); });
        this.container.querySelector('#cp-agregar').addEventListener('click', function () { self._abrirPicker(); });

        // Los campos de cabecera se guardan en el borrador conforme se escriben
        [['#c-proveedor', 'proveedor_id'], ['#c-tipo-doc', 'tipo_doc'], ['#c-serie', 'serie'],
         ['#c-numero', 'numero'], ['#c-fecha', 'fecha'], ['#c-observacion', 'observacion']].forEach(function (par) {
          var el = self.container.querySelector(par[0]);
          if (el) el.addEventListener('input', function (e) { self.form[par[1]] = e.target.value; });
        });

        this._bindItems();
      }

      if (this.viendo) {
        App.bindModal(this.container, function () { self.viendo = null; self._rerender(); });
      }

      if (this.eliminando) {
        App.bindModal(this.container, function () { self.eliminando = null; self._rerender(); });
        this.container.querySelector('[data-confirmar]').addEventListener('click', function () {
          App.DB.eliminarCompra(self.eliminando.id);
          self.eliminando = null;
          self._rerender();
        });
      }
    }

    _bindItems() {
      var self = this;

      this.container.querySelectorAll('[data-campo]').forEach(function (input) {
        input.addEventListener('input', function () {
          var idx = Number(input.dataset.idx);
          self.items[idx][input.dataset.campo] = input.value === '' ? 0 : Number(input.value);
          self._refrescarTotales();
        });
      });

      this.container.querySelectorAll('[data-quitar]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.items.splice(Number(btn.dataset.quitar), 1);
          self._refrescarItems();
        });
      });
    }

    /** Actualiza subtotales y total sin re-renderizar (no se pierde el foco). */
    _refrescarTotales() {
      var self = this;
      this.items.forEach(function (it, idx) {
        var celda = self.container.querySelector('[data-subtotal="' + idx + '"]');
        if (celda) celda.textContent = App.fmtMoney((Number(it.cantidad) || 0) * (Number(it.costo_unitario) || 0));
      });
      var total = this.container.querySelector('#cp-total');
      if (total) total.textContent = App.fmtMoney(this._total());
    }

    _refrescarItems() {
      this.container.querySelector('#cp-items').innerHTML = this._itemsHTML();
      App.refreshIcons();
      this._bindItems();
    }

    _abrirPicker() {
      var self = this;
      new App.ProductPicker({
        onSelect: function (p) {
          var existente = self.items.find(function (it) { return it.codigo === p.codigo; });
          if (existente) {
            existente.cantidad = Number(existente.cantidad) + 1;
          } else {
            self.items.push({
              producto_id: p.id,
              codigo: p.codigo,
              descripcion: p.descripcion,
              unidad: p.unidad,
              cantidad: 1,
              costo_unitario: Number(p.costo_unitario || 0),
            });
          }
          self._refrescarItems();
        },
      }).render(document.body);
    }

    _rerender() {
      this._renderHTML();
      this._bind();
    }

    _guardar() {
      var f = this.form;
      var proveedor = App.DB.find('proveedores', f.proveedor_id);

      var error = null;
      if (!proveedor) error = 'Selecciona un proveedor.';
      else if (!f.serie.trim()) error = 'Ingresa la serie del documento.';
      else if (!f.numero.trim()) error = 'Ingresa el número del documento.';
      else if (this.items.length === 0) error = 'Agrega al menos un producto.';
      else if (this.items.some(function (it) { return !(Number(it.cantidad) > 0); })) error = 'Todas las cantidades deben ser mayores a cero.';

      if (error) {
        var box = this.container.querySelector('#cp-error');
        box.textContent = error;
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      var items = this.items.map(function (it) {
        return Object.assign({}, it, {
          cantidad: Number(it.cantidad),
          costo_unitario: Number(it.costo_unitario),
          subtotal: Math.round(Number(it.cantidad) * Number(it.costo_unitario) * 100) / 100,
        });
      });

      App.DB.registrarCompra({
        fecha: f.fecha,
        proveedor_id: proveedor.id,
        proveedor_doc: proveedor.num_doc,
        proveedor: proveedor.razon_social,
        tipo_doc: f.tipo_doc,
        serie: f.serie.trim().toUpperCase(),
        numero: f.numero.trim(),
        moneda: 'PEN',
        items: items,
        total: Math.round(this._total() * 100) / 100,
        observacion: f.observacion.trim(),
        estado: 'registrada',
      });

      this.vista = 'lista';
      this.items = [];
      this._rerender();
    }
  };
})();
