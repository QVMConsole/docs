# Docusaurus 文档打包脚本
# 用法: .\build.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectRoot = $PSScriptRoot
$outputDir = "$projectRoot\dist"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  QVMConsole 文档 - 打包编译" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  请选择打包模式:" -ForegroundColor White
Write-Host ""
Write-Host "    1. 本地构建 - 生成静态文件用于本地预览或手动部署" -ForegroundColor White
Write-Host "    2. 推送模式 - 构建后自动推送到 gh-pages 分支" -ForegroundColor White
Write-Host ""

$modeInput = Read-Host "  请输入选项 (1/2, 默认1)"
if ([string]::IsNullOrWhiteSpace($modeInput)) { $modeInput = "1" }

switch ($modeInput) {
    "1" {
        $buildMode = "local"
        Write-Host ""
        Write-Host "  [MODE] 本地构建" -ForegroundColor Cyan
    }
    "2" {
        $buildMode = "push"
        Write-Host ""
        Write-Host "  [MODE] 推送模式" -ForegroundColor Cyan
    }
    default {
        Write-Host "  [ERROR] 无效选项，请输入 1 或 2" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 检查环境
try { node --version 2>&1 | Out-Null } catch {
    Write-Host "[ERROR] 未安装 Node.js" -ForegroundColor Red; exit 1
}

# 检查 pnpm
try { pnpm --version 2>&1 | Out-Null } catch {
    Write-Host "[ERROR] 未安装 pnpm，请运行: npm install -g pnpm" -ForegroundColor Red; exit 1
}

# 清理旧的编译产物
if (Test-Path $outputDir) {
    Write-Host "[INFO] 清理旧的编译产物..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $outputDir
}

# 确保依赖已安装
Write-Host "[1/2] 检查依赖..." -ForegroundColor Yellow
Set-Location $projectRoot

if (-not (Test-Path "$projectRoot\node_modules")) {
    Write-Host "[INFO] 安装依赖..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 编译文档
Write-Host ""
Write-Host "[2/2] 编译文档..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 文档编译失败" -ForegroundColor Red
    exit 1
}

# 复制编译产物到 dist 目录
$buildDir = "$projectRoot\build"
if (Test-Path $buildDir) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Copy-Item -Recurse -Force "$buildDir\*" "$outputDir\"
    Write-Host "[OK] 文档编译完成" -ForegroundColor Green
} else {
    Write-Host "[ERROR] 编译产物不存在" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  打包完成!" -ForegroundColor Green
Write-Host "  输出目录: $outputDir" -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "  文件结构:" -ForegroundColor White
Write-Host "    dist/" -ForegroundColor White
Write-Host "    ├── index.html      首页" -ForegroundColor White
Write-Host "    ├── docs/           文档页面" -ForegroundColor White
Write-Host "    ├── assets/         静态资源" -ForegroundColor White
Write-Host "    └── ...             其他静态文件" -ForegroundColor White
Write-Host ""

# ==========================================
# 推送模式：询问是否推送到 gh-pages 分支
# ==========================================
if ($buildMode -eq "push") {
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "  静态文件推送" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  是否将构建产物推送到 gh-pages 分支?" -ForegroundColor White
    Write-Host "  (适用于 GitHub Pages、静态托管部署)" -ForegroundColor Gray
    Write-Host ""

    $pushInput = Read-Host "  请输入 (y/N, 默认N)"

    if ($pushInput -eq "y" -or $pushInput -eq "Y") {
        Write-Host ""
        Write-Host "[INFO] 准备推送静态文件到 gh-pages 分支..." -ForegroundColor Yellow

        # 检查 git 环境
        try {
            git --version 2>&1 | Out-Null
        } catch {
            Write-Host "[ERROR] 未安装 Git，跳过推送" -ForegroundColor Red
            return
        }

        # 获取远程仓库地址
        $remoteUrl = git remote get-url origin 2>$null
        if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
            Write-Host "[ERROR] 未找到 git remote origin，跳过推送" -ForegroundColor Red
        } else {
            # 创建临时目录（放在项目根目录下，避免与输出目录冲突）
            $tempDir = "$projectRoot\_temp_push"
            if (Test-Path $tempDir) {
                Remove-Item -Recurse -Force $tempDir
            }
            New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

            # 复制构建产物
            Copy-Item -Recurse -Force "$outputDir\*" "$tempDir\"

            # 初始化 git 仓库并提交
            Push-Location $tempDir
            git init 2>&1 | Out-Null
            git checkout --orphan gh-pages 2>&1 | Out-Null
            git add -A 2>&1 | Out-Null
            git commit -m "chore: deploy docs static files" 2>&1 | Out-Null
            git remote add origin $remoteUrl 2>&1 | Out-Null

            Write-Host "[INFO] 正在推送到 gh-pages 分支..." -ForegroundColor Yellow
            $pushResult = git push origin gh-pages --force 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] 推送失败，请检查网络和 Git 权限" -ForegroundColor Red
                Write-Host $pushResult -ForegroundColor Red
            } else {
                Write-Host "[OK] 静态文件已推送到 gh-pages 分支" -ForegroundColor Green
            }
            Pop-Location

            # 清理临时目录
            Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host ""
        Write-Host "[INFO] 跳过推送" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 返回项目根目录
Set-Location $projectRoot
