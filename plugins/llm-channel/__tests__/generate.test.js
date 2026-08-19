'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  generate,
  cleanStale,
  collectDocs,
  articleRelPath,
  buildCatalogText,
  buildIndexJson,
  extractHeadings,
  excerptFromMarkdown,
} = require('../generate');

function fakeAllContent() {
  return {
    'docusaurus-plugin-content-docs': {
      install: {
        loadedVersions: [
          {
            versionName: 'current',
            docs: [
              {
                id: 'deploy',
                title: '部署',
                description: '多平台安装部署说明',
                permalink: '/docs/install/deploy',
                source: '@site/docs-install/deploy.mdx',
                sidebarPosition: 1,
                frontMatter: { keywords: ['安装', '部署'] },
              },
            ],
          },
        ],
      },
      tech: {
        loadedVersions: [
          {
            versionName: 'current',
            docs: [
              {
                id: 'virtual-machine/basic-config',
                title: '基础配置',
                description: '虚拟机基础信息配置',
                permalink: '/docs/tech/virtual-machine/basic-config',
                source: '@site/docs/virtual-machine/basic-config.mdx',
                sidebarPosition: 2,
                frontMatter: {},
              },
              {
                id: 'firewall/host-firewall',
                title: '宿主机防火墙',
                description: '',
                permalink: '/docs/tech/firewall/host-firewall',
                source: '@site/docs/firewall/host-firewall.mdx',
                sidebarPosition: undefined,
                frontMatter: {},
              },
            ],
          },
        ],
      },
    },
  };
}

test('collectDocs 按实例收集并自动排除 drafts', () => {
  const all = fakeAllContent();
  all['docusaurus-plugin-content-docs'].tech.loadedVersions[0].drafts = [
    { id: 'under-dev', title: '未完成' },
  ];
  const items = collectDocs(all);
  const ids = items.map((i) => `${i.instanceId}/${i.doc.id}`);
  assert.deepEqual(ids, [
    'install/deploy',
    'tech/virtual-machine/basic-config',
    'tech/firewall/host-firewall',
  ]);
  assert.ok(!ids.some((id) => id.includes('under-dev')), 'draft 不应被收录');
});

test('articleRelPath 生成 /llm/实例/文档id.md', () => {
  const [install] = collectDocs(fakeAllContent());
  assert.equal(articleRelPath(install), '/llm/install/deploy.md');
  const tech = collectDocs(fakeAllContent())[1];
  assert.equal(articleRelPath(tech), '/llm/tech/virtual-machine/basic-config.md');
});

test('buildCatalogText 分组、排序并包含描述/关键词/小标题', () => {
  const articles = [
    {
      instanceId: 'tech',
      docId: 'firewall/host-firewall',
      title: '宿主机防火墙',
      description: '基于 UFW 的宿主机入站端口规则管理',
      keywords: ['防火墙', 'UFW'],
      href: '/llm/tech/firewall/host-firewall.md',
      pagePath: '/docs/tech/firewall/host-firewall',
      headings: ['运行状态信息', '开启防火墙'],
    },
    {
      instanceId: 'install',
      docId: 'deploy',
      title: '部署',
      description: '多平台安装部署说明',
      keywords: ['安装', '部署'],
      href: '/llm/install/deploy.md',
      pagePath: '/docs/install/deploy',
      headings: ['部署准备'],
    },
  ];
  const text = buildCatalogText(articles, {
    instanceLabels: { install: '安装与使用', tech: '功能与原理' },
  });
  assert.ok(text.startsWith('# QVMConsole 文档'), '目录应以站点标题开头');
  assert.ok(text.includes('### 安装与使用'), '应使用实例中文标签分组');
  assert.ok(text.includes('### 功能与原理'));
  assert.ok(text.includes('- [部署](/llm/install/deploy.md): 多平台安装部署说明'));
  assert.ok(text.includes('（关键词：安装、部署）'));
  assert.ok(text.includes('  - 部署准备'), '小标题应以缩进子项出现');
  assert.ok(text.includes('/llm/tech/firewall/host-firewall.md'));
});

test('buildIndexJson 输出机器可读结构', () => {
  const articles = [
    {
      instanceId: 'tech',
      docId: 'virtual-machine/basic-config',
      title: '基础配置',
      description: '基础信息',
      keywords: [],
      href: '/llm/tech/virtual-machine/basic-config.md',
      pagePath: '/docs/tech/virtual-machine/basic-config',
      headings: ['配置项概览'],
    },
  ];
  const json = JSON.parse(buildIndexJson(articles, '2026-08-19T00:00:00Z'));
  assert.equal(json.version, 1);
  assert.equal(json.articles[0].url, '/llm/tech/virtual-machine/basic-config.md');
  assert.equal(json.articles[0].id, 'tech/virtual-machine/basic-config');
});

test('extractHeadings 只取 h2/h3 并清理行内格式', () => {
  const md = `# 标题
## 配置项概览
### 命名规则
#### 四级不收集
## 备注信息
普通段落`;
  assert.deepEqual(extractHeadings(md, 20), ['配置项概览', '命名规则', '备注信息']);
  const capped = extractHeadings(md, 2);
  assert.equal(capped.length, 2);
});

test('excerptFromMarkdown 提取首个正文段落', () => {
  const md = `# 标题

## 章节

这是**第一段**正文，包含 \`代码\` 与 [链接](/x)。

第二段。
`;
  const excerpt = excerptFromMarkdown(md);
  assert.ok(excerpt.includes('这是第一段正文'));
  assert.ok(!excerpt.includes('第二段'), '不应包含第二段');
});

test('cleanStale 删除孤儿文件与空目录', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-clean-'));
  try {
    const sub = path.join(tmp, 'sub');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(tmp, 'a.md'), 'a');
    fs.writeFileSync(path.join(tmp, 'b.md'), 'b');
    fs.writeFileSync(path.join(sub, 'c.md'), 'c');

    await cleanStale(tmp, ['a.md']);

    assert.ok(fs.existsSync(path.join(tmp, 'a.md')), '期望保留的文件应存在');
    assert.ok(!fs.existsSync(path.join(tmp, 'b.md')), '孤儿文件应被删除');
    assert.ok(!fs.existsSync(path.join(sub, 'c.md')), '嵌套孤儿文件应被删除');
    assert.ok(!fs.existsSync(sub), '空目录应被清理');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('cleanStale 保留根目录 index.json', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-clean2-'));
  try {
    fs.writeFileSync(path.join(tmp, 'index.json'), '{}');
    fs.writeFileSync(path.join(tmp, 'stale.md'), 'x');
    fs.mkdirSync(path.join(tmp, 'sub'));
    fs.writeFileSync(path.join(tmp, 'sub', 'keep.md'), 'y');
    await cleanStale(tmp, ['index.json', 'sub/keep.md']);
    assert.ok(fs.existsSync(path.join(tmp, 'index.json')), '根 index.json 应保留');
    assert.ok(fs.existsSync(path.join(tmp, 'sub', 'keep.md')), '嵌套保留项应保留');
    assert.ok(!fs.existsSync(path.join(tmp, 'stale.md')), '孤儿应删除');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('generate 端到端：输出 llms.txt / llm/*.md / index.json 且不误删 index.json', async () => {
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-gen-'));
  try {
    fs.mkdirSync(path.join(siteDir, 'docs-xyz'), {recursive: true});
    fs.writeFileSync(
      path.join(siteDir, 'docs-xyz', 'hello.mdx'),
      '---\ntitle: 你好\n---\n# 你好\n\n正文内容。\n',
    );
    const allContent = {
      'docusaurus-plugin-content-docs': {
        tech: {
          loadedVersions: [
            {
              versionName: 'current',
              docs: [
                {
                  id: 'hello',
                  title: '你好',
                  description: '一段简介',
                  permalink: '/docs/tech/hello',
                  source: '@site/docs-xyz/hello.mdx',
                  frontMatter: {},
                  sidebarPosition: 1,
                },
              ],
            },
          ],
        },
      },
    };
    await generate({siteDir, allContent, options: {instanceLabels: {tech: '功能与原理'}}});
    assert.ok(fs.existsSync(path.join(siteDir, 'static', 'llms.txt')), '应生成 llms.txt');
    assert.ok(
      fs.existsSync(path.join(siteDir, 'static', 'llm', 'tech', 'hello.md')),
      '应生成文章 llm/tech/hello.md',
    );
    assert.ok(
      fs.existsSync(path.join(siteDir, 'static', 'llm', 'index.json')),
      'index.json 不应被误删',
    );
    const catalog = fs.readFileSync(path.join(siteDir, 'static', 'llms.txt'), 'utf8');
    assert.ok(catalog.includes('- [你好](/llm/tech/hello.md)'), '目录应包含文章条目');
  } finally {
    fs.rmSync(siteDir, {recursive: true, force: true});
  }
});