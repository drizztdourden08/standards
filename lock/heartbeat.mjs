/* @layer tooling-scripts @kind logic */
import { Worker } from 'node:worker_threads';
import { HEARTBEAT_MS } from './lock.constants.mjs';

const BEAT = `
const { utimesSync } = require('node:fs');
const { workerData } = require('node:worker_threads');
const touch = () => {
  try {
    const now = new Date();
    utimesSync(workerData.file, now, now);
  } catch {
    return;
  }
};
setInterval(touch, workerData.ms);
`;

/**
 * @param {string} file the lock file to keep fresh
 * @returns {() => void} stops the beat
 */
const startHeartbeat = (file) => {
  const worker = new Worker(BEAT, { eval: true, workerData: { file, ms: HEARTBEAT_MS } });
  worker.unref();
  return () => {
    void worker.terminate();
  };
};

export { startHeartbeat };
