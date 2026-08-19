(function () {
  var root = document.getElementById('root');
  var sidebar = null;
  var sidebarOpen = false;
  var sidebarCollapsed = false;

  var router = new App.Router([
    { path: '/login',              handler: function () { return new App.Login(); } },
    { path: '/registro',           handler: function () { return new App.Registro(); } },
    { path: '/',                   handler: function () { return new App.Dashboard(); } },
    { path: '/configuracion',      handler: function () { return new App.Settings(); } },
    { path: '/nueva-factura',      handler: function () { return new App.NewInvoice(); } },
    { path: '/nueva-boleta',       handler: function () { return new App.NewBoleta(); } },
    { path: '/nueva-nc',           handler: function () { return new App.NewCreditNote(); } },
    { path: '/nueva-nd',           handler: function () { return new App.NewDebitNote(); } },
    { path: '/nueva-guia',         handler: function () { return new App.NewDispatchGuide(); } },
    { path: '/resumenes',          handler: function () { return new App.Summaries(); } },
    { path: '/anulaciones',        handler: function () { return new App.Anulaciones(); } },
    { path: '/documentos/:tipo',   handler: function (params) { return new App.DocumentList(params.tipo); } },
    { path: '/productos',          handler: function () { return new App.Productos(); } },
    { path: '/categorias',         handler: function () { return new App.Categorias(); } },
    { path: '/clientes',           handler: function () { return new App.Contactos('clientes'); } },
    { path: '/proveedores',        handler: function () { return new App.Contactos('proveedores'); } },
    { path: '/compras',            handler: function () { return new App.Compras(); } },
    { path: '/inventario',         handler: function () { return new App.Inventario(); } },
  ]);

  function toggleSidebar(open) {
    sidebarOpen = open;
    var aside = document.getElementById('app-sidebar');
    var overlay = document.getElementById('app-overlay');
    if (aside) {
      aside.style.transform = ''; // clear any desktop collapse override
      aside.classList.toggle('translate-x-0', open);
      aside.classList.toggle('-translate-x-full', !open);
    }
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  function toggleSidebarDesktop(collapsed) {
    sidebarCollapsed = collapsed;
    var aside = document.getElementById('app-sidebar');
    var spacer = document.getElementById('app-sidebar-spacer');
    var expandBtn = document.getElementById('btn-expand-sidebar');
    if (aside) {
      // Inline style overrides Tailwind to avoid dynamic responsive class issues
      aside.style.transform = collapsed ? 'translateX(-100%)' : '';
    }
    if (spacer) spacer.style.width = collapsed ? '0' : '18rem';
    if (expandBtn) {
      expandBtn.classList.toggle('hidden', !collapsed);
      if (collapsed) App.refreshIcons();
    }
  }

  function doLogout() {
    App.logout();
    router.navigate('/login');
  }

  function renderShell(currentPath) {
    var marca = App.branding();
    root.innerHTML = ''
      + '<div class="min-h-screen flex" style="background: rgb(248 250 252);">'
        + '<div id="app-overlay" class="fixed inset-0 z-30 hidden lg:hidden" style="background: rgb(15 23 42 / 0.5); backdrop-filter: blur(4px);"></div>'
        + '<div id="app-sidebar-spacer" class="flex-shrink-0 hidden lg:block" style="width: 18rem; transition: width 0.3s ease;"></div>'
        + '<aside id="app-sidebar" class="fixed top-0 left-0 z-40 w-72 h-screen bg-white flex flex-col -translate-x-full lg:translate-x-0 transform transition-transform duration-300" style="border-right: 1px solid rgb(241 245 249); box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);">'
          + '<div id="sidebar-content" class="flex flex-col h-full"></div>'
        + '</aside>'
        + '<button id="btn-expand-sidebar" class="hidden" title="Mostrar menú" style="position: fixed; top: 1rem; left: 1rem; z-index: 30; padding: 0.5rem; background: white; border: 1px solid rgb(226 232 240); border-radius: 0.75rem; box-shadow: 0 2px 8px rgb(0 0 0 / 0.1); color: rgb(71 85 105); cursor: pointer;">'
          + '<i data-lucide="panel-left-open" class="w-5 h-5"></i>'
        + '</button>'
        + '<div class="flex-1 flex flex-col min-w-0">'
          + '<header class="lg:hidden sticky top-0 z-20 px-4 py-3 flex items-center justify-between" style="background: rgb(255 255 255 / 0.8); backdrop-filter: blur(6px);">'
            + '<button id="btn-open-sidebar" class="p-2 -ml-2 rounded-lg" style="color: rgb(51 65 85);">'
              + '<i data-lucide="menu" class="w-5 h-5"></i>'
            + '</button>'
            + '<div class="flex items-center gap-2">'
              + '<span id="marca-icono" class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: ' + marca.color + '; color: white;">'
                + '<i data-lucide="' + marca.icono + '" class="w-4 h-4"></i>'
              + '</span>'
              + '<span id="marca-nombre" class="font-extrabold text-sm tracking-tight" style="color: rgb(15 23 42);">' + App.escapeHtml(marca.nombre) + '</span>'
            + '</div>'
            + '<div class="w-9"></div>'
          + '</header>'
          + '<main class="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">'
            + '<div class="max-w-6xl mx-auto">'
              + '<div id="page-container"></div>'
            + '</div>'
          + '</main>'
        + '</div>'
      + '</div>';

    sidebar = new App.Sidebar({
      currentPath: currentPath,
      onNavigate: function (path) {
        router.navigate(path);
        toggleSidebar(false);
      },
      onClose: function () { toggleSidebar(false); },
      onLogout: doLogout,
      onCollapseDesktop: function () { toggleSidebarDesktop(true); },
    });
    sidebar.render(document.getElementById('sidebar-content'));

    document.getElementById('btn-open-sidebar').addEventListener('click', function () { toggleSidebar(true); });
    document.getElementById('app-overlay').addEventListener('click', function () { toggleSidebar(false); });

    var expandBtn = document.getElementById('btn-expand-sidebar');
    if (expandBtn) expandBtn.addEventListener('click', function () { toggleSidebarDesktop(false); });

    App.refreshIcons();
  }

  /** Refresca el nombre y el ícono del negocio sin recargar la página. */
  App.refrescarMarca = function () {
    var m = App.branding();
    if (sidebar) sidebar.update(router.currentPath());
    var icono = document.getElementById('marca-icono');
    var nombre = document.getElementById('marca-nombre');
    if (icono) {
      icono.style.background = m.color;
      icono.innerHTML = '<i data-lucide="' + m.icono + '" class="w-4 h-4"></i>';
    }
    if (nombre) nombre.textContent = m.nombre;
    App.refreshIcons();
  };

  router.onNavigate(function (page, path) {
    var hayUsuarios = App.hayUsuarios();

    // 1) Primera vez: no existe ninguna cuenta → crear la del primer usuario
    if (!hayUsuarios && path !== '/registro') {
      router.navigate('/registro');
      return;
    }
    if (hayUsuarios && path === '/registro') {
      router.navigate(App.isLoggedIn() ? '/' : '/login');
      return;
    }

    // 2) No autenticado → forzar /login
    if (hayUsuarios && !App.isLoggedIn() && path !== '/login') {
      router.navigate('/login');
      return;
    }

    // 3) Autenticado + /login → mandar al inicio
    if (App.isLoggedIn() && path === '/login') {
      router.navigate('/');
      return;
    }

    // 4) /login y /registro se renderizan sin shell (pantalla completa)
    if (path === '/login' || path === '/registro') {
      sidebar = null;
      root.innerHTML = '';
      page.render(root, router);
      return;
    }

    // 5) Autenticado pero sin config → /configuracion
    if (!App.isConfigured() && path !== '/configuracion') {
      router.navigate('/configuracion');
      return;
    }

    // 6) Renderizado normal con shell
    if (!document.getElementById('sidebar-content')) {
      renderShell(path);
    } else {
      sidebar.update(path);
    }

    var container = document.getElementById('page-container');
    container.innerHTML = '';
    page.render(container, router);
  });

  /**
   * Red de seguridad: solo se ve si falta data/seed.js (por ejemplo si se copió
   * la carpeta sin ese archivo). Con seed.js presente el sistema arranca igual
   * abriendo index.html con doble clic que servido por HTTP.
   */
  function pantallaSinDatos(err) {
    root.innerHTML = ''
      + '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: rgb(241 245 249);">'
        + '<div class="card" style="max-width: 32rem;">'
          + '<h1 class="section-title" style="color: rgb(153 27 27);">'
            + '<i data-lucide="database-backup" class="w-5 h-5"></i> Faltan los datos del sistema'
          + '</h1>'
          + '<p style="color: rgb(51 65 85); line-height: 1.6;">'
            + 'No se encontró el archivo <code style="background: rgb(241 245 249); padding: 0.125rem 0.375rem; border-radius: 0.375rem;">data/seed.js</code>. '
            + 'Asegúrate de copiar la carpeta completa, con <strong>data/</strong>, <strong>css/</strong> y <strong>js/</strong> junto a index.html.'
          + '</p>'
          + '<p class="text-xs font-mono" style="color: rgb(148 163 184); margin-top: 1rem;">' + App.escapeHtml(err && err.message) + '</p>'
          + '<button id="reintentar" class="btn-primary" style="margin-top: 1.25rem;">'
            + '<i data-lucide="refresh-cw" class="w-4 h-4"></i> Reintentar</button>'
        + '</div>'
      + '</div>';
    App.refreshIcons();
    document.getElementById('reintentar').addEventListener('click', function () { window.location.reload(); });
  }

  // Los datos (productos, clientes, proveedores, compras, inventario) tienen que
  // estar en memoria antes de renderizar cualquier página.
  App.DB.init()
    .then(function () {
      App.aplicarTitulo();
      router.start();
    })
    .catch(pantallaSinDatos);
})();
