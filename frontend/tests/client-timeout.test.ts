import assert from 'node:assert/strict';
import { createClientTimeoutSignal } from '../src/services/api/request-timeout.ts';

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const timeout = createClientTimeoutSignal(undefined, 10);
await delay(20);
assert.equal(timeout.signal.aborted, true);
assert.equal(timeout.didTimeout(), true);
timeout.cleanup();

const manualController = new AbortController();
const manual = createClientTimeoutSignal(manualController.signal, 100);
manualController.abort();
assert.equal(manual.signal.aborted, true);
assert.equal(manual.didTimeout(), false);
manual.cleanup();

const cleaned = createClientTimeoutSignal(undefined, 10);
cleaned.cleanup();
await delay(20);
assert.equal(cleaned.signal.aborted, false);
assert.equal(cleaned.didTimeout(), false);

console.log('Client timeout behavior, composition, and cleanup checks passed.');
