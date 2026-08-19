'use strict';
/**
 * 大模型阅读通道生成器
 *
 * 输入 Docusaurus allContent 中的文档元数据，输出：
 * - static/llms.txt                  全站文章目录（用户统一附加的 URL）
 * - static/llm/<实例>/<文档id>.md    每篇文章的标准 Markdown
 * - static/llm/index.json            机器可读索引
 *
 * 与 Docusaurus 生命周期解耦：导出纯函数便于单元测试。
 */
const path = require('path');
const fs = require('fs/promises');
const { mdxToMarkdown } = require('./mdx-to-md');

const DOCS_PLUGIN_NAME = 'docusaurus-plugin-content-docs';
const SITE_TITLE = 'QVMConsole 文档';

const DEFAULT_OPTIONS = {
  siteUrl: undefined,
  includeHeadings: true,
  maxHeadingsPerDoc: 20,
  articleFooter: true,
  instanceLabels: {},
};

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    instanceLabels: { ...(options.instanceLabels || {}) },
  };
}

/** 把 DocMetadata 的 source（@site 前缀）解析为磁盘绝对路径 */
function resolveSourcePath(siteDir, source) {
  if (typeof source === 'string' && source.startsWith('@site/')) {
    return path.join(siteDir, source.slice('@site/'.length));
  }
  return source;
}

/**
 * 收集全部文章。drafts 在 LoadedVersion 中单独存放（docs 数组已自动排除），
 * unlisted 文档保留收录（内容仍然有效）。
 * @returns {Array<{instanceId:string, versionPrefix:string, doc:object}>}
 */
function collectDocs(allContent) {
  const instances = (allContent && allContent[DOCS_PLUGIN_NAME]) || {};
  const items = [];
  for (const [instanceId, content] of Object.entries(instances)) {
    if (!content || !Array.isArray(content.loadedVersions)) continue;
    const versions = content.loadedVersions;
    const multiVersion = versions.length > 1;
    for (const version of versions) {
      const versionPrefix = multiVersion ? `${version.versionName || 'current'}/` : '';
      for (const doc of version.docs || []) {
        items.push({ instanceId, versionPrefix, doc });
      }
    }
  }
  return items;
}

/** 文章相对路径（URL 形式，始终用正斜杠），如 /llm/tech/virtual-machine/basic-config.md */
function articleRelPath(item) {
  return `/llm/${item.instanceId}/${item.versionPrefix}${item.doc.id}.md`;
}

/** 目录条目链接：配置了 siteUrl 时输出绝对地址，否则输出根相对地址 */
function articleHref(options, relPath) {
  return options.siteUrl ? `${options.siteUrl}${relPath}` : relPath;
}

function normalizeKeywords(frontMatter) {
  const kw = frontMatter && frontMatter.keywords;
  if (Array.isArray(kw)) return kw.map(String);
  if (typeof kw === 'string') return kw.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** 从转换后的 Markdown 提取 h2/h3 小标题（供精确检索） */
function extractHeadings(md, max) {
  const out = [];
  for (const line of md.split('\n')) {
    const m = /^#{2,3}\s+(.+)$/.exec(line);
    if (m) {
      const text = m[1]
        .replace(/`/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\[(.+?)\]\(.*?\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (text && !out.includes(text)) out.push(text);
      if (max && out.length >= max) break;
    }
  }
  return out;
}

/** 提取首段纯文本，作为无 description 时的目录摘要 */
function excerptFromMarkdown(md, max = 220) {
  let paragraph = '';
  for (const line of md.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph) break;
      continue;
    }
    if (/^(#|>|\||[-*+] |```|:::|<)/.test(trimmed)) continue;
    paragraph += trimmed;
    if (paragraph.length >= max) break;
  }
  if (!paragraph) return '';
  return paragraph
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .slice(0, max);
}

/** 生成 /llms.txt 目录文本 */
function buildCatalogText(articles, options) {
  const lines = [
    `# ${SITE_TITLE}`,
    '',
    '> 基于 KVM/QEMU 的轻量级虚拟机管理面板（大模型阅读目录）。',
    '>',
    '> 使用方法：当用户问题涉及本产品的功能、原理或使用说明时，先阅读本目录，',
    '> 依据问题内容在下文条目中选择最匹配的文章，再请求该文章的 URL 获取完整 Markdown 正文；',
    '> 若正文不足以回答，可继续请求其他相关文章。文章 URL 一律以 /llm/ 开头、以 .md 结尾，直接返回标准 Markdown。',
    '',
    '## 文章列表',
    '',
  ];
  const byInstance = new Map();
  for (const article of articles) {
    if (!byInstance.has(article.instanceId)) byInstance.set(article.instanceId, []);
    byInstance.get(article.instanceId).push(article);
  }
  for (const [instanceId, list] of byInstance) {
    const label = options.instanceLabels[instanceId] || instanceId;
    lines.push(`### ${label}`, '');
    for (const a of list) {
      const parts = [`- [${a.title}](${a.href})`];
      if (a.description) parts.push(`: ${a.description}`);
      lines.push(parts.join(''));
      if (a.keywords.length) {
        lines.push(`  （关键词：${a.keywords.join('、')}）`);
      }
      for (const h of a.headings) {
        lines.push(`  - ${h}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

/** 生成 /llm/index.json 内容 */
function buildIndexJson(articles, generatedAt) {
  return JSON.stringify(
    {
      version: 1,
      generatedAt,
      articles: articles.map((a) => ({
        id: `${a.instanceId}/${a.docId}`,
        instance: a.instanceId,
        title: a.title,
        description: a.description,
        keywords: a.keywords,
        url: a.href,
        pagePath: a.pagePath,
        headings: a.headings,
      })),
    },
    null,
    2,
  );
}

/** 幂等写入：内容未变则跳过（避免开发态无谓的浏览器刷新） */
async function writeIdempotent(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  let existing = null;
  try {
    existing = await fs.readFile(filePath, 'utf8');
  } catch {
    // 文件不存在
  }
  if (existing === content) return false;
  await fs.writeFile(filePath, content, 'utf8');
  return true;
}

/** 清理生成目录中已不属于当前文档集的孤儿文件，并删除空目录 */
async function cleanStale(rootDir, expectedRelPaths) {
  let expected;
  try {
    expected = new Set(expectedRelPaths.map((p) => path.normalize(p)));
    await fs.access(rootDir);
  } catch {
    return;
  }
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let nonEmpty = false;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const innerNonEmpty = await walk(full);
        if (!innerNonEmpty) {
          await fs.rmdir(full).catch(() => {});
        } else {
          nonEmpty = true;
        }
      } else {
        const rel = path.relative(rootDir, full);
        if (expected.has(normalizePosix(rel))) {
          nonEmpty = true;
        } else {
          await fs.unlink(full).catch(() => {});
        }
      }
    }
    return nonEmpty;
  }
  await walk(rootDir);
}

function normalizePosix(p) {
  return p.split('/').join(path.sep);
}

/**
 * 主入口：读取文档、转换、写出全部产物。
 * @param {{siteDir:string, allContent:object, options?:object}} args
 */
async function generate({ siteDir, allContent, options }) {
  const opts = normalizeOptions(options);
  const items = collectDocs(allContent);
  const llmRoot = path.join(siteDir, 'static', 'llm');
  const articles = [];
  // 期望清单相对 llmRoot；index.json 位于 llmRoot 根下
  const expectedFiles = ['index.json'];

  for (const item of items) {
    const { doc } = item;
    let md;
    try {
      const sourcePath = resolveSourcePath(siteDir, doc.source);
      const raw = await fs.readFile(sourcePath, 'utf8');
      md = await mdxToMarkdown(raw, {
        title: doc.title || undefined,
        permalink: doc.permalink,
        footer: opts.articleFooter,
      });
    } catch (err) {
      console.warn(`[llm-channel] 转换文档失败，已跳过: ${doc.source} - ${err.message}`);
      continue;
    }

    const relPath = articleRelPath(item);
    const fileRel = normalizePosix(relPath.slice('/llm/'.length)); // 去掉 /llm/ 前缀
    const filePath = path.join(llmRoot, fileRel);
    await writeIdempotent(filePath, md);
    expectedFiles.push(fileRel);

    const frontMatter = doc.frontMatter || {};
    articles.push({
      instanceId: item.instanceId,
      docId: doc.id,
      title: doc.title || frontMatter.title || doc.id,
      description: doc.description || excerptFromMarkdown(md),
      keywords: normalizeKeywords(frontMatter),
      href: articleHref(opts, relPath),
      pagePath: doc.permalink,
      headings: opts.includeHeadings ? extractHeadings(md, opts.maxHeadingsPerDoc) : [],
      sidebarPosition:
        typeof doc.sidebarPosition === 'number' ? doc.sidebarPosition : Number.MAX_SAFE_INTEGER,
    });
  }

  const generatedAt = new Date().toISOString();

  // 目录条目按 (sidebarPosition, id) 排序，保证稳定
  const sortedArticles = articles.sort((x, y) => {
    return x.sidebarPosition - y.sidebarPosition || x.docId.localeCompare(y.docId);
  });

  await writeIdempotent(path.join(siteDir, 'static', 'llms.txt'), buildCatalogText(sortedArticles, opts));
  await writeIdempotent(path.join(llmRoot, 'index.json'), buildIndexJson(sortedArticles, generatedAt));
  await cleanStale(llmRoot, expectedFiles);
}

module.exports = {
  generate,
  cleanStale,
  collectDocs,
  articleRelPath,
  articleHref,
  extractHeadings,
  excerptFromMarkdown,
  buildCatalogText,
  buildIndexJson,
  normalizeOptions,
};