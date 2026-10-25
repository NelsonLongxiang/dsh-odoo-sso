#!/usr/bin/env node
/** v0 判据冒烟（先红后绿）：契约冻结件+六面骨架+资产锚活体。 */
import { readFileSync, existsSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log(`  ${c ? 'PASS' : 'FAIL'} ${n} ${x}`); } if (c) pass++; else fail++; };

const contract = existsSync('src/contract.ts') ? readFileSync('src/contract.ts', 'utf8') : '';
ok('① 契约件在场', contract.includes('PIWEB_SSO_PATHS'));
ok('① 握手三端点冻结', contract.includes('handshake') && contract.includes('redirect') && contract.includes('logout'));
ok('① 配置面', contract.includes('odooBase') && contract.includes('groupMap'));
ok('① 六贡献面契约', contract.includes('Contributions') && contract.includes('lifecycle'));

const idx = existsSync('src/index.ts') ? readFileSync('src/index.ts', 'utf8') : '';
ok('② 骨架 apply+Service', idx.includes('export function apply') && idx.includes('extends Service'));
ok('② v0 空实现带 throw', idx.includes('v0 骨架'));
ok('② TODO(v1) 标记', (idx.match(/TODO\(v1\)/g) ?? []).length >= 1);

const patch = existsSync('cordis.patch.yml') ? readFileSync('cordis.patch.yml', 'utf8') : '';
ok('③ bundle 行声明', patch.includes('piweb-sso'));

try {
  const r = await fetch('http://192.168.3.88:8069/web/login', { signal: AbortSignal.timeout(5000) });
  ok('④ Odoo 19 活体', r.status === 200);
} catch { ok('④ Odoo 19 活体', false, '不可达'); }

ok('⑤ v0 handshake 骨架红', idx.includes('throw new Error'));

console.log(`\n===== v0 判据 ${pass + fail} 项：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail ? 1 : 0);
