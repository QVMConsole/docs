# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## LLM Reading Channel (大模型阅读通道)

本站内置大模型阅读通道：构建/预览时自动生成 `/llms.txt` 全站目录与 `/llm/<实例>/<文档id>.md` 纯净 Markdown 文章，供大模型按问题精确检索。

- 写文档方式不变（`docs/` 与 `docs-install/` 下的 `.mdx` 照常编写）。
- 每次 `pnpm build` 自动生成并入产物；`pnpm start` 预览时保存即同步。
- 导航栏「大模型阅读」按钮提供使用介绍与一键复制地址。
- 实现为本地插件 `plugins/llm-channel/`，详见 `docs-install/site-guide/llm-access.mdx`。
- 生成物（`static/llms.txt`、`static/llm/`）自动生成，不入库（见 `.gitignore`）。

测试：`pnpm run test:llm`（llm-channel 单元测试）。
