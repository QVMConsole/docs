import React, {type ReactNode, useState, useEffect, useCallback} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {acceptAgreement} from '@site/src/components/AgreementGate';
import styles from './agreement.module.css';

const VALID_RETURN_PATHS = ['/docs/install/', '/docs/install'];

function getReturnUrl(): string {
  if (typeof window === 'undefined') return '/docs/install/';
  const params = new URLSearchParams(window.location.search);
  const ret = params.get('return') || '/docs/install/';
  if (VALID_RETURN_PATHS.some((p) => ret.startsWith(p))) {
    return ret;
  }
  return '/docs/install/';
}

export default function Agreement(): ReactNode {
  const [agreed, setAgreed] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/docs/install/');

  useEffect(() => {
    setReturnUrl(getReturnUrl());
  }, []);

  const handleConfirm = useCallback(() => {
    if (!agreed) return;
    acceptAgreement();
    window.location.href = returnUrl;
  }, [agreed, returnUrl]);

  return (
    <Layout
      title="用户协议"
      description="QVMConsole 用户协议">
      <main className={styles.page}>
        <div className={styles.container}>
          <Heading as="h1" className={styles.title}>
            用户协议
          </Heading>
          <p className={styles.subtitle}>
            请仔细阅读以下全部内容，勾选同意后方可查看安装方法
          </p>

          <div className={styles.sections}>
            {/* 用户协议 */}
            <section className={styles.section}>
              <Heading as="h2" className={styles.sectionTitle}>
                用户协议
              </Heading>
              <div className={styles.sectionBody}>
                <h3>1. 服务说明</h3>
                <p>
                  QVMConsole（以下简称"本软件"）是一款基于 KVM/QEMU 的虚拟机管理面板。
                  本软件按"现状"提供，不附带任何明示或暗示的保证。开发者保留对本软件功能、界面及服务条款进行调整的权利。
                </p>

                <h3>2. 使用条件</h3>
                <p>使用本软件前，您应确认并保证：</p>
                <ul>
                  <li>已充分了解 KVM/QEMU 虚拟化技术的基本原理、架构及潜在风险</li>
                  <li>具备独立部署、调试和排查虚拟化环境问题的技术能力</li>
                  <li>在独立的测试环境中先行充分验证，确认无问题后方可用于正式环境</li>
                  <li>对使用本软件所管理的虚拟机、数据及网络承担全部管理责任</li>
                  <li>遵守中华人民共和国相关法律法规，包括但不限于《中华人民共和国网络安全法》《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》的相关规定</li>
                  <li>不得利用本软件从事任何违法违规活动</li>
                </ul>

                <h3>3. 免责声明</h3>
                <p>
                  开发者已尽合理努力保障软件质量，但不对软件的完整性、可靠性、安全性及适用性作任何保证。在中华人民共和国法律允许的最大范围内，开发者不对因使用或无法使用本软件而产生的任何直接或间接损失承担责任，包括但不限于数据丢失、服务中断、系统故障、业务中断、利润损失或任何其他损失。
                </p>
                <p>
                  根据《中华人民共和国民法典》第五百零六条之规定，本协议中的免责条款不适用于因开发者故意或重大过失造成的损失。
                </p>

                <h3>4. 知识产权</h3>
                <p>
                  本软件及其相关文档的知识产权归开发者所有。未经开发者明确书面授权，您不得对本软件进行反向工程、反编译或反汇编，不得擅自修改、复制、分发本软件的任何部分。用户通过反馈渠道提交的建议和问题报告，开发者有权无偿用于产品改进。
                </p>

                <h3>5. 协议变更</h3>
                <p>
                  开发者有权根据需要不时修改本协议。修改后的协议一经发布即生效。如您继续使用本软件，即视为您已接受修改后的协议。
                </p>
              </div>
            </section>
          </div>

          {/* 蓝色重点说明 */}
          <div className={styles.warningBox}>
            <div className={styles.warningBoxHeader}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>重要提示</span>
            </div>
            <div className={styles.warningBoxBody}>
              <p>
                为了安全起见，我们<strong>强烈建议您做好数据备份</strong>，避免不合适的操作触发程序 Bug 造成数据丢失或异常。
              </p>
              <p>
                若您反馈有效的 Bug 和建议并配合排查一定数量后，则会奖励您后续 <strong>Pro 版订阅资格</strong>。
              </p>
            </div>
          </div>

          {/* 同意确认区域 */}
          <div className={styles.agreeArea}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                我已详细阅读并充分理解《用户协议》的全部内容，已知悉使用本软件可能存在安全风险并做好数据备份，确认自身具备相应的技术能力和经验，自愿承担使用本软件所带来的一切风险和责任
              </span>
            </label>
            <button
              className={styles.confirmButton}
              disabled={!agreed}
              onClick={handleConfirm}>
              同意并查看安装方法
            </button>
          </div>
        </div>
      </main>
    </Layout>
  );
}
