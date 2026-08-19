import React, {useCallback, useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './LLMDocsButton.module.css';

/**
 * 导航栏「大模型阅读」按钮
 *
 * 点击弹出使用介绍弹窗：上方三张 SVG 使用说明图，下方一键复制
 * 大模型阅读通道地址（llms.txt）与提问模板。
 */

type CopyState = 'idle' | 'ok' | 'fail';

/** 复制文本；http 环境 navigator.clipboard 不可用时降级 execCommand 方案 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续尝试降级方案
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** 机器人小图标（导航栏按钮用） */
function RobotIcon() {
  return (
    <svg
      className={styles.navIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="4" width="10" height="9" rx="2.5" />
      <circle cx="10" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 13v3.5a1.5 1.5 0 0 0 3 0V13" />
      <path d="M12 4V2.5" />
      <path d="M3 20c1.2-2 3.2-3 5-3h8c1.8 0 3.8 1 5 3" />
    </svg>
  );
}

/** 使用说明图 1：复制访问地址 */
function UsageFigureCopy() {
  return (
    <svg className={styles.figure} viewBox="0 0 300 170" role="img" aria-label="第一步：复制访问地址">
      <rect x="8" y="8" width="284" height="82" rx="8" className={styles.figPanel} />
      <text x="20" y="30" fontSize="12" className={styles.figTextStrong}>
        弹窗中复制访问地址
      </text>
      <rect x="20" y="40" width="196" height="24" rx="6" className={styles.figUrlBox} />
      <text x="28" y="57" fontSize="11" className={styles.figMono}>
        https://站点/llms.txt
      </text>
      <rect x="224" y="40" width="60" height="24" rx="6" className={styles.figPrimaryFill} />
      <text x="254" y="57" fontSize="11" textAnchor="middle" className={styles.figOnPrimary}>
        复制
      </text>
      <text x="20" y="80" fontSize="11" className={styles.figText}>
        把地址附在向大模型提问的文字中
      </text>
    </svg>
  );
}

/** 使用说明图 2：提问时附加地址 */
function UsageFigureAttach() {
  return (
    <svg className={styles.figure} viewBox="0 0 300 170" role="img" aria-label="第二步：提问时附加地址">
      <rect x="20" y="14" width="248" height="34" rx="10" className={styles.figBubble} />
      <text x="32" y="31" fontSize="11" className={styles.figText}>
        如何配置端口转发？
      </text>
      <text x="32" y="44" fontSize="10" className={styles.figMono}>
        参考文档：…/llms.txt
      </text>
      <rect x="20" y="60" width="248" height="34" rx="10" className={styles.figBubbleAlt} />
      <text x="32" y="81" fontSize="11" className={styles.figTextStrong}>
        大模型收到问题与地址
      </text>
      <rect x="16" y="110" width="238" height="30" rx="8" className={styles.figInputBox} />
      <text x="28" y="129" fontSize="11" className={styles.figPlaceholder}>
        输入问题，附加文档地址…
      </text>
      <rect x="262" y="110" width="22" height="30" rx="8" className={styles.figPrimaryFill} />
      <path
        d="M273 120l-8 8-8-8h16z"
        fill="none"
        stroke="currentColor"
        className={styles.figSendArrow}
        strokeWidth="1.6"
      />
    </svg>
  );
}

/** 使用说明图 3：大模型按问题精确检索文章 */
function UsageFigureSearch() {
  return (
    <svg className={styles.figure} viewBox="0 0 300 170" role="img" aria-label="第三步：大模型精确检索文章">
      <rect x="18" y="30" width="54" height="54" rx="12" className={styles.figRobotHead} />
      <circle cx="34" cy="48" r="3.5" className={styles.figRobotEye} />
      <circle cx="56" cy="48" r="3.5" className={styles.figRobotEye} />
      <rect x="34" y="58" width="22" height="4" rx="2" className={styles.figRobotMouth} />
      <rect x="102" y="16" width="96" height="30" rx="8" className={styles.figIndexBox} />
      <text x="150" y="35" fontSize="11" textAnchor="middle" className={styles.figTextStrong}>
        llms.txt 目录
      </text>
      <rect x="102" y="58" width="96" height="26" rx="8" className={styles.figArticleBox} />
      <text x="150" y="75" fontSize="10" textAnchor="middle" className={styles.figText}>
        文章 A（匹配）
      </text>
      <rect x="102" y="92" width="96" height="26" rx="8" className={styles.figArticleBox} />
      <text x="150" y="109" fontSize="10" textAnchor="middle" className={styles.figText}>
        文章 B（无关）
      </text>
      <path d="M72 50h30" className={styles.figLine} />
      <path d="M150 46v12" className={styles.figLine} />
      <rect x="218" y="66" width="64" height="48" rx="10" className={styles.figAnswerBox} />
      <text x="250" y="86" fontSize="10" textAnchor="middle" className={styles.figTextStrong}>
        精确回答
      </text>
      <text x="250" y="100" fontSize="10" textAnchor="middle" className={styles.figText}>
        基于文章内容
      </text>
      <path d="M198 92h20" className={styles.figLine} />
    </svg>
  );
}

function CopyFeedback({state}: {state: CopyState}) {
  if (state === 'idle') {
    return <span className={styles.copyHint}>支持一键复制</span>;
  }
  if (state === 'ok') {
    return <span className={styles.copyOk}>已复制 ✓</span>;
  }
  return <span className={styles.copyFail}>复制失败，请手动选择</span>;
}

export default function LLMDocsButton(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [addrState, setAddrState] = useState<CopyState>('idle');
  const [tplState, setTplState] = useState<CopyState>('idle');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const baseUrlPath = useBaseUrl('/llms.txt');
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${baseUrlPath}` : baseUrlPath;
  const template = `请先访问 ${fullUrl} 获取文档目录，再根据我的问题选择最相关的文章阅读，然后基于文档内容回答。`;

  const resetTimer = useRef<number | undefined>(undefined);

  const handleCopyAddr = useCallback(async () => {
    const ok = await copyText(fullUrl);
    setAddrState(ok ? 'ok' : 'fail');
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setAddrState('idle'), 2000);
  }, [fullUrl]);

  const handleCopyTemplate = useCallback(async () => {
    const ok = await copyText(template);
    setTplState(ok ? 'ok' : 'fail');
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setTplState('idle'), 2000);
  }, [template]);

  // ESC 关闭 + 打开时聚焦弹窗
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    return () => window.clearTimeout(resetTimer.current);
  }, []);

  return (
    <>
      <button
        type="button"
        className={clsx('navbar__link', 'clean-btn', styles.navButton)}
        onClick={() => setOpen(true)}
        title="大模型阅读通道：复制文档地址，让大模型精确查找答案"
      >
        <RobotIcon />
        <span className={styles.navText}>大模型阅读</span>
      </button>

      {open && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="大模型阅读通道使用说明"
            tabIndex={-1}
            ref={dialogRef}
          >
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>大模型阅读通道</h3>
              <button
                type="button"
                className={clsx('clean-btn', styles.closeButton)}
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>

            <p className={styles.intro}>
              本站为文档提供一个「大模型阅读地址」：把下面的访问地址附在提问中，
              大模型会先读取文档目录，再根据你的问题精确请求对应的文章（标准 Markdown），
              从而给出准确的回答。
            </p>

            <div className={styles.figureGrid}>
              <figure className={styles.figureCard}>
                <UsageFigureCopy />
                <figcaption className={styles.figureCaption}>
                  ① 复制访问地址
                </figcaption>
              </figure>
              <figure className={styles.figureCard}>
                <UsageFigureAttach />
                <figcaption className={styles.figureCaption}>② 提问时附加该地址</figcaption>
              </figure>
              <figure className={styles.figureCard}>
                <UsageFigureSearch />
                <figcaption className={styles.figureCaption}>
                  ③ 大模型按问题精确检索文章
                </figcaption>
              </figure>
            </div>

            <div className={styles.copyArea}>
              <div className={styles.copyRow}>
                <label className={styles.copyLabel} htmlFor="llmAddress">
                  访问地址（附在提问中）
                </label>
                <CopyFeedback state={addrState} />
              </div>
              <div className={styles.copyRow}>
                <input
                  id="llmAddress"
                  className={styles.addressBox}
                  readOnly
                  value={fullUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button
                  type="button"
                  className={clsx('button', 'button--primary', 'button--sm', styles.copyButton)}
                  onClick={handleCopyAddr}
                >
                  复制地址
                </button>
              </div>

              <div className={clsx(styles.copyRow, styles.templateRow)}>
                <label className={styles.copyLabel} htmlFor="llmTemplate">
                  提问模板（可选，替换为你的问题即可）
                </label>
                <CopyFeedback state={tplState} />
              </div>
              <div className={styles.copyRow}>
                <textarea
                  id="llmTemplate"
                  className={styles.templateBox}
                  readOnly
                  rows={2}
                  value={template}
                />
                <button
                  type="button"
                  className={clsx('button', 'button--primary', 'button--sm', styles.copyButton)}
                  onClick={handleCopyTemplate}
                >
                  复制模板
                </button>
              </div>
            </div>

            <div className={styles.recommend}>
              <div className={styles.recommendText}>
                <span className={styles.recommendBadge}>推荐</span>
                使用 <strong>豆包</strong> 提问：支持联网读取上面复制的文档地址，并自动按问题精确检索对应文章。
              </div>
              <a
                className={clsx('button', 'button--primary', 'button--sm', styles.recommendLink)}
                href="https://www.doubao.com/chat/?channel=browser_landing_page"
                target="_blank"
                rel="noopener noreferrer"
              >
                去豆包提问
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  className={styles.recommendIcon}
                >
                  <path
                    d="M7 17L17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <p className={styles.footerNote}>
              详细说明见「站点指南 → 大模型阅读通道」；保存文档后地址内容会自动同步更新。
            </p>
          </div>
        </div>
      )}
    </>
  );
}