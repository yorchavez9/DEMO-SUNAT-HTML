(function () {
  var root = document.getElementById('root');
  var sidebar = null;
  var sidebarOpen = false;
  var sidebarCollapsed = false;

  var router = new App.Router([
    { path: '/login',              handler: function () { return new App.Login(); } },
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
              + '<span class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: rgb(37 99 235); color: white;">'
                + '<i data-lucide="file-digit" class="w-4 h-4"></i>'
              + '</span>'
              + '<span class="font-extrabold text-sm tracking-tight" style="color: rgb(15 23 42);">SUNAT Demo</span>'
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

  router.onNavigate(function (page, path) {
    // 1) No autenticado → forzar /login
    if (!App.isLoggedIn() && path !== '/login') {
      router.navigate('/login');
      return;
    }

    // 2) Autenticado + /login → mandar al inicio
    if (App.isLoggedIn() && path === '/login') {
      router.navigate('/');
      return;
    }

    // 3) /login se renderiza sin shell (pantalla completa)
    if (path === '/login') {
      sidebar = null;
      root.innerHTML = '';
      page.render(root, router);
      return;
    }

    // 4) Autenticado pero sin config → /configuracion
    if (!App.isConfigured() && path !== '/configuracion') {
      router.navigate('/configuracion');
      return;
    }

    // 5) Renderizado normal con shell
    if (!document.getElementById('sidebar-content')) {
      renderShell(path);
    } else {
      sidebar.update(path);
    }

    var container = document.getElementById('page-container');
    container.innerHTML = '';
    page.render(container, router);
  });

  router.start();
})();
