var App = window.App || (window.App = {});

(function () {
  /**
   * Menú lateral. Los enlaces sueltos van al primer nivel y el resto se agrupa
   * en submenús plegables, para que el listado no sea una lista de 18 enlaces.
   */
  var MENU = [
    { tipo: 'link', path: '/', icon: 'layout-dashboard', label: 'Inicio' },

    {
      tipo: 'grupo', id: 'emitir', icon: 'file-plus-2', label: 'Emitir',
      hijos: [
        { path: '/nueva-factura', icon: 'file-text', label: 'Factura' },
        { path: '/nueva-boleta', icon: 'receipt', label: 'Boleta' },
        { path: '/nueva-nc', icon: 'trending-down', label: 'Nota de Crédito' },
        { path: '/nueva-nd', icon: 'trending-up', label: 'Nota de Débito' },
        { path: '/nueva-guia', icon: 'truck', label: 'Guía de Remisión' },
        { path: '/resumenes', icon: 'file-stack', label: 'Resumen Diario' },
        { path: '/anulaciones', icon: 'ban', label: 'Anulaciones' },
      ],
    },

    {
      tipo: 'grupo', id: 'consultar', icon: 'folder-search', label: 'Consultar',
      hijos: [
        { path: '/documentos/facturas', icon: 'file-text', label: 'Facturas' },
        { path: '/documentos/boletas', icon: 'receipt', label: 'Boletas' },
        { path: '/documentos/notas-credito', icon: 'trending-down', label: 'Notas Crédito' },
        { path: '/documentos/notas-debito', icon: 'trending-up', label: 'Notas Débito' },
        { path: '/documentos/guias-remision', icon: 'truck', label: 'Guías' },
      ],
    },

    {
      tipo: 'grupo', id: 'gestion', icon: 'layout-grid', label: 'Gestión',
      hijos: [
        { path: '/productos', icon: 'package', label: 'Productos' },
        { path: '/inventario', icon: 'warehouse', label: 'Inventario' },
        { path: '/compras', icon: 'shopping-cart', label: 'Compras' },
        { path: '/clientes', icon: 'users', label: 'Clientes' },
        { path: '/proveedores', icon: 'building-2', label: 'Proveedores' },
      ],
    },
  ];

  // Qué grupos quedan desplegados. Vive fuera de la clase para que el estado
  // sobreviva a los re-render del sidebar en cada navegación.
  var abiertos = {};

  function grupoContiene(grupo, path) {
    return grupo.hijos.some(function (h) { return h.path === path; });
  }

  App.Sidebar = class Sidebar {
    constructor(opts) {
      this.currentPath = opts.currentPath || '/';
      this.onNavigate = opts.onNavigate;
      this.onClose = opts.onClose;
      this.onLogout = opts.onLogout;
      this.onCollapseDesktop = opts.onCollapseDesktop || null;
      this.root = null;
    }

    _linkHTML(link, esSub) {
      var active = this.currentPath === link.path;
      var cls = 'nav-link' + (active ? ' active' : '') + (esSub ? ' nav-link-sub' : '');
      var tam = esSub ? 'w-4 h-4' : 'w-[18px] h-[18px]';
      return '<a class="' + cls + '" data-path="' + link.path + '"' + (active ? ' aria-current="page"' : '') + '>'
        + '<i data-lucide="' + link.icon + '" class="' + tam + ' flex-shrink-0"></i>'
        + '<span>' + link.label + '</span>'
      + '</a>';
    }

    /** Grupo plegable: cabecera con chevron y su lista de hijos. */
    _grupoHTML(grupo) {
      var self = this;
      var contieneActivo = grupoContiene(grupo, this.currentPath);
      // El grupo de la página actual siempre se ve abierto
      var abierto = contieneActivo || abiertos[grupo.id] === true;

      return '<div class="nav-group' + (abierto ? ' is-open' : '') + '" data-grupo="' + grupo.id + '">'
        + '<button type="button" class="nav-group-btn' + (contieneActivo ? ' has-active' : '') + '"'
          + ' aria-expanded="' + abierto + '" aria-controls="nav-sub-' + grupo.id + '">'
          + '<span class="nav-group-left">'
            + '<i data-lucide="' + grupo.icon + '" class="w-[18px] h-[18px] flex-shrink-0"></i>'
            + '<span>' + grupo.label + '</span>'
          + '</span>'
          + '<span class="nav-group-right">'
            + (contieneActivo ? '<span class="nav-dot" aria-hidden="true"></span>' : '')
            + '<i data-lucide="chevron-down" class="nav-chevron w-4 h-4"></i>'
          + '</span>'
        + '</button>'
        + '<div class="nav-sub" id="nav-sub-' + grupo.id + '">'
          + grupo.hijos.map(function (h) { return self._linkHTML(h, true); }).join('')
        + '</div>'
      + '</div>';
    }

    _menuHTML() {
      var self = this;
      return MENU.map(function (item) {
        return item.tipo === 'grupo' ? self._grupoHTML(item) : self._linkHTML(item);
      }).join('');
    }

    _html() {
      var self = this;
      var marca = App.branding();
      return ''
        + '<div class="px-5 py-5 flex items-center justify-between">'
          + '<div>'
            + '<h1 class="text-base font-extrabold flex items-center gap-2 tracking-tight" style="color: rgb(15 23 42);">'
              + '<span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ' + marca.color + '; color: white;">'
                + '<i data-lucide="' + marca.icono + '" class="w-5 h-5"></i>'
              + '</span>'
              + '<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + App.escapeHtml(marca.nombre) + '</span>'
            + '</h1>'
            + '<p class="text-xs mt-1 font-medium" style="color: rgb(100 116 139);">' + App.escapeHtml(marca.descripcion) + '</p>'
          + '</div>'
          + '<div style="display: flex; align-items: center; gap: 0.25rem;">'
            + '<button id="sidebar-close" class="lg:hidden p-1" style="color: rgb(148 163 184);">'
              + '<i data-lucide="x" class="w-5 h-5"></i>'
            + '</button>'
            + '<button id="sidebar-collapse" class="hidden lg:block p-1" title="Ocultar menú" style="color: rgb(148 163 184); background: transparent; border: none; cursor: pointer; border-radius: 0.375rem;">'
              + '<i data-lucide="panel-left-close" class="w-5 h-5"></i>'
            + '</button>'
          + '</div>'
        + '</div>'
        + '<nav class="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">'
          + this._menuHTML()
        + '</nav>'
        + '<div class="p-4" style="display: flex; flex-direction: column; gap: 0.5rem;">'
          + this._linkHTML({ path: '/configuracion', icon: 'settings', label: 'Configuración' })
          + this._userBoxHTML()
        + '</div>';
    }

    _userBoxHTML() {
      var session = App.getSession();
      if (!session) return '';
      return ''
        + '<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: rgb(248 250 252); border-radius: 0.75rem;">'
          + '<div style="width: 2rem; height: 2rem; background: rgb(37 99 235); color: white; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">'
            + App.escapeHtml(session.usuario.substring(0, 2).toUpperCase())
          + '</div>'
          + '<div style="flex: 1; min-width: 0;">'
            + '<div style="font-size: 0.75rem; font-weight: 700; color: rgb(15 23 42); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + App.escapeHtml(session.nombre) + '</div>'
            + '<div style="font-size: 0.625rem; color: rgb(100 116 139); text-transform: uppercase; letter-spacing: 0.05em;">@' + App.escapeHtml(session.usuario) + '</div>'
          + '</div>'
          + '<button id="sidebar-logout" title="Cerrar sesión" style="padding: 0.375rem; color: rgb(148 163 184); background: transparent; border: none; border-radius: 0.375rem; cursor: pointer; flex-shrink: 0;">'
            + '<i data-lucide="log-out" class="w-4 h-4"></i>'
          + '</button>'
        + '</div>';
    }

    render(root) {
      this.root = root;
      root.innerHTML = this._html();
      this._bind();
      App.refreshIcons();
    }

    update(currentPath) {
      this.currentPath = currentPath;
      if (this.root) this.render(this.root);
    }

    _bind() {
      var self = this;
      this.root.querySelectorAll('[data-path]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          self.onNavigate(el.dataset.path);
        });
      });

      // Plegar y desplegar. Se cambian clases en vez de re-renderizar para
      // que la transición de altura se vea.
      this.root.querySelectorAll('[data-grupo]').forEach(function (grupo) {
        var btn = grupo.querySelector('.nav-group-btn');
        btn.addEventListener('click', function () {
          var abre = !grupo.classList.contains('is-open');
          grupo.classList.toggle('is-open', abre);
          btn.setAttribute('aria-expanded', String(abre));
          abiertos[grupo.dataset.grupo] = abre;
        });
      });
      var closeBtn = this.root.querySelector('#sidebar-close');
      if (closeBtn && this.onClose) closeBtn.addEventListener('click', function () { self.onClose(); });

      var collapseBtn = this.root.querySelector('#sidebar-collapse');
      if (collapseBtn && this.onCollapseDesktop) collapseBtn.addEventListener('click', function () { self.onCollapseDesktop(); });

      var logoutBtn = this.root.querySelector('#sidebar-logout');
      if (logoutBtn && this.onLogout) logoutBtn.addEventListener('click', function () { self.onLogout(); });
    }
  };
})();
