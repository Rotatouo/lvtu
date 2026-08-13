# 旅途 P2 求职材料与部署实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 统一网站、GitHub 与求职材料的事实口径，部署国内主链接和备用链接，并形成可直接投递与面试使用的完整材料。

**架构：** README 和求职材料从已验证的产品行为与 `evaluation/report.json` 提取事实；不手写无法复核的数字。EdgeOne 作为国内主站，Vercel 作为备用，两个环境只由用户在平台后台配置 DashScope 变量。

**技术栈：** Markdown、Next.js 生产构建、EdgeOne Pages、Vercel、GitHub。

---

## 文件结构

- 修改：`README.md`：真实项目说明、架构、运行、评测与边界。
- 创建：`docs/portfolio/项目案例一页纸.md`：一页式项目介绍。
- 创建：`docs/career/简历项目描述.md`：长短两版简历描述。
- 创建：`docs/career/三分钟面试讲稿.md`：按问题、方案、证据、复盘组织。
- 创建：`docs/career/项目深挖问答.md`：模型、评测、AI 协作、失败与边界问答。
- 创建：`docs/deployment/edgeone-deployment.md`：无密钥部署步骤和验收记录。
- 修改：`src/features/portfolio/components/AboutSection.tsx`：真实个人信息与简历入口。
- 创建：`src/features/portfolio/components/AboutSection.test.tsx`：公开联系方式与简历动作测试。
- 创建：`src/features/portfolio/readme-consistency.test.ts`：README 事实一致性测试。
- 创建：`src/features/portfolio/claims-consistency.test.ts`：跨材料声明一致性测试。
- 创建：`public/resume.pdf`：用户确认公开后的最终简历 PDF。

## 任务 1：重写 README 并建立声明核对表

- [ ] **步骤 1：创建事实核对清单**

逐项从代码、评测报告和线上行为核对：模型名、字段、样本数、重复调用数、实时/回放边界、账户与持久化范围、部署地址、旧功能状态。任何数字必须引用 `evaluation/report.json` 的键或明确写为定性描述。

- [ ] **步骤 2：重写 README**

固定章节：项目一句话、问题背景、我的角色、核心体验、AI 工作流、评测方法、真实结果、Badcase、架构、运行方式、环境变量名、已知边界、版本记录。删除 Gemini、Mock 可完整体验、已完成多用户和未验证准确率等错误表述。

- [ ] **步骤 3：增加 README 自动一致性测试**

```ts
it("uses the verified model name and omits stale claims", () => {
  const readme = readFileSync("README.md", "utf8");
  expect(readme).toContain("qwen-vl-plus");
  expect(readme).not.toContain("Gemini 2.0 Flash");
  expect(readme).not.toMatch(/20\+.*用户测试/);
  expect(readme).toContain(`${report.sampleCount} 张探索性评测`);
});
```

- [ ] **步骤 4：运行一致性测试并提交**

```powershell
pnpm test:run src/features/portfolio/readme-consistency.test.ts
git add README.md src/features/portfolio/readme-consistency.test.ts
git commit -m "docs: rewrite portfolio README"
```

## 任务 2：输出简历、讲稿、深挖问答和一页纸

- [ ] **步骤 1：生成简历长短两版**

短版控制为 2 至 3 条，每条使用“动作 + 产品判断 + 可验证证据”；长版补充模型字段、人工确认与 Badcase。不得写“独立完成全部开发”，使用“提出并定义、通过 AI 编程工具辅助实现、负责验收与迭代”。

- [ ] **步骤 2：生成三分钟讲稿**

时间结构固定为：30 秒问题与角色、60 秒核心链路、60 秒评测和 Badcase、30 秒复盘与岗位匹配。所有数字从报告读取后写入。

- [ ] **步骤 3：生成项目深挖问答**

至少覆盖：为什么用 `qwen-vl-plus`、为什么不能只看总准确率、如何标注、为何 30 张只称探索性评测、如何处理低置信度、AI 工具完成了什么、本人完成了什么、为什么移除 Supabase 核心依赖、如何防止实时接口滥用、如果有更多时间如何验证真实需求。

- [ ] **步骤 4：生成一页式项目介绍**

一页纸包含问题、方案图、一次交互流程、三项真实指标、一个 Badcase、个人角色、链接与二维码位置。PDF 或图片制作安排在网站数据稳定后，文本源先存 Markdown。

- [ ] **步骤 5：运行交叉声明检查并提交**

脚本扫描 README、案例页和三份求职材料，验证模型名、样本数和重复调用数一致，且不存在 Gemini 和虚构用户测试描述。

```powershell
pnpm test:run src/features/portfolio/claims-consistency.test.ts
git add docs/career docs/portfolio src/features/portfolio/claims-consistency.test.ts
git commit -m "docs: add AI PM career materials"
```

## 任务 3：补充 About 信息和简历下载

- [ ] **步骤 1：用户提供并确认公开信息**

用户确认真实姓名、公开邮箱、是否展示手机号/微信、GitHub 链接与最终简历。未确认的联系方式不得放入公开仓库或页面。

- [ ] **步骤 2：编写失败的 About 组件测试**

```tsx
it("exposes the approved contact and resume actions", () => {
  render(<AboutSection />);
  expect(screen.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
  expect(screen.getByRole("link", { name: "查看 GitHub" })).toHaveAttribute("href", "https://github.com/Rotatouo/lvtu");
});
```

- [ ] **步骤 3：实现并验证**

只写用户批准公开的信息；外部链接使用安全属性；简历 PDF 不包含详细身份证件、家庭住址或第三方隐私。

- [ ] **步骤 4：运行测试并提交**

```powershell
pnpm test:run src/features/portfolio/components/AboutSection.test.tsx
git add src/features/portfolio/components/AboutSection.tsx public/resume.pdf
git commit -m "feat: add portfolio contact and resume"
```

## 任务 4：部署 EdgeOne 国内主站

- [ ] **步骤 1：运行最终本地门禁**

```powershell
pnpm test:run
pnpm lint
pnpm build
git diff --check
```

预期：全部通过。

- [ ] **步骤 2：用户注册腾讯云中国站并完成实名认证**

不在对话中提供账号、验证码、Token 或 API Key。创建 EdgeOne Pages 项目并连接 `Rotatouo/lvtu` 的待部署分支。

- [ ] **步骤 3：配置构建**

构建命令使用 `pnpm build`，安装命令使用 `pnpm install --frozen-lockfile`。仅在 EdgeOne 控制台后台添加 `DASHSCOPE_API_KEY`；不要创建 `.env` 提交文件。

- [ ] **步骤 4：部署并验证静态回放**

先不配置模型变量部署一次，确认首页、6 个回放样本、人工确认、评测和 Badcase 全部可用，实时识别显示“服务未配置”并能返回回放。

- [ ] **步骤 5：配置模型变量并验证实时识别**

用户在控制台配置后重新部署。使用一张允许测试的旅行截图，确认接口成功、页面区分实时模式、错误日志不含密钥。

- [ ] **步骤 6：记录主链接与国内访问证据**

用户分别用常用 Wi-Fi 和手机网络打开主链接，记录日期、网络、首屏加载、回放、实时识别结果。写入 `docs/deployment/edgeone-deployment.md`，不记录账户或密钥。

- [ ] **步骤 7：提交部署文档**

```powershell
git add docs/deployment/edgeone-deployment.md
git commit -m "docs: record EdgeOne deployment verification"
```

## 任务 5：更新 Vercel 备用站与最终交付核对

- [ ] **步骤 1：在 Vercel 后台更新同一环境变量**

由用户在 Vercel 控制台操作，不在对话或终端输出变量值。

- [ ] **步骤 2：部署并验证备用链接**

检查静态回放、实时识别和错误降级；记录备用地址。

- [ ] **步骤 3：将主链接写入 README、简历与 About**

EdgeOne 为主链接，Vercel 标注为备用。运行声明一致性测试。

- [ ] **步骤 4：最终浏览器验收**

在 EdgeOne 与 Vercel 各验证桌面和移动端：首屏、五段导航、6 个回放样本、实时识别、确认收藏、评测指标、Badcase、简历下载、GitHub 链接和 reduced-motion。

- [ ] **步骤 5：运行最终质量门禁**

```powershell
pnpm test:run
pnpm lint
pnpm build
git status --short
git log --oneline -12
```

预期：测试、lint、build 全部通过；工作区仅包含已知且经确认的改动；提交历史按 P0、P1、P2 分层可读。

- [ ] **步骤 6：提交链接更新**

```powershell
git add README.md docs src public
git commit -m "release: prepare lvtu portfolio for applications"
```
