import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';
import type {ImgHTMLAttributes, PointerEvent as ReactPointerEvent} from 'react';
import styles from './styles.module.css';

// 缩放范围限制,避免过大或过小导致体验异常
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
// 每次滚轮触发的缩放步长
const WHEEL_STEP = 0.12;

type ZoomableImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  // 在 MDX 中为 <img> 添加该属性可禁用放大预览,用于不需要交互的小图标等
  'data-no-zoom'?: boolean | string;
};

/**
 * 可点击放大的图片组件。
 *
 * 作为 MDX `img` 的全局替代渲染器使用,文档中所有 Markdown 图片
 * (`![alt](src)`) 都会自动获得点击放大预览能力,无需修改任何文档。
 *
 * 预览支持:
 * - 点击图片打开 / 点击遮罩或关闭按钮关闭
 * - ESC 键关闭
 * - 滚轮缩放(原生非 passive 监听,缩放时不会滚动页面)
 * - 鼠标/触摸拖拽移动
 * - 双击重置缩放与位移
 */
export default function ZoomableImg({
  src,
  alt = '',
  title,
  className,
  'data-no-zoom': noZoom,
  ...rest
}: ZoomableImgProps) {
  // data-no-zoom 为真值时渲染普通图片,不启用预览(供 MDX 中需要保持原样的图片使用)
  const disableZoom =
    noZoom !== undefined && noZoom !== false && noZoom !== 'false';

  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  // 标记客户端挂载完成,确保 createPortal 在浏览器环境执行(SSR 安全)
  const [mounted, setMounted] = useState(false);

  const draggingRef = useRef(false);
  const lastRef = useRef({x: 0, y: 0});
  const overlayRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  // 标记客户端挂载,用于安全渲染 portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // 重置缩放与位移到初始状态
  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({x: 0, y: 0});
  }, []);

  // 打开预览并重置变换状态
  const openPreview = useCallback(() => {
    resetTransform();
    setOpen(true);
  }, [resetTransform]);

  // 关闭预览
  const closePreview = useCallback(() => {
    setOpen(false);
  }, []);

  // 打开时:锁定背景滚动、ESC 关闭、原生滚轮缩放、聚焦遮罩便于键盘操作
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreview();
      }
    };

    // 原生非 passive 监听,使 preventDefault 生效,缩放时阻止页面滚动
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
      setScale((s) => {
        const next = +(s + delta).toFixed(2);
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      });
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const el = previewRef.current;
    el?.addEventListener('wheel', onWheel, {passive: false});

    // 聚焦遮罩层,让键盘用户可以直接按 ESC
    overlayRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      el?.removeEventListener('wheel', onWheel);
    };
  }, [open, closePreview]);

  // 拖拽移动图片(指针事件统一处理鼠标与触摸)
  const onPointerDown = (e: ReactPointerEvent) => {
    draggingRef.current = true;
    lastRef.current = {x: e.clientX, y: e.clientY};
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = {x: e.clientX, y: e.clientY};
    setOffset((o) => ({x: o.x + dx, y: o.y + dy}));
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // 禁用预览时,直接渲染普通图片,不附加任何交互
  if (disableZoom) {
    return (
      <img
        {...rest}
        src={src}
        alt={alt}
        title={title}
        className={className}
      />
    );
  }

  return (
    <>
      <img
        loading="lazy"
        {...rest}
        src={src}
        alt={alt}
        title={title ?? '点击查看大图'}
        className={clsx(className, styles.zoomable)}
        onClick={openPreview}
      />
      {mounted &&
        open &&
        createPortal(
          <div
            ref={overlayRef}
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label={alt ? `${alt} - 图片预览` : '图片预览'}
            tabIndex={-1}
            onClick={closePreview}
          >
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="关闭预览"
              onClick={closePreview}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <img
              ref={previewRef}
              src={src}
              alt={alt}
              className={styles.previewImg}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={resetTransform}
            />

            {title && (
              <div
                className={styles.caption}
                onClick={(e) => e.stopPropagation()}
              >
                {title}
              </div>
            )}

            <div className={styles.hint}>滚轮缩放 · 拖拽移动 · ESC 关闭</div>
          </div>,
          document.body,
        )}
    </>
  );
}
