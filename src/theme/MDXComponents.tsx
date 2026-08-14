import MDXComponents from '@theme-original/MDXComponents';
import ZoomableImg from '@site/src/components/ZoomableImg';

// 复用默认的 MDX 组件映射,仅覆盖原生 img,
// 使文档中所有 Markdown 图片(![alt](src))自动支持点击放大预览。
export default {
  ...MDXComponents,
  img: ZoomableImg,
};
