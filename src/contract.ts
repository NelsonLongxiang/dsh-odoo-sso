/**
 * Odoo SSO 契约（v0 冻结）——六贡献面中 v0 只契约+骨架。
 *
 * 外部资产锚（活体已探）：Odoo 19 @ http://192.168.3.88:8069
 *  - /web/login 200（53ms）✓
 *  - /odoo_sso 404（模块未装——本插件装它）
 *
 * 身份流（odoo_sso 握手）：
 *  1. 用户带 Odoo 会话访问 DSH → 插件经 odoo_sso 校验会话 → 取 uid/组
 *  2. 首登自动开账（svc-auth 映射：Odoo 组 → DSH 角色）
 *  3. 无会话 → 跳 Odoo 登录 → 回跳续接
 *
 * JWT·RBAC（svc-auth 在产，不依赖飞书凭证）：
 *  - token 签发/校验走 svc-auth 既有面
 *  - RBAC：Odoo group → DSH preset/policy 映射表（本插件配置面）
 */

/** odoo_sso 握手端点（Odoo 侧模块——v1 装） */
export const PIWEB_SSO_PATHS = {
  handshake: '/piweb_sso/handshake',   // GET：会话校验 → { uid, login, groups[], session_valid }
  redirect: '/piweb_sso/redirect',     // GET：无会话 → 302 Odoo 登录带回跳
  logout: '/piweb_sso/logout',         // POST：销Odoo会话
} as const;

/** 插件配置（cordis.yml config 面） */
export interface OdooSsoConfig {
  odooBase: string;                    // http://192.168.3.88:8069
  autoProvision: boolean;              // 首登自动开账
  groupMap: Record<string, string>;    // Odoo group → DSH 角色
}

/** 六贡献面（L3 全能型）——v0 骨架逐面挂空实现+契约注释 */
export interface Contributions {
  /** ①HTTP 路由：/odoo/sso/* 面（握手/回跳/登出） */
  routes: readonly string[];
  /** ②中间件：请求预处理（会话探测/头部注入） */
  middleware: readonly string[];
  /** ③MCP 工具：sso_status/sso_whoami */
  mcpTools: readonly string[];
  /** ④UI：登录态徽章+角色显示（client slot） */
  ui: readonly string[];
  /** ⑤自注册：装配即报身份源（svc-auth 声明） */
  selfRegister: readonly string[];
  /** ⑥生命周期：start/stop（连接池/缓存清理） */
  lifecycle: readonly string[];
}
