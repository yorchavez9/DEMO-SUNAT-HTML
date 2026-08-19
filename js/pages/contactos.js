var App = window.App || (window.App = {});

/**
 * Pantalla de gestión de contactos. Clientes y proveedores comparten la misma
 * ficha (tipo de documento, número, razón social, dirección, contacto), así que
 * ambas rutas usan esta clase con distinta colección.
 */
(function () {
  var TIPOS_DOC = [
    { cod: '6', label: 'RUC' },
    { cod: '1', label: 'DNI' },
    { cod: '4', label: 'Carnet de extranjería' },
    { cod: '7', label: 'Pasaporte' },
    { cod: '0', label: 'Otros' },
  ];

  var CONFIG = {
    clientes: {
      titulo: 'Clientes',
      icono: 'users',
      singular: 'cliente',
      ayuda: 'Se usan al emitir facturas, boletas y notas.',
    },
    proveedores: {
      titulo: 'Proveedores',
      icono: 'building-2',
      singular: 'proveedor',
      ayuda: 'Se usan al registrar compras de mercadería.',
    },
  };

  function tipoDocLabel(cod) {
    var t = TIPOS_DOC.find(function (x) { return x.cod === cod; });
    return t ? t.label : cod;
  }

  App.Contactos = class Contactos {
    constructor(coleccion) {
      this.col = coleccion;
      this.cfg = CONFIG[coleccion];
      this.container = null;
      this.router = null;
      this.editando = null;
      this.eliminando = null;
      this.buscandoDoc = false;
      this.errorDoc = null;
    }

    render(container, router) {
      this.container = container;
      this.router = router;
      this._renderHTML();
      this._bind();
    }

    _renderHTML() {
      this.container.innerHTML = ''
        + '<div>'
          + '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">'
            + '<div>'
              + '<h1 class="page-title" style="margin-bottom: 0.25rem;"><i data-lucide="' + this.cfg.icono + '" class="w-7 h-7"></i> ' + this.cfg.titulo + '</h1>'
              + '<p class="text-xs" style="color: rgb(100 116 139); margin-bottom: 1.5rem;">' + this.cfg.ayuda + '</p>'
            + '</div>'
            + '<button id="ct-nuevo" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Nuevo ' + this.cfg.singular + '</button>'
          + '</div>'

          + '<div class="card" style="padding: 0;">'
            + '<div id="ct-tabla">' + this._tablaHTML() + '</div>'
          + '</div>'
        + '</div>'
        + (this.editando ? this._formHTML() : '')
        + (this.eliminando ? this._confirmHTML() : '');

      App.refreshIcons();
    }

    _tablaHTML() {
      var lista = App.DB.all(this.col);
      if (lista.length === 0) {
        return '<div style="padding: 3rem 1.5rem; text-align: center; color: rgb(148 163 184);">'
          + '<i data-lucide="user-plus" class="w-10 h-10" style="margin: 0 auto 0.75rem; display: block;"></i>'
          + '<div style="font-weight: 600; color: rgb(71 85 105);">Todavía no tienes ' + this.col + '</div>'
          + '<p class="text-xs" style="margin-top: 0.5rem;">Crea el primero con <strong>Nuevo ' + this.cfg.singular + '</strong>.</p>'
          + '</div>';
      }

      return ''
        + '<table class="table-std js-dt" data-dt-key="' + this.col + '" data-dt-buscar="Buscar por nombre, RUC/DNI o correo...">'
            + '<thead><tr>'
              + '<th>Documento</th><th>Razón social / Nombre</th><th>Contacto</th><th style="width: 5.5rem;"></th>'
            + '</tr></thead>'
            + '<tbody>'
            + lista.map(function (c) {
              var inactivo = c.activo === false
                ? '<span class="badge" style="background: rgb(243 244 246); color: rgb(75 85 99); margin-left: 0.375rem;">Inactivo</span>'
                : '';
              return '<tr>'
                + '<td>'
                  + '<div class="font-mono text-xs" style="font-weight: 600;">' + App.escapeHtml(c.num_doc) + '</div>'
                  + '<div class="text-xs" style="color: rgb(148 163 184);">' + App.escapeHtml(tipoDocLabel(c.tipo_doc)) + '</div>'
                + '</td>'
                + '<td>'
                  + '<div style="font-weight: 600;">' + App.escapeHtml(c.razon_social) + inactivo + '</div>'
                  + '<div class="text-xs" style="color: rgb(148 163 184);">' + App.escapeHtml(c.direccion || '—') + '</div>'
                + '</td>'
                + '<td class="text-xs">'
                  + '<div>' + App.escapeHtml(c.email || '—') + '</div>'
                  + (c.telefono ? '<div style="color: rgb(148 163 184);">' + App.escapeHtml(c.telefono) + '</div>' : '')
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
      var esNuevo = !c.id;

      var estadoBusqueda = this.buscandoDoc
        ? '<span class="text-xs" style="color: rgb(100 116 139);">Consultando...</span>'
        : this.errorDoc
          ? '<span class="text-xs" style="color: rgb(185 28 28);">' + App.escapeHtml(this.errorDoc) + '</span>'
          : '';

      var cuerpo = ''
        + '<div id="ct-error" style="display: none; padding: 0.75rem; margin-bottom: 1rem; background: rgb(254 242 242); border-radius: 0.5rem; color: rgb(185 28 28); font-size: 0.875rem;"></div>'
        + '<div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 0.875rem;">'
          + '<div>'
            + '<label class="label">Tipo de documento</label>'
            + '<select id="f-tipo-doc" class="input js-select">'
              + TIPOS_DOC.map(function (t) {
                return '<option value="' + t.cod + '"' + (t.cod === (c.tipo_doc || '6') ? ' selected' : '') + '>' + t.label + '</option>';
              }).join('')
            + '</select>'
          + '</div>'
          + '<div>'
            + '<label class="label">Número *</label>'
            + '<div style="display: flex; gap: 0.5rem;">'
              + '<input id="f-num-doc" class="input font-mono" style="flex: 1;" value="' + App.escapeHtml(c.num_doc || '') + '" placeholder="20123456789" />'
              + '<button type="button" id="f-buscar-doc" class="btn-secondary" title="Consultar en SUNAT / RENIEC" ' + (this.buscandoDoc ? 'disabled' : '') + '>'
                + '<i data-lucide="' + (this.buscandoDoc ? 'loader-2' : 'search') + '" class="w-4 h-4' + (this.buscandoDoc ? ' icon-spin' : '') + '"></i>'
              + '</button>'
            + '</div>'
            + (estadoBusqueda ? '<p style="margin-top: 0.25rem;">' + estadoBusqueda + '</p>' : '')
          + '</div>'
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + '<label class="label">Razón social / Nombre *</label>'
          + '<input id="f-razon" class="input" value="' + App.escapeHtml(c.razon_social || '') + '" placeholder="CONSTRUCTORA ANDINA DEL SUR SAC" />'
        + '</div>'
        + '<div style="margin-top: 0.875rem;">'
          + '<label class="label">Dirección</label>'
          + '<input id="f-direccion" class="input" value="' + App.escapeHtml(c.direccion || '') + '" placeholder="AV. LOS CONSTRUCTORES 1234 - ATE" />'
        + '</div>'
        + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-top: 0.875rem;">'
          + '<div>'
            + '<label class="label">Correo</label>'
            + '<input id="f-email" type="email" class="input" value="' + App.escapeHtml(c.email || '') + '" placeholder="compras@empresa.pe" />'
          + '</div>'
          + '<div>'
            + '<label class="label">Teléfono</label>'
            + '<input id="f-telefono" class="input" value="' + App.escapeHtml(c.telefono || '') + '" placeholder="01 4785200" />'
          + '</div>'
        + '</div>'
        + '<div style="margin-top: 1rem;">'
          + '<label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); cursor: pointer;">'
            + '<input id="f-activo" type="checkbox" ' + (c.activo !== false ? 'checked' : '') + ' /> Activo'
          + '</label>'
        + '</div>';

      return App.modalHTML({
        icono: esNuevo ? 'user-plus' : 'pencil',
        titulo: (esNuevo ? 'Nuevo ' : 'Editar ') + this.cfg.singular,
        ancho: '36rem',
        cuerpo: cuerpo,
        footer: ''
          + '<button type="button" data-modal-close class="btn-secondary">Cancelar</button>'
          + '<button type="button" id="ct-guardar" class="btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar</button>',
      });
    }

    _confirmHTML() {
      return App.confirmarHTML({
        titulo: 'Eliminar ' + this.cfg.singular,
        mensaje: '¿Seguro que quieres eliminar a <strong>' + App.escapeHtml(this.eliminando.razon_social) + '</strong>?',
      });
    }

    _bind() {
      var self = this;

      this.container.querySelector('#ct-nuevo').addEventListener('click', function () {
        self.editando = { tipo_doc: '6', activo: true };
        self.errorDoc = null;
        self._rerender();
      });

      this._bindTabla();

      if (this.editando) {
        App.bindModal(this.container, function () { self.editando = null; self.errorDoc = null; self._rerender(); });
        this.container.querySelector('#ct-guardar').addEventListener('click', function () { self._guardar(); });
        this.container.querySelector('#f-buscar-doc').addEventListener('click', function () { self._consultarDoc(); });
      }

      if (this.eliminando) {
        App.bindModal(this.container, function () { self.eliminando = null; self._rerender(); });
        this.container.querySelector('[data-confirmar]').addEventListener('click', function () {
          App.DB.remove(self.col, self.eliminando.id);
          self.eliminando = null;
          self._rerender();
        });
      }
    }

    /** Delegado en #ct-tabla: con paginación las demás filas no están en el DOM. */
    _bindTabla() {
      var self = this;
      var raiz = this.container.querySelector('#ct-tabla');
      App.delegarClick(raiz, '[data-editar]', function (btn) {
        self.editando = Object.assign({}, App.DB.find(self.col, btn.dataset.editar));
        self.errorDoc = null;
        self._rerender();
      });
      App.delegarClick(raiz, '[data-borrar]', function (btn) {
        self.eliminando = App.DB.find(self.col, btn.dataset.borrar);
        self._rerender();
      });
    }

    _rerender() {
      this._renderHTML();
      this._bind();
    }

    /** Autocompleta la ficha desde SUNAT (RUC) o RENIEC (DNI) vía api.json.pe. */
    async _consultarDoc() {
      // Los datos del formulario se pierden al re-renderizar, así que los
      // guardamos en `editando` antes de disparar la consulta.
      this._capturarFormulario();
      var numero = (this.editando.num_doc || '').trim();
      var tipo = this.editando.tipo_doc;

      if (tipo !== '6' && tipo !== '1') {
        this.errorDoc = 'Solo se puede consultar RUC o DNI.';
        this._rerender();
        return;
      }
      if (!/^\d{8,11}$/.test(numero)) {
        this.errorDoc = 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos).';
        this._rerender();
        return;
      }

      this.buscandoDoc = true;
      this.errorDoc = null;
      this._rerender();

      try {
        var res = await App.api.buscarDocumento(tipo, numero);
        this.editando = Object.assign({}, this.editando, {
          razon_social: res.data.razon_social,
          direccion: res.data.direccion || this.editando.direccion || '',
        });
      } catch (e) {
        this.errorDoc = e.message;
      } finally {
        this.buscandoDoc = false;
        this._rerender();
      }
    }

    _capturarFormulario() {
      var c = this.container;
      var val = function (sel) { var el = c.querySelector(sel); return el ? el.value.trim() : ''; };
      this.editando = Object.assign({}, this.editando, {
        tipo_doc: c.querySelector('#f-tipo-doc').value,
        num_doc: val('#f-num-doc'),
        razon_social: val('#f-razon'),
        direccion: val('#f-direccion'),
        email: val('#f-email'),
        telefono: val('#f-telefono'),
        activo: c.querySelector('#f-activo').checked,
      });
    }

    _guardar() {
      this._capturarFormulario();
      var datos = this.editando;

      var error = null;
      if (!datos.num_doc) error = 'El número de documento es obligatorio.';
      else if (datos.tipo_doc === '6' && !/^\d{11}$/.test(datos.num_doc)) error = 'El RUC debe tener 11 dígitos.';
      else if (datos.tipo_doc === '1' && !/^\d{8}$/.test(datos.num_doc)) error = 'El DNI debe tener 8 dígitos.';
      else if (!datos.razon_social) error = 'La razón social o nombre es obligatorio.';
      else {
        var idActual = datos.id;
        var col = this.col;
        var repetido = App.DB.all(col).find(function (x) {
          return x.num_doc === datos.num_doc && String(x.id) !== String(idActual);
        });
        if (repetido) error = 'Ya existe un registro con el documento ' + datos.num_doc + '.';
      }

      if (error) {
        var box = this.container.querySelector('#ct-error');
        box.textContent = error;
        box.style.display = 'block';
        return;
      }

      var payload = {
        tipo_doc: datos.tipo_doc,
        num_doc: datos.num_doc,
        razon_social: datos.razon_social,
        direccion: datos.direccion || '',
        email: datos.email || '',
        telefono: datos.telefono || '',
        activo: datos.activo !== false,
      };

      if (datos.id) App.DB.update(this.col, datos.id, payload);
      else App.DB.insert(this.col, payload);

      this.editando = null;
      this._rerender();
    }
  };
})();
