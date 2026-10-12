#!/usr/bin/env node
'use strict';

/**
 * 生成静态托管配置文件 edgeone.json（腾讯 EdgeOne Makers）。
 *
 * 背景：
 *   站点使用 trailingSlash: true，页面地址统一以 / 结尾；
 *   但历史上已被搜索引擎收录、被外部分享的地址是「不带尾斜杠」的旧形态。
 *   平台的边缘路由不会把无尾斜杠的目录地址补成 index.html，而是直接判定找不到页面，
 *   因此需要用 301 把旧地址兜底到新地址。
 *
 * 数据来源：构建产物中的 sitemap.xml（由 @docusaurus/plugin-sitemap 生成），
 *          因此新增、删除文档后无需手工维护重定向列表。
 *
 * 平台限制：redirects 最多 100 条，source / destination 不超过 500 字符。
 *
 * 用法：
 *   node scripts/gen-edgeone-json.js                   默认读取 build/，写入 build/edgeone.json
 *   node scripts/gen-edgeone-json.js --out-dir dist    指定产物目录
 *   node scripts/gen-edgeone-json.js --with-root       额外在项目根目录写一份（导入 Git 仓库部署时需要）
 */

const fs = require('fs');
const path = require('path');

/** 平台限制：redirects 最多 100 条，超出部分平台会拒绝整个配置 */
const MAX_REDIRECTS = 100;

/** 需要剥离的 XML 实体，sitemap 中的地址可能包含 & 等字符 */
const XML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

/**
 * 把 sitemap 中的完整地址转换成「无尾斜杠 → 带尾斜杠」的 301 规则
 * @param {string[]} locs sitemap 中的完整地址
 * @param {{maxRedirects?: number}} [options] 可选配置
 * @returns {{redirects: Array<{source: string, destination: string, statusCode: number}>, skipped: number}}
 */
function collectRedirects(locs, options = {}) {
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  // 用 Map 按 source 去重，同时保留顺序无关的确定性结果
  const unique = new Map();

  for (const loc of locs) {
    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      continue; // 非法地址直接跳过，不能因此中断构建
    }
    if (!pathname || pathname === '/') {
      continue; // 首页本身就是以 / 结尾，不存在旧形态
    }

    const source = pathname.replace(/\/+$/, '');
    if (!source) {
      continue;
    }

    const lastSegment = source.slice(source.lastIndexOf('/') + 1);
    if (lastSegment.includes('.')) {
      continue; // 带扩展名的是静态文件（如 llms.txt），补斜杠会直接破坏访问
    }

    unique.set(source, `${source}/`);
  }

  const all = [...unique].map(([source, destination]) => ({
    source,
    destination,
    statusCode: 301,
  }));

  // 路径越短越可能是入口页、分类页，超出平台上限时优先保留这些
  all.sort((a, b) => a.source.length - b.source.length || a.source.localeCompare(b.source));

  return {
    redirects: all.slice(0, maxRedirects),
    skipped: Math.max(0, all.length - maxRedirects),
  };
}

/**
 * 读取 sitemap.xml 中的所有 <loc> 地址
 * @param {string} sitemapPath sitemap 文件路径
 * @returns {string[]}
 */
function readSitemapLocs(sitemapPath) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [];
  const pattern = /<loc>([\s\S]*?)<\/loc>/g;
  let matched = pattern.exec(xml);
  while (matched !== null) {
    let value = matched[1].trim();
    for (const [entity, char] of Object.entries(XML_ENTITIES)) {
      value = value.split(entity).join(char);
    }
    locs.push(value);
    matched = pattern.exec(xml);
  }
  return locs;
}

/** 解析命令行参数 */
function parseArgs(argv) {
  const options = { outDir: 'build', withRoot: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out-dir' && argv[i + 1]) {
      options.outDir = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.slice('--out-dir='.length);
    } else if (arg === '--with-root') {
      options.withRoot = true;
    }
  }
  return options;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const { outDir, withRoot } = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(projectRoot, outDir);
  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  const targetPath = path.join(outputDir, 'edgeone.json');

  let redirects = [];
  let skipped = 0;

  if (fs.existsSync(sitemapPath)) {
    const { redirects: collected, skipped: dropped } = collectRedirects(readSitemapLocs(sitemapPath));
    redirects = collected;
    skipped = dropped;
  } else {
    console.warn(`[edgeone] 未找到站点地图：${sitemapPath}`);
    console.warn('[edgeone] 本次不会生成旧地址兜底规则，站点仍可正常访问（页面地址已经带尾斜杠）。');
  }

  fs.writeFileSync(targetPath, `${JSON.stringify({ redirects }, null, 2)}\n`, 'utf8');
  console.log(`[edgeone] 已生成 ${targetPath}，包含 ${redirects.length} 条 301 兜底规则`);

  if (skipped > 0) {
    console.warn(`[edgeone] 另有 ${skipped} 条旧地址超出平台 100 条上限，未被写入。`);
    console.warn('[edgeone] 请检查是否可合并文档路径，或改为在平台侧配置重定向。');
  }

  if (withRoot) {
    const rootPath = path.join(projectRoot, 'edgeone.json');
    fs.writeFileSync(rootPath, `${JSON.stringify({ redirects }, null, 2)}\n`, 'utf8');
    console.log(`[edgeone] 已额外生成 ${rootPath}（用于导入 Git 仓库的部署方式，请提交该文件）`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collectRedirects, readSitemapLocs, MAX_REDIRECTS };
