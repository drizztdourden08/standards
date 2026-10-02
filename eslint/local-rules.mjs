/* @layer tooling-scripts @kind logic */
import { noRawHtml } from './rules/no-raw-html.mjs';
import { noRawColor } from './rules/no-raw-color.mjs';
import { noInlineStyle } from './rules/no-inline-style.mjs';
import { noAsElementWithPrimitive } from './rules/no-as-element-with-primitive.mjs';
import { noStaticInlineStyle } from './rules/no-static-inline-style.mjs';
import { noEmDash, noSmartPunctuation, noSlopProse } from './rules/slop-rule.mjs';
import { noComments } from './rules/no-comments.mjs';
import { noSlopIdentifiers } from './rules/no-slop-identifiers.mjs';
import { exportsLast } from './rules/exports-last.mjs';
import { oneComponentPerFile } from './rules/one-component-per-file.mjs';
import { oneExportPerFile } from './rules/one-export-per-file.mjs';
import { typesInTypeFile } from './rules/types-in-type-file.mjs';
import { constantsInConstantsFile } from './rules/constants-in-constants-file.mjs';
import { hookFileNamedAfterHook } from './rules/hook-file-named-after-hook.mjs';
import { cssBesideComponent } from './rules/css-beside-component.mjs';
import { noCrossPackageRelative, noDeepPackageImport, noGenericFolderNames } from './rules/boundaries.mjs';
import { fileHeader } from './rules/file-header.mjs';

const LOCAL_RULES = {
  'no-raw-html': noRawHtml,
  'no-raw-color': noRawColor,
  'no-inline-style': noInlineStyle,
  'no-as-element-with-primitive': noAsElementWithPrimitive,
  'no-static-inline-style': noStaticInlineStyle,
  'no-em-dash': noEmDash,
  'no-smart-punctuation': noSmartPunctuation,
  'no-slop-prose': noSlopProse,
  'no-comments': noComments,
  'no-slop-identifiers': noSlopIdentifiers,
  'exports-last': exportsLast,
  'one-component-per-file': oneComponentPerFile,
  'one-export-per-file': oneExportPerFile,
  'types-in-type-file': typesInTypeFile,
  'constants-in-constants-file': constantsInConstantsFile,
  'hook-file-named-after-hook': hookFileNamedAfterHook,
  'css-beside-component': cssBesideComponent,
  'no-cross-package-relative': noCrossPackageRelative,
  'no-deep-package-import': noDeepPackageImport,
  'no-generic-folder-names': noGenericFolderNames,
  'file-header': fileHeader,
};

const LOCAL_PLUGIN = { meta: { name: '@drizztdourden08/standards' }, rules: LOCAL_RULES };

export { LOCAL_RULES, LOCAL_PLUGIN };
