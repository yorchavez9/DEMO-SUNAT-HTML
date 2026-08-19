var App = window.App || (window.App = {});

(function () {
  var AFECTACIONES = [
    { cod: '10', label: '10 — Gravado (IGV 18%)' },
    { cod: '20', label: '20 — Exonerado' },
    { cod: '30', label: '30 — Inafecto' },
    { cod: '40', label: '40 — Exportación' },
  ];

  function unidadSym(cod) {
    var u = (App.SUNAT_UNITS || []).find(function (x) { return x.cod === cod; });
    return u ? u.sym : cod;
  }

  App.Productos = class Productos {
    constructor() {
      this.container = null;
      this.router = null;
      this.editando = null;   // producto en edición (o {} si es nuevo)
      this.eliminando = null; // producto pendiente de confirmar borrado
    }

    render(container, router) {
      this.container = container;
      this.router = router;
      this._renderHTML();
      this._bind();
    }

    // ─── Render ─────────────────────────────────────────────────
    _renderHTML() {
      this.container.innerHTML = ''
        + '<div>'
          + '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
            + '<h1 class="page-title"><i data-lucide="package" class="w-7 h-7"></i> Productos</h1>'
            + '<button id="pr-nuevo" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nuevo producto</button>'
          + '</div>'

          + '<div class="card" style="padding: 0;">'
            + '<div id="pr-tabla">' + this._tablaHTML() + '</div>'
          + '</div>'
        + '</div>'
        + (this.editando ? this._formHTML() : '')
        + (this.eliminando ? this._confirmHTML() : '');

      App.refreshIcons();
    }

    _tablaHTML() {
      var lista = App.DB.all('productos');
      if (lista.length === 0) {
        return '<div style="padding: 3rem 1.5rem; text-align: center; color: rgb(148 163 184);">'
          + '<i data-lucide="package-plus" class="w-10 h-10" style="margin: 0 auto 0.75rem; display: block;"></i>'
          + '<div style="font-weight: 600; color: rgb(71 85 105);">Todavía no tienes productos</div>'
          + '<p class="text-xs" style="margin-top: 0.5rem; line-height: 1.6; max-width: 26rem; margin-left: auto; margin-right: auto;">'
            + 'Crea el primero con <strong>Nuevo producto</strong>. Si ya tienes un respaldo, '
            + 'impórtalo desde <strong>Configuración → Sistema</strong>.'
          + '</p>'
          + '</div>';
      }

      return ''
        + '<table class="table-std js-dt" data-dt-key="productos" data-dt-buscar="Buscar producto, código o categoría...">'
          + '<thead><tr>'
            + '<th>Código</th><th>Descripción</th><th>Und</th>'
            + '<th style="text-align: right;">Precio</th>'
            + '<th style="text-align: right;">Costo</th>'
            + '<th style="text-align: right;">Stock</th>'
            + '<th style="width: 5.5rem;"></th>'
          + '</tr></thead>'
          + '<tbody>' + lista.map(this._filaHTML).join('') + '</tbody>'
        + '</table>';
    }

    _filaHTML(p) {
      var sinStock = p.controla_stock !== false && Number(p.stock || 0) <= 0;
      var bajo = p.controla_stock !== false && !sinStock && Number(p.stock || 0) <= Number(p.stock_min || 0);
      var stockHTML = p.controla_stock === false
        ? '<span style="color: rgb(148 163 184);">—</span>'
        : '<span class="badge" style="' + (sinStock
            ? 'background: rgb(254 226 226); color: rgb(153 27 27);'
            : bajo
              ? 'background: rgb(255 237 213); color: rgb(154 52 18);'
              : 'background: rgb(240 253 244); color: rgb(22 101 52);') + '">'
          + App.fmtNumber(p.stock, 0)
          + '</span>';

      var inactivo = p.activo === false
        ? '<span class="badge" style="background: rgb(243 244 246); color: rgb(75 85 99); margin-left: 0.375rem;">Inactivo</span>'
        : '';

      var exonerado = p.tip_afe_igv !== '10'
        ? '<span class="badge" style="background: rgb(238 242 255); color: rgb(55 48 163); margin-left: 0.375rem;">Afect. ' + App.escapeHtml(p.tip_afe_igv) + '</span>'
        : '';

      // data-order lleva el valor crudo: si no, "S/ 1,200.00" se ordenaría
      // como texto y 1,200 quedaría antes que 900
      return '<tr>'
        + '<td class="font-mono text-xs">' + App.escapeHtml(p.codigo) + '</td>'
        + '<td>'
          + '<div style="font-weight: 600;">' + App.escapeHtml(p.descripcion) + inactivo + exonerado + '</div>'
          + '<div class="text-xs" style="color: rgb(148 163 184);">' + App.escapeHtml(p.categoria || '—') + '</div>'
        + '</td>'
        + '<td class="text-xs">' + App.escapeHtml(unidadSym(p.unidad)) + '</td>'
        + '<td class="text-right font-semibold" data-order="' + Number(p.precio_unitario || 0) + '">' + App.fmtMoney(p.precio_unitario) + '</td>'
        + '<td class="text-right text-xs" style="color: rgb(100 116 139);" data-order="' + Number(p.costo_unitario || 0) + '">' + App.fmtMoney(p.costo_unitario) + '</td>'
        + '<td class="text-right" data-order="' + (p.controla_stock === false ? -1 : Number(p.stock || 0)) + '">' + stockHTML + '</td>'
        + '<td>'
          + '<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">'
            + '<button data-editar="' + p.id + '" title="Editar" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(37 99 235); background: transparent; border: none; cursor: pointer;">'
              + '<i data-lucide="pencil" class="w-4 h-4"></i></button>'
            + '<button data-borrar="' + p.id + '" title="Eliminar" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(220 38 38); background: transparent; border: none; cursor: pointer;">'
              + '<i data-lucide="trash-2" class="w-4 h-4"></i></button>'
          + '</div>'
        + '</td>'
        + '</tr>';
    }

    /**
     * Opciones del selector de categoría: las activas, más la que el producto
     * ya tenga aunque esté inactiva o ya no exista en el catálogo. Sin esto,
     * editar un producto de una categoría desactivada la borraría en silencio.
     */
    _opcionesCategoria(actual) {
      var nombres = App.DB.categoriasActivas().map(function (c) { return c.nombre; });
      if (actual && nombres.indexOf(actual) === -1) nombres.unshift(actual);

      return '<option value="">— Sin categoría —</option>'
        + nombres.map(function (n) {
          return '<option value="' + App.escapeHtml(n) + '"' + (n === actual ? ' selected' : '') + '>'
            + App.escapeHtml(n) + '</option>';
        }).join('');
    }

    _formHTML() {
      var p = this.editando;
      var esNuevo = !p.id;
      var hayCategorias = App.DB.all('categorias').length > 0;

      function campo(label, inputHTML, ayuda) {
        return '<div>'
          + '<label class="label">' + label + '</label>'
          + inputHTML
          + (ayuda ? '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">' + ayuda + '</p>' : '')
          + '</div>';
      }

      var cuerpo = ''
        + '<div id="pr-error" style="display: none; padding: 0.75rem; margin-bottom: 1rem; background: rgb(254 242 242); border-radius: 0.5rem; color: rgb(185 28 28); font-size: 0.875rem;"></div>'
        + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem;">'
          + campo('Código interno *', '<input id="f-codigo" class="input font-mono" value="' + App.escapeHtml(p.codigo || '') + '" placeholder="P052" />')
          + campo('Código SUNAT', '<input id="f-cod-sunat" class="input font-mono" value="' + App.escapeHtml(p.cod_producto_sunat || '') + '" placeholder="31161601" />')
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + campo('Descripción *', '<input id="f-descripcion" class="input" value="' + App.escapeHtml(p.descripcion || '') + '" placeholder="CLAVO PARA MADERA 3\" (KILO)" />')
        + '</div>'
        + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-top: 0.875rem;">'
          + campo('Categoría',
              '<select id="f-categoria" class="input js-select" data-search="true" data-clearable="true"'
              + ' data-placeholder="Sin categoría" data-search-placeholder="Buscar categoría...">'
              + this._opcionesCategoria(p.categoria || '')
              + '</select>',
              hayCategorias ? '' : 'Todavía no hay categorías. Créalas en <strong>Gestión → Categorías</strong>.')
          + campo('Unidad de medida',
              '<select id="f-unidad" class="input js-select" data-search="true" data-search-placeholder="Buscar unidad...">'
              + (App.SUNAT_UNITS || []).map(function (u) {
                return '<option value="' + u.cod + '"' + (u.cod === (p.unidad || 'NIU') ? ' selected' : '') + '>' + u.cod + ' — ' + u.desc + '</option>';
              }).join('')
              + '</select>')
        + '</div>'
        + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-top: 0.875rem;">'
          + campo('Precio de venta (S/) *', '<input id="f-precio" type="number" min="0" step="0.01" class="input text-right" value="' + (p.precio_unitario != null ? p.precio_unitario : '') + '" />')
          + campo('Costo de compra (S/)', '<input id="f-costo" type="number" min="0" step="0.01" class="input text-right" value="' + (p.costo_unitario != null ? p.costo_unitario : 0) + '" />')
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + campo('Afectación al IGV',
              '<select id="f-afectacion" class="input js-select">'
              + AFECTACIONES.map(function (a) {
                return '<option value="' + a.cod + '"' + (a.cod === (p.tip_afe_igv || '10') ? ' selected' : '') + '>' + a.label + '</option>';
              }).join('')
              + '</select>')
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + campo('ICBPER por unidad (S/)', '<input id="f-icbper" type="number" min="0" step="0.01" class="input text-right" value="' + (p.icbper != null ? p.icbper : '') + '" placeholder="Vacío si no aplica" />',
              'Solo para bolsas plásticas. Si lo dejas vacío el producto no lleva ICBPER.')
        + '</div>'

        + '<div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgb(241 245 249);">'
          + '<label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); cursor: pointer;">'
            + '<input id="f-controla-stock" type="checkbox" ' + (p.controla_stock !== false ? 'checked' : '') + ' /> Controlar stock de este producto'
          + '</label>'
          + '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">Desactívalo para servicios (alquileres, corte, transporte).</p>'
          + '<div id="f-stock-campos" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-top: 0.875rem;">'
            + campo(esNuevo ? 'Stock inicial' : 'Stock actual', '<input id="f-stock" type="number" step="1" class="input text-right" value="' + (p.stock != null ? p.stock : 0) + '" />',
                esNuevo ? 'Se registrará como movimiento de entrada.' : 'Si lo cambias se registra un ajuste de inventario.')
            + campo('Stock mínimo', '<input id="f-stock-min" type="number" min="0" step="1" class="input text-right" value="' + (p.stock_min != null ? p.stock_min : 0) + '" />', 'Debajo de este valor se marca en alerta.')
          + '</div>'
        + '</div>'

        + '<div style="margin-top: 1rem;">'
          + '<label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); cursor: pointer;">'
            + '<input id="f-activo" type="checkbox" ' + (p.activo !== false ? 'checked' : '') + ' /> Producto activo (aparece al emitir comprobantes)'
          + '</label>'
        + '</div>';

      return App.modalHTML({
        icono: esNuevo ? 'plus-circle' : 'pencil',
        titulo: esNuevo ? 'Nuevo producto' : 'Editar producto',
        subtitulo: esNuevo ? 'Se agrega al catálogo de la ferretería' : App.escapeHtml(p.codigo),
        ancho: '40rem',
        cuerpo: cuerpo,
        footer: ''
          + '<button type="button" data-modal-close class="btn-secondary">Cancelar</button>'
          + '<button type="button" id="pr-guardar" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar</button>',
      });
    }

    _confirmHTML() {
      var p = this.eliminando;
      return App.confirmarHTML({
        titulo: 'Eliminar producto',
        mensaje: '¿Seguro que quieres eliminar <strong>' + App.escapeHtml(p.descripcion) + '</strong> (' + App.escapeHtml(p.codigo) + ')?'
          + '<br><br>Sus movimientos de inventario se conservan en el historial.',
      });
    }

    // ─── Eventos ────────────────────────────────────────────────
    _bind() {
      var self = this;

      this.container.querySelector('#pr-nuevo').addEventListener('click', function () {
        self.editando = { activo: true, controla_stock: true, tip_afe_igv: '10', unidad: 'NIU', stock: 0, stock_min: 0, costo_unitario: 0 };
        self._rerender();
      });

      this._bindTabla();

      if (this.editando) {
        App.bindModal(this.container, function () { self.editando = null; self._rerender(); });
        this.container.querySelector('#pr-guardar').addEventListener('click', function () { self._guardar(); });
        var chk = this.container.querySelector('#f-controla-stock');
        var campos = this.container.querySelector('#f-stock-campos');
        chk.addEventListener('change', function () { campos.style.display = chk.checked ? 'grid' : 'none'; });
        campos.style.display = chk.checked ? 'grid' : 'none';
      }

      if (this.eliminando) {
        App.bindModal(this.container, function () { self.eliminando = null; self._rerender(); });
        this.container.querySelector('[data-confirmar]').addEventListener('click', function () {
          App.DB.remove('productos', self.eliminando.id);
          self.eliminando = null;
          self._rerender();
        });
      }
    }

    /**
     * Clic delegado: con la tabla paginada, las filas de la página 2 en
     * adelante no están en el DOM, así que no se les puede enganchar un
     * listener directo.
     */
    _bindTabla() {
      var self = this;
      // Se delega en #pr-tabla, que se recrea en cada render: así los
      // listeners mueren con él y no se acumulan.
      var raiz = this.container.querySelector('#pr-tabla');
      App.delegarClick(raiz, '[data-editar]', function (btn) {
        self.editando = Object.assign({}, App.DB.find('productos', btn.dataset.editar));
        self._rerender();
      });
      App.delegarClick(raiz, '[data-borrar]', function (btn) {
        self.eliminando = App.DB.find('productos', btn.dataset.borrar);
        self._rerender();
      });
    }

    /** Re-render completo. */
    _rerender() {
      this._renderHTML();
      this._bind();
    }

    _guardar() {
      var c = this.container;
      var val = function (sel) { return c.querySelector(sel).value.trim(); };
      var num = function (sel) { var v = c.querySelector(sel).value; return v === '' ? null : Number(v); };

      var idActual = this.editando.id;
      var codigo = val('#f-codigo').toUpperCase();
      var descripcion = val('#f-descripcion');
      var precio = num('#f-precio');

      var error = null;
      if (!codigo) error = 'El código interno es obligatorio.';
      else if (!descripcion) error = 'La descripción es obligatoria.';
      else if (precio == null || precio < 0) error = 'Ingresa un precio de venta válido.';
      else {
        var repetido = App.DB.all('productos').find(function (p) {
          return p.codigo === codigo && String(p.id) !== String(idActual);
        });
        if (repetido) error = 'Ya existe otro producto con el código ' + codigo + '.';
      }

      if (error) {
        var box = c.querySelector('#pr-error');
        box.textContent = error;
        box.style.display = 'block';
        return;
      }

      var controlaStock = c.querySelector('#f-controla-stock').checked;
      var icbper = num('#f-icbper');

      var datos = {
        codigo: codigo,
        cod_producto_sunat: val('#f-cod-sunat'),
        descripcion: descripcion,
        categoria: val('#f-categoria'),
        unidad: c.querySelector('#f-unidad').value,
        precio_unitario: precio,
        costo_unitario: num('#f-costo') || 0,
        tip_afe_igv: c.querySelector('#f-afectacion').value,
        icbper: icbper,
        factor_icbper: icbper,
        controla_stock: controlaStock,
        stock_min: controlaStock ? (num('#f-stock-min') || 0) : null,
        activo: c.querySelector('#f-activo').checked,
      };

      var stockPedido = controlaStock ? (num('#f-stock') || 0) : null;

      if (!this.editando.id) {
        var creado = App.DB.insert('productos', Object.assign({}, datos, { stock: controlaStock ? 0 : null }));
        if (controlaStock && stockPedido > 0) {
          App.DB.movimiento({
            tipo: 'entrada', producto_id: creado.id, cantidad: stockPedido,
            costo_unitario: datos.costo_unitario, motivo: 'Stock inicial',
          });
        }
      } else {
        var actual = App.DB.find('productos', this.editando.id);
        var stockPrevio = Number(actual.stock || 0);
        App.DB.update('productos', actual.id, Object.assign({}, datos, {
          stock: controlaStock ? stockPrevio : null,
        }));
        var diferencia = controlaStock ? stockPedido - stockPrevio : 0;
        if (diferencia !== 0) {
          App.DB.movimiento({
            tipo: 'ajuste', producto_id: actual.id, cantidad: diferencia,
            costo_unitario: datos.costo_unitario, motivo: 'Ajuste manual desde Productos',
          });
        }
      }

      this.editando = null;
      this._rerender();
    }
  };
})();
