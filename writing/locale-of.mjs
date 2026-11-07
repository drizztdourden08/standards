/* @layer tooling-scripts @kind logic */
const LOCALE_DIRS = new Set(['locales', 'locale', 'i18n', 'l10n', 'lang', 'langs', 'languages', 'translations']);
const LOCALE_CODE = /^([a-z]{2,3})(?:[-_][A-Za-z0-9]{2,8})*$/;

/**
 * The language of a translation file, read from its path: the folder or file name right after a locales, i18n, lang or
 * translations folder (`src/i18n/locales/it/menu.ts`, `lang/pt-BR.json`). Null when the path names no locale.
 * @param {string | undefined} file
 * @returns {string | null}
 */
const localeOf = (file) => {
  if (!file) return null;
  const parts = file.split(/[\\/]/);
  for (let i = parts.length - 2; i >= 0; i--) {
    if (!LOCALE_DIRS.has(parts[i].toLowerCase())) continue;
    const next = i + 1 === parts.length - 1 ? parts[i + 1].replace(/\..*$/, '') : parts[i + 1];
    const code = LOCALE_CODE.exec(next);
    return code ? code[1] : null;
  }
  return null;
};

/**
 * @param {string | undefined} file
 * @returns {boolean} true for a translation file in a language other than English
 */
const isForeignLocale = (file) => {
  const lang = localeOf(file);
  return lang !== null && lang !== 'en';
};

export { localeOf, isForeignLocale };
