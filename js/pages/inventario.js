var App = window.App || (window.App = {});

/**
 * Inventario: stock actual por producto, alertas de stock mínimo, ajustes
 * manuales e historial de movimientos (entradas por compra, salidas por venta
 * y ajustes).
 */
(function () {
  var TIPO_MOV = {
    entrada: { label: 'Entrada', style: 'background: rgb(220 252 231); color: rgb(22 101 52);', icono: 'arrow-down-to-line' },
    salida:  { label: 'Salida',  style: 'background: rgb(254 226 226); color: rgb(153 27 27);', icono: 'arrow-up-from-line' },
    ajuste:  { label: 'Ajuste',  style: 'background: rgb(255 237 213); color: rgb(154 52 18);', icono: 'sliders-horizontal' },
  };

  App.Inventario = class Inventario {
    constructor() {
      this.container = null;
      this.router = null;
      this.q = '';
      this.filtro = 'todos'; // todos | bajo | sin
      this.ajustando = null; // producto sobre el que se hace el ajuste
      this.historialDe = null;
    }

    render(container, router) {
      this.container = container;
      this.router = router;
      this._renderHTML();
      this._bind();
    }

    _filtrados() {
      var q = this.q.toLowerCase().trim();
      var filtro = this.filtro;
      return App.DB.all('productos').filter(function (p) {
        if (p.controla_stock === false) return false;
        var stock = Number(p.stock || 0);
        if (filtro === 'bajo' && !(stock > 0 && stock <= Number(p.stock_min || 0))) return false;
        if (filtro === 'sin' && stock > 0) return false;
        if (!q) return true;
        return p.descripcion.toLowerCase().includes(q)
          || p.codigo.toLowerCase().includes(q)
          || (p.categoria || '').toLowerCase().includes(q);
      });
    }

    // ─── Render ─────────────────────────────────────────────────
    _renderHTML() {
      this.container.innerHTML = ''
        + '<div>'
          + '<h1 class="page-title"><i data-lucide="warehouse" class="w-7 h-7"></i> Inventario</h1>'
          + this._kpisHTML()

          + '<div class="card" style="margin-bottom: 1rem;">'
            + '<div style="display: grid; grid-template-columns: 1fr; gap: 0.75rem;" class="inv-grid">'
              + '<div>'
                + '<label class="label">Buscar</label>'
                + '<input id="in-buscar" class="input" placeholder="Producto, código o categoría..." value="' + App.escapeHtml(this.q) + '" />'
              + '</div>'
              + '<div>'
                + '<label class="label">Mostrar</label>'
                + '<select id="in-filtro" class="input js-select">'
                  + '<option value="todos">Todos los productos</option>'
                  + '<option value="bajo">Solo bajo stock mínimo</option>'
                  + '<option value="sin">Solo sin stock</option>'
                + '</select>'
              + '</div>'
            + '</div>'
            + '<style>@media (min-width: 768px) { .inv-grid { grid-template-columns: 2fr 1fr !important; } }</style>'
          + '</div>'

          + '<div class="card" style="padding: 0; margin-bottom: 1.5rem;">'
            + '<div id="in-tabla">' + this._tablaHTML() + '</div>'
          + '</div>'

          + '<h2 class="section-title"><i data-lucide="history" class="w-5 h-5"></i> Últimos movimientos</h2>'
          + '<div class="card" style="padding: 0;">' + this._movimientosHTML() + '</div>'
        + '</div>'
        + (this.ajustando ? this._ajusteHTML() : '')
        + (this.historialDe ? this._historialHTML() : '');

      var sel = this.container.querySelector('#in-filtro');
      if (sel) sel.value = this.filtro;

      App.refreshIcons();
    }

    _kpisHTML() {
      var conStock = App.DB.all('productos').filter(function (p) { return p.controla_stock !== false; });
      var bajo = conStock.filter(function (p) { var s = Number(p.stock || 0); return s > 0 && s <= Number(p.stock_min || 0); });
      var sin = conStock.filter(function (p) { return Number(p.stock || 0) <= 0; });

      function kpi(icono, color, fondo, label, valor) {
        return '<div class="card" style="display: flex; align-items: center; gap: 0.75rem;">'
          + '<span style="width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: ' + fondo + '; color: ' + color + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">'
            + '<i data-lucide="' + icono + '" class="w-5 h-5"></i>'
          + '</span>'
          + '<div style="min-width: 0;">'
            + '<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(100 116 139);">' + label + '</div>'
            + '<div style="font-size: 1.25rem; font-weight: 800; white-space: nowrap;">' + valor + '</div>'
          + '</div>'
        + '</div>';
      }

      return ''
        + '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;" class="kpi-inv">'
          + kpi('package', 'rgb(37 99 235)', 'rgb(219 234 254)', 'Productos', App.fmtNumber(conStock.length, 0))
          + kpi('coins', 'rgb(22 163 74)', 'rgb(220 252 231)', 'Valor inventario', App.fmtMoney(App.DB.valorInventario()))
          + kpi('alert-triangle', 'rgb(194 65 12)', 'rgb(255 237 213)', 'Bajo mínimo', App.fmtNumber(bajo.length, 0))
          + kpi('package-x', 'rgb(185 28 28)', 'rgb(254 226 226)', 'Sin stock', App.fmtNumber(sin.length, 0))
        + '</div>'
        + '<style>@media (min-width: 768px) { .kpi-inv { grid-template-columns: repeat(4, 1fr) !important; } }</style>';
    }

    _tablaHTML() {
      var lista = this._filtrados();
      if (lista.length === 0) {
        var sinProductos = App.DB.all('productos').length === 0;
        return '<div style="padding: 3rem 1.5rem; text-align: center; color: rgb(148 163 184);">'
          + '<i data-lucide="' + (sinProductos ? 'package-plus' : 'package-search') + '" class="w-10 h-10" style="margin: 0 auto 0.75rem; display: block;"></i>'
          + (sinProductos
            ? '<div style="font-weight: 600; color: rgb(71 85 105);">Todavía no hay productos que controlen stock</div>'
              + '<p class="text-xs" style="margin-top: 0.5rem;">Crea productos desde <strong>Productos</strong> y aparecerán aquí.</p>'
            : 'No hay productos que coincidan con el filtro.')
          + '</div>';
      }

      return ''
        + '<div class="table-wrap">'
          + '<table class="table-std">'
            + '<thead><tr>'
              + '<th>Producto</th>'
              + '<th style="text-align: right;">Stock</th>'
              + '<th style="text-align: right;">Mínimo</th>'
              + '<th style="text-align: right;">Costo</th>'
              + '<th style="text-align: right;">Valorizado</th>'
              + '<th style="width: 5.5rem;"></th>'
            + '</tr></thead>'
            + '<tbody>'
            + lista.map(function (p) {
              var stock = Number(p.stock || 0);
              var min = Number(p.stock_min || 0);
              var estilo = stock <= 0
                ? 'background: rgb(254 226 226); color: rgb(153 27 27);'
                : stock <= min
                  ? 'background: rgb(255 237 213); color: rgb(154 52 18);'
                  : 'background: rgb(240 253 244); color: rgb(22 101 52);';
              return '<tr>'
                + '<td>'
                  + '<div style="font-weight: 600; font-size: 0.8125rem;">' + App.escapeHtml(p.descripcion) + '</div>'
                  + '<div class="text-xs" style="color: rgb(148 163 184);">'
                    + '<span class="font-mono">' + App.escapeHtml(p.codigo) + '</span> · ' + App.escapeHtml(p.categoria || '—')
                  + '</div>'
                + '</td>'
                + '<td class="text-right"><span class="badge" style="' + estilo + '">' + App.fmtNumber(stock, 0) + '</span></td>'
                + '<td class="text-right text-xs" style="color: rgb(100 116 139);">' + App.fmtNumber(min, 0) + '</td>'
                + '<td class="text-right text-xs" style="color: rgb(100 116 139);">' + App.fmtMoney(p.costo_unitario) + '</td>'
                + '<td class="text-right font-semibold">' + App.fmtMoney(stock * Number(p.costo_unitario || 0)) + '</td>'
                + '<td>'
                  + '<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">'
                    + '<button data-ajustar="' + p.id + '" title="Registrar movimiento" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(37 99 235); background: transparent; border: none; cursor: pointer;">'
                      + '<i data-lucide="sliders-horizontal" class="w-4 h-4"></i></button>'
                    + '<button data-historial="' + p.id + '" title="Ver movimientos" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(100 116 139); background: transparent; border: none; cursor: pointer;">'
                      + '<i data-lucide="history" class="w-4 h-4"></i></button>'
                  + '</div>'
                + '</td>'
                + '</tr>';
            }).join('')
            + '</tbody>'
          + '</table>'
        + '</div>';
    }

    _movimientosHTML() {
      var movs = App.DB.all('inventario').slice().sort(function (a, b) {
        return String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id;
      }).slice(0, 40);

      if (movs.length === 0) {
        return '<div style="padding: 2.5rem 1rem; text-align: center; color: rgb(148 163 184);">Sin movimientos registrados.</div>';
      }

      return ''
        + '<div class="table-wrap">'
          + '<table class="table-std">'
            + '<thead><tr>'
              + '<th>Fecha</th><th>Tipo</th><th>Producto</th>'
              + '<th style="text-align: right;">Cantidad</th><th>Motivo</th>'
            + '</tr></thead>'
            + '<tbody>'
            + movs.map(function (m) {
              var meta = TIPO_MOV[m.tipo] || TIPO_MOV.ajuste;
              var cant = Number(m.cantidad);
              return '<tr>'
                + '<td class="text-xs">' + App.escapeHtml(m.fecha) + '</td>'
                + '<td><span class="badge" style="' + meta.style + '">' + meta.label + '</span></td>'
                + '<td>'
                  + '<div style="font-size: 0.8125rem;">' + App.escapeHtml(m.descripcion) + '</div>'
                  + '<div class="text-xs font-mono" style="color: rgb(148 163 184);">' + App.escapeHtml(m.codigo) + '</div>'
                + '</td>'
                + '<td class="text-right font-semibold" style="color: ' + (cant >= 0 ? 'rgb(22 163 74)' : 'rgb(220 38 38)') + ';">'
                  + (cant >= 0 ? '+' : '') + App.fmtNumber(cant, 0)
                + '</td>'
                + '<td class="text-xs" style="color: rgb(100 116 139);">' + App.escapeHtml(m.motivo || '—') + '</td>'
                + '</tr>';
            }).join('')
            + '</tbody>'
          + '</table>'
        + '</div>';
    }

    _ajusteHTML() {
      var p = this.ajustando;
      var cuerpo = ''
        + '<div id="in-error" style="display: none; padding: 0.75rem; margin-bottom: 1rem; background: rgb(254 242 242); border-radius: 0.5rem; color: rgb(185 28 28); font-size: 0.875rem;"></div>'
        + '<div style="padding: 0.75rem; background: rgb(248 250 252); border-radius: 0.5rem; margin-bottom: 1rem;">'
          + '<div style="font-weight: 600; font-size: 0.875rem;">' + App.escapeHtml(p.descripcion) + '</div>'
          + '<div class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">'
            + 'Stock actual: <strong>' + App.fmtNumber(p.stock, 0) + '</strong> · Mínimo: ' + App.fmtNumber(p.stock_min, 0)
          + '</div>'
        + '</div>'
        + '<div>'
          + '<label class="label">Tipo de movimiento</label>'
          + '<select id="a-tipo" class="input js-select">'
            + '<option value="entrada">Entrada (suma stock)</option>'
            + '<option value="salida">Salida (resta stock)</option>'
            + '<option value="ajuste">Ajuste por inventario físico</option>'
          + '</select>'
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + '<label class="label">Cantidad *</label>'
          + '<input id="a-cantidad" type="number" min="0" step="1" class="input text-right" placeholder="0" />'
          + '<p id="a-ayuda" class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">Se sumará al stock actual.</p>'
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + '<label class="label">Motivo *</label>'
          + '<input id="a-motivo" class="input" placeholder="Ej: merma, devolución, conteo físico" />'
        + '</div>';

      return App.modalHTML({
        icono: 'sliders-horizontal',
        titulo: 'Movimiento de inventario',
        ancho: '30rem',
        cuerpo: cuerpo,
        footer: ''
          + '<button type="button" data-modal-close class="btn-secondary">Cancelar</button>'
          + '<button type="button" id="in-guardar" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Registrar</button>',
      });
    }

    _historialHTML() {
      var p = this.historialDe;
      var movs = App.DB.movimientosDe(p.codigo).slice().sort(function (a, b) {
        return String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id;
      });

      var cuerpo = movs.length === 0
        ? '<p style="color: rgb(148 163 184); text-align: center; padding: 1.5rem 0;">Este producto todavía no tiene movimientos.</p>'
        : '<div class="table-wrap"><table class="table-std">'
            + '<thead><tr><th>Fecha</th><th>Tipo</th><th style="text-align: right;">Cant.</th><th>Motivo</th></tr></thead>'
            + '<tbody>'
            + movs.map(function (m) {
              var meta = TIPO_MOV[m.tipo] || TIPO_MOV.ajuste;
              var cant = Number(m.cantidad);
              return '<tr>'
                + '<td class="text-xs">' + App.escapeHtml(m.fecha) + '</td>'
                + '<td><span class="badge" style="' + meta.style + '">' + meta.label + '</span></td>'
                + '<td class="text-right font-semibold" style="color: ' + (cant >= 0 ? 'rgb(22 163 74)' : 'rgb(220 38 38)') + ';">'
                  + (cant >= 0 ? '+' : '') + App.fmtNumber(cant, 0) + '</td>'
                + '<td class="text-xs" style="color: rgb(100 116 139);">' + App.escapeHtml(m.motivo || '—') + '</td>'
                + '</tr>';
            }).join('')
            + '</tbody></table></div>';

      return App.modalHTML({
        icono: 'history',
        titulo: 'Movimientos',
        subtitulo: App.escapeHtml(p.codigo + ' · ' + p.descripcion),
        ancho: '38rem',
        cuerpo: cuerpo,
        footer: '<button type="button" data-modal-close class="btn-secondary">Cerrar</button>',
      });
    }

    // ─── Eventos ────────────────────────────────────────────────
    _bind() {
      var self = this;

      this.container.querySelector('#in-buscar').addEventListener('input', function (e) {
        self.q = e.target.value;
        self._refrescarTabla();
      });

      this.container.querySelector('#in-filtro').addEventListener('change', function (e) {
        self.filtro = e.target.value;
        self._refrescarTabla();
      });

      this._bindTabla();

      if (this.ajustando) {
        App.bindModal(this.container, function () { self.ajustando = null; self._rerender(); });
        this.container.querySelector('#in-guardar').addEventListener('click', function () { self._guardarMovimiento(); });

        var tipo = this.container.querySelector('#a-tipo');
        var ayuda = this.container.querySelector('#a-ayuda');
        tipo.addEventListener('change', function () {
          ayuda.textContent = tipo.value === 'entrada' ? 'Se sumará al stock actual.'
            : tipo.value === 'salida' ? 'Se restará del stock actual.'
            : 'El stock quedará exactamente en la cantidad que indiques.';
        });
      }

      if (this.historialDe) {
        App.bindModal(this.container, function () { self.historialDe = null; self._rerender(); });
      }
    }

    _bindTabla() {
      var self = this;
      this.container.querySelectorAll('[data-ajustar]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.ajustando = App.DB.find('productos', btn.dataset.ajustar);
          self._rerender();
        });
      });
      this.container.querySelectorAll('[data-historial]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.historialDe = App.DB.find('productos', btn.dataset.historial);
          self._rerender();
        });
      });
    }

    _refrescarTabla() {
      this.container.querySelector('#in-tabla').innerHTML = this._tablaHTML();
      App.refreshIcons();
      this._bindTabla();
    }

    _rerender() {
      this._renderHTML();
      this._bind();
    }

    _guardarMovimiento() {
      var c = this.container;
      var tipo = c.querySelector('#a-tipo').value;
      var cantidad = Number(c.querySelector('#a-cantidad').value);
      var motivo = c.querySelector('#a-motivo').value.trim();

      var error = null;
      if (!(cantidad >= 0) || c.querySelector('#a-cantidad').value === '') error = 'Ingresa una cantidad válida.';
      else if (tipo !== 'ajuste' && cantidad <= 0) error = 'La cantidad debe ser mayor a cero.';
      else if (!motivo) error = 'Indica el motivo del movimiento.';

      if (error) {
        var box = c.querySelector('#in-error');
        box.textContent = error;
        box.style.display = 'block';
        return;
      }

      var p = this.ajustando;
      // En "ajuste" la cantidad es el stock final que debe quedar; en los otros
      // tipos es cuánto entra o sale.
      var delta = tipo === 'entrada' ? cantidad
        : tipo === 'salida' ? -cantidad
        : cantidad - Number(p.stock || 0);

      if (delta !== 0) {
        App.DB.movimiento({
          tipo: tipo,
          producto_id: p.id,
          cantidad: delta,
          costo_unitario: p.costo_unitario,
          motivo: motivo,
        });
      }

      this.ajustando = null;
      this._rerender();
    }
  };
})();
