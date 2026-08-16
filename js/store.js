var App = window.App || (window.App = {});

(function () {
  var STORAGE_KEY = 'api_sunat_config';
  var AUTH_KEY = 'api_sunat_session';
  var USERS_KEY = 'sistema_v1_usuarios';

  // ─── Usuarios ───────────────────────────────────────────────
  /**
   * OJO: esto es autenticación del lado del cliente. La contraseña se guarda
   * ofuscada (no en claro), pero cualquiera con acceso al navegador puede leer
   * el localStorage. Sirve para separar sesiones en el demo, NO es seguridad
   * real: en producción el login tiene que validarse en el servidor.
   */
  function ofuscar(texto, salt) {
    // FNV-1a de 32 bits sobre "salt + texto"
    var entrada = String(salt) + '|' + String(texto);
    var h = 0x811c9dc5;
    for (var i = 0; i < entrada.length; i++) {
      h ^= entrada.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
  }

  function leerUsuarios() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var lista = raw ? JSON.parse(raw) : null;
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function guardarUsuarios(lista) {
    localStorage.setItem(USERS_KEY, JSON.stringify(lista));
  }

  App.hayUsuarios = function () {
    return leerUsuarios().length > 0;
  };

  App.usuarios = function () {
    return leerUsuarios().map(function (u) { return { usuario: u.usuario, nombre: u.nombre }; });
  };

  /** Crea la cuenta y deja la sesión iniciada. Devuelve {ok} o {ok:false, error}. */
  App.registrarUsuario = function (datos) {
    var usuario = String(datos.usuario || '').trim().toLowerCase();
    var password = String(datos.password || '');

    if (!usuario) return { ok: false, error: 'Ingresa un nombre de usuario.' };
    if (!/^[a-z0-9._-]{3,}$/.test(usuario)) {
      return { ok: false, error: 'El usuario debe tener al menos 3 caracteres: letras, números, punto, guion o guion bajo.' };
    }
    if (password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };

    var lista = leerUsuarios();
    if (lista.some(function (u) { return u.usuario === usuario; })) {
      return { ok: false, error: 'Ese usuario ya existe.' };
    }

    var salt = String(Date.now()) + Math.random().toString(36).slice(2);
    lista.push({
      usuario: usuario,
      nombre: String(datos.nombre || '').trim() || usuario,
      salt: salt,
      clave: ofuscar(password, salt),
      creado: new Date().toISOString(),
    });
    guardarUsuarios(lista);

    abrirSesion(lista[lista.length - 1]);
    return { ok: true };
  };

  function abrirSesion(u) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      usuario: u.usuario,
      nombre: u.nombre,
      loggedInAt: new Date().toISOString(),
    }));
  }

  App.login = function (usuario, password) {
    var buscado = String(usuario || '').trim().toLowerCase();
    var u = leerUsuarios().find(function (x) { return x.usuario === buscado; });
    if (!u || u.clave !== ofuscar(String(password || ''), u.salt)) return false;
    abrirSesion(u);
    return true;
  };

  /** Cambia la contraseña del usuario con la sesión abierta. */
  App.cambiarPassword = function (actual, nueva) {
    var sesion = App.getSession();
    if (!sesion) return { ok: false, error: 'No hay sesión iniciada.' };
    if (String(nueva || '').length < 6) return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };

    var lista = leerUsuarios();
    var u = lista.find(function (x) { return x.usuario === sesion.usuario; });
    if (!u || u.clave !== ofuscar(String(actual || ''), u.salt)) {
      return { ok: false, error: 'La contraseña actual no es correcta.' };
    }

    u.salt = String(Date.now()) + Math.random().toString(36).slice(2);
    u.clave = ofuscar(nueva, u.salt);
    guardarUsuarios(lista);
    return { ok: true };
  };

  App.logout = function () {
    localStorage.removeItem(AUTH_KEY);
  };

  App.getSession = function () {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  App.isLoggedIn = function () {
    return !!App.getSession();
  };

  var DEFAULT_CONFIG = {
    base_url: 'https://apisunatv2.kodevo.es/api/v1',
    api_key: 'CiYYgu7XWPj080F6vWkZwQwVKDtU5ZN16T2kRt31VhfEwbzJVgCKVFunH8HQWXHK',
    api_secret: '077069428c4b6aef90915b438052ffc159093fc8aceff1e489c95daed6897624',
    jsonpe_token: '461a4e35bb683c7b21e8da62a012108f81422441ed843b5b6a510f9b9fa8',
  };

  App.getConfig = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : Object.assign({}, DEFAULT_CONFIG);
    } catch (e) {
      return Object.assign({}, DEFAULT_CONFIG);
    }
  };

  App.saveConfig = function (config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  App.isConfigured = function () {
    var c = App.getConfig();
    return Boolean(c.api_key && c.api_secret);
  };
})();
