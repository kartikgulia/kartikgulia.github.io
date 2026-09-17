// Fetch + validate content.json, date formatting, sorting — SPEC §10

export async function loadContent(url = 'content/content.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`content.json: HTTP ${res.status}`);
  const data = await res.json();
  validate(data);
  return data;
}

function validate(data) {
  const warn = (msg) => console.warn(`[content] ${msg}`);

  if (!data || typeof data !== 'object') return warn('content.json is not an object');
  if (!data.profile || !data.profile.name) warn('profile.name is missing');

  const seen = new Set();
  const checkIds = (arr, label) => {
    (arr || []).forEach((item) => {
      if (!item.id) warn(`${label} entry missing id`);
      else if (seen.has(item.id)) warn(`duplicate id "${item.id}" in ${label}`);
      else seen.add(item.id);
    });
  };

  (data.projects || []).forEach((p) => {
    if (!p.id) warn('project missing id');
    if (!p.title) warn(`project "${p.id}" missing title`);
  });
  checkIds(data.projects, 'projects');

  (data.experience || []).forEach((e) => {
    if (!e.id) warn('experience entry missing id');
    if (!e.role) warn(`experience "${e.id}" missing role`);
  });
  checkIds(data.experience, 'experience');

  (data.education || []).forEach((e) => {
    if (!e.id) warn('education entry missing id');
    if (!e.school) warn(`education "${e.id}" missing school`);
  });
  checkIds(data.education, 'education');

  (data.links || []).forEach((l) => {
    if (!l.id) warn('link missing id');
    if (!l.label) warn(`link "${l.id}" missing label`);
  });
}

// ---- Date formatting ----

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthYear(ym) {
  if (!ym) return 'Present';
  const [y, m] = ym.split('-').map(Number);
  if (!y) return ym;
  if (!m) return String(y);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatDateRange(start, end) {
  return `${formatMonthYear(start)} – ${end ? formatMonthYear(end) : 'Present'}`;
}

export function yearOf(ym) {
  if (!ym) return new Date().getFullYear();
  return Number(ym.split('-')[0]);
}

export function yearsBetween(start, end) {
  const s = new Date(`${start}-01`);
  const e = end ? new Date(`${end}-01`) : new Date();
  return (e - s) / (1000 * 60 * 60 * 24 * 365.25);
}

// ---- Sorting ----

export function sortProjects(projects, mode) {
  const arr = [...(projects || [])];
  if (mode === 'featured') {
    arr.sort((a, b) => {
      const f = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (f !== 0) return f;
      return (b.year || 0) - (a.year || 0) || (a.order || 0) - (b.order || 0);
    });
  } else if (mode === 'a-z' || mode === 'a–z') {
    arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    // newest (default)
    arr.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.order || 0) - (b.order || 0));
  }
  return arr;
}

export function nextSortMode(mode) {
  if (mode === 'newest') return 'featured';
  if (mode === 'featured') return 'a-z';
  return 'newest';
}

export function sortModeLabel(mode) {
  if (mode === 'a-z') return 'a–z';
  return mode;
}
