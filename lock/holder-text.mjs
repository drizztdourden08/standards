/* @layer tooling-scripts @kind logic */

const heldFor = (holder) => {
  const since = Date.parse(holder.startedAt);
  return Number.isNaN(since) ? '' : `, held for ${Math.round((Date.now() - since) / 1000)}s`;
};

const oneHolder = ({ slot, holder }) => (holder ? `${slot}: pid ${holder.pid} (${holder.command} in ${holder.root}${heldFor(holder)})` : `${slot}: unreadable holder`);

/**
 * @param {{ slot: string, holder?: object }[]} busy
 * @returns {string} every holder: slot, pid and job text
 */
const holdersText = (busy) => busy.map(oneHolder).join('; ');

export { holdersText };
