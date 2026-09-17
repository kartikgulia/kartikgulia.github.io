// Hash parsing, parent map, navigate() — SPEC §7.1

const ROUTES = [
  { name: 'home', pattern: /^\/?$/, parent: null },
  { name: 'projects', pattern: /^\/projects\/?$/, parent: null },
  { name: 'project-detail', pattern: /^\/projects\/([^/]+)\/?$/, parent: '#/projects' },
  { name: 'resume', pattern: /^\/resume\/?$/, parent: null },
  { name: 'role-detail', pattern: /^\/resume\/([^/]+)\/?$/, parent: '#/resume' },
  { name: 'education', pattern: /^\/education\/?$/, parent: null },
  { name: 'education-tab', pattern: /^\/education\/(coursework|awards|clubs)\/?$/, parent: null },
  { name: 'contact', pattern: /^\/contact\/?$/, parent: null },
];

// Parents for top-level sections point back to Home.
const HOME_HASH = '#/';

export function parseRoute(hash) {
  const path = (hash || '').replace(/^#/, '') || '/';
  for (const r of ROUTES) {
    const m = path.match(r.pattern);
    if (m) {
      const params = {};
      if (r.name === 'project-detail') params.id = decodeURIComponent(m[1]);
      if (r.name === 'role-detail') params.id = decodeURIComponent(m[1]);
      if (r.name === 'education-tab') params.tab = m[1];
      return { name: r.name, params };
    }
  }
  return { name: 'not-found', params: {} };
}

export function parentHash(route) {
  switch (route.name) {
    case 'home':
      return null;
    case 'project-detail':
      return '#/projects';
    case 'role-detail':
      return '#/resume';
    default:
      return HOME_HASH;
  }
}

export function currentHash() {
  return window.location.hash || '#/';
}

export function navigate(hash, { replace = false } = {}) {
  if (replace) {
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash === hash) {
    // Force a re-evaluation even if the hash is unchanged.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

export function goHome() {
  navigate(HOME_HASH);
}

export function onRouteChange(fn) {
  const handler = () => fn(parseRoute(currentHash()));
  window.addEventListener('hashchange', handler);
  return handler;
}
