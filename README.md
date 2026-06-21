# CheckinMan

Tampermonkey 油猴脚本合集，收集各站点每日自动签到脚本。

## 脚本列表

| 脚本 | 目标站点 | 说明 |
|------|---------|------|
| [CheckinMan-zhutix.user.js](../../raw/main/CheckinMan-zhutix.user.js) | 致美化 | 每天自动签到，获取锋币 |

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击上表脚本链接，Tampermonkey 自动弹安装框

## 命名规范

所有脚本统一格式：`CheckinMan-<site>.user.js`

- `CheckinMan`：合集项目名前缀
- `<site>`：目标站点标识（小写英文）

脚本内部 `@name` 同步采用：`CheckinMan - <站点中文名>签到`

## 工作原理（以致美化为例）

1. **首次**：正常登录致美化网站，脚本自动保存登录凭证
2. **之后**：打开任意网页时，脚本静默调用签到 API（一天仅一次）
3. 签到成功后右上角弹出提示，显示获得锋币和连续签到天数
4. 已签到或签到失败均标记为已处理，当天不再重复
5. 网络错误不标记，下次打开网页自动重试
