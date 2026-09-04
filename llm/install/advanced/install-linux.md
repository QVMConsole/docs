# 安装 Linux

> **前置阅读** 请确保已完成[基础设施配置](/docs/install/quick-start/infrastructure-config)（网络、存储池等），再进行虚拟机创建。

## 系统安装

Linux 虚拟机的安装流程与物理机安装方式相同，无需额外加载驱动程序，本文不再赘述安装过程。

## 安装 QEMU Guest Agent

QEMU Guest Agent 可以增强宿主机对虚拟机的控制能力，QVMConsole 的部分功能依赖此组件实现（如获取网卡 IP 地址等）。

系统安装完成并进入桌面后，请根据您的发行版执行对应命令。

### Debian / Ubuntu

```bash
# 更新软件源并安装 qemu-guest-agent
sudo apt update && sudo apt install -y qemu-guest-agent

# 启动服务
sudo systemctl start qemu-guest-agent

# （可选）设为开机自启 —— 部分发行版该服务为 static 类型，无需 enable
sudo systemctl enable qemu-guest-agent
```

### RHEL / CentOS / Fedora / Rocky

```bash
# 安装 qemu-guest-agent
sudo dnf install -y qemu-guest-agent

# 启动服务并设为开机自启
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```

### 验证安装

执行以下命令检查服务状态：

```bash
systemctl status qemu-guest-agent
```

正常情况下应显示 `active (running)`：

![Guest Agent 运行状态](https://images.xiaozhuhouses.asia/i/2026/06/12/zdkkzl.png)

安装成功后，在 QVMConsole 虚拟机详情页面底部的「高级设置」中，QEMU Guest Agent 状态应显示为「已连接」，鼠标悬停可查看版本号。

***

---

> 原文路径：/docs/install/advanced/install-linux（本文由 QVMConsole 文档站自动生成，供大模型阅读）
