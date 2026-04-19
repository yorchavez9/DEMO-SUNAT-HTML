var App = window.App || (window.App = {});

App.Login = class Login {
  constructor() {
    this.usuario = '';
    this.password = '';
    this.error = null;
    this.loading = false;
    this.container = null;
    this.router = null;
  }

  render(container, router) {
    this.container = container;
    this.router = router;
    this._renderHTML();
    this._bind();
  }

  _renderHTML() {
    var errorHTML = this.error
      ? '<div style="padding: 0.75rem; background: rgb(254 242 242); border-radius: 0.75rem; font-size: 0.875rem; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
        + '<i data-lucide="x-circle" class="w-4 h-4" style="flex-shrink: 0;"></i> ' + App.escapeHtml(this.error)
        + '</div>'
      : '';

    var btnContent = this.loading
      ? '<span style="display: inline-block; width: 1rem; height: 1rem; border-radius: 9999px; border: 2px solid rgb(255 255 255 / 0.4); border-top-color: white; animation: icon-spin 0.8s linear infinite;"></span> Entrando...'
      : '<i data-lucide="log-in" class="w-4 h-4"></i> Entrar';

    this.container.innerHTML = ''
      + '<div style="min-height: 100vh; display: flex; background: white;">'

        // ═══════════ PANEL IZQUIERDO — Marca ═══════════
        + '<div class="login-brand" style="display: none; position: relative; overflow: hidden; padding: 3rem; flex-direction: column; justify-content: space-between; background: rgb(15 23 42); color: white; width: 45%;">'

          // Formas decorativas (colores sólidos con alpha, no gradientes)
          + '<div style="position: absolute; top: -120px; right: -120px; width: 380px; height: 380px; border-radius: 9999px; background: rgb(37 99 235 / 0.25); pointer-events: none;"></div>'
          + '<div style="position: absolute; bottom: -80px; left: -100px; width: 320px; height: 320px; border-radius: 9999px; background: rgb(59 130 246 / 0.18); pointer-events: none;"></div>'
          + '<div style="position: absolute; top: 35%; left: 55%; width: 180px; height: 180px; border-radius: 9999px; background: rgb(96 165 250 / 0.12); pointer-events: none;"></div>'

          // Header
          + '<div style="position: relative; z-index: 10; display: flex; align-items: center; gap: 0.75rem;">'
            + '<div style="width: 2.75rem; height: 2.75rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; background: rgb(37 99 235);">'
              + '<i data-lucide="file-digit" class="w-6 h-6"></i>'
            + '</div>'
            + '<div>'
              + '<div style="font-size: 1.125rem; font-weight: 800; letter-spacing: -0.025em;">SUNAT Demo</div>'
              + '<div style="font-size: 0.75rem; color: rgb(148 163 184); font-weight: 500;">Sistema de facturación</div>'
            + '</div>'
          + '</div>'

          // Hero
          + '<div style="position: relative; z-index: 10;">'
            + '<div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.025em; margin-bottom: 1.5rem; background: rgb(37 99 235 / 0.25); color: rgb(147 197 253);">'
              + '<i data-lucide="sparkles" class="w-[14px] h-[14px]"></i> Demo interactiva'
            + '</div>'
            + '<h2 style="font-size: 2.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 1rem;">'
              + 'Facturación electrónica <span style="color: rgb(96 165 250);">sin complicaciones.</span>'
            + '</h2>'
            + '<p style="color: rgb(203 213 225); font-size: 1rem; line-height: 1.6; max-width: 28rem;">'
              + 'Emite facturas, boletas, notas de crédito y guías de remisión conectándote directamente a SUNAT. Todo desde una única API.'
            + '</p>'

            // Features
            + '<div style="margin-top: 2.5rem; display: flex; flex-direction: column; gap: 1rem;">'
              + this._featureHTML('zap', 'Emisión en segundos', 'Envío directo a SUNAT o en modo lote')
              + this._featureHTML('shield-check', 'Certificado digital', 'Firma XML + validación SUNAT incluida')
            + '</div>'
          + '</div>'

          // Footer
          + '<div style="position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: rgb(148 163 184);">'
            + '<div>Hecho con ♥ en Perú</div>'
            + '<div style="font-family: JetBrains Mono, monospace;">v1.0.0</div>'
          + '</div>'
        + '</div>'

        // ═══════════ PANEL DERECHO — Formulario ═══════════
        + '<div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 1.5rem;">'
          + '<div style="width: 100%; max-width: 24rem;">'

            // Logo móvil
            + '<div class="login-mobile-logo" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem;">'
              + '<div style="width: 3.5rem; height: 3.5rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 0.75rem; background: rgb(37 99 235);">'
                + '<i data-lucide="file-digit" class="w-7 h-7"></i>'
              + '</div>'
              + '<div style="font-size: 1.125rem; font-weight: 800; letter-spacing: -0.025em; color: rgb(15 23 42);">SUNAT Demo</div>'
            + '</div>'

            + '<div style="margin-bottom: 2rem;">'
              + '<h1 style="font-size: 1.875rem; font-weight: 800; letter-spacing: -0.025em; color: rgb(15 23 42); margin-bottom: 0.375rem;">Bienvenido 👋</h1>'
              + '<p style="color: rgb(100 116 139); font-size: 0.875rem;">Inicia sesión para acceder a la demo.</p>'
            + '</div>'

            + '<form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">'
              + '<div>'
                + '<label class="label">Usuario</label>'
                + '<input id="login-user" class="input" autofocus value="' + App.escapeHtml(this.usuario) + '" placeholder="demo" required />'
              + '</div>'
              + '<div>'
                + '<label class="label">Contraseña</label>'
                + '<input id="login-pass" type="password" class="input" value="' + App.escapeHtml(this.password) + '" placeholder="demo123" required />'
              + '</div>'
              + errorHTML
              + '<button type="submit" class="btn-primary" style="width: 100%; margin-top: 0.5rem; padding: 0.75rem 1rem;" ' + (this.loading ? 'disabled' : '') + '>'
                + btnContent
              + '</button>'
            + '</form>'

            // Credenciales demo
            + '<div style="margin-top: 1.5rem; padding: 1rem; border-radius: 0.75rem; background: rgb(241 245 249);">'
              + '<div style="display: flex; align-items: center; gap: 0.375rem; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(71 85 105); margin-bottom: 0.5rem;">'
                + '<i data-lucide="info" class="w-3 h-3"></i> Credenciales demo'
              + '</div>'
              + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem;">'
                + '<div>'
                  + '<div style="font-size: 10px; color: rgb(100 116 139); font-weight: 600; text-transform: uppercase;">Usuario</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border-radius: 0.375rem; font-family: JetBrains Mono, monospace; font-weight: 700; color: rgb(15 23 42);">demo</code>'
                + '</div>'
                + '<div>'
                  + '<div style="font-size: 10px; color: rgb(100 116 139); font-weight: 600; text-transform: uppercase;">Contraseña</div>'
                  + '<code style="display: block; margin-top: 0.125rem; padding: 0.25rem 0.5rem; background: white; border-radius: 0.375rem; font-family: JetBrains Mono, monospace; font-weight: 700; color: rgb(15 23 42);">demo123</code>'
                + '</div>'
              + '</div>'
            + '</div>'

            + '<div style="margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: rgb(148 163 184);">'
              + '© ' + new Date().getFullYear() + ' SUNAT Demo · Solo para pruebas'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</div>'

      // Estilos responsive (panel izq solo en desktop, logo móvil solo en móvil)
      + '<style>'
        + '@media (min-width: 1024px) {'
          + '.login-brand { display: flex !important; }'
          + '.login-mobile-logo { display: none !important; }'
        + '}'
      + '</style>';

    App.refreshIcons();
  }

  _featureHTML(iconName, title, subtitle) {
    return ''
      + '<div style="display: flex; align-items: flex-start; gap: 0.75rem;">'
        + '<div style="width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgb(37 99 235 / 0.2);">'
          + '<i data-lucide="' + iconName + '" class="w-5 h-5" style="color: rgb(147 197 253);"></i>'
        + '</div>'
        + '<div>'
          + '<div style="font-weight: 700; color: white; font-size: 0.875rem;">' + App.escapeHtml(title) + '</div>'
          + '<div style="font-size: 0.75rem; color: rgb(148 163 184); margin-top: 0.125rem;">' + App.escapeHtml(subtitle) + '</div>'
        + '</div>'
      + '</div>';
  }

  _bind() {
    var self = this;
    var user = this.container.querySelector('#login-user');
    var pass = this.container.querySelector('#login-pass');
    var form = this.container.querySelector('#login-form');

    user.addEventListener('input', function (e) {
      self.usuario = e.target.value;
      if (self.error) { self.error = null; self._renderHTML(); self._bind(); }
    });
    pass.addEventListener('input', function (e) {
      self.password = e.target.value;
      if (self.error) { self.error = null; self._renderHTML(); self._bind(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      self._submit();
    });
  }

  _submit() {
    var self = this;
    this.loading = true;
    this._renderHTML();
    this._bind();

    setTimeout(function () {
      var ok = App.login(self.usuario, self.password);
      if (!ok) {
        self.error = 'Usuario o contraseña incorrectos';
        self.loading = false;
        self._renderHTML();
        self._bind();
        return;
      }
      self.router.navigate('/');
    }, 250);
  }
};
