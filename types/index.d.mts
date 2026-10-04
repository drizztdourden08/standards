/* @layer tooling-scripts @kind types */
import type { Linter } from 'eslint';

export type PackageKind = 'app' | 'package';

export interface StructureContext {
  rootDir: string;
  packageDir: string;
  label: string;
  pkg: Record<string, unknown>;
  kind: PackageKind;
}

export type StructureCheckResult = string[] | { findings?: string[]; notes?: string[] };

export interface ComponentFile {
  /** a file name with {Name} standing for the component folder name */
  file: string;
  /** required in every component folder outside sub-components/ */
  required?: boolean;
  /** printed after a missing required file */
  reason?: string;
}

export interface ModuleFile {
  pattern: RegExp;
  /** how the finding names this file form, e.g. <id>.task.ts */
  label?: string;
}

export interface StructureFacet {
  componentFiles?: ComponentFile[];
  moduleFiles?: (RegExp | ModuleFile)[];
  ownedDirs?: (packageDir: string) => string[];
  checks?: ((ctx: StructureContext) => StructureCheckResult | Promise<StructureCheckResult>)[];
  /** a file whose presence makes a workspace folder an app, e.g. brock.config.ts */
  appMarkers?: string[];
}

/** what an options function receives */
export interface OptionsContext {
  /** the rootDir given to the factory, else the nearest standards.config.mjs or pnpm-workspace.yaml above the working folder */
  rootDir: string;
  /** the packageDir given to the factory, else the workspace package below rootDir that holds the working folder */
  packageDir?: string;
}

/** plain options, or a function of the run that returns them */
export type FacetOptions<T> = Partial<T> | ((ctx: OptionsContext) => Partial<T>);

export interface EslintFacet {
  plugins?: Record<string, unknown>;
  rules?: Linter.RulesRecord;
  configs?: Linter.Config[];
  /** merged into the factory options: arrays join, rawControls and consoleGlobs replace */
  options?: FacetOptions<EslintOptions>;
}

export interface StylelintFacet {
  plugins?: string[];
  rules?: Record<string, unknown>;
  options?: FacetOptions<StylelintOptions>;
}

export interface MarkdownlintFacet {
  customRules?: unknown[];
  config?: Record<string, unknown>;
}

export interface ProseFacet {
  banned?: string[];
  allow?: string[];
}

export interface Extension {
  id: string;
  description?: string;
  structure?: StructureFacet;
  eslint?: EslintFacet;
  stylelint?: StylelintFacet;
  markdownlint?: MarkdownlintFacet;
  prose?: ProseFacet;
  knip?: KnipFacet;
}

/** turns a source file into the text knip reads, e.g. example imports into re-exports */
export type KnipCompiler = (text: string, path: string) => string;

export interface KnipFacet {
  /** by file extension, with or without the dot; the compilers of several extensions for one key run in load order */
  compilers?: Record<string, KnipCompiler>;
  /** joined into the knip.json entry list, and into each workspace that lists its own entry (packageDir is then that workspace) */
  entry?: string[] | ((ctx: OptionsContext) => string[]);
}

export type PresetName = 'base' | 'library' | 'design-system' | 'react-app';

export interface StandardsConfig {
  presets?: (PresetName | string)[];
  extensions?: (string | Extension)[];
  /** false turns off loading extensions declared by dependencies */
  discover?: boolean;
  options?: {
    scope?: string;
    tokens?: string[];
    allow?: string[];
    banned?: string[];
    eslint?: Partial<EslintOptions>;
    stylelint?: Partial<StylelintOptions>;
    markdownlint?: Record<string, unknown>;
    lint?: { stylelint?: string[]; skip?: ('typecheck' | 'eslint' | 'stylelint' | 'prose' | 'knip' | 'jscpd')[] };
  };
}

export interface Justified {
  files: string[];
  why: string;
}

export interface Loading {
  rootDir?: string;
  packageDir?: string;
  presets?: string[];
  extensions?: (string | Extension)[];
  discover?: boolean;
}

export interface EslintOptions extends Loading {
  allow?: string[];
  banned?: string[];
  ignores?: string[];
  boundaries?: boolean;
  typed?: boolean;
  extra?: Linter.Config[];
  primitivesGlobs?: string[];
  rawColorOffGlobs?: string[];
  consoleGlobs?: string[];
  defaultExportGlobs?: string[];
  inlineStyle?: Justified[];
  doubleCast?: Justified[];
  glyphContent?: Justified[];
  shapeOff?: Justified[];
  comments?: { allow?: string[] };
  rawControls?: { selector: string; message: string }[];
  fileKinds?: Record<string, string | string[]>;
  oneExportExempt?: string[];
}

export interface StylelintOptions extends Loading {
  uiGlobs?: string[];
  tokenGlobs?: string[];
  rawValueGlobs?: string[];
  exemptGlobs?: string[];
  tokens?: string[];
  commentAllow?: string;
  ignoreFiles?: string[];
  rules?: Record<string, unknown>;
}

export declare const defineExtension: (extension: Extension) => Extension;
export declare const defineStandards: (config: StandardsConfig) => StandardsConfig;
export declare const loadStandards: (input?: Loading) => { rootDir: string; context: OptionsContext; options: NonNullable<StandardsConfig['options']>; extensions: Extension[] };
export declare const facetOptions: (extensions: Extension[], name: 'eslint' | 'stylelint', ctx?: OptionsContext) => Record<string, unknown>;
export declare const findRoot: (fromDir?: string) => string;
export declare const discoverExtensions: (rootDir: string) => string[];
