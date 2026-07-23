# 🚀 旅途项目部署方法论 v1.0

> **血的教训,每一条都踩过坑。永远不要跳过任何一步。**

---

## 一、部署流程(严格按此顺序)

```
1. 本地代码完成 → next build 通过(TS 0 错误)
2. git commit + tag
3. 推送到 GitHub(先确认能推通!)
4. Vercel 自动部署(需要等 2-3 分钟)
5. 浏览器打开验证(用 Vercel 生成的域名,不是预览 URL)
```

---

## 二、推送代码到 GitHub(最坑的一步!)

### 2.1 推送前必做检查清单

| # | 检查项 | 怎么做 |
|---|--------|--------|
| 1 | `next build` 是否通过? | `cd 项目目录 && npx next build`,必须 0 错误 |
| 2 | `.env.local` 是否在 `.gitignore` 里? | `git ls-files | grep .env` 应该没有输出 |
| 3 | commit 邮箱是否匹配 GitHub 账号? | `git log -1 --format="%ae"` 必须等于 GitHub 绑定的邮箱 |
| 4 | git remote 用 SSH 还是 HTTPS? | **强制用 SSH!** 见 2.2 |
| 5 | GitHub 仓库是否存在? | 浏览器打开 https://github.com/用户名/仓库名,确认不是 404 |

### 2.2 ⚠️ 永远用 SSH 推送,不要用 HTTPS!

**原因**:Windows 上的 HTTPS 推送会遇到四重地狱:
1. 公司/学校代理拦截 TLS(Connection reset/recv failure)
2. Windows 自带代理注入 `[200~` 转义码破坏 URL
3. 证书吊销检查失败(CRYPTO_E_REVOCATION_OFFLINE)
4. 443 端口连接超时(Connection timed out)

**解决方案(一次性配置)**:

```bash
# 1. 生成 SSH key(如果没有)
ssh-keygen -t ed25519 -C "GitHub绑定的邮箱"  # 一路回车不设密码

# 2. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 3. 打开 https://github.com/settings/keys → New SSH key → 粘贴 → Add

# 4. 在项目目录里,把 remote 改成 SSH:
git remote set-url origin git@github.com:用户名/仓库名.git

# 5. 验证
git remote -v   # 必须显示 git@github.com:... 不是 https://
ssh -T git@github.com  # 必须显示 "Hi 用户名! You've successfully authenticated"
```

所有后续推送都用 `git push origin master`,不会再弹 HTTPS 错误。

### 2.3 commit 邮箱必须匹配 GitHub 账号!

**问题**:Vercel 会拒绝任何 author 邮箱**不匹配任何 GitHub 账号**的 commit。

**解决方案**:

```bash
# 查看当前邮箱
git log -1 --format="%an <%ae>"

# 如果不匹配 GitHub 绑定的邮箱,改成对的:
git config user.email "GitHub绑定的邮箱"

# 修改最后一个 commit 的作者(已经在本地但没推送时):
git commit --amend --reset-author --no-edit
git push origin master --force
```

**GitHub 绑定的邮箱在哪看**: https://github.com/settings/emails

### 2.4 给用户的一键推送命令

以后每次版本推送,给用户这 3 行(前提:SSH 已配好,remote 是 SSH):

```bash
cd /c/Users/用户名/仓库目录
git remote -v    # 确认是 git@github.com:... 不是 https://
git push origin master --tags --force
```

---

## 三、Vercel 部署(第二个大坑区!)

### 3.1 部署前必做检查

| # | 检查项 | 怎么做 |
|---|--------|--------|
| 1 | Vercel 项目是否选对了? | Vercel 列表里可能有多个项目(lvtu vs lvtu-kueq),确认操作的是最新那个 |
| 2 | 是否绑定了正确的 GitHub 仓库? | Vercel 项目 Settings → Git → 确认是 用户名/仓库名 |
| 3 | **4 个环境变量是否全部设了?** | 见 3.2 |
| 4 | 构建命令是否正确? | Settings → Build → Framework 应该是 Next.js |

### 3.2 必须设置的 4 个环境变量

在 Vercel 项目 → Settings → **Environment Variables**(不是 Environments!)→ 添加:

| Key | Value 来源 |
|-----|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope 控制台 |

每个变量的 **Environments** 都要勾 Production / Preview / Development 三个。

### 3.3 部署后验证

1. 等 Vercel 显示 🟢 **Ready**
2. 浏览器打开域名(如 `lvtu.vercel.app`)——**不是沙箱预览 URL!**
3. 快速检查:
   - 页面能加载 → 基础构建成功
   - 上传一张截图 → Supabase + AI 链路通
   - 切地图视图 → Leaflet 瓦片加载成功
   - 点新页面链接 → 路由都在

### 3.4 常见 Failure 排查

| Build Log 关键词 | 原因 | 解法 |
|-----------------|------|------|
| `supabaseUrl is required` | 没设 Supabase URL 环境变量 | 去 Vercel 设 4 个环境变量 |
| `Deployment Blocked` + `commit email could not be matched` | commit 邮箱不匹配 GitHub 账号 | 改 commit 邮箱后重新推送(见 2.3) |
| `Module not found: Can't resolve 'xxx'` | 依赖没装或版本不对 | `pnpm install` 然后重推 |
| `Type error` | TypeScript 编译错误 | `npx next build` 先本地修好再推 |

---

## 四、Supabase 数据库

### 4.1 每次改表都要

1. 写迁移 SQL 文件(`supabase-migration-vX.X.sql`)
2. **在 Supabase SQL Editor 手动执行**(不能自动化)
3. 执行后验证:Vercel 上测试相关 API 返回 200

Supabase SQL Editor 直达:
```
https://supabase.com/dashboard/project/bkvpezzouhzrdafwpcvt/sql/new
```

### 4.2 常见 Supabase 错误

| 错误 | 原因 | 解法 |
|------|------|------|
| API 返回 500 + "获取失败" | 表不存在 | 去 SQL Editor 跑迁移 SQL |
| API 返回 404 | Vercel 没重启/代码没推 | 重新 push 到 GitHub |
| Storage 上传 403 | Bucket 不是 public | 在 Supabase Storage 里把 bucket 设为公开 |

---

## 五、沙箱限制(Agent 端知道就行)

| 限制 | 影响 | 绕过方案 |
|------|------|---------|
| 无法访问 `github.com:443` | 不能从沙箱 push 代码 | **让用户本地 push** |
| 无法访问 `vercel.app` | 不能从沙箱验证 Vercel 部署 | **让用户在浏览器验** |
| 无法访问 OSM 瓦片服务器 | 沙箱预览地图不显示 | **Vercel 上正常,用户浏览器直接加载瓦片** |
| `gh` CLI 未登录 | 不能用 `gh` 操作 GitHub | 用 git + SSH |

---

## 六、版本发布 Checklist

每次发布版本前,逐项打勾:

- [ ] `npx next build` 通过
- [ ] `.env.local` 在 `.gitignore` 中
- [ ] commit email 匹配 GitHub 账号(`git log -1 --format="%ae"`)
- [ ] git remote 是 SSH(`git remote -v`)
- [ ] `git tag -a vX.Y.Z -m "描述"` 打标签
- [ ] `git push origin master --force --tags` 推送成功
- [ ] Vercel 环境变量 4 项全部就位
- [ ] Supabase 迁移 SQL 已执行
- [ ] Vercel 部署状态 Ready
- [ ] 浏览器打开网站验证核心功能

---

## 七、给用户的最简推送命令(每次发布都可用)

> ⚠️ 前提:已配好 SSH key 并在项目目录里

```bash
# 确认 SSH 连通
ssh -T git@github.com
# 必须看到: Hi 用户名! You've successfully authenticated

# 确认 remote 是 SSH
git remote -v
# 必须看到: git@github.com:用户名/仓库名.git

# 推送
git push origin master --tags --force
```

---

**最后更新**:2026-07-20 · 版本:v0.4 部署后的血泪总结
