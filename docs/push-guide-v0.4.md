# 旅途 v0.4 推送指南(Windows 必看)

## 现状
- ✅ tar.gz 已下载到本地(143.8KB,文件名 v04.tar.gz)
- ❌ git clone 因终端转义码注入失败
- 解决:跳过 git clone,改用 git init + force push

## 操作步骤(逐行复制粘贴,每行回车后等)

### 第 1 步:解压(用浏览器下也行)

在浏览器打开 https://bkvpezzouhzrdafwpcvt.supabase.co/storage/v1/object/public/updates/v0.4/lvtu-v0.4.tar.gz
另存为到 C:\Users\10842\Downloads\lvtu-v0.4.tar.gz

(或者用 curl -kL 重新下载,见下面)

### 第 2 步:在 Git Bash 里跑这些

```bash
# 1. 进入 Downloads
cd /c/Users/10842/Downloads

# 2. 把 v04.tar.gz 重命名(如果你前面下到了别的名字)
ls -la v04.tar.gz 2>/dev/null && mv v04.tar.gz lvtu-v0.4.tar.gz

# 3. 创建项目目录并解压
mkdir -p /c/Users/10842/lvtu
cd /c/Users/10842/lvtu
tar xzf /c/Users/10842/Downloads/lvtu-v0.4.tar.gz
ls
# 应该看到: src  public  docs  package.json  supabase-migration-v0.4.sql 等

# 4. 初始化 git 并提交
git init -b master
git config user.name "旅途开发者"
git config user.email "lvtu@journey.app"
git add -A
git commit -m "v0.4: 路线/日记/明信片/成就/天气/AI推荐"

# 5. 关联远程仓库并强制推送
# ⚠️ 把 PAT_TOKEN 替换成你新生成的 token(只勾 repo,7 天)
git remote add origin https://Rotatouo:PAT_TOKEN@github.com/Rotatouo/lvtu.git
git push -u origin master --force --tags
```

## 注意事项
1. **PAT_TOKEN**:去 https://github.com/settings/tokens 重新生成一个,只勾 `repo`,7 天。把上面命令里的 `PAT_TOKEN` 4 个字整体替换成你的新 token(以 ghp_ 开头)
2. **--force 必须加**:因为是 git init 全新仓库,远程有 v0.3 的提交,不用 force 会冲突
3. **如果 push 时还问用户名密码**:说明 token 没正确替换,检查 token 是不是完整的
