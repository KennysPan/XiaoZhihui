# XiaoZhihui

XiaoZhihui 是一个微信小程序项目，面向智慧校园场景，提供教师端、家长端和代理商端三类角色入口。项目主包以教师端首页、扫码和个人中心为核心，家长端、代理商端以及教师业务页面通过分包加载，降低主包体积并便于按角色维护。

## 功能概览

### 教师端

- 教师登录、找回密码和 token 失效后重新选择角色登录
- 首页数据看板、班级列表、学生列表和校园公告
- 学生管理、学生详情、班级详情
- 考勤管理、学生考勤记录查询和教师补签
- 请假管理、请假审批
- 学生评价、班级评价、荣誉墙和更多功能中心

### 家长端

- 家长登录、密码重置和个人中心
- 孩子管理、添加孩子、学生信息查看
- 考勤查询、请假申请、请假审批列表
- 课程表、通知公告、通知详情
- 德育评价、增补校徽和关于页面

### 代理商端

- 代理商登录
- 学校管理、补货订单、创建订单
- 收益统计、维修管理和个人中心

## 技术栈

- 微信小程序原生框架
- Vant Weapp `^1.11.7`
- ECharts 微信小程序组件
- 自定义 tabBar
- 分包加载

## 目录结构

```text
.
├── app.js                    # 小程序入口和全局登录状态
├── app.json                  # 页面、分包、窗口和 tabBar 配置
├── app.wxss                  # 全局样式
├── config/                   # 环境和常量配置
├── custom-tab-bar/           # 自定义底部导航
├── components/               # 通用业务组件
├── ec-canvas/                # ECharts 小程序组件
├── pages/
│   ├── roleSelect/           # 角色选择页
│   ├── teacher/              # 教师端页面
│   ├── parent/               # 家长端页面
│   └── agent/                # 代理商端页面
├── utils/                    # 请求、接口封装、工具和模拟数据
├── miniprogram_npm/          # 微信开发者工具构建后的 npm 包
├── package.json              # npm 依赖
└── project.config.json       # 微信开发者工具项目配置
```

## 本地运行

1. 安装依赖：

   ```bash
   npm install
   ```

2. 使用微信开发者工具导入当前目录。

3. 在微信开发者工具中执行“工具 -> 构建 npm”，生成或刷新 `miniprogram_npm`。

4. 选择对应编译模式或直接从 `pages/roleSelect/roleSelect` 进入角色选择页。

## 接口配置

接口请求主要通过 `utils/Ext.js` 和 `utils/dataService.js` 发起。当前公共请求基准地址位于 `utils/Ext.js`：

```js
static Url = 'https://sms.kennyspan.xyz:8665';
```

`config/env.js` 中保留了开发和生产环境配置示例。如果后续要按开发版、体验版、发布版自动切换接口，需要把公共请求封装统一接入该配置。发布前请确认 `Ext.Url` 指向正确后端环境。

## 登录与会话

- 登录接口为 `/api/sessions`
- token 存储键包括 `accessToken`、`token_expire`、`tokenType`
- 角色选择信息存储键包括 `selected_role`、`selected_role_path`
- token 失效后会清理本地登录态，并跳转到角色选择页提示重新登录

## 打包说明

`project.config.json` 中配置了以下忽略项：

```json
"packOptions": {
  "ignore": [
    { "value": "node_modules", "type": "folder" },
    { "value": "minitest", "type": "folder" },
    { "value": "ec-canvas", "type": "folder" }
  ]
}
```

上传小程序时如果看到这些目录未被打包，属于当前配置下的正常提示。需要使用图表组件的页面已经在相关分包内包含 `ec-canvas` 资源。

## 常用开发约定

- 新增页面后需要同步更新 `app.json` 的 `pages` 或 `subPackages`
- 教师端主 tab 页面使用 `wx.switchTab`
- 分包内页面跳转使用 `wx.navigateTo` 或 `wx.redirectTo`
- 请求接口前优先通过公共封装处理鉴权和 token 失效逻辑
- 不要把真实账号、密码、token 或生产密钥写入仓库

## 依赖

当前 npm 依赖：

```json
{
  "@vant/weapp": "^1.11.7"
}
```

依赖更新后需要重新执行微信开发者工具的“构建 npm”。
