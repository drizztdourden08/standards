/* @layer tooling-scripts @kind constants */
const TEST_TAGS = [
  { name: 'critical', description: 'Fast pure checks of a rule. No child process, network, build or timer. Runs on every test run.', timeout: 5000 },
  { name: 'standard', description: 'Component, integration and failure path tests with in-memory fakes. Runs in the PR gate.', timeout: 30000 },
  { name: 'e2e', description: 'Real app, real tools, real build. One at a time. Runs for a release or a special occasion.', timeout: 120000, concurrent: false },
];

const TAG_NAMES = TEST_TAGS.map((tag) => tag.name);

export { TEST_TAGS, TAG_NAMES };
