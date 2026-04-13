/**
 * Shared protocol constants and validation for the live variant mode.
 * Imported by both server.mjs and poll.mjs.
 */

// Browser → Server event types
export const EVENT = Object.freeze({
  GENERATE: 'generate',
  ACCEPT: 'accept',
  DISCARD: 'discard',
  EXIT: 'exit',
});

// Server → Browser message types
export const MSG = Object.freeze({
  AUTH_OK: 'auth_ok',
  AUTH_FAIL: 'auth_fail',
  GENERATING: 'generating',
  DONE: 'done',
  ERROR: 'error',
});

// Poll return types (superset of EVENT — adds timeout)
export const POLL = Object.freeze({
  ...EVENT,
  TIMEOUT: 'timeout',
});

// Commands that make sense for visual variant generation.
// Shown in the browser action panel dropdown.
export const VISUAL_ACTIONS = Object.freeze([
  'impeccable',  // default: freeform design pass
  'bolder',
  'quieter',
  'distill',
  'polish',
  'typeset',
  'colorize',
  'layout',
  'adapt',
  'animate',
  'delight',
  'overdrive',
]);

/**
 * Validate a browser event before queuing it for the agent.
 * Returns null if valid, or an error string if not.
 */
export function validateEvent(msg) {
  if (!msg || typeof msg !== 'object' || !msg.type) {
    return 'Missing or invalid message';
  }

  switch (msg.type) {
    case EVENT.GENERATE:
      if (!msg.id || typeof msg.id !== 'string') return 'generate: missing id';
      if (!msg.action || !VISUAL_ACTIONS.includes(msg.action)) return `generate: invalid action "${msg.action}"`;
      if (!Number.isInteger(msg.count) || msg.count < 1 || msg.count > 8) return 'generate: count must be 1-8';
      if (!msg.element || typeof msg.element !== 'object') return 'generate: missing element context';
      if (!msg.element.outerHTML) return 'generate: element must include outerHTML';
      return null;

    case EVENT.ACCEPT:
      if (!msg.id || typeof msg.id !== 'string') return 'accept: missing id';
      if (!msg.variantId) return 'accept: missing variantId';
      return null;

    case EVENT.DISCARD:
      if (!msg.id || typeof msg.id !== 'string') return 'discard: missing id';
      return null;

    case EVENT.EXIT:
      return null;

    default:
      return `Unknown event type: "${msg.type}"`;
  }
}
