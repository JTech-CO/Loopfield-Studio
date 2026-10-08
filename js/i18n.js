import { entries } from './locales/en.js';
import { entries as curveEntries } from './locales/curves-en.js';
import { entries as planarEntries } from './locales/planar-en.js';
import { entries as spatialEntries } from './locales/spatial-en.js';
import { PRESETS } from './presets.js';

const catalog = new Map([entries, curveEntries, planarEntries, spatialEntries].join('\n').trim().split('\n').filter(Boolean).map(line => {
  const separator = line.indexOf('|');
  return [line.slice(0, separator), line.slice(separator + 1)];
}));
for (const preset of PRESETS) catalog.set(preset.ko, preset.name);
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phrases = new RegExp([...catalog.keys()].sort((a,b) => b.length-a.length).map(escape).join('|'), 'g');
let language = 'en';
try { if (typeof window !== 'undefined' && localStorage.getItem('loopfield.language.v1') === 'ko') language = 'ko'; } catch {}
export const getLanguage = () => language;
export function translate(value, locale = language) {
  return locale === 'en' ? String(value).replace(phrases, match => catalog.get(match)) : String(value);
}

// A presentation-only adapter keeps imported names, editor source, drafts and project
// JSON independent of locale. Remember original DOM values for lossless switching.
const originals = new WeakMap();
const attributes = ['title', 'aria-label', 'placeholder'];
const excluded = 'textarea, script, style, #codeHighlight, #lineNumbers, #projectName';
function present(target, key, read, write) {
  let values = originals.get(target);
  if (!values) originals.set(target, values = new Map());
  const current = read();
  let record = values.get(key);
  if (!record || current !== record.rendered) record = { source: current };
  record.rendered = translate(record.source);
  values.set(key, record);
  if (current !== record.rendered) write(record.rendered);
}
function localize(root) {
  if (root.nodeType === 3) {
    if (!root.parentElement?.closest(excluded)) present(root, 'text', () => root.data, value => root.data = value);
    return;
  }
  if (root.nodeType !== 1 || root.matches(excluded)) return;
  for (const attribute of attributes) if (root.hasAttribute(attribute)) {
    present(root, attribute, () => root.getAttribute(attribute), value => root.setAttribute(attribute, value));
  }
  for (const child of root.childNodes) localize(child);
}
function updateMetadata() {
  document.documentElement.lang = language;
  document.title = language === 'en' ? 'Loopfield Studio | Geometric loop video studio' : 'Loopfield Studio | 기하학 루프 영상 스튜디오';
  const button = document.querySelector('#languageToggle');
  button.textContent = language === 'ko' ? 'EN' : 'KR';
  button.lang = language === 'ko' ? 'en' : 'ko';
  button.setAttribute('aria-label', language === 'ko' ? 'Switch to English' : '한국어로 전환');
  for (const link of document.querySelectorAll('[data-doc]')) link.href = `./docs/${link.dataset.doc}${language === 'ko' ? '-KR' : ''}.md`;
}
export function initLanguage() {
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') for (const child of record.addedNodes) localize(child);
      else localize(record.target);
    }
    observe();
  });
  function observe() { observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes}); }
  function apply() {
    observer.disconnect();
    localize(document.body);
    updateMetadata();
    document.dispatchEvent(new Event('languagechange'));
    observe();
  }
  document.querySelector('#languageToggle').addEventListener('click', () => {
    language = language === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('loopfield.language.v1', language); } catch {}
    apply();
  });
  apply();
}
