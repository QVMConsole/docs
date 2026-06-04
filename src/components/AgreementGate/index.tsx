import React, {type ReactNode, useState, useEffect} from 'react';
import {useLocation} from '@docusaurus/router';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const AGREEMENT_STORAGE_KEY = 'qvmconsole_agreement_accepted';

/**
 * 检查用户是否已同意协议
 */
export function isAgreementAccepted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AGREEMENT_STORAGE_KEY) === 'true';
}

/**
 * 标记用户已同意协议
 */
export function acceptAgreement(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AGREEMENT_STORAGE_KEY, 'true');
  }
}

interface AgreementGateProps {
  /** 被包裹的内容（同意后才会显示） */
  children: ReactNode;
  /** 未同意时显示的提示文本 */
  hint?: string;
}

/**
 * 协议门控组件
 * 未同意时显示遮罩，点击跳转到协议页面
 * 同意后显示内容 + 协议状态提示
 */
export default function AgreementGate({
  children,
  hint = '查看安装方法',
}: AgreementGateProps): ReactNode {
  const location = useLocation();
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAccepted(isAgreementAccepted());
    setChecking(false);

    // 监听 storage 事件，当协议页面设置 localStorage 后自动更新状态
    const onStorage = (e: StorageEvent) => {
      if (e.key === AGREEMENT_STORAGE_KEY) {
        setAccepted(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 页面重新获得焦点时检查（从协议页面返回时）
  useEffect(() => {
    const onFocus = () => {
      setAccepted(isAgreementAccepted());
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // 跳转到协议页面，携带当前页面路径作为返回地址
  const handleRequestView = () => {
    const returnUrl = location.pathname;
    window.location.href = `/agreement?return=${encodeURIComponent(returnUrl)}`;
  };

  // 加载中不渲染任何内容，避免闪烁
  if (checking) return null;

  // 已同意：显示内容 + 协议状态提示
  if (accepted) {
    return (
      <>
        {children}
        <div className={styles.agreedNotice}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.agreedIcon}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>您当前已同意</span>
          <Link to="/agreement" className={styles.agreedLink}>
            用户协议
          </Link>
        </div>
      </>
    );
  }

  // 未同意：显示遮罩提示
  return (
    <div className={styles.gateWrapper}>
      <div className={styles.gateOverlay}>
        <div className={styles.gateContent}>
          <div className={styles.gateIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className={styles.gateText}>
            安装方法需要阅读并同意用户协议后才能查看
          </p>
          <button className={styles.gateButton} onClick={handleRequestView}>
            {hint}
          </button>
        </div>
      </div>
    </div>
  );
}
