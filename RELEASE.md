# 发版说明（维护者）

## 市场链接

| 渠道 | URL |
|------|-----|
| GitHub Release | https://github.com/zhengge6/UJSCOURSE/releases |
| 脚本猫 | https://scriptcat.org/zh-CN/script-show-page/8701 |
| Greasy Fork | https://greasyfork.org/zh-CN/scripts/602041-ujscourse-江苏大学自动评教 |

## Greasy Fork 自动更新（已配置）

以后 **不必** 再手动打开 Greasy Fork 点「更新」。

1. Greasy Fork 管理页已设 **自动同步**，源：
   `https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js`
2. GitHub 仓库已挂 Webhook（`push` + `release`）→
   `https://api.greasyfork.org/zh-CN/users/1000648-zhengge6/webhook`
3. 发版流程只要把带新 `@version` 的 `auto.user.js` 推到 `main`（或打 Release），
   Greasy Fork 会自己拉 raw 并更新。

Webhook secret 只存在 GitHub Settings → Webhooks，**不要**写进仓库。

## 推荐发版步骤

1. 改 `auto.src.js` 头部 `@version`（及功能）
2. `npm run sync` → 写出可读 `auto.user.js`
3. 更新 README 版本号 / changelog（用户向，不要写 QQ / webhook / 混淆）
4. `git commit` + `git push origin main`
5. `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file ...`
6. Greasy Fork：等 webhook（一般几十秒）；脚本猫：管理页「更新脚本」手工贴一次代码（暂无同等 webhook）

## 自检

- 本地 `auto.user.js` 的 `@version` 与即将发的 tag 一致
- `@namespace` 非空：`https://github.com/zhengge6/UJSCOURSE`
- push 后可在 GitHub → Settings → Webhooks → Recent Deliveries 看是否 `200`
- Greasy Fork 脚本页版本号是否变成新版
