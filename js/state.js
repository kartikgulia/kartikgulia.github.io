// Tiny store — SPEC §7.2
import { storage } from './util.js';

const defaultSettings = { darkScreens: false, sound: false };
const defaultSort = { projects: 'newest' };

let state = {
  route: { name: 'home', params: {} },
  cursor: {},
  page: { projects: 0 },
  tab: { education: 'coursework' },
  galleryIndex: {},
  schoolIndex: 0,
  overlay: null,
  settings: storage.get('local', 'hp.settings', defaultSettings),
  sort: storage.get('session', 'hp.sort', defaultSort),
  booted: storage.get('session', 'hp.booted', false),
  firstVisitThisSession: !storage.get('session', 'hp.booted', false),
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  listeners.forEach((fn) => fn(state));
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function persistSettings() {
  storage.set('local', 'hp.settings', state.settings);
}

export function persistSort() {
  storage.set('session', 'hp.sort', state.sort);
}

export function persistBooted() {
  storage.set('session', 'hp.booted', true);
}

export function setCursor(screenKey, itemId) {
  setState({ cursor: { ...state.cursor, [screenKey]: itemId } });
}

export function getCursor(screenKey) {
  return state.cursor[screenKey];
}
