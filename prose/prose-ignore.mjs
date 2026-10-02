/* @layer tooling-scripts @kind logic */
const ENTRY = /^(\S+)\s+(.+)$/;

const globToRegExp = (glob) => {
  const source = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.*/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
  return new RegExp(`^${source}$`);
};

/**
 * @param {string} text
 * @returns {{ matchers: ((file: string) => boolean)[], problems: string[] }}
 */
const readProseIgnore = (text) => {
  const matchers = [];
  const problems = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const entry = ENTRY.exec(line);
    if (!entry) {
      problems.push(`line ${index + 1}: "${line}" has no why. Write "<glob>  <why this file is skipped>".`);
      return;
    }
    const re = globToRegExp(entry[1]);
    matchers.push((file) => re.test(file));
  });
  return { matchers, problems };
};

export { readProseIgnore };
