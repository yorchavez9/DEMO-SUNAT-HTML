var App = window.App || (window.App = {});

/**
 * Select personalizado con buscador — JavaScript vanilla, sin dependencias.
 *
 * Idea central: el <select> original NUNCA se elimina. Se oculta visualmente y
 * se le construye una interfaz encima. Al elegir una opción se escribe
 * select.value y se dispara un evento 'change' real, así que todo el código que
 * ya existe en el proyecto sigue funcionando sin cambios:
 *
 *     container.querySelector('#f-unidad').value          -> sigue igual
 *     select.addEventListener('change', e => e.target.value)  -> sigue igual
 *     new FormData(form).get('cliente_id')                -> sigue igual
 *
 * Uso:
 *     <select class="js-select" name="cliente_id"
 *             data-placeholder="Seleccione un cliente"
 *             data-search="true" data-clearable="true">
 *
 *     App.initSelects()                  // convierte todos los .js-select
 *     App.initSelect(el)                 // convierte uno y devuelve la instancia
 *     App.getSelect(el).refresh()        // re-lee las <option> del nativo
 *
 * Se engancha a App.refreshIcons(), que este proyecto llama al final de cada
 * render, así que los selects de las pantallas re-renderizadas se reconstruyen
 * solos (ver el final de este archivo).
 *
 * data-attributes:
 *   data-placeholder        Texto cuando no hay selección.
 *   data-search             "true" | "false" | "auto" (por defecto: auto, busca
 *                           si hay más de UMBRAL_BUSQUEDA opciones).
 *   data-clearable          "true" para mostrar la ✕ que limpia la selección.
 *   data-disabled           "true" para deshabilitar (equivale a [disabled]).
 *   data-loading            "true" para el estado de carga.
 *   data-empty-text         Mensaje cuando la búsqueda no encuentra nada.
 *   data-search-placeholder Placeholder del input de búsqueda.
 */
(function () {
  var UMBRAL_BUSQUEDA = 8;   // a partir de aquí el buscador aparece solo
  var MARGEN_VIEWPORT = 8;   // aire mínimo entre el panel y el borde de pantalla

  var contador = 0;
  var instancias = [];       // todas las instancias vivas
  var abierta = null;        // solo puede haber un panel abierto a la vez
  var handlersGlobales = false;

  // ─── Utilidades ─────────────────────────────────────────────
  var ICONOS = {
    chevron: '<svg class="vselect__icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    x: '<svg class="vselect__icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    check: '<svg class="vselect__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    lupa: '<svg class="vselect__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  };

  /** Minúsculas y sin tildes, para que "jose" encuentre "José". */
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function esVerdadero(valor) {
    return valor === '' || valor === 'true' || valor === '1';
  }

  function escapar(texto) {
    return App.escapeHtml ? App.escapeHtml(texto) : String(texto == null ? '' : texto);
  }

  // ─── Componente ─────────────────────────────────────────────
  App.Select = class Select {
    constructor(select) {
      this.select = select;
      this.id = 'vselect-' + (++contador);
      this.opciones = [];
      this.filtradas = [];
      this.indiceActivo = -1;
      this.abierto = false;
      this.consulta = '';

      this._leerConfig();
      this._construir();
      this.refresh();
      this._observarOpciones();

      select.__vselect = this;
      select.setAttribute('data-vselect', 'on');
      instancias.push(this);
      bindGlobales();
    }

    // ─── Configuración ────────────────────────────────────────
    _leerConfig() {
      var d = this.select.dataset;
      this.cfg = {
        placeholder: d.placeholder || '',
        busqueda: d.search || 'auto',
        limpiable: esVerdadero(d.clearable),
        vacio: d.emptyText || 'No se encontraron resultados',
        buscarPlaceholder: d.searchPlaceholder || 'Buscar...',
        inline: this.select.classList.contains('input-inline'),
      };
    }

    /** ¿Toca mostrar el buscador? "auto" decide según cuántas opciones hay. */
    _usaBusqueda() {
      if (this.cfg.busqueda === 'true') return true;
      if (this.cfg.busqueda === 'false') return false;
      return this.opciones.length > UMBRAL_BUSQUEDA;
    }

    // ─── Construcción del DOM ─────────────────────────────────
    _construir() {
      var sel = this.select;

      this.raiz = document.createElement('div');
      this.raiz.className = 'vselect' + (this.cfg.inline ? ' vselect--inline' : '');

      sel.parentNode.insertBefore(this.raiz, sel);
      this.raiz.appendChild(sel);
      sel.classList.add('vselect__native');
      sel.setAttribute('tabindex', '-1');
      sel.setAttribute('aria-hidden', 'true');

      this.control = document.createElement('button');
      this.control.type = 'button';
      this.control.className = 'vselect__control';
      this.control.id = this.id + '-control';
      this.control.setAttribute('role', 'combobox');
      this.control.setAttribute('aria-haspopup', 'listbox');
      this.control.setAttribute('aria-expanded', 'false');
      this.control.setAttribute('aria-controls', this.id + '-list');

      // El <label for="..."> del formulario debe seguir apuntando al control
      if (sel.id) {
        var etiqueta = document.querySelector('label[for="' + sel.id + '"]');
        if (etiqueta) this.control.setAttribute('aria-labelledby', etiqueta.id || (etiqueta.id = this.id + '-label'));
      }

      this.raiz.appendChild(this.control);

      // El panel vive en <body>: así ningún overflow ni z-index lo recorta
      this.panel = document.createElement('div');
      this.panel.className = 'vselect__panel';
      this.panel.id = this.id + '-panel';
      this.panel.hidden = true;

      this._bind();
    }

    // ─── Sincronización con el <select> nativo ────────────────
    /**
     * Vuelve a leer las <option> del select nativo. Llámalo después de
     * reemplazar las opciones por JavaScript (aunque el MutationObserver
     * interno ya lo hace solo).
     */
    refresh() {
      var self = this;
      this.opciones = Array.prototype.map.call(this.select.options, function (op, i) {
        return {
          indice: i,
          value: op.value,
          texto: op.textContent.trim(),
          buscable: normalizar(op.textContent + ' ' + op.value),
          deshabilitada: op.disabled,
          // Con data-placeholder, la <option> vacía se usa como placeholder y
          // no se lista. Sin él se muestra tal cual ("Todas", "Seleccione...").
          esPlaceholder: op.value === '' && !!self.cfg.placeholder,
          grupo: op.parentElement && op.parentElement.tagName === 'OPTGROUP'
            ? op.parentElement.label : null,
        };
      });

      this.sync();
      if (this.abierto) this._pintarLista();
      return this;
    }

    /** Refleja en la interfaz el estado actual del select nativo. */
    sync() {
      var sel = this.select;
      var elegida = sel.selectedIndex >= 0 ? this.opciones[sel.selectedIndex] : null;
      var hayValor = !!(elegida && elegida.value !== '');

      var texto = hayValor
        ? elegida.texto
        : (this.cfg.placeholder || (elegida ? elegida.texto : '') || 'Seleccionar');

      var cargando = esVerdadero(sel.dataset.loading);
      var deshabilitado = sel.disabled || esVerdadero(sel.dataset.disabled);

      this.raiz.classList.toggle('is-disabled', deshabilitado);
      this.raiz.classList.toggle('is-loading', cargando);
      this.control.disabled = deshabilitado || cargando;

      this.control.innerHTML = ''
        + '<span class="vselect__label' + (hayValor ? '' : ' is-placeholder') + '">' + escapar(texto) + '</span>'
        + (cargando ? '<span class="vselect__spinner" aria-hidden="true"></span>' : '')
        + (this.cfg.limpiable && hayValor && !cargando && !deshabilitado
          ? '<span class="vselect__clear" data-vselect-clear role="button" tabindex="-1" aria-label="Limpiar selección">' + ICONOS.x + '</span>'
          : '')
        + (cargando ? '' : '<span class="vselect__arrow" aria-hidden="true">' + ICONOS.chevron + '</span>');

      return this;
    }

    /** Vigila cambios de <option> hechos por JavaScript (datos dinámicos). */
    _observarOpciones() {
      var self = this;
      if (!window.MutationObserver) return;
      this.observer = new MutationObserver(function () { self.refresh(); });
      this.observer.observe(this.select, { childList: true, subtree: true });
    }

    // ─── Apertura y cierre ────────────────────────────────────
    open() {
      if (this.abierto || this.control.disabled) return;
      if (abierta && abierta !== this) abierta.close();

      // Si se reabre antes de que termine la animación de cierre, hay que
      // cancelar el desmontaje pendiente o nos quedaríamos sin panel.
      if (this._timerCierre) {
        clearTimeout(this._timerCierre);
        this._timerCierre = null;
      }

      this.abierto = true;
      abierta = this;
      this.consulta = '';
      this.raiz.classList.add('is-open');
      this.control.setAttribute('aria-expanded', 'true');

      this._pintarPanel();
      document.body.appendChild(this.panel);
      this.panel.hidden = false;
      this._posicionar();

      // Un frame después para que la transición de entrada se vea
      var panel = this.panel;
      requestAnimationFrame(function () { panel.classList.add('is-visible'); });

      // Arranca sobre la opción seleccionada
      var actual = this.select.selectedIndex;
      this.indiceActivo = this.filtradas.findIndex(function (o) { return o.indice === actual; });
      if (this.indiceActivo < 0 && this.filtradas.length) this.indiceActivo = 0;
      this._marcarActiva(true);

      if (this.buscador) this.buscador.focus();
    }

    close(devolverFoco) {
      if (!this.abierto) return;
      this.abierto = false;
      if (abierta === this) abierta = null;

      this.raiz.classList.remove('is-open');
      this.control.setAttribute('aria-expanded', 'false');
      this.control.removeAttribute('aria-activedescendant');
      this.panel.classList.remove('is-visible');
      this.buscador = null;

      var self = this;
      var panel = this.panel;
      this._timerCierre = setTimeout(function () {
        self._timerCierre = null;
        panel.hidden = true;
        if (panel.parentNode) panel.parentNode.removeChild(panel);
      }, 130);

      if (devolverFoco) this.control.focus();
    }

    toggle() {
      if (this.abierto) this.close(true); else this.open();
    }

    /** Coloca el panel bajo el campo; si no cabe abajo, lo abre hacia arriba. */
    _posicionar() {
      var r = this.control.getBoundingClientRect();
      var alto = this.panel.offsetHeight;
      var espacioAbajo = window.innerHeight - r.bottom - MARGEN_VIEWPORT;
      var espacioArriba = r.top - MARGEN_VIEWPORT;
      var arriba = alto > espacioAbajo && espacioArriba > espacioAbajo;

      this.panel.classList.toggle('is-up', arriba);
      this.panel.style.width = r.width + 'px';
      this.panel.style.maxHeight = Math.max(120, (arriba ? espacioArriba : espacioAbajo)) + 'px';
      this.panel.style.left = Math.max(
        MARGEN_VIEWPORT,
        Math.min(r.left, window.innerWidth - r.width - MARGEN_VIEWPORT)
      ) + 'px';
      this.panel.style.top = arriba
        ? Math.max(MARGEN_VIEWPORT, r.top - this.panel.offsetHeight - 4) + 'px'
        : (r.bottom + 4) + 'px';
    }

    // ─── Pintado del panel ────────────────────────────────────
    _pintarPanel() {
      var busca = this._usaBusqueda();
      this.panel.innerHTML = ''
        + (busca
          ? '<div class="vselect__search-wrap">' + ICONOS.lupa
            + '<input type="text" class="vselect__search" autocomplete="off" spellcheck="false"'
            + ' role="combobox" aria-expanded="true" aria-autocomplete="list"'
            + ' aria-controls="' + this.id + '-list"'
            + ' placeholder="' + escapar(this.cfg.buscarPlaceholder) + '" aria-label="Buscar opción" />'
            + '</div>'
          : '')
        + '<ul id="' + this.id + '-list" class="vselect__list" role="listbox"'
        + ' aria-label="' + escapar(this.cfg.placeholder || 'Opciones') + '"></ul>';

      this.buscador = this.panel.querySelector('.vselect__search');
      this.lista = this.panel.querySelector('.vselect__list');

      if (this.buscador) {
        var self = this;
        this.buscador.addEventListener('input', function () {
          self.consulta = self.buscador.value;
          self._pintarLista();
          self.indiceActivo = self.filtradas.length ? 0 : -1;
          self._marcarActiva(true);
          self._posicionar();
        });
        this.buscador.addEventListener('keydown', function (e) { self._teclado(e); });
      }

      this._pintarLista();
    }

    _pintarLista() {
      var q = normalizar(this.consulta).trim();
      var self = this;

      this.filtradas = this.opciones.filter(function (o) {
        if (o.esPlaceholder) return false;
        if (!q) return true;
        return o.buscable.indexOf(q) !== -1;
      });

      if (esVerdadero(this.select.dataset.loading)) {
        this.lista.innerHTML = '<li class="vselect__loading"><span class="vselect__spinner"></span> Cargando...</li>';
        return;
      }

      if (this.filtradas.length === 0) {
        this.lista.innerHTML = '<li class="vselect__empty">' + escapar(this.cfg.vacio) + '</li>';
        return;
      }

      var seleccionado = this.select.selectedIndex;
      var grupoPrevio = null;

      this.lista.innerHTML = this.filtradas.map(function (o, i) {
        var cabecera = '';
        if (o.grupo && o.grupo !== grupoPrevio) {
          cabecera = '<li class="vselect__group" role="presentation">' + escapar(o.grupo) + '</li>';
          grupoPrevio = o.grupo;
        }
        var clases = 'vselect__option'
          + (o.indice === seleccionado ? ' is-selected' : '')
          + (o.deshabilitada ? ' is-disabled' : '');
        return cabecera
          + '<li id="' + self.id + '-op-' + i + '" class="' + clases + '" role="option"'
          + ' data-vselect-index="' + i + '"'
          + ' aria-selected="' + (o.indice === seleccionado) + '"'
          + (o.deshabilitada ? ' aria-disabled="true"' : '') + '>'
          + '<span class="vselect__option-text">' + escapar(o.texto) + '</span>'
          + ICONOS.check
          + '</li>';
      }).join('');
    }

    _marcarActiva(desplazar) {
      var self = this;
      // aria-activedescendant va en el elemento que tiene el foco real:
      // el buscador si existe, si no el propio campo.
      var host = this.buscador || this.control;
      var hayActiva = false;

      this.lista.querySelectorAll('.vselect__option').forEach(function (li) {
        var activa = Number(li.dataset.vselectIndex) === self.indiceActivo;
        li.classList.toggle('is-active', activa);
        if (activa) {
          hayActiva = true;
          host.setAttribute('aria-activedescendant', li.id);
          if (desplazar) li.scrollIntoView({ block: 'nearest' });
        }
      });

      if (!hayActiva) host.removeAttribute('aria-activedescendant');
    }

    // ─── Selección ────────────────────────────────────────────
    /**
     * Escribe el valor en el <select> nativo y lanza los eventos reales, para
     * que el código existente del proyecto lo reciba como un cambio normal.
     */
    seleccionar(opcion) {
      if (!opcion || opcion.deshabilitada) return;
      this.select.selectedIndex = opcion.indice;
      this.sync();
      this._emitir();
      this.close(true);
    }

    /** Deja el select sin selección (vuelve a la opción vacía si existe). */
    clear() {
      var vacia = this.opciones.find(function (o) { return o.value === ''; });
      this.select.selectedIndex = vacia ? vacia.indice : -1;
      this.sync();
      this._emitir();
    }

    _emitir() {
      this.select.dispatchEvent(new Event('input', { bubbles: true }));
      this.select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ─── Eventos ──────────────────────────────────────────────
    _bind() {
      var self = this;

      this.control.addEventListener('click', function (e) {
        if (e.target.closest('[data-vselect-clear]')) {
          e.stopPropagation();
          self.clear();
          return;
        }
        self.toggle();
      });

      this.control.addEventListener('keydown', function (e) { self._teclado(e); });

      this.panel.addEventListener('click', function (e) {
        var li = e.target.closest('[data-vselect-index]');
        if (!li) return;
        self.seleccionar(self.filtradas[Number(li.dataset.vselectIndex)]);
      });

      this.panel.addEventListener('mousemove', function (e) {
        var li = e.target.closest('[data-vselect-index]');
        if (!li) return;
        var i = Number(li.dataset.vselectIndex);
        if (i === self.indiceActivo) return;
        self.indiceActivo = i;
        self._marcarActiva(false);
      });

      // Si otro código cambia el <select> por su cuenta, la interfaz lo sigue
      this.select.addEventListener('change', function () { self.sync(); });
    }

    _teclado(e) {
      var k = e.key;

      if (!this.abierto) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
          e.preventDefault();
          this.open();
        }
        return;
      }

      if (k === 'Escape') {
        e.preventDefault();
        this.close(true);
        return;
      }
      if (k === 'Tab') {
        this.close();
        return;
      }
      if (k === 'Enter') {
        e.preventDefault();
        this.seleccionar(this.filtradas[this.indiceActivo]);
        return;
      }

      var salto = { ArrowDown: 1, ArrowUp: -1 }[k];
      if (salto) {
        e.preventDefault();
        this._mover(salto);
        return;
      }
      if (k === 'Home' || k === 'PageUp') {
        e.preventDefault();
        this._irA(0);
        return;
      }
      if (k === 'End' || k === 'PageDown') {
        e.preventDefault();
        this._irA(this.filtradas.length - 1);
      }
    }

    /** Se mueve saltando las opciones deshabilitadas. */
    _mover(salto) {
      var total = this.filtradas.length;
      if (!total) return;
      var i = this.indiceActivo;
      for (var intentos = 0; intentos < total; intentos++) {
        i = (i + salto + total) % total;
        if (!this.filtradas[i].deshabilitada) break;
      }
      this._irA(i);
    }

    _irA(i) {
      if (i < 0 || i >= this.filtradas.length) return;
      this.indiceActivo = i;
      this._marcarActiva(true);
    }

    // ─── API pública extra ────────────────────────────────────
    get value() { return this.select.value; }

    set value(v) {
      this.select.value = v;
      this.sync();
    }

    setLoading(activo) {
      if (activo) this.select.dataset.loading = 'true';
      else delete this.select.dataset.loading;
      this.sync();
      if (this.abierto) this._pintarLista();
      return this;
    }

    setDisabled(activo) {
      this.select.disabled = !!activo;
      this.sync();
      return this;
    }

    /** Devuelve el <select> a su estado original. */
    destroy() {
      this.close();
      if (this.observer) this.observer.disconnect();
      if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);

      var sel = this.select;
      sel.classList.remove('vselect__native');
      sel.removeAttribute('tabindex');
      sel.removeAttribute('aria-hidden');
      sel.removeAttribute('data-vselect');
      delete sel.__vselect;

      if (this.raiz.parentNode) this.raiz.parentNode.insertBefore(sel, this.raiz);
      if (this.raiz.parentNode) this.raiz.parentNode.removeChild(this.raiz);

      var i = instancias.indexOf(this);
      if (i !== -1) instancias.splice(i, 1);
    }
  };

  // ─── Handlers globales (una sola vez para toda la página) ────
  function bindGlobales() {
    if (handlersGlobales) return;
    handlersGlobales = true;

    // Clic fuera cierra el panel abierto
    document.addEventListener('mousedown', function (e) {
      if (!abierta) return;
      if (abierta.raiz.contains(e.target) || abierta.panel.contains(e.target)) return;
      abierta.close();
    });

    // El panel es position:fixed: al hacer scroll hay que reubicarlo.
    // Capture porque el scroll de contenedores internos no burbujea.
    window.addEventListener('scroll', function () {
      if (abierta) abierta._posicionar();
    }, true);

    window.addEventListener('resize', function () {
      if (abierta) abierta._posicionar();
    });
  }

  // ─── API de inicialización ──────────────────────────────────
  /** Convierte un <select> concreto (o devuelve su instancia si ya lo estaba). */
  App.initSelect = function (select) {
    if (!select || select.tagName !== 'SELECT') return null;
    if (select.__vselect) return select.__vselect;
    return new App.Select(select);
  };

  App.getSelect = function (select) {
    return select && select.__vselect ? select.__vselect : null;
  };

  /**
   * Convierte todos los .js-select que haya dentro de `raiz`, sincroniza los
   * que ya estaban convertidos y limpia las instancias cuyo <select> ya no
   * está en el documento (este proyecto re-renderiza con innerHTML).
   */
  App.initSelects = function (raiz) {
    // Limpieza de instancias huérfanas tras un re-render
    instancias.slice().forEach(function (inst) {
      if (!inst.select.isConnected) {
        inst.close();
        if (inst.observer) inst.observer.disconnect();
        if (inst.panel.parentNode) inst.panel.parentNode.removeChild(inst.panel);
        var i = instancias.indexOf(inst);
        if (i !== -1) instancias.splice(i, 1);
      } else {
        // Por si alguien asignó select.value = '...' por código
        inst.sync();
      }
    });

    (raiz || document).querySelectorAll('select.js-select').forEach(function (select) {
      App.initSelect(select);
    });
  };

  App.destroySelects = function (raiz) {
    instancias.slice().forEach(function (inst) {
      if (!raiz || raiz.contains(inst.select)) inst.destroy();
    });
  };

  // ─── Enganche al ciclo de render del proyecto ───────────────
  // Todas las pantallas terminan su render llamando a App.refreshIcons();
  // aprovechamos ese mismo punto para (re)construir los selects.
  var refreshIconsOriginal = App.refreshIcons;
  App.refreshIcons = function () {
    if (refreshIconsOriginal) refreshIconsOriginal.apply(this, arguments);
    App.initSelects();
  };

  document.addEventListener('DOMContentLoaded', function () { App.initSelects(); });
})();
