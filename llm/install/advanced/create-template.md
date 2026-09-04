# 制作模板

> **前置阅读** 请先阅读[模板管理](/docs/install/quick-start/template-management)了解模板的基本概念和使用方式。

模板是 QVMConsole 实现**秒级创建虚拟机**的核心功能。通过将一台精心配置的虚拟机制作为模板，您可以快速克隆出多台相同配置的虚拟机。

## 工作原理

QVMConsole 的模板制作本质上是将虚拟机的磁盘文件进行稀疏复制（`cp --sparse=always`），生成一个只包含实际数据的精简磁盘文件。基于该模板创建虚拟机时，系统支持两种克隆模式：

* **链式克隆**：速度快、占用空间小，但依赖模板文件完整性
* **完整克隆**：完全独立，不依赖模板，但占用更多存储空间

***

## 准备工作

### 1. 下载驱动和工具

前往夸克网盘下载所需的驱动和工具文件：

**夸克网盘**：[https://pan.quark.cn/s/1a0b0ee29bc9](https://pan.quark.cn/s/1a0b0ee29bc9)（环境依赖文件夹）

> **驱动版本选择** 不同 Windows 版本需要使用对应的 virtio 驱动版本：
>
> | Windows 版本     | virtio 驱动版本            |
> | -------------- | ---------------------- |
> | Windows 7      | virtio-win-0.1.173.iso |
> | Windows 8      | virtio-win-0.1.190.iso |
> | Windows 10 及以上 | virtio-win-0.1.285.iso |
>
> **注意**：
>
> * Windows 7 安装 virtio 驱动时需要**取消勾选 spice 组件**，否则会导致安装失败
> * Windows 7 及更早版本**无需安装 CloudbaseInit**制作模板表单勾选不初始化

### 2. 准备系统 ISO 文件

您可以从 [HelloWindows](https://hellowindows.cn/#) 下载所需的系统镜像。

> **上传提示** 将 ISO 上传到 ISO 存储目录后，请检查文件后缀名。如果后缀为大写的 `.ISO`，请将其改为小写 `.iso`，以确保系统正常识别。

***

## 制作 Windows 模板

[视频教程](https://www.bilibili.com/video/BV1sF786iExm/)

### 3. 创建虚拟机

创建虚拟机时，在安装镜像选择步骤中：

1. 先选择系统 ISO 镜像
2. 然后选择 virtio 驱动 ISO

![选择安装镜像](https://images.xiaozhuhouses.asia/i/2026/06/15/116l1jw.png)

> **性能优化** 将磁盘类型和网卡都设置为 **virtio 半虚拟化**，可以获得接近物理机的性能表现。\
> Windows7网卡选择e1000。Windows更低版本由于没有驱动支持，全部保持默认的e1000

详细的安装过程请参考 [安装 Windows](install-windows.mdx) 文档。

### 4. 进入审计模式

审计模式是 Windows 官方推荐的系统封装方式。在此模式下：

* 以管理员账户运行，拥有系统完整权限
* 加载的服务最少，便于系统封装
* 是微软官方推荐的封装方式

**进入方法**：

1. 等待系统安装完成，进入安装向导阶段
   * Windows Server 系统：在创建账户密码界面
   * 普通 Windows 系统：在 OOBE 设置界面
2. 按下 `Ctrl + Shift + F3` 组合键
3. 系统将自动重启进入审计模式

> **备注** 如果重启过程中出现持续黑屏，可以强制关机后重新开机。

进入审计模式后，您应当能看到桌面上有一个 **Sysprep 系统准备工具**窗口，这表示您已成功进入审计模式。

### 5. 安装驱动

在虚拟机中挂载 virtio 驱动 ISO 光盘，双击安装以下两个驱动程序：

![virtio 驱动安装](https://help-static.fnnas.com/images/20241230144945826.png)

![驱动安装确认](https://images.xiaozhuhouses.asia/i/2026/06/12/zcjqec.png)

安装过程中一直点击"下一步"即可完成。

### 6. 安装软件和环境

根据您的实际需求，在当前系统中安装所需的软件和配置环境。

> **建议**
>
> * 安装常用的运行时库（如 VC++ 运行库、.NET Framework 等）
> * 配置好网络和远程访问
> * 安装必要的驱动程序

### 7. 安装初始化工具

CloudbaseInit 是用于云环境初始化的工具，能够自动配置主机名、网络等信息。

**安装方法**：

1. 在局域网内搭建 SMB 服务
2. 在 Windows 资源管理器地址栏输入 `\\<SMB服务IP>` 访问共享
3. 将 CloudbaseInit 安装文件复制到桌面
4. 双击运行安装程序

![CloudbaseInit 安装](https://images.xiaozhuhouses.asia/i/2026/06/15/st7bv5.png)

> **注意** 安装到最后一步的两个选项**不要勾选**，直接点击关闭即可。
>
> 如果您之前不小心关闭了 Sysprep 系统准备工具窗口，则需要勾选这两个选项，因为它会调用 Sysprep 工具。

### 8. 执行最终封装

若你已经勾选了CloudbaseInit最后的两个勾此时您应当能看到正在初始化，所以这一步跳过即可。

1. 按 `Win + R` 打开运行菜单，输入 `sysprep` 并回车
2. 在打开的目录中双击可执行文件
3. 按照下图选择配置：

![Sysprep 配置](https://images.xiaozhuhouses.asia/i/2026/06/15/qjoqhe.png)

4. 确认系统环境无误后，点击"确定"开始封装

> **Windows 11 用户注意** Windows 11 默认启用了磁盘加密（BitLocker），**必须先关闭磁盘加密**后再进行模板制作，否则Sysprep会失败。
>
> ![关闭磁盘加密](https://images.xiaozhuhouses.asia/i/2026/06/15/qnr1d7.png)

### 9. 制作模板

等待系统自动关机后，在虚拟机列表中：

1. 找到目标虚拟机
2. 点击右侧的三个点（...）下拉菜单
3. 选择"制作模板"
4. 根据系统信息填写模板名称和描述
5. 选择磁盘处理方式（见下方说明）
6. 点击确定完成制作

![制作模板](https://images.xiaozhuhouses.asia/i/2026/06/13/h5h5l7.png)

#### 磁盘处理方式

制作表单提供「压缩」与「磁盘处理方式」两个选项：

| 选项               | 说明                                                   |
| ---------------- | ---------------------------------------------------- |
| **不压缩 + 复制（默认）** | 稀疏复制磁盘，保留原虚拟机的 backing 链，源虚拟机不受影响                    |
| **压缩**           | 使用 qcow2 压缩输出，占用更小但制作更慢；链式克隆的虚拟机压缩时会复用其父模板作为 backing |
| **不压缩 + 移动**     | 直接迁移源系统盘，模板保存成功后**删除源虚拟机**（高风险操作，需二次确认）              |

> **移动选项注意** 「移动」会在模板保存成功后删除源虚拟机及其快照、附加磁盘等资源，且移动磁盘时固定为不压缩。仅当确定不再需要源虚拟机时选择该选项。

***

## 制作 Linux 模板

相比 Windows，Linux 模板的制作过程更加简单快捷。

先按照 [安装 Linux](install-linux.mdx) 文档安装好 Linux 系统

然后安装下面初始化工具

### Debian/Ubuntu

```bash
apt-get install -y cloud-init cloud-guest-utils
```

### CentOS/RHEL (yum)

```bash
yum install -y cloud-init cloud-utils-growpart
```

### Fedora/Rocky/Alma (dnf)

```bash
dnf install -y cloud-init cloud-utils-growpart
```

最后直接关机，制作模板即可

![制作 Linux 模板](https://images.xiaozhuhouses.asia/i/2026/06/13/h5h5l7.png)

> **Linux 模板优势**
>
> * 制作速度快，无需复杂的封装步骤
> * 无需进入审计模式
> * 无需安装 CloudbaseInit 等初始化工具
> * 支持所有主流 Linux 发行版

***

## 制作 OpenWrt 模板

OpenWrt模板制作非常简单，只需要从自己想要的分支固件官网下载img后导入虚拟机确保能够正常开机即可，然后直接关机制作模板，一般选择openwrt类型即可，然后基于模板创建虚拟机测试。

***

## 制作 FnOS 模板

FnOS模板制作非常简单，只需要前往飞牛官网下载ISO正常安装飞牛后进入系统，此时**不需要初始化飞牛**直接关机制作模板选择FnOS即可

***

## 模板使用建议

1. **定期更新模板**：及时更新系统补丁和软件版本
2. **模板命名规范**：使用清晰的命名规则，如 `Windows-Server-2022-Base-20240101`
3. **模板分类管理**：按用途或系统类型对模板进行分类
4. **测试模板**：制作完成后先测试创建虚拟机，确保模板可用

## 创建子版本模板与克隆虚拟机

一般情况您可以直接下载导入作者的模板，然后初始化进入系统后您可以直接安装所需软件然后不需要运行`Sysprep`直接关机，直接制作模板即可。克隆虚拟机也是一样的方法。然后您可以在模板管理中对应模板的下拉框中看到子版本的模板信息。

## Linux启动后命令

此功能允许在系统完成初始化后后台自动执行命令，通常可以用于配置自己的业务环境和更换镜像源

`等待命令执行完毕后再启动 SSH`用于必须要等待命令执行完毕后才允许用户使用的场景，通过阻止SSH实现禁止功能。

### 更换镜像源

可以使用[linuxmirrors](https://linuxmirrors.cn/)的脚本来完成自动换源

```bash
bash <(curl -sSL https://gitee.com/SuperManito/LinuxMirrors/raw/main/ChangeMirrors.sh) --source mirrors.aliyun.com --protocol http --use-intranet-source false  --install-epel true --backup false --upgrade-software false --clean-cache false --ignore-backup-tips
```

然后勾选 `等待命令执行完毕后再启动 SSH`

## 相关文档

* [模板管理](/docs/install/quick-start/template-management) - 了解模板的管理和使用
* [安装 Windows](install-windows.mdx) - Windows 系统安装指南
* [安装 Linux](install-linux.mdx) - Linux 系统安装指南

---

> 原文路径：/docs/install/advanced/create-template（本文由 QVMConsole 文档站自动生成，供大模型阅读）
