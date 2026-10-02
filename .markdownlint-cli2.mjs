/* @layer root-config @kind config */
import { standardsMarkdownlint } from './markdownlint/index.mjs';

export default standardsMarkdownlint({ ignores: ['CHANGELOG.md'], rulesModule: './markdownlint/rules.mjs' });
