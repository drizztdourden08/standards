/* @layer tooling-scripts @kind logic */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const specsOf = async ({ bin, root, files }) => {
  process.env.VITEST = 'true';
  process.env.TEST = 'true';
  process.env.NODE_ENV ??= 'test';
  const { createVitest } = await import(pathToFileURL(createRequire(bin).resolve('vitest/node')).href);
  const ctx = await createVitest('test', { root, watch: false, run: true, related: files, passWithNoTests: true });
  try {
    const specs = await ctx.getRelevantTestSpecifications([]);
    return [...new Set(specs.map((spec) => spec.moduleId))];
  } finally {
    await ctx.close();
  }
};

const answer = (message) => process.send(message, () => process.exit(0));

process.once('message', async (job) => {
  try {
    answer({ tests: await specsOf(job) });
  } catch (error) {
    answer({ failure: error instanceof Error ? error.message : String(error) });
  }
});
