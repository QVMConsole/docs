'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mdxToMarkdown, stripFrontmatter } = require('../mdx-to-md');

test('剥离 frontmatter 并保留正文标题', async () => {
  const src = `---
sidebar_position: 2
title: 基础配置
description: 说明
---
# 基础配置

正文内容。`;
  const md = await mdxToMarkdown(src, { title: '基础配置', footer: false });
  assert.ok(!md.includes('sidebar_position'), '不应残留 frontmatter 字段');
  assert.ok(!md.includes('description: 说明'), '不应残留 frontmatter description');
  assert.ok(md.startsWith('# 基础配置'), '应以一级标题开头');
  assert.ok(md.includes('正文内容。'));
});

test('删除 import 语句', async () => {
  const src = `---
title: 部署
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import AgreementGate from '@site/src/components/AgreementGate';

# 部署

正文。`;
  const md = await mdxToMarkdown(src, { title: '部署', footer: false });
  assert.ok(!md.includes('import '), '不应残留 import 语句');
  assert.ok(md.includes('正文。'));
});

test('Tabs 展平为 ### 标签标题（嵌套场景）', async () => {
  const src = `---
title: 示例
---
# 示例

<Tabs groupId="a" defaultValue="x">
  <TabItem value="x" label="选项X">
外层内容。

<Tabs>
  <TabItem value="x" label="内层A">
内层A内容。
  </TabItem>
  <TabItem value="y" label="内层B">
内层B内容。
  </TabItem>
</Tabs>
  </TabItem>
  <TabItem value="y" label="选项Y">
外层Y内容。
  </TabItem>
</Tabs>

结尾。`;
  const md = await mdxToMarkdown(src, { title: '示例', footer: false });
  assert.ok(md.includes('### 选项X'), '外层 TabItem 应生成三级标题');
  assert.ok(md.includes('### 选项Y'), '第二个 TabItem 应生成三级标题');
  assert.ok(md.includes('### 内层A'), '嵌套 TabItem 应生成三级标题');
  assert.ok(md.includes('### 内层B'), '嵌套第二个 TabItem 应生成三级标题');
  assert.ok(md.includes('外层内容。'));
  assert.ok(md.includes('内层A内容。'));
  assert.ok(md.includes('内层B内容。'));
  assert.ok(md.includes('外层Y内容。'));
  assert.ok(md.includes('结尾。'));
  assert.ok(!md.includes('<Tabs'), '不应残留 JSX 标签');
  assert.ok(!md.includes('</TabItem>'), '不应残留 TabItem 闭合标签');
});

test('admonition ::: 提示块转为引用块', async () => {
  const src = `---
title: 测试
---
# 测试

:::tip[建议]
建议建立统一规范。
:::

:::warning[注意]
这是一个警告。
:::

正文。`;
  const md = await mdxToMarkdown(src, { title: '测试', footer: false });
  assert.ok(md.includes('> **建议**'), 'tip 应转为带加粗标题的引用块');
  assert.ok(md.includes('建议建立统一规范。'));
  assert.ok(md.includes('> **注意**'), 'warning 应转为引用块');
  assert.ok(md.includes('这是一个警告。'));
});

test('GFM 表格保留', async () => {
  const src = `---
title: 表格
---
# 表格

| 规则 | 说明 |
|------|------|
| **唯一性** | 同一主机唯一 |
| 长度 | 最大 63 |
`;
  const md = await mdxToMarkdown(src, { title: '表格', footer: false });
  assert.ok(/\|\s*规则\s*\|\s*说明\s*\|/.test(md), '表头应保留（GFM 会对齐空格）');
  assert.ok(/\|\s*\*\*唯一性\*\*\s*\|\s*同一主机唯一\s*\|/.test(md), '数据行应保留');
});

test('mermaid 代码围栏原样保留', async () => {
  const src = `---
title: 图
---
# 图

\`\`\`mermaid
graph TD
    A[节点] --> B[节点2]
\`\`\`
`;
  const md = await mdxToMarkdown(src, { title: '图', footer: false });
  assert.ok(md.includes('```mermaid'), 'mermaid 围栏保留');
  assert.ok(md.includes('graph TD'), 'mermaid 内容保留');
});

test('未知 JSX 组件展开保留内容 + img 转换', async () => {
  const src = `---
title: 组件
---
# 组件

<AgreementGate>
需要同意的内容。
</AgreementGate>

行内图片：<img src="/img/icon.png" alt="图标" data-no-zoom />
`;
  const md = await mdxToMarkdown(src, { title: '组件', footer: false });
  assert.ok(md.includes('需要同意的内容。'), 'AgreementGate 内容应保留');
  assert.ok(!md.includes('AgreementGate'), '不应残留组件标签');
  assert.ok(md.includes('[图标](/img/icon.png)'), 'inline img 应转为 markdown 链接');
});

test('缺少一级标题时自动补 # 标题，并可追加原文脚注', async () => {
  const src = `---
title: 无标题正文
---
直接开始的正文。`;
  const md = await mdxToMarkdown(src, {
    title: '无标题正文',
    permalink: '/docs/tech/foo',
    footer: true,
  });
  assert.ok(md.startsWith('# 无标题正文'), '应自动补充一级标题');
  assert.ok(md.includes('/docs/tech/foo'), '脚注应包含原文路径');
});

test('stripFrontmatter 兼容无 frontmatter 的文档', () => {
  assert.equal(stripFrontmatter('# 只有标题\n\n正文'), '# 只有标题\n\n正文');
  assert.equal(stripFrontmatter('---\na: b\n---\n\n# 标题\n'), '# 标题\n');
});

test('HTML 注释被移除（代码围栏内的保留）', async () => {
  const src = `---
title: 注释
---
# 注释

<!-- 此处展示架构图 -->

正文一段。

\`\`\`html
<!-- 代码示例中的注释应保留 -->
<div>x</div>
\`\`\`
`;
  const md = await mdxToMarkdown(src, { title: '注释', footer: false });
  assert.ok(md.includes('正文一段。'), '注释移除后正文应保留');
  assert.ok(!md.includes('此处展示架构图'), 'HTML 注释应被移除');
  assert.ok(md.includes('<!-- 代码示例中的注释应保留 -->'), '代码围栏内的注释应保留');
});

test(':::name 标题 空格写法归一化为引用块（围栏内不受影响）', async () => {
  const src = `---
title: 提示
---
# 提示

:::tip 操作提示
保存后自动生效。
:::

:::note
无标题提示块。
:::

\`\`\`text
:::warning 这是代码示例，不应转换
\`\`\`
`;
  const md = await mdxToMarkdown(src, { title: '提示', footer: false });
  assert.ok(md.includes('> **操作提示**'), '空格标题式应转为带加粗标题的引用块');
  assert.ok(md.includes('保存后自动生效。'));
  assert.ok(md.includes('> **备注**'), '无标题时用指令名对应的中文作标题');
  assert.ok(md.includes('无标题提示块。'));
  assert.ok(md.includes(':::warning 这是代码示例，不应转换'), '代码围栏内的 :: 原样保留');
});