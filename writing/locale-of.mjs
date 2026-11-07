/* @layer tooling-scripts @kind logic */
const LOCALE_DIRS = new Set(['locales', 'locale', 'i18n', 'l10n', 'lang', 'langs', 'languages', 'translations']);
const LOCALE_CODE = /^([a-z]{2,3})(?:[-_][A-Za-z0-9]{2,8})*$/;

/**
 * @param {string | undefined} file
 * @returns {string | null} the language a translation file is in
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

export { localeOf };
