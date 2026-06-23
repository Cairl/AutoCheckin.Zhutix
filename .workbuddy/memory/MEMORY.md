# CheckinMan 项目记忆

## 项目结构
- `CheckinMan-zhutix.user.js` — 致美化签到油猴脚本 (v2.3)
- `github_sync.bat` — GitHub 同步脚本
- `README.md` — 项目说明

## B2 主题签到 API (致美化 zhutix.com)
- 认证: JWT Token，存于 b2_token cookie，通过 `Authorization: Bearer <token>` header 传递
- **两阶段签到流程** (B2 新版):
  1. POST `/wp-json/b2/v1/getUserMission` + body `count=10&paged=1` (获取任务数据)
  2. POST `/wp-json/b2/v1/userMission` + body `""` (执行签到)
- 响应结构兼容性: 尝试 `d.data.mission.credit` → `d.mission.credit` → `d.credit` 三级 fallback
- day (连续天数) 优先从 userMission 响应获取，缺失时从 getUserMission 响应 fallback
- 重复签到返回 400/403，message 含"已签到"或"重复"
- 网络错误时不标记日期，下次访问自动重试

## 编码规范
- toast 使用 DOM 构造 + textContent，禁止 innerHTML 注入动态文本
- 日期格式统一 `YYYY-MM-DD` (padStart 补零)
- .bat 脚本 echo 输出使用英文
- 版本号同步更新
