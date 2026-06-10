var App = window.App || (window.App = {});

(function () {
  var STORAGE_KEY = 'api_sunat_config';
  var AUTH_KEY = 'api_sunat_session';

  // Credenciales demo (hardcoded, solo para este ejemplo)
  App.DEMO_CREDENTIALS = {
    usuario: 'demo',
    password: 'demo123',
    nombre: 'Usuario Demo',
  };

  App.login = function (usuario, password) {
    if (usuario === App.DEMO_CREDENTIALS.usuario && password === App.DEMO_CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        usuario: App.DEMO_CREDENTIALS.usuario,
        nombre: App.DEMO_CREDENTIALS.nombre,
        loggedInAt: new Date().toISOString(),
      }));
      return true;
    }
    return false;
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
