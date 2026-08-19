'use strict';
/**
 * 大模型阅读通道 Docusaurus 插件
 *
 * 在 allContentLoaded（站点内容加载完成、静态文件拷贝之前）阶段，把
 * docs 插件已解析的文档内容转换为标准 Markdown，写入 static/ 目录：
 * - dev: 每次文档变更触发的内容重载都会重新生成，开发预览实时同步
 * - build: 生成物随静态文件一起进入构建产物，无需改动构建脚本
 *
 * 不改变原有写文档方式：docs 与 docs-install 下的 .mdx 照常编写即可。
 */
const { generate } = require('./generate');

module.exports = function llmChannelPlugin(context, options) {
  return {
    name: 'llm-channel',
    async allContentLoaded({ allContent }) {
      try {
        await generate({ siteDir: context.siteDir, allContent, options });
        console.log('[llm-channel] 大模型阅读文件已生成（llms.txt / llm/**/*.md）');
      } catch (err) {
        // 生成失败不阻断站点构建，但需要醒目提示
        console.error('[llm-channel] 大模型阅读文件生成失败（不影响站点构建），请检查:');
        console.error(err);
      }
    },
  };
};