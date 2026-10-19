import { createHash, createDecipheriv, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

export const root = new URL('../../', import.meta.url);
export const origin = 'https://jrvx-id-next.gleb-v-markevich.workers.dev';

export async function createRuntime(overrides = {}) {
  const secret = overrides.SECURITY_SECRET ?? randomBytes(48).toString('hex');
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    scriptPath: fileURLToPath(new URL('recovered/worker.js', root)),
    compatibilityDate: '2026-10-18', compatibilityFlags: ['nodejs_compat'],
    d1Databases: ['DB'],
    bindings: {
      IDENTITY_ORIGIN: origin, ENVIRONMENT: 'staging', CAPTURE_TEST_MAIL: 'true',
      BUILD_ID: '20d696dc14a06e64', OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
      SECURITY_SECRET: secret, OIDC_SECRET: randomBytes(48).toString('hex'), ...overrides
    },
    outboundService() { throw Error('External network is disabled for local identity tests'); }
  }));
  try {
    const db = await mf.getD1Database('DB');
    const local = new DatabaseSync(':memory:');
    try {
      local.exec(await readFile(new URL('schema/next-20261019.sql', root), 'utf8'));
      const objects = local.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END,name").all();
      for (const { sql } of objects) await db.prepare(sql).run();
    } finally { local.close(); }

    let browserCount = 0;
    return {
      mf, db,
      dispose: () => mf.dispose(),
      browser() {
        const cookies = new Map();
        const ip = `192.0.2.${++browserCount}`;
        return {
          async request(path, { method = 'GET', body, headers = {}, redirect = 'manual' } = {}) {
            const response = await mf.dispatchFetch(origin + path, {
              method, redirect, headers: {
                'user-agent': 'JRVX local integration test', 'cf-connecting-ip': ip,
                ...(cookies.size ? { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
                ...(!['GET', 'HEAD'].includes(method) ? { origin, 'content-type': 'application/json' } : {}), ...headers
              }, ...(body !== undefined ? { body: JSON.stringify(body) } : {})
            });
            const setCookies = response.headers.getSetCookie();
            for (const cookie of setCookies) {
              const pair = cookie.slice(0, cookie.indexOf(';') < 0 ? undefined : cookie.indexOf(';'));
              const eq = pair.indexOf('=');
              if (eq < 1) continue;
              if (/max-age=0(?:;|$)/i.test(cookie)) cookies.delete(pair.slice(0, eq));
              else cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
            }
            const data = response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text();
            return { response, data };
          }
        };
      },
      async emailCode(recipient) {
        const rows = await db.prepare('SELECT id,cipher FROM identity_test_outbox WHERE recipient=? ORDER BY rowid DESC LIMIT 10').bind(recipient).all();
        for (const row of rows.results) {
          const [iv, encoded] = row.cipher.split('.');
          const packed = Buffer.from(encoded, 'base64url');
          const cipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), Buffer.from(iv, 'base64url'));
          cipher.setAAD(Buffer.from(row.id));
          cipher.setAuthTag(packed.subarray(-16));
          const mail = JSON.parse(Buffer.concat([cipher.update(packed.subarray(0, -16)), cipher.final()]).toString('utf8'));
          const code = mail.text?.match(/\b\d{8}\b/)?.[0];
          if (code) return code;
        }
        throw Error('Expected a synthetic verification code in the local encrypted outbox');
      }
    };
  } catch (error) { await mf.dispose(); throw error; }
}
