'use strict';
/**
 * MDX → 标准 Markdown 转换器
 *
 * 供「大模型阅读通道」插件使用，把 Docusaurus 的 .mdx 源文档转成干净的、
 * 大模型可直接阅读的标准 Markdown：
 * - 剥离 frontmatter（--- 之间的元数据）
 * - 删除 import / export 语句与 JSX 表达式（{...}）
 * - Tabs 展平：每个 TabItem 前插入 "### 标签" 标题（支持嵌套 Tabs）
 * - 未知 JSX 组件（如 <AgreementGate>）展开并保留内部内容
 * - <img> 转为标准图片语法（无 src 则丢弃）
 * - ::: 提示块（remark-directive）转为 "> **标题**" 引用块
 * - 表格（GFM）、代码围栏、mermaid 代码块原样保留
 */

// remark/unified 系列均为 ESM-only 包，CJS 插件中用动态 import() 加载并缓存
let processorPromise = null;

function getProcessor() {
  if (!processorPromise) {
    processorPromise = Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-mdx'),
      import('remark-gfm'),
      import('remark-directive'),
      import('remark-stringify'),
    ]).then(([unifiedMod, remarkParse, remarkMdx, remarkGfm, remarkDirective, remarkStringify]) =>
      unifiedMod
        .unified()
        .use(remarkParse.default)
        .use(remarkMdx.default)
        .use(remarkGfm.default)
        .use(remarkDirective.default)
        .use(remarkStringify.default),
    );
  }
  return processorPromise;
}

/** 剥离文件头部的 frontmatter 块（并清理其后的空行） */
function stripFrontmatter(source) {
  const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(source);
  return match ? source.slice(match[0].length).replace(/^\r?\n+/, '') : source;
}

/** 移除 MDX 不允许的 HTML 注释（<!-- ... -->）；代码围栏内的注释原样保留 */
function stripHtmlComments(source) {
  const lines = source.split('\n');
  const out = [];
  let inFence = false;
  let inComment = false;
  for (const line of lines) {
    if (/^\s*(```+|~~~+)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence || inComment) {
      if (inComment) {
        const endIdx = line.indexOf('-->');
        if (endIdx >= 0) {
          inComment = false;
          out.push(line.slice(endIdx + 3));
        }
        // 注释跨行且本行未结束：整行丢弃
      } else {
        out.push(line);
      }
      continue;
    }
    const startIdx = line.indexOf('<!--');
    if (startIdx >= 0) {
      const endIdx = line.indexOf('-->', startIdx + 4);
      if (endIdx >= 0) {
        out.push(line.slice(0, startIdx) + line.slice(endIdx + 3));
      } else {
        inComment = true;
        out.push(line.slice(0, startIdx));
      }
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/** Docusaurus 提示块名称（与 Docusaurus 内置一致） */
const ADMONITION_NAMES = [
  'note',
  'tip',
  'info',
  'warning',
  'danger',
  'caution',
  'success',
  'important',
  'secondary',
];

/**
 * 归一化「:::name 标题」写法为「:::name[标题]」。
 * 该写法在 Docusaurus 中合法（标题跟在指令名后），但 remark-directive 只识别
 * 方括号标签；统一转成方括号形式后才可被解析为引用块。代码围栏内不处理。
 */
function normalizeAdmonitionTitles(source) {
  const lines = source.split('\n');
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (/^\s*(```+|~~~+)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (!inFence) {
      const m = /^(\s*:::)([a-z]+)\s+(.+?)\s*$/.exec(line);
      if (m && ADMONITION_NAMES.includes(m[2])) {
        out.push(`${m[1]}${m[2]}[${m[3]}]`);
        continue;
      }
    }
    out.push(line);
  }
  return out.join('\n');
}

function isJsxElement(node) {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function elementName(node) {
  return typeof node.name === 'string' ? node.name : '';
}

/**
 * 读取 JSX / 指令节点的属性值。
 * JSX 属性为数组 [{name, value}]；remark-directive 属性为对象 {title: ...}。
 */
function attrString(attributes, key) {
  if (!attributes) return '';
  if (Array.isArray(attributes)) {
    const attr = attributes.find((a) => a && a.name === key);
    if (!attr) return '';
    const value = attr.value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }
  if (typeof attributes === 'object') {
    const value = attributes[key];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

function textNode(value) {
  return { type: 'text', value };
}

function headingNode(depth, value) {
  return { type: 'heading', depth, children: [textNode(value)] };
}

/** 无 [标签] 时按指令名给出中文提示标题 */
const DIRECTIVE_LABELS = {
  note: '备注',
  tip: '提示',
  info: '信息',
  warning: '警告',
  danger: '危险',
  caution: '注意',
  success: '成功',
  important: '重要',
};

/** 将 ::: 提示块转为引用块，带加粗标题 */
function directiveToBlockquote(node) {
  const children = mapChildren(node.children || []);
  let title = attrString(node.attributes, 'title') || '';

  // [标签] 是带 data.directiveLabel 标记的段落，取文本并从正文中移除
  const labelIndex = children.findIndex(
    (c) => c.type === 'paragraph' && c.data && c.data.directiveLabel === true,
  );
  if (labelIndex >= 0) {
    const labelText = children[labelIndex].children
      .map((t) => (t.value !== undefined ? String(t.value) : ''))
      .join('')
      .trim();
    if (labelText) title = labelText;
    children.splice(labelIndex, 1);
  }
  if (!title) title = DIRECTIVE_LABELS[node.name] || node.name;

  const firstParagraph = children.find((c) => c.type === 'paragraph');
  if (title) {
    if (firstParagraph) {
      firstParagraph.children = [
        { type: 'strong', children: [textNode(title)] },
        textNode(' '),
        ...firstParagraph.children,
      ];
    } else {
      children.unshift({
        type: 'paragraph',
        children: [{ type: 'strong', children: [textNode(title)] }],
      });
    }
  }
  return { type: 'blockquote', children };
}

/** 展开 JSX 块级元素 */
function expandJsxFlow(node) {
  const name = elementName(node);
  const inner = mapChildren(node.children || []);
  if (name === 'Tabs') {
    // 展平 Tabs，保留各 TabItem 内容
    return inner;
  }
  if (name === 'TabItem') {
    const label = attrString(node.attributes, 'label') || attrString(node.attributes, 'value');
    return label ? [headingNode(3, label), ...inner] : inner;
  }
  if (name === 'img') {
    const src = attrString(node.attributes, 'src');
    if (!src) return [];
    return [{ type: 'image', url: src, alt: attrString(node.attributes, 'alt'), title: null }];
  }
  // 其他组件（AgreementGate 等）：展开保留内部内容
  return inner;
}

/** 展开 JSX 行内元素 */
function expandJsxText(node) {
  const name = elementName(node);
  if (name === 'img') {
    const src = attrString(node.attributes, 'src');
    if (!src) return [];
    return [{ type: 'image', url: src, alt: attrString(node.attributes, 'alt'), title: null }];
  }
  // 行内组件：只保留其中的文本
  return (node.children || []).filter((c) => c.type === 'text').map((c) => textNode(c.value));
}

/** 递归映射子节点：删除/展平/改写非标准节点 */
function mapChildren(children) {
  const out = [];
  for (const child of children || []) {
    if (
      child.type === 'mdxjsEsm' ||
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression'
    ) {
      // import / export / {表达式} 一律删除
      continue;
    }
    if (isJsxElement(child)) {
      out.push(...(child.type === 'mdxJsxTextElement' ? expandJsxText(child) : expandJsxFlow(child)));
      continue;
    }
    if (
      child.type === 'containerDirective' ||
      child.type === 'leafDirective' ||
      child.type === 'textDirective'
    ) {
      if (child.type === 'containerDirective') {
        out.push(directiveToBlockquote(child));
      }
      // leaf/text 指令（本项目未使用）直接丢弃
      continue;
    }
    if (Array.isArray(child.children)) {
      out.push({ ...child, children: mapChildren(child.children) });
    } else {
      out.push(child);
    }
  }
  return out;
}

/**
 * MDX 源文本 → 标准 Markdown 文本
 * @param {string} source 原始 .mdx 内容
 * @param {{title?: string, permalink?: string, footer?: boolean}} [opts]
 * @returns {Promise<string>}
 */
async function mdxToMarkdown(source, opts = {}) {
  const { title, permalink, footer = true } = opts;
  const processor = await getProcessor();
  const body = normalizeAdmonitionTitles(stripHtmlComments(stripFrontmatter(source)));
  const tree = processor.parse(body);
  const transformed = { ...tree, children: mapChildren(tree.children) };
  let md = processor.stringify(transformed).trimEnd();

  // 确保有 # 一级标题
  if (title && !/^#\s+/m.test(md)) {
    md = `# ${title}\n\n${md}`;
  }

  if (footer && permalink) {
    md += `\n\n---\n\n> 原文路径：${permalink}（本文由 QVMConsole 文档站自动生成，供大模型阅读）\n`;
  }

  return md.endsWith('\n') ? md : `${md}\n`;
}

module.exports = { mdxToMarkdown, stripFrontmatter, stripHtmlComments, normalizeAdmonitionTitles };