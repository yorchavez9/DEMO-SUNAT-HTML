var App = window.App || (window.App = {});

App.Router = class Router {
  constructor(routes) {
    this.routes = routes.map((r) => ({
      path: r.path,
      handler: r.handler,
      regex: this._pathToRegex(r.path),
      keys: this._extractKeys(r.path),
    }));
    this._listeners = [];
    this._currentPath = null;
    window.addEventListener('hashchange', () => this._handle());
  }

  _pathToRegex(path) {
    var escaped = path.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/');
    return new RegExp('^' + escaped + '$');
  }

  _extractKeys(path) {
    var keys = [];
    path.replace(/:([^/]+)/g, function (_, k) { keys.push(k); });
    return keys;
  }

  _getCurrentPath() {
    var hash = window.location.hash.slice(1) || '/';
    if (!hash.startsWith('/')) hash = '/' + hash;
    return hash;
  }

  _handle() {
    var path = this._getCurrentPath();
    for (var i = 0; i < this.routes.length; i++) {
      var route = this.routes[i];
      var m = path.match(route.regex);
      if (m) {
        var params = {};
        route.keys.forEach((k, idx) => { params[k] = decodeURIComponent(m[idx + 1]); });
        var page = route.handler(params);
        this._currentPath = path;
        this._listeners.forEach((cb) => cb(page, path, params));
        return;
      }
    }
    this.navigate('/');
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this._handle();
    }
  }

  navigate(path) {
    window.location.hash = '#' + path;
  }

  onNavigate(cb) {
    this._listeners.push(cb);
  }

  currentPath() {
    return this._currentPath;
  }
};
