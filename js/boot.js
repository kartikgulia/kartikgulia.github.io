// Boot sequence — SPEC §8.8
import { prefersReducedMotion } from './util.js';
import { getState, setState, persistBooted } from './state.js';
import { playSound } from './audio.js';
import { setBootSkipHandler } from './input.js';

const screenTop = document.getElementById('screen-top');
const screenTouch = document.getElementById('screen-touch');
const statusLeft = document.getElementById('status-top-left');
const statusRight = document.getElementById('status-top-right');

let timers = [];
let done = false;
let finishCallback = null;
let coverTop = null;
let coverTouch = null;

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

function isDeepLink() {
  const h = window.location.hash;
  return h && h !== '#/' && h !== '#';
}

export function runBoot(afterBoot) {
  finishCallback = afterBoot;
  const reduced = prefersReducedMotion();
  const alreadyBooted = getState().booted;

  if (reduced || alreadyBooted || isDeepLink()) {
    persistBooted();
    setState({ booted: true });
    afterBoot();
    return;
  }

  setBootSkipHandler(() => finish());
  play();
}

function finish() {
  if (done) return;
  done = true;
  clearTimers();
  if (coverTop) { coverTop.remove(); coverTop = null; }
  if (coverTouch) { coverTouch.remove(); coverTouch = null; }
  screenTop.classList.remove('boot-hide-body');
  screenTouch.classList.remove('boot-hide-body');
  persistBooted();
  setState({ booted: true });
  setBootSkipHandler(null);
  if (finishCallback) finishCallback();
}

function makeCover(nameForBrand) {
  const el = document.createElement('div');
  el.className = 'boot-screen boot-screen--off';
  return el;
}

function play() {
  screenTop.classList.add('boot-hide-body');
  screenTouch.classList.add('boot-hide-body');
  statusLeft.textContent = '';
  statusRight.textContent = '';

  coverTop = makeCover();
  coverTouch = makeCover();
  screenTop.appendChild(coverTop);
  screenTouch.appendChild(coverTouch);

  timers.push(setTimeout(() => {
    coverTop.classList.remove('boot-screen--off');
    coverTop.classList.add('boot-flicker');
  }, 250));

  timers.push(setTimeout(() => {
    coverTouch.classList.remove('boot-screen--off');
    coverTouch.classList.add('boot-flicker');
  }, 310));

  timers.push(setTimeout(() => {
    coverTop.remove();
    coverTop = null;
    screenTop.classList.remove('boot-hide-body');
    statusLeft.textContent = 'booting…';
    screenTop.querySelector('.portrait, .portrait-fallback')?.classList.add('boot-portrait-draw');
  }, 450));

  timers.push(setTimeout(() => {
    coverTouch.innerHTML = '';
    coverTouch.classList.remove('boot-flicker');
    const profile = (window.__hpContent && window.__hpContent.profile) || {};
    const brand = document.createElement('div');
    brand.className = 'boot-brand boot-fade-in';
    brand.textContent = `${profile.name || '[YOUR NAME]'}'s portfolio`;
    coverTouch.appendChild(brand);
    timers.push(setTimeout(() => {
      const loader = document.createElement('div');
      loader.className = 'boot-loader';
      loader.innerHTML = '<span></span><span></span><span></span>';
      coverTouch.appendChild(loader);
    }, 300));
  }, 510));

  timers.push(setTimeout(() => {
    if (coverTouch) { coverTouch.remove(); coverTouch = null; }
    screenTouch.classList.remove('boot-hide-body');
    screenTouch.querySelectorAll('.tile').forEach((el, i) => {
      el.classList.add('boot-tile-in');
      el.style.animationDelay = `${i * 40}ms`;
    });
    if (getState().settings.sound) playSound('boot', true);
  }, 1250));

  timers.push(setTimeout(() => finish(), 1500));
}
