/* @layer tooling-scripts @kind constants */
const CORE_COMPONENT_FILES = ['{Name}.css', '{Name}.type.ts', '{Name}.constants.ts', '{Name}.usage.ts'];
const COMPONENT_DIRS = ['behavior', 'sub-components'];
const BEHAVIOR_FILE = /^(?:use[A-Z]\w*|[a-z][a-z0-9-]*)(?:\.type|\.constants)?\.ts$/;
const SUB_COMPONENT_FILE = /^[A-Z]\w*(?:\.tsx|\.type\.ts|\.constants\.ts|\.css)$/;
const CORE_MODULE_FILE = /^(?:[a-z][a-z0-9-]*(?:\.type|\.constants)?\.ts|use[A-Z]\w*\.ts|[A-Z]\w*(?:\.tsx|\.type\.ts|\.constants\.ts|\.css)|index\.ts|augment\.ts|main\.tsx|[a-z][a-z0-9-]*\.(?:html|css))$/;
const CORE_MODULE_LABELS = ['kebab-case.ts', '<subject>.type.ts', '<subject>.constants.ts'];
const SHAPE_SKIP = new Set(['node_modules', 'dist', 'out', 'release', 'coverage', '.brock', 'stories', 'tests']);
const WALK_SKIP = new Set(['node_modules', 'dist', 'out', 'release', 'coverage', '.brock']);
const GENERIC_FOLDERS = new Set(['lib', 'utils', 'helpers', 'misc', 'common']);
const MAX_DEPTH_BELOW_SRC = 5;
const APP_FOLDER = 'apps/';

export { CORE_COMPONENT_FILES, COMPONENT_DIRS, BEHAVIOR_FILE, SUB_COMPONENT_FILE, CORE_MODULE_FILE, CORE_MODULE_LABELS, SHAPE_SKIP, WALK_SKIP, GENERIC_FOLDERS, MAX_DEPTH_BELOW_SRC, APP_FOLDER };
