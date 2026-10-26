/**
 * Odoo SSO 插件骨架（v0）——L3 全能型六贡献面。
 * 每面：契约注释 + 空实现 + TODO(v1) 标记。判据先红：骨架面缺实现即红。
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { PIWEB_SSO_PATHS, type OdooSsoConfig } from './contract.ts';

export const inject = ['tools', 'timer', 'systemPrompt'];

export class SsoService extends Service {
  private ssoConfig: OdooSsoConfig;
  constructor(ctx: Context, config: OdooSsoConfig) {
    super(ctx, 'odooSso');
    this.ssoConfig = config;
  }
  get config(): OdooSsoConfig { return this.ssoConfig; }
  /** ① 握手：Odoo 会话校验——v1 实装（调 Odoo /piweb_sso/handshake·带 session_id cookie） */
  async handshake(sessionId: string): Promise<{ uid: number; login: string; groups: string[]; session_valid: boolean }> {
    const odooBase = (this.config as OdooSsoConfig).odooBase;
    const res = await fetch(`${odooBase}${PIWEB_SSO_PATHS.handshake}`, {
      headers: { Cookie: `session_id=${sessionId}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Odoo handshake HTTP ${res.status}`);
    const j = await res.json() as { uid?: number; login?: string; groups?: string[]; session_valid?: boolean };
    if (!j.session_valid) throw new Error('Odoo 会话无效或已过期');
    return { uid: j.uid ?? 0, login: j.login ?? '', groups: j.groups ?? [], session_valid: true };
  }
  /** ② RBAC 映射：Odoo group → DSH 角色（v1） */
  mapRole(groups: string[]): string[] {
    return groups; // v0 恒等映射
  }
}

export function apply(ctx: Context, config: OdooSsoConfig) {
  // ③ 自注册：向 svc-auth 声明身份源（v1 接 svc-auth 面时启用）
  ctx.plugin(SsoService, config);
  // ④路由：/odoo/sso/* 三面（SSO v1·属主令「都需要」）
  const routes = ctx.router;
  routes.get('/odoo/sso/handshake', async (koaCtx) => {
    const sid = /session_id=([^;\s]+)/.exec(String(koaCtx.headers.cookie ?? ''))?.[1] ?? '';
    if (!sid) { koaCtx.status = 401; koaCtx.body = { error: '无 session_id' }; return; }
    try {
      const result = await ctx.get('odooSso').handshake(sid);
      koaCtx.body = result;
    } catch (e) {
      koaCtx.status = 401; koaCtx.body = { error: String((e as Error).message).slice(0, 120) };
    }
  });
  routes.get('/odoo/sso/redirect', (koaCtx) => {
    const target = (ctx.get('odooSso') as any).config?.odooBase ?? '';
    koaCtx.redirect(`${target}/web/login?redirect=/odoo/sso/handshake`);
  });
  routes.post('/odoo/sso/logout', (koaCtx) => {
    koaCtx.body = { ok: true, hint: '销 Odoo 会话：跳 Odoo /web/login?logout=1（v2 实装销毁端点）' };
  });
  // ⑤中间件 ⑥MCP 工具 ⑦UI slot ⑧生命周期清理
  ctx.logger('odoo-sso').info('v0 骨架就绪（odooBase=%s）', config.odooBase);
}
