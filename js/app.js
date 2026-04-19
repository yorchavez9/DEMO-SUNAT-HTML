(function () {
  var root = document.getElementById('root');
  var sidebar = null;
  var sidebarOpen = false;

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
    { path: '/documentos/:tipo',   handler: function (params) { return new App.DocumentList(params.tipo); } },
  ]);

  function toggleSidebar(open) {
    sidebarOpen = open;
    var aside = document.getElementById('app-sidebar');
    var overlay = document.getElementById('app-overlay');
    if (aside) {
      aside.classList.toggle('translate-x-0', open);
      aside.classList.toggle('-translate-x-full', !open);
    }
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  function doLogout() {
    App.logout();
    router.navigate('/login');
  }

  function renderShell(currentPath) {
    root.innerHTML = ''
      + '<div class="min-h-screen flex" style="background: rgb(248 250 252);">'
        + '<div id="app-overlay" class="fixed inset-0 z-30 hidden lg:hidden" style="background: rgb(15 23 42 / 0.5); backdrop-filter: blur(4px);"></div>'
        + '<aside id="app-sidebar" class="fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-white flex flex-col -translate-x-full lg:translate-x-0 transform transition-transform duration-300">'
          + '<div id="sidebar-content" class="flex flex-col h-full"></div>'
        + '</aside>'
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
    });
    sidebar.render(document.getElementById('sidebar-content'));

    document.getElementById('btn-open-sidebar').addEventListener('click', function () { toggleSidebar(true); });
    document.getElementById('app-overlay').addEventListener('click', function () { toggleSidebar(false); });

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
