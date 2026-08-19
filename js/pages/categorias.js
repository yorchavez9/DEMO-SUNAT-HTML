var App = window.App || (window.App = {});

/**
 * Categorías de productos. El producto guarda el NOMBRE de su categoría, así
 * que renombrar aquí arrastra el cambio a todos sus productos (lo hace
 * App.DB.guardarCategoria) y no se puede borrar una categoría que esté en uso.
 */
(function () {
  App.Categorias = class Categorias {
    constructor() {
      this.container = null;
      this.router = null;
      this.editando = null;    // categoría en edición (o {} si es nueva)
      this.eliminando = null;  // { categoria, productos }
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
            + '<div>'
              + '<h1 class="page-title" style="margin-bottom: 0.25rem;"><i data-lucide="tags" class="w-7 h-7"></i> Categorías</h1>'
              + '<p class="text-xs" style="color: rgb(100 116 139); margin-bottom: 1.5rem;">Agrupan los productos del catálogo.</p>'
            + '</div>'
            + '<button id="cat-nueva" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nueva categoría</button>'
          + '</div>'

          + '<div class="card" style="padding: 0;">'
            + '<div id="cat-tabla">' + this._tablaHTML() + '</div>'
          + '</div>'
        + '</div>'
        + (this.editando ? this._formHTML() : '')
        + (this.eliminando ? this._confirmHTML() : '');

      App.refreshIcons();
    }

    _tablaHTML() {
      var lista = App.DB.all('categorias');
      if (lista.length === 0) {
        return '<div style="padding: 3rem 1.5rem; text-align: center; color: rgb(148 163 184);">'
          + '<i data-lucide="tags" class="w-10 h-10" style="margin: 0 auto 0.75rem; display: block;"></i>'
          + '<div style="font-weight: 600; color: rgb(71 85 105);">Todavía no tienes categorías</div>'
          + '<p class="text-xs" style="margin-top: 0.5rem; line-height: 1.6; max-width: 26rem; margin-left: auto; margin-right: auto;">'
            + 'Créalas aquí y luego asígnalas al dar de alta un producto.'
          + '</p>'
          + '</div>';
      }

      var cuenta = App.DB.contarProductosPorCategoria();

      return ''
        + '<table class="table-std js-dt" data-dt-key="categorias" data-dt-buscar="Buscar categoría...">'
          + '<thead><tr>'
            + '<th>Categoría</th>'
            + '<th>Descripción</th>'
            + '<th style="text-align: right;">Productos</th>'
            + '<th style="width: 5.5rem;"></th>'
          + '</tr></thead>'
          + '<tbody>'
          + lista.map(function (c) {
            var n = cuenta[c.nombre] || 0;
            var inactiva = c.activo === false
              ? '<span class="badge" style="background: rgb(243 244 246); color: rgb(75 85 99); margin-left: 0.375rem;">Inactiva</span>'
              : '';
            // Sin productos se ve apagado: es una categoría que todavía no se usa
            var estilo = n > 0
              ? 'background: rgb(238 242 255); color: rgb(55 48 163);'
              : 'background: rgb(248 250 252); color: rgb(148 163 184);';

            return '<tr>'
              + '<td><div style="font-weight: 600;">' + App.escapeHtml(c.nombre) + inactiva + '</div></td>'
              + '<td class="text-xs" style="color: rgb(100 116 139);">' + App.escapeHtml(c.descripcion || '—') + '</td>'
              + '<td class="text-right" data-order="' + n + '">'
                + '<span class="badge" style="' + estilo + '">' + App.fmtNumber(n, 0) + '</span>'
              + '</td>'
              + '<td>'
                + '<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">'
                  + '<button data-editar="' + c.id + '" title="Editar" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(37 99 235); background: transparent; border: none; cursor: pointer;">'
                    + '<i data-lucide="pencil" class="w-4 h-4"></i></button>'
                  + '<button data-borrar="' + c.id + '" title="Eliminar" style="padding: 0.3rem; border-radius: 0.375rem; color: rgb(220 38 38); background: transparent; border: none; cursor: pointer;">'
                    + '<i data-lucide="trash-2" class="w-4 h-4"></i></button>'
                + '</div>'
              + '</td>'
              + '</tr>';
          }).join('')
          + '</tbody>'
        + '</table>';
    }

    _formHTML() {
      var c = this.editando;
      var esNueva = !c.id;
      var enUso = c.id ? (App.DB.contarProductosPorCategoria()[c.nombre] || 0) : 0;

      var cuerpo = ''
        + '<div id="cat-error" style="display: none; padding: 0.75rem; margin-bottom: 1rem; background: rgb(254 242 242); border-radius: 0.5rem; color: rgb(185 28 28); font-size: 0.875rem;"></div>'
        + '<div>'
          + '<label class="label">Nombre *</label>'
          + '<input id="f-nombre" class="input" value="' + App.escapeHtml(c.nombre || '') + '" placeholder="Fierro y Acero" />'
          + (enUso > 0
            ? '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">'
              + 'Si cambias el nombre se actualizará en los <strong>' + enUso + '</strong> producto' + (enUso === 1 ? '' : 's') + ' que la usan.</p>'
            : '')
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + '<label class="label">Descripción</label>'
          + '<input id="f-descripcion" class="input" value="' + App.escapeHtml(c.descripcion || '') + '" placeholder="Opcional" />'
        + '</div>'
        + '<div style="margin-top: 1rem;">'
          + '<label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); cursor: pointer;">'
            + '<input id="f-activo" type="checkbox" ' + (c.activo !== false ? 'checked' : '') + ' /> Activa'
          + '</label>'
          + '<p class="text-xs" style="color: rgb(100 116 139); margin-top: 0.25rem;">Las inactivas no aparecen al elegir la categoría de un producto.</p>'
        + '</div>';

      return App.modalHTML({
        icono: esNueva ? 'plus-circle' : 'pencil',
        titulo: esNueva ? 'Nueva categoría' : 'Editar categoría',
        ancho: '32rem',
        cuerpo: cuerpo,
        footer: ''
          + '<button type="button" data-modal-close class="btn-secondary">Cancelar</button>'
          + '<button type="button" id="cat-guardar" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar</button>',
      });
    }

    _confirmHTML() {
      var c = this.eliminando.categoria;
      var n = this.eliminando.productos;

      // Con productos dentro no se ofrece borrar: solo se explica por qué
      if (n > 0) {
        return App.modalHTML({
          icono: 'alert-triangle',
          titulo: 'No se puede eliminar',
          ancho: '30rem',
          cuerpo: '<p style="font-size: 0.875rem; color: rgb(51 65 85); line-height: 1.6;">'
            + '<strong>' + App.escapeHtml(c.nombre) + '</strong> la están usando <strong>' + n + '</strong> producto' + (n === 1 ? '' : 's') + '.'
            + '<br><br>Cámbiales la categoría desde <strong>Productos</strong>, o desactívala para que deje de ofrecerse sin perder el dato.'
            + '</p>',
          footer: '<button type="button" data-modal-close class="btn-secondary">Entendido</button>'
            + '<button type="button" data-confirmar class="btn-primary"><i data-lucide="eye-off" class="w-4 h-4"></i> Desactivar</button>',
        });
      }

      return App.confirmarHTML({
        titulo: 'Eliminar categoría',
        mensaje: '¿Seguro que quieres eliminar <strong>' + App.escapeHtml(c.nombre) + '</strong>?'
          + '<br><br>No la usa ningún producto.',
      });
    }

    // ─── Eventos ────────────────────────────────────────────────
    _bind() {
      var self = this;

      this.container.querySelector('#cat-nueva').addEventListener('click', function () {
        self.editando = { activo: true };
        self._rerender();
      });

      this._bindTabla();

      if (this.editando) {
        App.bindModal(this.container, function () { self.editando = null; self._rerender(); });
        this.container.querySelector('#cat-guardar').addEventListener('click', function () { self._guardar(); });
      }

      if (this.eliminando) {
        App.bindModal(this.container, function () { self.eliminando = null; self._rerender(); });
        var confirmar = this.container.querySelector('[data-confirmar]');
        if (confirmar) {
          confirmar.addEventListener('click', function () {
            if (self.eliminando.productos > 0) {
              // El botón de este caso desactiva, no borra
              App.DB.update('categorias', self.eliminando.categoria.id, { activo: false });
            } else {
              App.DB.eliminarCategoria(self.eliminando.categoria.id);
            }
            self.eliminando = null;
            self._rerender();
          });
        }
      }
    }

    /** Delegado en #cat-tabla: con paginación las demás filas no están en el DOM. */
    _bindTabla() {
      var self = this;
      var raiz = this.container.querySelector('#cat-tabla');

      App.delegarClick(raiz, '[data-editar]', function (btn) {
        self.editando = Object.assign({}, App.DB.find('categorias', btn.dataset.editar));
        self._rerender();
      });
      App.delegarClick(raiz, '[data-borrar]', function (btn) {
        var cat = App.DB.find('categorias', btn.dataset.borrar);
        if (!cat) return;
        self.eliminando = {
          categoria: cat,
          productos: App.DB.contarProductosPorCategoria()[cat.nombre] || 0,
        };
        self._rerender();
      });
    }

    _rerender() {
      this._renderHTML();
      this._bind();
    }

    _guardar() {
      var c = this.container;
      var idActual = this.editando.id;
      var nombre = c.querySelector('#f-nombre').value.trim();

      var error = null;
      if (!nombre) {
        error = 'El nombre es obligatorio.';
      } else {
        var repetida = App.DB.all('categorias').find(function (x) {
          return x.nombre.toLowerCase() === nombre.toLowerCase() && String(x.id) !== String(idActual);
        });
        if (repetida) error = 'Ya existe una categoría llamada ' + repetida.nombre + '.';
      }

      if (error) {
        var box = c.querySelector('#cat-error');
        box.textContent = error;
        box.style.display = 'block';
        return;
      }

      App.DB.guardarCategoria({
        nombre: nombre,
        descripcion: c.querySelector('#f-descripcion').value.trim(),
        activo: c.querySelector('#f-activo').checked,
      }, idActual);

      this.editando = null;
      this._rerender();
    }
  };
})();
