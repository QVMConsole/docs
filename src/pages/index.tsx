import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>
          基于 KVM/QEMU 构建的轻量级虚拟机管理面板，提供虚拟机全生命周期管理、
          VNC 远程控制台、VPC 网络隔离、安全认证与异步任务中心等一站式能力。
        </p>
        <div className={styles.buttons}>
          <Link
            className={styles.heroButtonPrimary}
            to="/docs/intro">
            快速开始
          </Link>
          <Link
            className={styles.heroButtonSecondary}
            to="/docs/intro">
            开发文档
          </Link>
        </div>
      </div>
    </header>
  );
}

function TechStack() {
  const techs = [
    {label: 'Go', desc: '后端服务'},
    {label: 'Vue 3', desc: '前端框架'},
    {label: 'libvirt', desc: '虚拟化 API'},
    {label: 'OVS', desc: '虚拟交换机'},
    {label: 'noVNC', desc: '远程控制台'},
    {label: 'SQLite', desc: '数据存储'},
  ];

  return (
    <section className={styles.techStack}>
      <div className="container">
        <div className={styles.techStackInner}>
          {techs.map((t, i) => (
            <div key={i} className={styles.techItem}>
              <span className={styles.techDot} />
              <span><strong>{t.label}</strong> {t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <Heading as="h2" className={styles.ctaTitle}>
          开始使用 QVMConsole
        </Heading>
        <p className={styles.ctaDesc}>
          只需一行脚本即可完成安装，快速搭建您的虚拟化管理平台。
        </p>
        <div className={styles.buttons}>
          <Link
            className={styles.heroButtonPrimary}
            to="/docs/intro">
            阅读文档
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <TechStack />
        <CtaSection />
      </main>
    </Layout>
  );
}
