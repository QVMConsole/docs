'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { collectRedirects, readSitemapLocs } = require('../gen-edgeone-json');

const SITE = 'https://qvmcdocs.xiaozhuhouses.asia';

test('文档地址生成「无尾斜杠 → 带尾斜杠」的 301 规则', () => {
  const { redirects } = collectRedirects([`${SITE}/docs/install/quick-start/infrastructure-config`]);
  assert.deepEqual(redirects, [
    {
      source: '/docs/install/quick-start/infrastructure-config',
      destination: '/docs/install/quick-start/infrastructure-config/',
      statusCode: 301,
    },
  ]);
});

test('sitemap 中已带尾斜杠的地址同样生成兜底规则', () => {
  const { redirects } = collectRedirects([`${SITE}/docs/install/`]);
  assert.equal(redirects.length, 1);
  assert.equal(redirects[0].source, '/docs/install');
  assert.equal(redirects[0].destination, '/docs/install/');
});

test('首页不生成兜底规则', () => {
  const { redirects } = collectRedirects([`${SITE}/`]);
  assert.deepEqual(redirects, []);
});

test('带扩展名的静态文件不补斜杠', () => {
  const { redirects } = collectRedirects([
    `${SITE}/llms.txt`,
    `${SITE}/sitemap.xml`,
    `${SITE}/404.html`,
    `${SITE}/llm/install/deploy.md`,
  ]);
  assert.deepEqual(redirects, []);
});

test('重复地址只保留一条', () => {
  const { redirects } = collectRedirects([
    `${SITE}/docs/tech/workbench`,
    `${SITE}/docs/tech/workbench/`,
  ]);
  assert.equal(redirects.length, 1);
  assert.equal(redirects[0].source, '/docs/tech/workbench');
});

test('中文地址保持百分号编码，不做解码', () => {
  const encoded = `${SITE}/docs/tech/category/%E7%BD%91%E7%BB%9C`;
  const { redirects } = collectRedirects([encoded]);
  assert.equal(redirects[0].source, '/docs/tech/category/%E7%BD%91%E7%BB%9C');
  assert.equal(redirects[0].destination, '/docs/tech/category/%E7%BD%91%E7%BB%9C/');
});

test('非法地址被跳过且不影响其他地址', () => {
  const { redirects } = collectRedirects(['not-a-url', `${SITE}/docs/install/advanced/mcp-server`]);
  assert.equal(redirects.length, 1);
  assert.equal(redirects[0].source, '/docs/install/advanced/mcp-server');
});

test('超出平台上限时截断并返回被丢弃的数量，短路径优先保留', () => {
  const locs = [`${SITE}/a`, `${SITE}/b`, `${SITE}/c`, `${SITE}/very/long/path/name`];
  const { redirects, skipped } = collectRedirects(locs, { maxRedirects: 2 });
  assert.equal(redirects.length, 2);
  assert.equal(skipped, 2);
  assert.deepEqual(
    redirects.map((item) => item.source),
    ['/a', '/b'],
  );
});

test('能从 sitemap 中读取并还原 XML 实体', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edgeone-'));
  const sitemapPath = path.join(tempDir, 'sitemap.xml');
  fs.writeFileSync(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${SITE}/docs/install/a?x=1&amp;y=2</loc></url><url><loc>${SITE}/docs/tech/</loc></url></urlset>`,
    'utf8',
  );
  const locs = readSitemapLocs(sitemapPath);
  fs.rmSync(tempDir, { recursive: true, force: true });
  assert.deepEqual(locs, [`${SITE}/docs/install/a?x=1&y=2`, `${SITE}/docs/tech/`]);
});
