const test = require('node:test');
const assert = require('node:assert/strict');
const { validateLead } = require('../lib/validateLead');

test('valid name and phone contact passes', () => {
  const result = validateLead({ name: '홍길동', contact: '010-1234-5678', honeypot: '' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.name, '홍길동');
  assert.equal(result.contact, '010-1234-5678');
});

test('phone contact without dashes also passes', () => {
  const result = validateLead({ name: '김철수', contact: '01012345678', honeypot: '' });
  assert.equal(result.valid, true);
});

test('honeypot filled is rejected as spam', () => {
  const result = validateLead({ name: '홍길동', contact: '010-1234-5678', honeypot: 'i am a bot' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('spam_detected'));
});

test('name too short is rejected', () => {
  const result = validateLead({ name: '홍', contact: '010-1234-5678', honeypot: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('invalid_name'));
});

test('missing name is rejected', () => {
  const result = validateLead({ name: '', contact: '010-1234-5678', honeypot: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('invalid_name'));
});

test('invalid contact format is rejected', () => {
  const result = validateLead({ name: '홍길동', contact: '전화번호아님', honeypot: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('invalid_contact'));
});

test('trims whitespace from name and contact', () => {
  const result = validateLead({ name: '  홍길동  ', contact: '  010-1234-5678  ', honeypot: '' });
  assert.equal(result.name, '홍길동');
  assert.equal(result.contact, '010-1234-5678');
});
