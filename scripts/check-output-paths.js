#!/usr/bin/env node
'use strict';

/**
 * 构建产物路径自检：检查是否生成了**含非 ASCII 字符**的路径。
 *
 * 背景：当前静态托管平台（腾讯 EdgeOne Makers）无法服务路径中含非 ASCII 字符的资源，
 * 表现为返回平台自己的 NOT_FOUND 错误页。这类页面在站内点击可以正常浏览
 * （客户端路由不发服务器请求），但外部直达、搜索引擎进入与刷新都会失败。
 *
 * 常见的两个来源：
 *   1. 分类落地页：`_category_.json` 的 generated-index 未指定 ASCII 的 `link.slug` 时，
 *      路由默认取中文 label，例如 /docs/tech/category/网络；
 *   2. 文档所在目录名是中文：文档 id 会带中文，连带 /llm/*.md 地址也带中文。
 *
 * 因此构建后统一自检，发现问题时打印明确的修复指引。
 * 默认只告警（不阻断发布）；需要严格模式可加 --strict，发现即退出码 1。
 *
 * 用法：
 *   node scripts/check-output-paths.js                默认检查 build/
 *   node scripts/check-output-paths.js --out-dir dist
 *   node scripts/check-output-paths.js --strict       发现问题时退出码 1
 */

const fs = require('fs');
const path = require('path');

/** 单次最多列出的问题路径数量，避免刷屏 */
const MAX_REPORTED = 10;

/**
 * 从相对路径列表中筛出含非 ASCII 字符的路径
 * @param {string[]} relativePaths 相对路径（POSIX 分隔符）
 * @returns {string[]} 含非 ASCII 字符的路径
 */
function findNonAsciiPaths(relativePaths) {
  return relativePaths.filter((item) => /[^\x00-\x7F]/.test(item));
}

/**
 * 递归收集目录下的全部文件（相对 rootDir 的 POSIX 路径）
 * @param {string} rootDir 根目录
 * @returns {string[]}
 */
function collectFiles(rootDir) {
  const result = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        result.push(path.relative(rootDir, full).split(path.sep).join('/'));
      }
    }
  };
  if (fs.existsSync(rootDir)) {
    walk(rootDir);
  }
  return result;
}

/** 解析命令行参数 */
function parseArgs(argv) {
  const options = { outDir: 'build', strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out-dir' && argv[i + 1]) {
      options.outDir = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.slice('--out-dir='.length);
    } else if (arg === '--strict') {
      options.strict = true;
    }
  }
  return options;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const { outDir, strict } = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(projectRoot, outDir);

  if (!fs.existsSync(outputDir)) {
    console.warn(`[check-paths] 构建产物目录不存在，跳过检查：${outputDir}`);
    return;
  }

  const offenders = findNonAsciiPaths(collectFiles(outputDir));

  if (offenders.length === 0) {
    console.log('[check-paths] 构建产物路径全部为 ASCII，未发现线上无法访问的地址');
    return;
  }

  console.warn(`[check-paths] 发现 ${offenders.length} 个含非 ASCII 字符的路径，这些地址在线上会返回错误页：`);
  for (const item of offenders.slice(0, MAX_REPORTED)) {
    console.warn(`  - ${item}`);
  }
  if (offenders.length > MAX_REPORTED) {
    console.warn(`  ...还有 ${offenders.length - MAX_REPORTED} 个`);
  }
  console.warn('[check-paths] 修复方式：');
  console.warn('  1) 分类落地页：在对应 _category_.json 的 link 中补 "slug": "/category/<英文名>"，侧边栏显示名可保持中文；');
  console.warn('  2) 文档目录：把中文目录名改为英文，或给文档加 ASCII 的 slug frontmatter；');
  console.warn('  详见 docs-install/site-guide/deployment-routing.mdx');

  if (strict) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { findNonAsciiPaths, collectFiles };
