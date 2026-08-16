var App = window.App || (window.App = {});

/**
 * Alta del primer usuario. Se muestra solo mientras no exista ninguna cuenta;
 * a partir de ahí el sistema arranca siempre en el login.
 */
App.Registro = class Registro {
  constructor() {
    this.container = null;
    this.router = null;
    this.datos = { negocio: '', nombre: '', usuario: '', password: '', confirmar: '' };
    this.error = null;
    this.guardando = false;
    this.verPass = false;
  }

  render(container, router) {
    this.container = container;
    this.router = router;
    this._renderHTML();
    this._bind();
  }

  _renderHTML() {
    var PRIMARIO = 'rgb(37 99 235)';
    var d = this.datos;

    var errorHTML = this.error
      ? '<div style="padding: 0.75rem 0.875rem; background: rgb(254 242 242); border-radius: 0.75rem; font-size: 0.8125rem; font-weight: 600; color: rgb(185 28 28); display: flex; align-items: center; gap: 0.5rem;">'
          + '<i data-lucide="x-circle" style="width: 16px; height: 16px; flex-shrink: 0;"></i> ' + App.escapeHtml(this.error)
        + '</div>'
      : '';

    var btnContent = this.guardando
      ? '<i data-lucide="loader-2" class="w-4 h-4 icon-spin"></i> Creando cuenta...'
      : '<i data-lucide="arrow-right" class="w-4 h-4"></i> Crear cuenta y entrar';

    this.container.innerHTML = ''
      + '<div style="min-height: 100vh; background: rgb(241 245 249); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem;">'

        + '<div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem;">'
          + '<span style="width: 2.75rem; height: 2.75rem; border-radius: 0.875rem; background: ' + PRIMARIO + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 20px -6px rgb(37 99 235 / 0.55);">'
            + '<i data-lucide="user-plus" style="width: 22px; height: 22px; color: white;"></i>'
          + '</span>'
          + '<div>'
            + '<div style="font-weight: 800; font-size: 1.0625rem; color: rgb(15 23 42); letter-spacing: -0.02em; line-height: 1.2;">Configura tu acceso</div>'
            + '<div style="font-size: 0.75rem; color: rgb(100 116 139); margin-top: 0.125rem;">Es la primera vez que se abre el sistema</div>'
          + '</div>'
        + '</div>'

        + '<div style="width: 100%; max-width: 25rem; background: white; border-radius: 1.25rem; padding: 2rem 1.75rem; box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 16px 40px -12px rgb(15 23 42 / 0.16);">'

          + '<h1 style="font-size: 1.25rem; font-weight: 800; color: rgb(15 23 42); letter-spacing: -0.02em;">Crear cuenta</h1>'
          + '<p style="font-size: 0.8125rem; color: rgb(100 116 139); margin-top: 0.25rem; margin-bottom: 1.5rem;">Con esta cuenta entrarás al sistema de aquí en adelante.</p>'

          + '<form id="reg-form" style="display: flex; flex-direction: column; gap: 1rem;">'
            + '<div>'
              + '<label class="label">Nombre del negocio</label>'
              + '<input id="reg-negocio" class="input" value="' + App.escapeHtml(d.negocio) + '" placeholder="Comercial Santa Rosa" />'
            + '</div>'
            + '<div>'
              + '<label class="label">Tu nombre</label>'
              + '<input id="reg-nombre" class="input" value="' + App.escapeHtml(d.nombre) + '" placeholder="Administrador" />'
            + '</div>'
            + '<div>'
              + '<label class="label">Usuario *</label>'
              + '<input id="reg-usuario" class="input" value="' + App.escapeHtml(d.usuario) + '" placeholder="admin" autocomplete="username" required />'
            + '</div>'
            + '<div>'
              + '<label class="label">Contraseña *</label>'
              + '<div style="position: relative;">'
                + '<input id="reg-pass" type="' + (this.verPass ? 'text' : 'password') + '" class="input" style="padding-right: 2.75rem;" value="' + App.escapeHtml(d.password) + '" placeholder="Mínimo 6 caracteres" autocomplete="new-password" required />'
                + '<button type="button" id="reg-eye" title="Mostrar u ocultar" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgb(148 163 184); padding: 0; display: flex; align-items: center;">'
                  + '<i data-lucide="' + (this.verPass ? 'eye-off' : 'eye') + '" style="width: 16px; height: 16px;"></i>'
                + '</button>'
              + '</div>'
            + '</div>'
            + '<div>'
              + '<label class="label">Repite la contraseña *</label>'
              + '<input id="reg-confirmar" type="password" class="input" value="' + App.escapeHtml(d.confirmar) + '" placeholder="Vuelve a escribirla" autocomplete="new-password" required />'
            + '</div>'
            + errorHTML
            + '<button type="submit" id="reg-btn" class="btn-primary" style="width: 100%; padding: 0.75rem 1rem; margin-top: 0.25rem; font-size: 0.9375rem; border-radius: 0.75rem;" ' + (this.guardando ? 'disabled' : '') + '>'
              + btnContent
            + '</button>'
          + '</form>'

          + '<div style="margin-top: 1.5rem; padding: 0.875rem 1rem; border-radius: 0.875rem; background: rgb(241 245 249); font-size: 0.75rem; color: rgb(71 85 105); line-height: 1.6;">'
            + '<div style="display: flex; align-items: center; gap: 0.375rem; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ' + PRIMARIO + '; margin-bottom: 0.5rem;">'
              + '<i data-lucide="info" style="width: 12px; height: 12px;"></i> Ten en cuenta'
            + '</div>'
            + 'La cuenta se guarda en este navegador. Si abres el sistema en otro equipo o borras los datos del navegador, tendrás que crearla de nuevo.'
          + '</div>'

        + '</div>'
      + '</div>';

    App.refreshIcons();
  }

  _bind() {
    var self = this;
    var c = this.container;

    [['#reg-negocio', 'negocio'], ['#reg-nombre', 'nombre'], ['#reg-usuario', 'usuario'],
     ['#reg-pass', 'password'], ['#reg-confirmar', 'confirmar']].forEach(function (par) {
      c.querySelector(par[0]).addEventListener('input', function (e) {
        self.datos[par[1]] = e.target.value;
      });
    });

    c.querySelector('#reg-eye').addEventListener('click', function () {
      self.verPass = !self.verPass;
      self._renderHTML();
      self._bind();
    });

    c.querySelector('#reg-form').addEventListener('submit', function (e) {
      e.preventDefault();
      self._crear();
    });
  }

  _fallar(mensaje) {
    this.error = mensaje;
    this.guardando = false;
    this._renderHTML();
    this._bind();
  }

  _crear() {
    var d = this.datos;

    if (d.password !== d.confirmar) {
      this._fallar('Las contraseñas no coinciden.');
      return;
    }

    this.guardando = true;
    this.error = null;
    this._renderHTML();
    this._bind();

    var self = this;
    setTimeout(function () {
      var res = App.registrarUsuario({
        usuario: d.usuario,
        password: d.password,
        nombre: d.nombre || d.negocio,
      });

      if (!res.ok) {
        self._fallar(res.error);
        return;
      }

      if (d.negocio.trim()) {
        App.DB.guardarEmpresa({ nombre_comercial: d.negocio.trim() });
        App.aplicarTitulo();
      }
      self.router.navigate('/');
    }, 200);
  }
};
