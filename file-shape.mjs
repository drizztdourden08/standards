/* @layer tooling-scripts @kind config */
const FILE_KIND = {
  barrel: /(^|\/)index\.ts$/,
  types: /\.type\.ts$|(^|\/)augment\.ts$|\.d\.ts$/,
  constants: /\.constants\.ts$/,
  component: /\.tsx$/,
  story: /\.stories\.tsx?$|(^|\/)stories\//,
  test: /\.test\.tsx?$|(^|\/)tests\//,
  config: /\.config\.(?:ts|mjs|cjs|js)$|(^|\/)brock\.config\.ts$/,
  entry: /(^|\/)(?:main|preload|splash)\.tsx?$/,
};

const SHAPE_OFF_KINDS = ['story', 'test', 'config'];
const ONE_EXPORT_EXEMPT = ['barrel', 'types', 'constants', 'story', 'test', 'config'];
const GLOBAL_STYLESHEET = /(^|\/)(?:theme|tokens|reset|fonts)[^/]*\.css$|\/(?:theme|tokens)\//;
const UPPER_SNAKE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$|^[A-Z]{2,}[A-Z0-9]*$/;
const HOOK_NAME = /^use[A-Z]\w*$/;
const COMPONENT_NAME = /^[A-Z]\w*$/;

const normalize = (file) => file.replace(/\\/g, '/');

const kindsOf = (file) => {
  const path = normalize(file);
  return Object.entries(FILE_KIND).filter(([, re]) => re.test(path)).map(([kind]) => kind);
};

const hasKind = (file, kinds) => kindsOf(file).some((kind) => kinds.includes(kind));

const baseNameOf = (file) => normalize(file).split('/').at(-1)?.replace(/\.[^.]+$/, '') ?? '';

const typeFileFor = (file) => `${baseNameOf(file)}.type.ts`;
const constantsFileFor = (file) => `${baseNameOf(file)}.constants.ts`;

export { FILE_KIND, SHAPE_OFF_KINDS, ONE_EXPORT_EXEMPT, GLOBAL_STYLESHEET, UPPER_SNAKE, HOOK_NAME, COMPONENT_NAME, normalize, kindsOf, hasKind, baseNameOf, typeFileFor, constantsFileFor };
