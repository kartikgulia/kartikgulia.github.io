import home from './home.js';
import projects from './projects.js';
import projectDetail from './project-detail.js';
import resume from './resume.js';
import roleDetail from './role-detail.js';
import education from './education.js';
import contact from './contact.js';

const registry = {
  home,
  projects,
  'project-detail': projectDetail,
  resume,
  'role-detail': roleDetail,
  education,
  'education-tab': education,
  contact,
};

const notFound = {
  key: () => 'not-found',
  title: () => 'Not found',
  status: () => ({ left: '', right: '' }),
  renderTop: () => '',
  renderTouch: () => '',
  items: () => [],
  defaultCursor: () => null,
  y: () => null,
  hint: () => '',
};

export function getScreen(routeName) {
  return registry[routeName] || notFound;
}
