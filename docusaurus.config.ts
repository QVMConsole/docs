import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'QVMConsole',
  tagline: '基于 KVM/QEMU 的轻量级虚拟机管理面板',
  favicon: 'img/favicon.ico',

  url: 'https://qvmcdocs.xiaozhuhouses.asia',
  baseUrl: '/',

  organizationName: 'QVMConsole',
  projectName: 'QVMConsole',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'install',
        path: 'docs-install',
        routeBasePath: 'docs/install',
        sidebarPath: './sidebars-install.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'tech',
        path: 'docs',
        routeBasePath: 'docs/tech',
        sidebarPath: './sidebars.ts',
      },
    ],
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['zh', 'en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsPluginIdForPreferredVersion: 'tech',
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: ['docs/install', 'docs/tech'],
        searchResultLimits: 10,
        searchResultContextMaxLength: 50,
      },
    ],
    // 大模型阅读通道：构建/预览时自动生成 llms.txt 与 llm/*.md（详见 docs-install/site-guide/llm-access）
    [
      require.resolve('./plugins/llm-channel'),
      {
        instanceLabels: {
          install: '安装与使用',
          tech: '功能与原理',
        },
        includeHeadings: true,
        maxHeadingsPerDoc: 20,
        articleFooter: true,
        // 生产域名；如需覆盖可用环境变量 LLM_DOCS_SITE_URL
        siteUrl: process.env.LLM_DOCS_SITE_URL ?? 'https://qvmcdocs.xiaozhuhouses.asia',
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'QVMConsole',
      logo: {
        alt: 'QVMConsole Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/install/',
          label: '安装与使用',
          position: 'left',
        },
        {
          to: 'docs/tech/',
          label: '功能与原理',
          position: 'left',
        },
        {
          type: 'custom-LLMDocsButton',
          position: 'right',
        },
      ],
    },
    footer: undefined,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      theme: {
        light: 'default',
        dark: 'dark',
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
