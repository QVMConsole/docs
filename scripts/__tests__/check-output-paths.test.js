'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { findNonAsciiPaths, collectFiles } = require('../check-output-paths');

test('识别含非 ASCII 字符的路径', () => {
  const offenders = findNonAsciiPaths([
    'index.html',
    'docs/tech/workbench/index.html',
    'docs/tech/category/网络/index.html',
    'llm/install/security/内核漏洞/cve-2026-53359.md',
  ]);
  assert.deepEqual(offenders, [
    'docs/tech/category/网络/index.html',
    'llm/install/security/内核漏洞/cve-2026-53359.md',
  ]);
});

test('英文与数字路径不会被误报', () => {
  const offenders = findNonAsciiPaths([
    'docs/install/quick-start/infrastructure-config/index.html',
    'assets/js/main.a1b2c3.js',
    '404.html',
    'llms.txt',
  ]);
  assert.deepEqual(offenders, []);
});

test('collectFiles 递归收集文件并使用 POSIX 分隔符', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-paths-'));
  try {
    fs.mkdirSync(path.join(tmp, 'docs', '网络'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'index.html'), 'x');
    fs.writeFileSync(path.join(tmp, 'docs', '网络', 'index.html'), 'y');
    const files = collectFiles(tmp).sort();
    assert.deepEqual(files, ['docs/网络/index.html', 'index.html']);
    assert.deepEqual(findNonAsciiPaths(files), ['docs/网络/index.html']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('目录不存在时返回空列表而不是抛错', () => {
  assert.deepEqual(collectFiles(path.join(os.tmpdir(), 'check-paths-not-exist-xyz')), []);
});
