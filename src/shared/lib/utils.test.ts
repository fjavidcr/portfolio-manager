import { test } from 'node:test'
import assert from 'node:assert'
import { isValidDocId } from './utils.ts'

test('isValidDocId validates correct IDs', () => {
  assert.strictEqual(isValidDocId('abc123_-'), true)
  assert.strictEqual(isValidDocId('A-B_123'), true)
})

test('isValidDocId rejects invalid characters', () => {
  assert.strictEqual(isValidDocId('abc!123'), false)
  assert.strictEqual(isValidDocId('path/to/doc'), false)
  assert.strictEqual(isValidDocId('..'), false)
  assert.strictEqual(isValidDocId(' '), false)
})

test('isValidDocId rejects empty or null', () => {
  assert.strictEqual(isValidDocId(''), false)
  assert.strictEqual(isValidDocId(null), false)
})

test('isValidDocId respects length limits', () => {
  assert.strictEqual(isValidDocId('a'.repeat(128)), true)
  assert.strictEqual(isValidDocId('a'.repeat(129)), false)
})
