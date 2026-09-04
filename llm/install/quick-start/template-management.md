# 使用模板创建虚拟机

您可以通过模板实现**毫秒级创建虚拟机**。作者已制作了原版镜像可供大家导入使用。

## 下载预置模板

请通过以下链接下载预置模板压缩包（模板文件夹）：

* **123网盘**：[https://1852139552.share.123865.com/123pan/OAgIvd-fYoOH](https://1852139552.share.123865.com/123pan/OAgIvd-fYoOH)(官方)
* **夸克网盘**：[https://pan.quark.cn/s/a5c1097063cd](https://pan.quark.cn/s/a5c1097063cd)(非官方)
* **百度网盘**：[https://pan.baidu.com/s/1iEftpZkQgoCWTCS5PSSlXw?pwd=6f9y](https://pan.baidu.com/s/1iEftpZkQgoCWTCS5PSSlXw?pwd=6f9y)(非官方)
* **天翼云盘**：[https://cloud.189.cn/t/imINNjJFRVZ3](https://cloud.189.cn/t/imINNjJFRVZ3)(非官方；访问码：oop1)
* **迅雷云盘**：[https://pan.xunlei.com/s/VOvTNCA39Hj0BWQUDmyGp5g4A1?pwd=uevj#](https://pan.xunlei.com/s/VOvTNCA39Hj0BWQUDmyGp5g4A1?pwd=uevj#)(非官方)

## 导入模板

将下载好的模板压缩包通过以下方式上传到设备中：

* **网页上传**：在管理面板的模板管理页面直接上传
* **SFTP 上传（弱网推荐）**：通过 SFTP 工具将文件传输到服务器指定目录

上传完成后，在模板管理页面选择合适的导入方式即可完成模板导入。

## 从模板创建虚拟机

模板导入成功后，在**新建虚拟机**表单中选择 **「从模板快速克隆」** 即可使用模板创建虚拟机。系统会自动基于模板生成虚拟机磁盘，并支持批量创建多台相同配置的虚拟机。

> **快速上手** 从模板克隆的虚拟机会自动完成系统初始化，包括主机名设置、账号密码注入等，实现开箱即用。

## 链式克隆注意事项

> **重要警告** 若您选择**链式克隆**方式创建虚拟机，您必须确保**模板不能丢失或损坏**，否则将造成克隆后的虚拟磁盘损坏！
>
> 请务必将模板存放到**安全的硬盘阵列**中，重要数据建议通过**挂载数据盘**方式单独存放，避免模板丢失造成数据损坏！

***

> **功能与原理** 深入了解模板的元数据系统、树形结构、克隆模式、删除策略等技术细节，请参阅 [模板管理原理](/docs/tech/feature-analysis/template-management) 文档。

> **相关内容**
>
> * [制作模板](/docs/install/advanced/create-template) — 学习如何将虚拟机制作为模板
> * [系统初始化原理](/docs/tech/feature-analysis/system-initialization) — 克隆时的系统初始化机制

---

> 原文路径：/docs/install/quick-start/template-management（本文由 QVMConsole 文档站自动生成，供大模型阅读）
