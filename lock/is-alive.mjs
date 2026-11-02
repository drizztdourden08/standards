/* @layer tooling-scripts @kind logic */
/**
 * @param {number} pid
 * @returns {boolean} whether a process with this pid exists
 */
const isAlive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

export { isAlive };
