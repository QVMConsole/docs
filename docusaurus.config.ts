import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'QVMConsole',
  tagline: '基于 KVM/QEMU 的轻量级虚拟机管理面板',
  favicon: 'img/favicon.ico',

  url: 'https://your-docusaurus-site.example.com',
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
