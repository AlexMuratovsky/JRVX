// CAS v330: based on the verified deployed v326 module; session/provider secrets remain environment bindings.
import { createMgEconomy } from './economy-v330.mjs';
const MG_CONTRACT=Object.freeze({version:'mg-v330',currency:'MG',retiredCurrencies:['MS'],maxBalance:Number.MAX_SAFE_INTEGER});
function mgCurrency(value){if(value==='MS')throw Error('currency_retired');if(value!=='MG')throw Error('invalid_currency');return 'MG'}
function mgStatValue(value,signed=false){
  let exact;if(typeof value==='number'){if(!Number.isSafeInteger(value))throw Error('invalid_money_stat');exact=BigInt(value)}
  else if(typeof value==='string' && /^-?(0|[1-9][0-9]*)$/.test(value))exact=BigInt(value);
  else throw Error('invalid_money_stat');
  if(!signed && exact<0n)throw Error('invalid_money_stat');
  return exact>=BigInt(Number.MIN_SAFE_INTEGER)&&exact<=BigInt(Number.MAX_SAFE_INTEGER)?Number(exact):exact.toString();
}
function mgStatAdd(value,change){return mgStatValue((BigInt(mgStatValue(value,true))+BigInt(mgStatValue(change,true))).toString(),true)}
function mgErrorCode(error){const message=String(error?.message||error||'server_error');return /(?:balance_limit|wallet_exposure_limit)/.test(message)?'balance_limit':message}
// Conservative commitments, derived from current authoritative state. Four
// doubled blackjack hands can return at most16*baseBet; a poker table holds<=1e9.
// SQL guards enforce the same policy atomically, including net-zero wallet races.
async function mgReservedHeadroom(db,id,{pokerIntent=false,releasePoker=false,blackjackDeal=0,releaseBlackjack=false}={}){
  const row=await db.prepare(`SELECT b.state_json,
    EXISTS(SELECT 1 FROM cas_poker_seats p WHERE p.jrvx_id=u.jrvx_id) AS poker
    FROM cas_users u LEFT JOIN cas_blackjack_state b ON b.jrvx_id=u.jrvx_id WHERE u.jrvx_id=?`).bind(id).first();
  if(!row)throw Error('cas_user_not_found');
  let state;try{state=JSON.parse(row.state_json||'{}')}catch{throw Error('invalid_blackjack_state')}
  let bj=0;
  if(!releaseBlackjack){
    if(blackjackDeal){if(!Number.isSafeInteger(blackjackDeal)||blackjackDeal<2||blackjackDeal>1e6||blackjackDeal%2)throw Error('invalid_bet');bj=blackjackDeal*16}
    else if(state.active===true){if(state.currency!=='MG'||!Number.isSafeInteger(state.baseBet)||state.baseBet<2||state.baseBet>1e6)throw Error('invalid_blackjack_state');bj=state.baseBet*16}
  }
  return BigInt(releasePoker?0:pokerIntent||row.poker?1e9:0)+BigInt(bj);
}
function mgRequireCapacity(afterBalance,reserved,additional=0){
  if(!Number.isSafeInteger(afterBalance)||afterBalance<0)throw Error('invalid_balance');
  if(BigInt(afterBalance)+reserved+BigInt(additional)>BigInt(Number.MAX_SAFE_INTEGER))throw Error('balance_limit');
}
async function mgReady(db){try{return (await db.prepare("SELECT phase FROM cas_economy_control WHERE id=1").first())?.phase==='mg-only'}catch{return false}}
const mgService=createMgEconomy({ledgerStatement:U,maxBalance:Number.MAX_SAFE_INTEGER});
var Ii = Object.defineProperty;
var o = (e, t) => Ii(e, "name", { value: t, configurable: true });
var Ve = new TextEncoder(), Ke = new TextDecoder(), Ge = new TextDecoder("utf-8", { fatal: true }), Ia = 2 ** 32;
function Wr(...e) {
  let t = e.reduce((i, { length: s }) => i + s, 0), r = new Uint8Array(t), n = 0;
  for (let i of e) r.set(i, n), n += i.length;
  return r;
}
o(Wr, "concat");
var Ri = /[^\x00-\x7f]/;
function te(e) {
  if (typeof e == "string" && e.length >= 128) {
    if (Ri.test(e)) throw new TypeError("non-ASCII string encountered in encode()");
    return Ve.encode(e);
  }
  let t = new Uint8Array(e.length);
  for (let r = 0; r < e.length; r++) {
    let n = e.charCodeAt(r);
    if (n > 127) throw new TypeError("non-ASCII string encountered in encode()");
    t[r] = n;
  }
  return t;
}
o(te, "encode");
function Ur(e, t = false) {
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(e, { alphabet: t ? "base64url" : "base64" });
  if (t) {
    if (e.includes("+") || e.includes("/")) throw new TypeError("Invalid base64url");
    e = e.replace(/-/g, "+").replace(/_/g, "/");
  }
  let r = atob(e), n = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) n[i] = r.charCodeAt(i);
  return n;
}
o(Ur, "decodeBase64");
var N = class extends Error {
  static {
    o(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(t, r) {
    super(t, r), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
  }
}, P = class extends N {
  static {
    o(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(t, r, n = "unspecified", i = "unspecified") {
    super(t, { cause: { claim: n, reason: i, payload: r } }), this.claim = n, this.reason = i, this.payload = r;
  }
}, we = class extends N {
  static {
    o(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(t, r, n = "unspecified", i = "unspecified") {
    super(t, { cause: { claim: n, reason: i, payload: r } }), this.claim = n, this.reason = i, this.payload = r;
  }
}, ze = class extends N {
  static {
    o(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
}, M = class extends N {
  static {
    o(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var R = class extends N {
  static {
    o(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
}, re = class extends N {
  static {
    o(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var _e = class extends N {
  static {
    o(this, "JWKSInvalid");
  }
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
}, ne = class extends N {
  static {
    o(this, "JWKSNoMatchingKey");
  }
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(t = "no applicable key found in the JSON Web Key Set", r) {
    super(t, r);
  }
}, Xe = class extends N {
  static {
    o(this, "JWKSMultipleMatchingKeys");
  }
  [Symbol.asyncIterator] = async function* () {
  };
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(t = "multiple matching keys found in the JSON Web Key Set", r) {
    super(t, r);
  }
}, qe = class extends N {
  static {
    o(this, "JWKSTimeout");
  }
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(t = "request timed out", r) {
    super(t, r);
  }
}, Ye = class extends N {
  static {
    o(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(t = "signature verification failed", r) {
    super(t, r);
  }
};
var Ni = "The input to be decoded is not correctly encoded.";
function me(e) {
  try {
    return Ur(typeof e == "string" ? e : Ke.decode(e), true);
  } catch (t) {
    throw new TypeError(Ni, { cause: t });
  }
}
o(me, "decode");
function $(e) {
  if (typeof e != "object" || e === null || Object.prototype.toString.call(e) !== "[object Object]") return false;
  let t = Object.getPrototypeOf(e);
  return t === null || Object.getPrototypeOf(t) === null;
}
o($, "isObject");
function Ze(e) {
  return $(e) && Array.isArray(e.keys) && Array.from(e.keys).every($);
}
o(Ze, "isJwkSet");
function Pr(...e) {
  let t = /* @__PURE__ */ new Set();
  for (let r of e) if (r) for (let n of Object.keys(r)) {
    if (t.has(n)) return false;
    t.add(n);
  }
  return true;
}
o(Pr, "isDisjoint");
function Mt(e, t, r) {
  try {
    return me(e);
  } catch {
    throw new r(`Failed to base64url decode the ${t}`);
  }
}
o(Mt, "decodeBase64url");
function Hr(e, t, r) {
  try {
    return te(e);
  } catch {
    throw new r(`The ${t} is not a valid base64url string`);
  }
}
o(Hr, "encodeBase64url");
function $r(e, t, r) {
  let n;
  try {
    n = JSON.parse(Ge.decode(me(e)));
  } catch {
    throw new t(r);
  }
  if (!$(n)) throw new t(r);
  return n;
}
o($r, "parseJoseHeader");
var Fr = { __proto__: null, b64: true };
function Vr(e, t) {
  if (t !== void 0 && (!Array.isArray(t) || t.some((r) => typeof r != "string"))) throw new TypeError(`"${e}" option must be an array of strings`);
  return t === void 0 ? void 0 : new Set(t);
}
o(Vr, "validateAlgorithms");
function Kr(e, t, r, n, i) {
  if (i.crit !== void 0 && n?.crit === void 0) throw new e('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!n || n.crit === void 0) return [];
  if (!Array.isArray(n.crit) || n.crit.length === 0 || n.crit.some((a) => typeof a != "string" || a.length === 0)) throw new e('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  let s = r === void 0 ? t : { __proto__: null, ...r, ...t };
  for (let a of n.crit) {
    if (!(a in s)) throw new M(`Extension Header Parameter "${a}" is not recognized`);
    if (!Object.hasOwn(i, a) || i[a] === void 0) throw new e(`Extension Header Parameter "${a}" is missing`);
    if (s[a] && (!Object.hasOwn(n, a) || n[a] === void 0)) throw new e(`Extension Header Parameter "${a}" MUST be integrity protected`);
  }
  return n.crit;
}
o(Kr, "validateCrit");
function Gr(e, t) {
  if (t.includes("b64")) {
    let r = e.b64;
    if (typeof r != "boolean") throw new R('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    return r;
  }
  return true;
}
o(Gr, "validateB64");
var Ti = o((e) => e[Symbol.toStringTag], "tag"), ji = o((e, t, r) => {
  let { alg: n } = e;
  if (t.use !== void 0) {
    let i = r === "sign" || r === "verify" ? "sig" : "enc";
    if (t.use !== i) throw new TypeError(`Invalid key for this operation, its "use" must be "${i}" when present`);
  }
  if (t.alg !== void 0 && t.alg !== n) throw new TypeError(`Invalid key for this operation, its "alg" must be "${n}" when present`);
  if (Array.isArray(t.key_ops)) {
    let i = r === "encrypt" || r === "decrypt" ? e.ops?.[r === "encrypt" ? 0 : 1] : r;
    if (i && !t.key_ops.includes(i)) throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${i}" when present`);
  }
}, "jwkMatchesOp");
async function Xr(e, t, r) {
  let { alg: n, secret: i } = e, s = r === "decrypt" || r === "sign";
  if (i && t instanceof Uint8Array) return t;
  let a, c;
  if ($(t)) {
    if (a = Li(t), typeof a.kty != "string") throw zr(n, t, i);
    if (!(i ? a.kty === "oct" && typeof a.k == "string" : a.kty !== "oct" && (s ? a.kty === "AKP" && typeof a.priv == "string" || typeof a.d == "string" : a.d === void 0 && a.priv === void 0))) throw new TypeError(i ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${s ? "private" : "public"} JWK`);
    if (ji(e, a, r), a.kty === "oct") return me(a.k);
    if (!Object.isFrozen(t)) {
      let { key_ops: p } = t;
      Array.isArray(p) && Object.freeze(p), Object.freeze(t);
    }
  } else {
    if (!Ci(t)) throw zr(n, t, i);
    let p = i ? "secret" : s ? "private" : "public";
    if (t.type !== p && (i || ["secret", "public", "private"].includes(t.type))) throw new TypeError(`${Ti(t)} instances must be of type "${p}" for the ${n} algorithm`);
    if (qr(t)) return t;
    if (c = t, c.type === "secret") return c.export();
  }
  Jt ||= /* @__PURE__ */ new WeakMap();
  let u = t, d = Jt.get(u);
  if (d?.[n]) return d[n];
  if (d || Jt.set(u, d = {}), c && typeof c.toCryptoKey == "function") {
    let p = c.type === "public", h = Di[c.asymmetricKeyDetails?.namedCurve], f = e.resolve?.({ crv: h, asymmetricKeyType: c.asymmetricKeyType }) ?? e.subtle;
    return d[n] = c.toCryptoKey(f, p, e.usages[p ? 0 : 1]);
  }
  return a ??= c.export({ format: "jwk" }), a.alg = n, d[n] = await Lt(e, a);
}
o(Xr, "prepareKey");
var Jt, Di = { __proto__: null, prime256v1: "P-256", secp384r1: "P-384", secp521r1: "P-521" };
var qr = o((e) => {
  if (e?.[Symbol.toStringTag] === "CryptoKey") return true;
  try {
    return e instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey"), Oi = o((e) => e?.[Symbol.toStringTag] === "KeyObject", "isKeyObject"), Ci = o((e) => qr(e) || Oi(e), "isKeyLike");
function Mi(e, t, ...r) {
  if (r.length > 2) {
    let n = r.pop();
    e += `one of type ${r.join(", ")}, or ${n}.`;
  } else r.length === 2 ? e += `one of type ${r[0]} or ${r[1]}.` : e += `of type ${r[0]}.`;
  return t == null ? e += ` Received ${t}` : typeof t == "function" && t.name ? e += ` Received function ${t.name}` : typeof t == "object" && t != null && t.constructor?.name && (e += ` Received an instance of ${t.constructor.name}`), e;
}
o(Mi, "message");
function zr(e, t, r) {
  let n = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return r && n.push("Uint8Array"), new TypeError(Mi(`Key for the ${e} algorithm must be `, t, ...n));
}
o(zr, "invalidKeyType");
var Qe = o((e, t = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${t} must be ${e}`), "unusable");
function Ji(e, t) {
  if (t && !e.usages.includes(t)) throw new TypeError(`CryptoKey does not support this operation, its usages must include ${t}.`);
}
o(Ji, "checkUsage");
function Yr(e, t) {
  let { modulusLength: r } = t.algorithm;
  if (typeof r != "number" || r < 2048) throw new TypeError(`${e} requires key modulusLength to be 2048 bits or larger`);
}
o(Yr, "checkModulusLength");
function Bi(e, t, r) {
  let n = e.algorithm;
  if (n.name !== t.name) throw Qe(t.name);
  if (t.hash && n.hash?.name !== t.hash) throw Qe(t.hash, "algorithm.hash");
  if (t.namedCurve && n.namedCurve !== t.namedCurve) throw Qe(t.namedCurve, "algorithm.namedCurve");
  if (t.length !== void 0 && n.length !== t.length) throw Qe(t.length, "algorithm.length");
  Ji(e, r);
}
o(Bi, "checkCryptoKey");
function Bt(e) {
  return { __proto__: null, ...e };
}
o(Bt, "snapshotJwk");
function Li(e) {
  let t = Bt(e);
  if (t.ext !== void 0 && typeof t.ext != "boolean") throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (t.key_ops !== void 0) {
    let r = t.key_ops, n = Array.isArray(r) ? [...r] : void 0;
    if (!n || n.some((i) => typeof i != "string") || new Set(n).size !== n.length) throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    t.key_ops = n;
  }
  return t;
}
o(Li, "normalizeJwk");
async function Lt(e, t, r) {
  if (!e.kty.includes(t.kty)) throw new M('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  let n = e.resolve?.({ kty: t.kty, crv: t.crv }) ?? e.subtle, i = !!(t.d || t.priv), s = { ...t, ext: r ?? t.ext };
  return s.kty !== "AKP" && delete s.alg, delete s.use, crypto.subtle.importKey("jwk", s, n, s.ext ?? !i, t.key_ops ?? e.usages[i ? 1 : 0]);
}
o(Lt, "jwkToKey");
async function Zr(e, t, r, n = false) {
  return e instanceof Uint8Array && (e = await crypto.subtle.importKey("raw", e, t, n, [r])), Bi(e, t, r), e;
}
o(Zr, "rawKey");
function Qr(e) {
  let t = { __proto__: null };
  for (let r in e) t[r] = { ...e[r], alg: r };
  return t;
}
o(Qr, "table");
var ye = [["verify"], ["sign"]];
function Wt(e) {
  let t = { name: "HMAC", hash: `SHA-${e}` };
  return { kty: ["oct"], secret: true, subtle: t, signing: t, usages: ye };
}
o(Wt, "hmac");
function ie(e, t) {
  let r = { name: t ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${e}` };
  return { kty: ["RSA"], subtle: r, signing: t ? { ...r, saltLength: t } : r, usages: ye, minRsaBits: 2048 };
}
o(ie, "rsa");
function Ut(e, t) {
  return { kty: ["EC"], crv: e, subtle: { name: "ECDSA", namedCurve: e }, signing: { name: "ECDSA", hash: `SHA-${t}` }, usages: ye };
}
o(Ut, "ecdsa");
function en() {
  let e = { name: "Ed25519" };
  return { kty: ["OKP"], crv: "Ed25519", subtle: e, signing: e, usages: ye };
}
o(en, "eddsa");
function Pt(e) {
  let t = { name: `ML-DSA-${e}` };
  return { kty: ["AKP"], subtle: t, signing: t, usages: ye };
}
o(Pt, "mldsa");
var Ht = Qr({ HS256: Wt(256), HS384: Wt(384), HS512: Wt(512), RS256: ie(256), RS384: ie(384), RS512: ie(512), PS256: ie(256, 32), PS384: ie(384, 48), PS512: ie(512, 64), ES256: Ut("P-256", 256), ES384: Ut("P-384", 384), ES512: Ut("P-521", 512), EdDSA: en(), Ed25519: en(), "ML-DSA-44": Pt(44), "ML-DSA-65": Pt(65), "ML-DSA-87": Pt(87) });
function tn(e) {
  let t = typeof e == "string" ? Ht[e] : void 0;
  if (!t) throw new M(`alg ${e} is not supported either by JOSE or your javascript runtime`);
  return t;
}
o(tn, "jwsAlgorithm");
function rn(e) {
  return [e && Vr("algorithms", e.algorithms), e?.crit];
}
o(rn, "prepareVerify");
function Wi(e) {
  return e === void 0 ? {} : $r(e, R, "JWS Protected Header is invalid");
}
o(Wi, "parseProtectedHeader");
function Ui(e) {
  try {
    return te(e);
  } catch {
    throw new R("JWS Compact Serialization payload must use only ASCII characters");
  }
}
o(Ui, "encodeCompactUnencodedPayload");
async function Pi(e, t, r, n, i) {
  let { protected: s, header: a, payload: c } = e, u = i ?? Wi(s);
  if (!Pr(u, a)) throw new R("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  let d = { ...u, ...a }, p = Gr(u, Kr(R, Fr, t[1], u, d)), { alg: h } = d;
  if (typeof h != "string" || !h) throw new R('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  if (t[0] && !t[0].has(h)) throw new ze('"alg" (Algorithm) Header Parameter value not allowed');
  if (p) {
    if (typeof c != "string") throw new R("JWS Payload must be a string");
  } else if (typeof c != "string" && !(c instanceof Uint8Array)) throw new R("JWS Payload must be a string or an Uint8Array instance");
  let f = p || typeof c != "string" ? c : n(c), _ = false;
  typeof r == "function" && (r = await r(u, e), _ = true);
  let w = tn(h), y = Wr(s !== void 0 ? te(s) : new Uint8Array(), te("."), typeof f == "string" ? t[2] ??= Hr(f, "payload", R) : f), m = Mt(e.signature, "signature", R), g = await Xr(w, r, "verify"), E = await Zr(g, w.subtle, "verify");
  w.minRsaBits && Yr(w.alg, E);
  let k = false;
  try {
    k = await crypto.subtle.verify(w.signing, E, m, y);
  } catch {
  }
  if (!k) throw new Ye();
  let b = { payload: typeof f == "string" ? Mt(f, "payload", R) : f };
  return s !== void 0 && (b.protectedHeader = u), a !== void 0 && (b.unprotectedHeader = a), _ ? [{ ...b, key: g }, p] : [b, p];
}
o(Pi, "verifySignature");
async function nn(e, t, r) {
  if (e instanceof Uint8Array && (e = Ke.decode(e)), typeof e != "string") throw new R("Compact JWS must be a string or Uint8Array");
  let { 0: n, 1: i, 2: s, length: a } = e.split(".");
  if (a !== 3) throw new R("Invalid Compact JWS");
  return Pi({ payload: i, protected: n, signature: s }, t, r, Ui);
}
o(nn, "verifyCompact");
var Hi = o((e) => Math.floor(e.getTime() / 1e3), "epoch"), $i = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31557600 }, Fi = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i, ae = "check_failed";
function $t() {
  throw new TypeError("Invalid time period format");
}
o($t, "invalidDuration");
function an(e) {
  typeof e != "string" && $t();
  let t = Fi.exec(e);
  (!t || t[4] && t[1]) && $t();
  let r = parseFloat(t[2]), n = Math.round(r * $i[t[3][0].toLowerCase()]);
  return Number.isFinite(n) || $t(), t[1] === "-" || t[4] === "ago" ? -n : n;
}
o(an, "secs");
function Ft(e, t) {
  if (!Number.isFinite(t)) throw new TypeError(`Invalid ${e} input`);
  return t;
}
o(Ft, "validateInput");
var sn = o((e) => {
  let t = e.toLowerCase();
  return e.includes("/") ? t : `application/${t}`;
}, "normalizeTyp"), Vi = o((e, t) => typeof e == "string" ? t.includes(e) : Array.isArray(e) ? t.some((r) => e.includes(r)) : false, "checkAudiencePresence");
function Vt(e, t, r = false) {
  let n = e[t];
  if (!(n === void 0 && !r)) {
    if (typeof n != "number") throw new P(`"${t}" claim must be a number`, e, t, "invalid");
    return n;
  }
}
o(Vt, "validateNumericDate");
function Kt(e, t) {
  throw new P(`unexpected "${t}" claim value`, e, t, ae);
}
o(Kt, "unexpectedClaim");
function on(e, t, r = {}) {
  let n;
  try {
    n = JSON.parse(Ge.decode(t));
  } catch {
  }
  if (!$(n)) throw new re("JWT Claims Set must be a top-level JSON object");
  let { typ: i } = r;
  if (i !== void 0 && (typeof e.typ != "string" || sn(e.typ) !== sn(i))) throw new P('unexpected "typ" JWT header value', n, "typ", ae);
  let { requiredClaims: s = [], issuer: a, subject: c, audience: u, maxTokenAge: d } = r, p = [...s];
  d !== void 0 && p.push("iat"), u !== void 0 && p.push("aud"), c !== void 0 && p.push("sub"), a !== void 0 && p.push("iss");
  for (let E of new Set(p.reverse())) if (!Object.hasOwn(n, E)) throw new P(`missing required "${E}" claim`, n, E, "missing");
  a !== void 0 && !(Array.isArray(a) ? a : [a]).includes(n.iss) && Kt(n, "iss"), c !== void 0 && n.sub !== c && Kt(n, "sub"), u !== void 0 && !Vi(n.aud, typeof u == "string" ? [u] : u) && Kt(n, "aud");
  let { clockTolerance: h } = r, f = 0;
  if (typeof h == "string") f = an(h);
  else if (h !== void 0) {
    if (typeof h != "number") throw new TypeError("Invalid clockTolerance option type");
    f = h;
  }
  Ft("clockTolerance option", f);
  let { currentDate: _ } = r, w = Ft("currentDate option", Hi(_ === void 0 ? /* @__PURE__ */ new Date() : _)), y = Vt(n, "iat", d !== void 0), m = Vt(n, "nbf");
  if (m !== void 0 && m > w + f) throw new P('"nbf" claim timestamp check failed', n, "nbf", ae);
  let g = Vt(n, "exp");
  if (g !== void 0 && g <= w - f) throw new we('"exp" claim timestamp check failed', n, "exp", ae);
  if (d !== void 0) {
    let E = w - y, k = Ft("maxTokenAge option", typeof d == "number" ? d : an(d));
    if (E - f > k) throw new we('"iat" claim timestamp check failed (too far in the past)', n, "iat", ae);
    if (E < -f) throw new P('"iat" claim timestamp check failed (it should be in the past)', n, "iat", ae);
  }
  return n;
}
o(on, "validateClaimsSet");
async function Gt(e, t, r) {
  let [n, i] = await nn(e, rn(r), t);
  if (!i) throw new re("JWTs MUST NOT use unencoded payload");
  let s = on(n.protectedHeader, n.payload, r);
  return { ...n, payload: s };
}
o(Gt, "jwtVerify");
function Ki(e, t, r, n) {
  let { kty: i, key_ops: s, ext: a, kid: c, alg: u, use: d, crv: p } = e;
  return (a === void 0 || typeof a == "boolean") && (s === void 0 || Array.isArray(s) && s.every((h, f) => typeof h == "string" && s.indexOf(h) === f) && s.includes("verify")) && t.kty.includes(i) && (n === void 0 || typeof n == "string" && n === c) && (u === void 0 ? i !== "AKP" : r === u) && (d === void 0 || d === "sig") && (!t.crv || p === t.crv);
}
o(Ki, "isUsableJWK");
async function cn(e, t, r) {
  let n = e.get(t) || e.set(t, {}).get(t), { alg: i } = r;
  if (n[i] === void 0) {
    let s = Lt(r, t, true).then((a) => {
      if (a.type !== "public") throw new _e("JSON Web Key Set members must be public keys");
      return n[i] = a, a;
    }).catch((a) => {
      throw n[i] === s && delete n[i], a;
    });
    n[i] = s;
  }
  return n[i];
}
o(cn, "importWithAlgCache");
function zt(e) {
  let t;
  try {
    t = structuredClone(e);
  } catch {
  }
  if (!Ze(t)) throw new _e("JSON Web Key Set malformed");
  let r = t.keys.map((i) => {
    let s = Bt(i);
    return Array.isArray(s.key_ops) && (s.key_ops = [...s.key_ops]), s;
  }), n = /* @__PURE__ */ new WeakMap();
  return Object.defineProperty(async (i, s) => {
    let { alg: a, kid: c } = { ...i, ...s?.header }, u = typeof a == "string" ? Ht[a] : void 0;
    if (!u || u.secret) throw new M('Unsupported "alg" value for a JSON Web Key Set');
    let d = t.keys.filter((f, _) => Ki(r[_], u, a, c)), { 0: p, length: h } = d;
    if (!h) throw new ne();
    if (h !== 1) {
      let f = new Xe();
      throw f[Symbol.asyncIterator] = async function* () {
        for (let _ of d) try {
          yield await cn(n, _, u);
        } catch {
        }
      }, f;
    }
    return cn(n, p, u);
  }, "jwks", { value: o(() => structuredClone(t), "value") });
}
o(zt, "createLocalJWKSet");
function Gi() {
  return typeof WebSocketPair < "u" || typeof navigator < "u" && true || typeof EdgeRuntime < "u" && EdgeRuntime === "vercel";
}
o(Gi, "isCloudflareWorkers");
var Xt;
(typeof navigator > "u" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) && (Xt = "jose/v6.2.12");
var et = /* @__PURE__ */ Symbol();
async function zi(e, t, r, n = fetch) {
  let i = await n(e, { method: "GET", signal: r, redirect: "manual", headers: t }).catch((s) => {
    throw s.name === "TimeoutError" ? new qe() : s;
  });
  if (i.status !== 200) throw new N("Expected 200 OK from the JSON Web Key Set HTTP response");
  try {
    return await i.json();
  } catch {
    throw new N("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
o(zi, "fetchJwks");
var dn = /* @__PURE__ */ Symbol();
function ge(e, t) {
  return Number.isFinite(e) && Date.now() < e + t;
}
o(ge, "isFreshFor");
function un(e, t, r) {
  if (Number.isNaN(e)) throw new TypeError(`"${r}" option must not be NaN`);
  return typeof e == "number" ? e : t;
}
o(un, "validateDuration");
function qt(e, t) {
  if (!(e instanceof URL)) throw new TypeError("url must be an instance of URL");
  let r = new URL(e.href).href, n = t ?? {}, i = n.timeoutDuration;
  if (typeof i == "number" && (!Number.isInteger(i) || i < 0)) throw new TypeError('"timeoutDuration" option must be a non-negative integer');
  let s = typeof i == "number" ? i : 5e3, a = un(n.cooldownDuration, 3e4, "cooldownDuration"), c = un(n.cacheMaxAge, 6e5, "cacheMaxAge"), u = new Headers(n.headers);
  Xt && !u.has("User-Agent") && u.set("User-Agent", Xt), u.has("accept") || u.set("accept", "application/json, application/jwk-set+json");
  let d = n[et], p = n[dn], h, f, _ = 0, w = 0, y;
  if (p && typeof p == "object") {
    let { uat: g, jwks: E } = p;
    ge(g, c) && Ze(E) && (h = g, y = zt(E));
  }
  let m = o(async () => {
    if (f && Gi() && (f = void 0), !f) {
      let g = ++_, E = f = zi(r, u, AbortSignal.timeout(s), d).then((k) => {
        let b = zt(k);
        if (g <= w) return;
        y = b;
        let A = Date.now();
        p && (p.uat = A, p.jwks = k), h = A, w = g;
      }).finally(() => {
        f === E && (f = void 0);
      });
    }
    await f;
  }, "reload");
  return Object.defineProperties(async (g, E) => {
    (!y || !ge(h, c)) && await m();
    try {
      return await y(g, E);
    } catch (k) {
      if (k instanceof ne && !ge(h, a)) return await m(), y(g, E);
      throw k;
    }
  }, { coolingDown: { get: o(() => ge(h, a), "get"), enumerable: true }, fresh: { get: o(() => ge(h, c), "get"), enumerable: true }, reload: { value: m, enumerable: true }, reloading: { get: o(() => !!f, "get"), enumerable: true }, jwks: { value: o(() => y?.jwks(), "value"), enumerable: true } });
}
o(qt, "createRemoteJWKSet");
function pn(e) {
  if (typeof e.access_token != "string" || !e.access_token || e.refresh_token !== void 0 && (typeof e.refresh_token != "string" || !e.refresh_token) || e.token_type !== void 0 && (typeof e.token_type != "string" || e.token_type.toLowerCase() !== "bearer")) throw new Error("Invalid JRVX token response");
  let t = e.expires_in === void 0 ? 600 : Number(e.expires_in);
  if (!Number.isFinite(t) || t <= 0) throw new Error("Invalid JRVX token lifetime");
  return { accessToken: e.access_token, ...typeof e.refresh_token == "string" ? { refreshToken: e.refresh_token } : {}, expiresIn: Math.min(t, 600) };
}
o(pn, "accessTokens");
var G = class extends Error {
  static {
    o(this, "JrvxProviderUnavailable");
  }
};
async function Ee(e, t, r) {
  let n = { ...r, redirect: "manual" }, i;
  try {
    i = await (e.fetcher ? e.fetcher(new Request(t, n)) : fetch(t, n));
  } catch {
    throw new G("JRVX provider unavailable");
  }
  if (i.status === 429 || i.status >= 500) throw new G("JRVX provider unavailable");
  return i;
}
o(Ee, "providerFetch");
async function nt(e, t) {
  let r = await it(e), n = await Ee(e, r.userinfo, { headers: { authorization: `Bearer ${t}` } });
  if (!n.ok) throw new Error("JRVX UserInfo rejected the account");
  let i = await n.json();
  if (typeof i.sub != "string" || !i.sub || typeof i.jrvx_id != "string" || !/^JRVX-[A-Z]{4}[0-9]{8}$/.test(i.jrvx_id)) throw new Error("Invalid JRVX UserInfo identity");
  return { sub: i.sub, jrvxId: i.jrvx_id, ...typeof i.username == "string" ? { username: i.username } : {} };
}
o(nt, "getJrvxUserInfo");
var rt = "jrvx_oidc_flow";
function Yt(e = 32) {
  let t = crypto.getRandomValues(new Uint8Array(e));
  return btoa(String.fromCharCode(...t)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
o(Yt, "randomString");
function Zt(e) {
  return btoa(String.fromCharCode(...e)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
o(Zt, "toBase64Url");
function ln(e) {
  let t = e.replace(/-/g, "+").replace(/_/g, "/"), r = atob(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
  return Uint8Array.from(r, (n) => n.charCodeAt(0));
}
o(ln, "fromBase64Url");
async function fn(e) {
  if (e.length < 32) throw new Error("JRVX client state secret must be at least 32 characters");
  let t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(e));
  return crypto.subtle.importKey("raw", t, "AES-GCM", false, ["encrypt", "decrypt"]);
}
o(fn, "stateKey");
function tt(e, t) {
  if (typeof e != "string") throw new Error("Invalid JRVX OIDC metadata");
  let r = new URL(e);
  if (r.protocol !== "https:" || r.origin !== t.origin || r.username || r.password) throw new Error("Unexpected JRVX OIDC endpoint origin");
  return r;
}
o(tt, "safeEndpoint");
async function it(e) {
  let t = new URL(e.issuer);
  if (t.protocol !== "https:" || t.pathname !== "/" || t.search || t.hash || t.username || t.password) throw new Error("JRVX issuer must be an HTTPS origin");
  let r = await Ee(e, new URL("/.well-known/openid-configuration", t));
  if (!r.ok) throw new Error("JRVX OIDC discovery unavailable");
  let n = await r.json();
  if (n.issuer !== t.origin) throw new Error("Unexpected JRVX OIDC issuer");
  return { issuer: t.origin, authorize: tt(n.authorization_endpoint, t), token: tt(n.token_endpoint, t), userinfo: tt(n.userinfo_endpoint, t), jwks: tt(n.jwks_uri, t) };
}
o(it, "metadata");
function ve(e) {
  let t = new URL(e.callbackUrl);
  if (t.protocol !== "https:" || t.search || t.hash || t.username || t.password) throw new Error("JRVX callback must be an HTTPS URL without query or fragment");
  return t;
}
o(ve, "callback");
function Qt(e) {
  return ve(e).pathname;
}
o(Qt, "cookiePath");
function hn(e, t) {
  if (!/^\/(?!\/)/.test(e) || /[\\\u0000-\u001f\u007f]/.test(e)) throw new Error("Return path must be local");
  let r = ve(t).origin, n = new URL(e, r);
  if (n.origin !== r || n.pathname.startsWith("//")) throw new Error("Return path must be local");
  return `${n.pathname}${n.search}${n.hash}`;
}
o(hn, "localReturnPath");
async function Xi(e, t) {
  let r = crypto.getRandomValues(new Uint8Array(12)), n = new TextEncoder().encode(JSON.stringify(e)), i = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, await fn(t.stateSecret), n));
  return `${Zt(r)}.${Zt(i)}`;
}
o(Xi, "seal");
async function qi(e, t) {
  let [r, n, i] = e.split(".");
  if (!r || !n || i) throw new Error("Missing JRVX login state");
  let s = Uint8Array.from(ln(r)), a = Uint8Array.from(ln(n)), c = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s }, await fn(t.stateSecret), a), u = JSON.parse(new TextDecoder().decode(c));
  if (Date.now() - u.createdAt > 3e5 || u.createdAt > Date.now() + 1e4) throw new Error("JRVX login state expired");
  return u;
}
o(qi, "unseal");
function Yi(e) {
  return e.headers.get("cookie")?.split(";").map((t) => t.trim()).find((t) => t.startsWith(`${rt}=`))?.slice(rt.length + 1);
}
o(Yi, "readCookie");
async function wn(e, t = "/") {
  t = hn(t, e);
  let r = await it(e), n = Yt(), i = Yt(), s = Yt(), a = Zt(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))), c = new URL(r.authorize);
  c.search = new URLSearchParams({ response_type: "code", client_id: e.clientId, redirect_uri: ve(e).href, scope: `openid profile jrvx_id${e.requestOfflineAccess ? " offline_access" : ""}`, state: n, nonce: i, code_challenge: a, code_challenge_method: "S256" }).toString();
  let u = await Xi({ state: n, nonce: i, verifier: s, returnTo: t, createdAt: Date.now() }, e);
  return new Response(null, { status: 302, headers: { location: c.href, "set-cookie": `${rt}=${u}; Path=${Qt(e)}; Max-Age=300; HttpOnly; Secure; SameSite=Lax`, "cache-control": "no-store" } });
}
o(wn, "beginJrvxLogin");
async function _n(e, t) {
  if (new URL(e.url).origin !== ve(t).origin || new URL(e.url).pathname !== Qt(t)) throw new Error("Unexpected JRVX callback URL");
  let r = await qi(Yi(e) ?? "", t), n = new URL(e.url).searchParams;
  if (!n.get("code") || n.get("state") !== r.state || n.has("error")) throw new Error("Invalid JRVX authorization response");
  let i = await it(t), s = await Ee(t, i.token, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: t.clientId, redirect_uri: ve(t).href, code: n.get("code"), code_verifier: r.verifier }) });
  if (!s.ok) throw new Error("JRVX token exchange failed");
  let a = await s.json();
  if (typeof a.id_token != "string" || !a.id_token) throw new Error("Incomplete JRVX token response");
  let c = pn(a), u = qt(i.jwks, { [et]: (h, f) => Ee(t, h, f) }), { payload: d } = await Gt(a.id_token, u, { issuer: i.issuer, audience: t.clientId, algorithms: t.signingAlgorithms ?? ["EdDSA"], requiredClaims: ["exp", "iat", "sub"], maxTokenAge: 600, clockTolerance: 5 });
  if (d.azp !== void 0 && d.azp !== t.clientId || Array.isArray(d.aud) && d.aud.length > 1 && d.azp !== t.clientId) throw new Error("Invalid JRVX authorized party");
  if (d.nonce !== r.nonce || typeof d.sub != "string" || !d.sub || typeof d.jrvx_id != "string" || !/^JRVX-[A-Z]{4}[0-9]{8}$/.test(d.jrvx_id)) throw new Error("Invalid JRVX identity claims");
  let p = await nt(t, c.accessToken);
  if (p.sub !== d.sub || p.jrvxId !== d.jrvx_id) throw new Error("JRVX UserInfo does not match the ID token");
  return { identity: p, ...c, idTokenExpiresAt: d.exp, returnTo: hn(r.returnTo, t), clearCookie: `${rt}=; Path=${Qt(t)}; Max-Age=0; HttpOnly; Secure; SameSite=Lax` };
}
o(_n, "completeJrvxLogin");
async function mn(e, t) {
  if (!t.trim()) throw new Error("Missing JRVX refresh token");
  let r = await it(e), n = await Ee(e, r.token, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", client_id: e.clientId, refresh_token: t }) });
  if (!n.ok) throw new Error("JRVX token refresh failed");
  return pn(await n.json());
}
o(mn, "refreshJrvxTokens");
var En = "https://cas.jrvx.ru", vn = "https://id.jrvx.ru", at = new TextEncoder(), Zi = o((e) => ["true", "prepared"].includes(e.JRVX_OIDC_ENABLED || ""), "enabled");
function be(e) {
  return { issuer: vn, clientId: "jrvx-cas", callbackUrl: `${En}/auth/jrvx/callback`, stateSecret: e.JRVX_SESSION_SECRET, fetcher: o((t) => e.IDENTITY.fetch(new Request(t, { signal: AbortSignal.timeout(5e3) })), "fetcher"), requestOfflineAccess: true, signingAlgorithms: ["ES256"] };
}
o(be, "config");
function yn(e) {
  return btoa(String.fromCharCode(...e)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
o(yn, "b64");
function gn(e) {
  let t = atob(e.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(e.length / 4) * 4, "="));
  return Uint8Array.from(t, (r) => r.charCodeAt(0));
}
o(gn, "unb64");
async function bn(e) {
  if (e.JRVX_SESSION_SECRET.length < 32) throw Error("cas_secret_missing");
  let t = await crypto.subtle.digest("SHA-256", at.encode(`cas-oidc-token-storage:v1:${e.JRVX_SESSION_SECRET}`));
  return crypto.subtle.importKey("raw", t, "AES-GCM", false, ["encrypt", "decrypt"]);
}
o(bn, "key");
async function Sn(e, t, r) {
  let n = crypto.getRandomValues(new Uint8Array(12)), i = await crypto.subtle.encrypt({ name: "AES-GCM", iv: n, additionalData: at.encode(t) }, await bn(e), at.encode(JSON.stringify(r)));
  return `${yn(n)}.${yn(new Uint8Array(i))}`;
}
o(Sn, "seal");
async function er(e, t) {
  let [r, n, i] = t.cipher.split(".");
  if (!r || !n || i) throw Error("invalid_tokens");
  let s = await crypto.subtle.decrypt({ name: "AES-GCM", iv: gn(r), additionalData: at.encode(t.sid) }, await bn(e), gn(n)), a = JSON.parse(new TextDecoder().decode(s));
  if (typeof a.accessToken != "string" || typeof a.refreshToken != "string") throw Error("invalid_tokens");
  return a;
}
o(er, "unseal");
async function Qi(e, t) {
  for (let r = 0; r < 40; r++) {
    let n = await e.DB.prepare("SELECT * FROM cas_oidc_credentials WHERE sid=? AND expires_at>?").bind(t, Date.now()).first();
    if (!n) throw Error("oidc_session_expired");
    let i = await er(e, n);
    if (n.access_expires_at > Date.now() + 3e4) return { row: n, tokens: i };
    let s = crypto.randomUUID();
    if (!await e.DB.prepare("UPDATE cas_oidc_credentials SET refresh_lock=?,refresh_lock_until=? WHERE sid=? AND (refresh_lock IS NULL OR refresh_lock_until<?) RETURNING sid").bind(s, Date.now() + 3e4, t, Date.now()).first()) {
      if (n.access_expires_at > Date.now() + 1e3) return { row: n, tokens: i };
      await new Promise((c) => setTimeout(c, 150));
      continue;
    }
    try {
      let c = await e.DB.prepare("SELECT * FROM cas_oidc_credentials WHERE sid=? AND refresh_lock=? AND expires_at>?").bind(t, s, Date.now()).first();
      if (!c) throw Error("oidc_session_expired");
      let u = await er(e, c);
      if (c.access_expires_at > Date.now() + 3e4) return await e.DB.prepare("UPDATE cas_oidc_credentials SET refresh_lock=NULL,refresh_lock_until=0 WHERE sid=? AND refresh_lock=?").bind(t, s).run(), { row: c, tokens: u };
      let d = await mn(be(e), u.refreshToken), p = { accessToken: d.accessToken, refreshToken: d.refreshToken || u.refreshToken };
      if ((await nt(be(e), p.accessToken)).sub !== c.sub) throw Error("identity_mismatch");
      let f = await Sn(e, t, p), _ = Date.now() + d.expiresIn * 1e3;
      if (!await e.DB.prepare("UPDATE cas_oidc_credentials SET cipher=?,access_expires_at=?,refresh_lock=NULL,refresh_lock_until=0 WHERE sid=? AND refresh_lock=? RETURNING sid").bind(f, _, t, s).first()) throw Error("oidc_refresh_lock_lost");
      return { row: { ...c, cipher: f, access_expires_at: _ }, tokens: p };
    } catch (c) {
      throw await e.DB.prepare("UPDATE cas_oidc_credentials SET refresh_lock=NULL,refresh_lock_until=0 WHERE sid=? AND refresh_lock=?").bind(t, s).run(), c;
    }
  }
  throw new G("oidc_refresh_busy");
}
o(Qi, "credentials");
async function kn(e, t, r) {
  try {
    let { row: n, tokens: i } = await Qi(e, t), s = await nt(be(e), i.accessToken);
    if (s.sub !== n.sub || (await e.DB.prepare("SELECT jrvx_id FROM cas_identity_subject WHERE sub=?").bind(s.sub).first())?.jrvx_id !== r) throw Error("identity_mismatch");
    return { id: r, sub: s.sub, jrvx_id: s.jrvxId, nickname: s.username || s.jrvxId, identityExpiry: n.expires_at };
  } catch (n) {
    throw n instanceof G ? Error("identity_unavailable") : n;
  }
}
o(kn, "verifyCasOidc");
async function xn(e, t) {
  let r = await e.DB.prepare("SELECT * FROM cas_oidc_credentials WHERE sid=?").bind(t).first();
  if (r) {
    try {
      let n = await er(e, r);
      for (let i of [n.refreshToken, n.accessToken]) await e.IDENTITY.fetch(new Request(`${vn}/oidc/oauth2/revoke`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: "jrvx-cas", token: i }) }));
    } catch {
    }
    await e.DB.prepare("DELETE FROM cas_oidc_credentials WHERE sid=?").bind(t).run();
  }
}
o(xn, "revokeCasOidc");
async function An(e, t, r) {
  if (!Zi(t)) return null;
  let n = new URL(e.url);
  if (![En, "https://cas-backend.jrvx.ru"].includes(n.origin)) return null;
  if (n.pathname === "/auth/jrvx/start" && e.method === "GET") return wn(be(t));
  if (n.pathname !== "/auth/jrvx/callback" || e.method !== "GET") return null;
  try {
    let i = new URL(e.url);
    i.host = "cas.jrvx.ru";
    let s = await _n(new Request(i, e), be(t));
    if (!s.refreshToken) throw Error("offline_access_missing");
    let c = (await t.DB.prepare("SELECT jrvx_id FROM cas_identity_subject WHERE sub=?").bind(s.identity.sub).first())?.jrvx_id || s.identity.jrvxId, u = Date.now() + 36e5, d = await r.ensureAccount(t, { id: c, nickname: s.identity.username || s.identity.jrvxId, identityExpiry: u });
    if (await t.DB.prepare("INSERT INTO cas_identity_subject(sub,jrvx_id,linked_at) VALUES(?,?,?) ON CONFLICT(sub) DO NOTHING").bind(s.identity.sub, c, Date.now()).run(), (await t.DB.prepare("SELECT jrvx_id FROM cas_identity_subject WHERE sub=?").bind(s.identity.sub).first())?.jrvx_id !== c) throw Error("identity_mapping_conflict");
    let h = crypto.randomUUID(), f = await Sn(t, h, { accessToken: s.accessToken, refreshToken: s.refreshToken });
    await t.DB.batch([t.DB.prepare("INSERT INTO cas_sessions(sid,jrvx_id,expires_at,created_at) VALUES(?,?,?,?)").bind(h, c, u, Date.now()), t.DB.prepare("INSERT INTO cas_oidc_credentials(sid,sub,cipher,access_expires_at,expires_at) VALUES(?,?,?,?,?)").bind(h, s.identity.sub, f, Date.now() + s.expiresIn * 1e3, u)]), await r.touchCasLogin(t.DB, c);
    let _ = await r.signSession(t, { id: d.id, sid: h, exp: u, oidc: true }), w = new Headers({ location: s.returnTo, "cache-control": "no-store", "referrer-policy": "no-referrer" });
    return w.append("set-cookie", s.clearCookie), w.append("set-cookie", r.cookie("jrvx_cas_session", _, 3600)), w.append("set-cookie", r.cookie("jrvx_cas_logged_out", "", 0)), new Response(null, { status: 302, headers: w });
  } catch {
    return new Response("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 JRVX ID. \u0412\u0435\u0440\u043D\u0438\u0442\u0435\u0441\u044C \u0432 CAS \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0432\u0445\u043E\u0434.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  }
}
o(An, "handleCasOidcRoutes");
import { DurableObject as fa } from "cloudflare:workers";
import { DurableObject as xi } from "cloudflare:workers";
var ea = Object.defineProperty, l = o((e, t) => ea(e, "name", { value: t, configurable: true }), "__name"), rr = [{ id: "welcome", icon: "\u2660", name: "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C", desc: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C JRVX CAS.", test: l((e) => true, "test") }, { id: "streak3", icon: "\u{1F525}", name: "\u0421\u0435\u0440\u0438\u044F 3", desc: "\u0417\u0430\u0445\u043E\u0434\u0438\u0442\u044C 3 \u0434\u043D\u044F \u043F\u043E\u0434\u0440\u044F\u0434.", test: l((e) => e.progress.streak.current >= 3, "test") }, { id: "streak7", icon: "\u{1F525}", name: "\u041D\u0435\u0434\u0435\u043B\u044F \u0432 \u043A\u043B\u0443\u0431\u0435", desc: "\u0417\u0430\u0445\u043E\u0434\u0438\u0442\u044C 7 \u0434\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434.", test: l((e) => e.progress.streak.current >= 7, "test") }, { id: "level5", icon: "V", name: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C 5", desc: "\u0414\u043E\u0441\u0442\u0438\u0447\u044C 5 \u0443\u0440\u043E\u0432\u043D\u044F.", test: l((e) => Ce(e.progress.xp).level >= 5, "test") }, { id: "level10", icon: "X", name: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C 10", desc: "\u0414\u043E\u0441\u0442\u0438\u0447\u044C 10 \u0443\u0440\u043E\u0432\u043D\u044F.", test: l((e) => Ce(e.progress.xp).level >= 10, "test") }, { id: "poker1", icon: "\u2660", name: "\u041F\u0435\u0440\u0432\u0430\u044F \u0440\u0430\u0437\u0434\u0430\u0447\u0430", desc: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C \u0440\u0430\u0437\u0434\u0430\u0447\u0443 Poker.", test: l((e) => e.stats.poker.hands >= 1, "test") }, { id: "poker25", icon: "\u2660", name: "Poker Regular", desc: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C 25 \u0440\u0430\u0437\u0434\u0430\u0447 Poker.", test: l((e) => e.stats.poker.hands >= 25, "test") }, { id: "poker100", icon: "\u2660", name: "\u0421\u043E\u0442\u043D\u044F \u0440\u0430\u0437\u0434\u0430\u0447", desc: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C 100 \u0440\u0430\u0437\u0434\u0430\u0447 Poker.", test: l((e) => e.stats.poker.hands >= 100, "test") }, { id: "poker10wins", icon: "W", name: "\u0414\u0435\u0441\u044F\u0442\u044C \u0431\u0430\u043D\u043A\u043E\u0432", desc: "\u0412\u044B\u0438\u0433\u0440\u0430\u0442\u044C 10 \u0440\u0430\u0437\u0434\u0430\u0447 Poker.", test: l((e) => e.stats.poker.wins >= 10, "test") }, { id: "pokerbig", icon: "\u25C6", name: "\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u0431\u0430\u043D\u043A", desc: "\u0412\u044B\u0438\u0433\u0440\u0430\u0442\u044C \u0431\u0430\u043D\u043A \u043E\u0442 2 000.", test: l((e) => e.stats.poker.biggestPot >= 2e3, "test") }, { id: "bj1", icon: "21", name: "\u0417\u0430 \u0441\u0442\u043E\u043B\u043E\u043C", desc: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C \u0440\u0443\u043A\u0443 Blackjack.", test: l((e) => e.stats.blackjack.hands >= 1, "test") }, { id: "bj25", icon: "21", name: "Blackjack Regular", desc: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C 25 \u0440\u0443\u043A Blackjack.", test: l((e) => e.stats.blackjack.hands >= 25, "test") }, { id: "bjnatural", icon: "A", name: "Natural", desc: "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043D\u0430\u0442\u0443\u0440\u0430\u043B\u044C\u043D\u044B\u0439 Blackjack.", test: l((e) => e.stats.blackjack.naturals >= 1, "test") }, { id: "roulette1", icon: "0", name: "\u041F\u0435\u0440\u0432\u043E\u0435 \u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435", desc: "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0441\u0442\u0430\u0432\u043A\u0443 \u0432 Roulette.", test: l((e) => e.stats.roulette.spins >= 1, "test") }, { id: "roulette25", icon: "36", name: "Roulette Regular", desc: "\u0421\u0434\u0435\u043B\u0430\u0442\u044C 25 \u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0439.", test: l((e) => e.stats.roulette.spins >= 25, "test") }, { id: "straight", icon: "\u2605", name: "\u0422\u043E\u0447\u043D\u043E\u0435 \u043F\u043E\u043F\u0430\u0434\u0430\u043D\u0438\u0435", desc: "\u0412\u044B\u0438\u0433\u0440\u0430\u0442\u044C straight-up \u0441\u0442\u0430\u0432\u043A\u0443.", test: l((e) => e.stats.roulette.straightWins >= 1, "test") }], Mn = [{ id: "poker_hands", name: "Poker Online: 3 \u0440\u0430\u0437\u0434\u0430\u0447\u0438", desc: "\u0421\u044B\u0433\u0440\u0430\u0439\u0442\u0435 3 server-verified \u0440\u0430\u0437\u0434\u0430\u0447\u0438 Poker.", counter: "pokerHands", goal: 3, rewardXp: 45, rewardMg: 1 }, { id: "blackjack_hands", name: "Blackjack: 5 \u0440\u0443\u043A", desc: "\u0421\u044B\u0433\u0440\u0430\u0439\u0442\u0435 5 \u0440\u0443\u043A Blackjack.", counter: "blackjackHands", goal: 5, rewardXp: 40, rewardMg: 0 }, { id: "roulette_spins", name: "Roulette: 8 \u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0439", desc: "\u0421\u0434\u0435\u043B\u0430\u0439\u0442\u0435 8 \u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0439 Roulette.", counter: "rouletteSpins", goal: 8, rewardXp: 40, rewardMg: 0 }], I = l((e) => Math.max(0, Math.floor(Number(e) || 0)), "int");
function Q(e = Date.now()) {
  return new Date(e).toISOString().slice(0, 10);
}
o(Q, "dayKey");
l(Q, "dayKey");
function nr(e) {
  let t = Date.parse(`${e}T00:00:00Z`);
  return Number.isFinite(t) ? Math.floor(t / 864e5) : 0;
}
o(nr, "dayNumber");
l(nr, "dayNumber");
function ir(e) {
  return 250 + Math.max(0, e - 1) * 75;
}
o(ir, "xpNeed");
l(ir, "xpNeed");
function Ce(e = 0) {
  let t = I(e), r = 1, n = t, i = ir(r);
  for (; n >= i && r < 100; ) n -= i, r++, i = ir(r);
  return { level: r, current: n, need: i, total: t, pct: i ? Math.min(100, n / i * 100) : 100 };
}
o(Ce, "levelInfo");
l(Ce, "levelInfo");
function Jn(e) {
  return e >= 30 ? "LEGEND" : e >= 20 ? "ELITE" : e >= 15 ? "HIGH ROLLER" : e >= 10 ? "GRINDER" : e >= 5 ? "REGULAR" : "ROOKIE";
}
o(Jn, "rankFor");
l(Jn, "rankFor");
function pt() {
  return { poker: { hands: 0, wins: 0, showdowns: 0, biggestPot: 0, biggestWin: 0, onlineHands: 0, localHands: 0 }, blackjack: { hands: 0, wins: 0, naturals: 0, biggestWin: 0, wagered: 0, profit: 0 }, roulette: { spins: 0, wins: 0, straightWins: 0, biggestWin: 0, wagered: 0, profit: 0 }, global: { games: 0, wins: 0, wagered: 0, profit: 0 } };
}
o(pt, "blankStats");
l(pt, "blankStats");
function ft(e = Q()) {
  return { date: e, counters: { pokerHands: 0, pokerWins: 0, blackjackHands: 0, blackjackWins: 0, rouletteSpins: 0, rouletteWins: 0 }, claimed: [] };
}
o(ft, "blankDaily");
l(ft, "blankDaily");
function Le(e, t = Date.now()) {
  if(e.stats && e.stats.economyVersion!=='mg-v330'){
    const legacy={};for(const key of ['global','poker','blackjack','roulette']){
      const stat=e.stats[key];if(!stat)continue;legacy[key]={};
      for(const field of ['wagered','profit','biggestPot','biggestWin'])if(Object.hasOwn(stat,field)){legacy[key][field]=stat[field];stat[field]=0}
    }
    e.stats.legacyMoneyV329=legacy;e.stats.economyVersion='mg-v330';
  }

  e.stats = e.stats && typeof e.stats == "object" ? e.stats : pt();
  let r = pt();
  for (let [i, s] of Object.entries(r)) {
    e.stats[i] = e.stats[i] && typeof e.stats[i] == "object" ? e.stats[i] : {};
    for (let [a, c] of Object.entries(s)) e.stats[i][a] = ["profit","wagered","biggestPot","biggestWin"].includes(a) ? mgStatValue(e.stats[i][a] ?? c,a==="profit") : I(e.stats[i][a] ?? c);
  }
  e.stats.poker.hands = Math.max(e.stats.poker.hands, I(e.pokerHands)), e.stats.poker.wins = Math.max(e.stats.poker.wins, I(e.pokerWins)), e.pokerHands = e.stats.poker.hands, e.pokerWins = e.stats.poker.wins, e.progress = e.progress && typeof e.progress == "object" ? e.progress : {}, e.progress.xp = I(e.progress.xp), e.progress.achievements = Array.isArray(e.progress.achievements) ? [...new Set(e.progress.achievements.map(String))] : [], e.progress.recentEventIds = Array.isArray(e.progress.recentEventIds) ? e.progress.recentEventIds.map(String).slice(-96) : [], e.progress.streak = e.progress.streak && typeof e.progress.streak == "object" ? e.progress.streak : { current: 0, best: 0, lastDate: "" }, e.progress.streak.current = I(e.progress.streak.current), e.progress.streak.best = I(e.progress.streak.best), e.progress.streak.lastDate = String(e.progress.streak.lastDate || "");
  let n = Q(t);
  if (!e.progress.daily || e.progress.daily.date !== n) e.progress.daily = ft(n);
  else {
    let i = e.progress.daily;
    i.counters = i.counters || {};
    for (let s of Object.keys(ft().counters)) i.counters[s] = I(i.counters[s]);
    i.claimed = Array.isArray(i.claimed) ? [...new Set(i.claimed.map(String))] : [];
  }
  e.stats.economyVersion ||= "mg-v330";
  return We(e), e;
}
o(Le, "ensureProgress");
l(Le, "ensureProgress");
function Bn(e, t = Date.now()) {
  Le(e, t);
  let r = Q(t), n = e.progress.streak;
  if (n.lastDate === r) return false;
  let i = n.lastDate ? nr(r) - nr(n.lastDate) : 999;
  return n.current = i === 1 ? n.current + 1 : 1, n.best = Math.max(n.best, n.current), n.lastDate = r, e.progress.xp += 10, We(e), true;
}
o(Bn, "touchLogin");
l(Bn, "touchLogin");
function z(e, t, r = 1) {
  let n = e.progress.daily;
  n?.counters && t in n.counters && (n.counters[t] = I(n.counters[t]) + I(r));
}
o(z, "bumpDaily");
l(z, "bumpDaily");
function B(e, t) {
  e.progress.xp = I(e.progress.xp) + I(t);
}
o(B, "addXP");
l(B, "addXP");
function ar(e, t = 0, r = 0, n = false) {
  e.stats.global.games++, e.stats.global.wagered = mgStatAdd(e.stats.global.wagered,I(t)), e.stats.global.profit = mgStatAdd(e.stats.global.profit,Math.trunc(Number(r)||0)), n && e.stats.global.wins++;
}
o(ar, "addGlobal");
l(ar, "addGlobal");
function V(e, t, r = {}, n = false) {
  Le(e);
  let i = l((d) => Math.max(0, Math.floor(Number(d) || 0)), "n"), s = Math.trunc(Number(r.profit) || 0), a = i(r.bet), c = i(r.pot), u = true;
  switch (String(t || "")) {
    case "poker_hand":
      e.stats.poker.hands++, e.stats.poker[n ? "onlineHands" : "localHands"]++, e.pokerHands = e.stats.poker.hands, n && z(e, "pokerHands"), ar(e, a, s), B(e, n ? 10 : 7);
      break;
    case "poker_win":
      e.stats.poker.wins++, e.pokerWins = e.stats.poker.wins, e.stats.poker.biggestPot = Math.max(e.stats.poker.biggestPot, c), e.stats.poker.biggestWin = Math.max(e.stats.poker.biggestWin, i(r.win || c)), n && z(e, "pokerWins"), e.stats.global.wins++, B(e, n ? 24 : 18);
      break;
    case "poker_showdown":
      e.stats.poker.showdowns++;
      break;
    case "blackjack_hand":
      e.stats.blackjack.hands++, n && z(e, "blackjackHands"), e.stats.global.games++, B(e, 5);
      break;
    case "blackjack_win":
      e.stats.blackjack.wins++, e.stats.blackjack.biggestWin = Math.max(e.stats.blackjack.biggestWin, i(s)), e.stats.blackjack.wagered = mgStatAdd(e.stats.blackjack.wagered,a), e.stats.blackjack.profit = mgStatAdd(e.stats.blackjack.profit,s), n && z(e, "blackjackWins"), e.stats.global.wins++, e.stats.global.wagered = mgStatAdd(e.stats.global.wagered,a), e.stats.global.profit = mgStatAdd(e.stats.global.profit,s), B(e, 12);
      break;
    case "blackjack_loss":
      e.stats.blackjack.wagered = mgStatAdd(e.stats.blackjack.wagered,a), e.stats.blackjack.profit = mgStatAdd(e.stats.blackjack.profit,s), e.stats.global.wagered = mgStatAdd(e.stats.global.wagered,a), e.stats.global.profit = mgStatAdd(e.stats.global.profit,s);
      break;
    case "blackjack_natural":
      e.stats.blackjack.naturals++, B(e, 8);
      break;
    case "roulette_spin":
      e.stats.roulette.spins++, e.stats.roulette.wagered = mgStatAdd(e.stats.roulette.wagered,a), n && z(e, "rouletteSpins"), ar(e, a, 0, false), B(e, 3);
      break;
    case "roulette_win":
      e.stats.roulette.wins++, e.stats.roulette.biggestWin = Math.max(e.stats.roulette.biggestWin, i(s)), e.stats.roulette.profit = mgStatAdd(e.stats.roulette.profit,s), n && z(e, "rouletteWins"), e.stats.global.wins++, e.stats.global.profit = mgStatAdd(e.stats.global.profit,s), B(e, 8);
      break;
    case "roulette_loss":
      e.stats.roulette.profit = mgStatAdd(e.stats.roulette.profit,s), e.stats.global.profit = mgStatAdd(e.stats.global.profit,s);
      break;
    case "roulette_straight":
      e.stats.roulette.straightWins++, B(e, 18);
      break;
    default:
      u = false;
  }
  return u && We(e), u;
}
o(V, "recordProgress");
l(V, "recordProgress");
function We(e) {
  Ln(e);
  let t = new Set(e.progress.achievements || []), r = [];
  for (let n of rr) !t.has(n.id) && n.test(e) && (t.add(n.id), r.push(n.id));
  return e.progress.achievements = [...t], r;
}
o(We, "updateAchievements");
l(We, "updateAchievements");
function Ln(e) {
  e.stats || (e.stats = pt()), e.progress || (e.progress = { xp: 0, achievements: [], streak: { current: 0, best: 0, lastDate: "" }, daily: ft() }), Array.isArray(e.progress.achievements) || (e.progress.achievements = []);
}
o(Ln, "ensureProgressShallow");
l(Ln, "ensureProgressShallow");
function Wn(e, t) {
  Le(e);
  let r = Mn.find((a) => a.id === String(t || ""));
  if (!r) return { ok: false, error: "\u0417\u0430\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" };
  let n = e.progress.daily;
  if (n.claimed.includes(r.id)) return { ok: false, error: "\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0443\u0436\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430" };
  if (I(n.counters[r.counter]) < r.goal) return { ok: false, error: "\u0417\u0430\u0434\u0430\u043D\u0438\u0435 \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E" };
  n.claimed.push(r.id), B(e, r.rewardXp);
  let s = We(e);
  return { ok: true, rewardXp: r.rewardXp, rewardMg: r.rewardMg, unlocked: s };
}
o(Wn, "claimDaily");
l(Wn, "claimDaily");
function Ue(e) {
  Le(e);
  let t = Ce(e.progress.xp), r = new Set(e.progress.achievements);
  return { xp: t.total, level: t.level, xpCurrent: t.current, xpNeed: t.need, xpPct: t.pct, rank: Jn(t.level), streak: { ...e.progress.streak }, stats: JSON.parse(JSON.stringify(e.stats)), achievements: rr.map((n) => ({ id: n.id, icon: n.icon, name: n.name, desc: n.desc, unlocked: r.has(n.id) })), achievementCount: r.size, achievementTotal: rr.length, daily: Mn.map((n) => ({ id: n.id, name: n.name, desc: n.desc, goal: n.goal, value: Math.min(n.goal, I(e.progress.daily.counters[n.counter])), rewardXp: n.rewardXp, rewardMg: n.rewardMg, claimed: e.progress.daily.claimed.includes(n.id), ready: I(e.progress.daily.counters[n.counter]) >= n.goal && !e.progress.daily.claimed.includes(n.id) })), dailyDate: e.progress.daily.date, wallet: { MG: I(e.wallet.MG) } };
}
o(Ue, "snapshot");
l(Ue, "snapshot");
var Y = 24, bt = l((e) => new Promise((t) => setTimeout(t, Math.min(160, 8 * 2 ** Math.min(e, 4)) + Math.floor(Math.random() * 64))), "contentionDelay"), Un = /^JRVX-[A-Z]{4}\d{8}$/, ta = /* @__PURE__ */ new Set(["MG"]), ra = /^[A-Za-z0-9:._-]{1,180}$/, na = 16 * 1024;
function Me(e, t = 0) {
  if (t > 12) throw new Error("metadata_too_deep");
  if (e === null || typeof e == "string" || typeof e == "boolean") return e;
  if (typeof e == "number") {
    if (!Number.isFinite(e)) throw new Error("invalid_metadata");
    return e;
  }
  if (Array.isArray(e)) {
    if (e.length > 256) throw new Error("metadata_too_large");
    return e.map((n) => Me(n, t + 1));
  }
  if (!e || typeof e != "object") throw new Error("invalid_metadata");
  let r = {};
  for (let n of Object.keys(e).sort()) {
    if (["__proto__", "prototype", "constructor"].includes(n) || n.length > 100) throw new Error("invalid_metadata");
    r[n] = Me(e[n], t + 1);
  }
  return r;
}
o(Me, "canonical");
l(Me, "canonical");
function Er(e) {
  return String(e.source || "server").slice(0, 80);
}
o(Er, "normalizedSource");
l(Er, "normalizedSource");
function vr(e) {
  return String(e.actorId || e.jrvxId || "").slice(0, 80);
}
o(vr, "normalizedActor");
l(vr, "normalizedActor");
function St(e) {
  let t = JSON.stringify(Me(e.metadata && typeof e.metadata == "object" ? e.metadata : {}));
  if (new TextEncoder().encode(t).length > na) throw new Error("metadata_too_large");
  return t;
}
o(St, "metadataText");
l(St, "metadataText");
function br(e) {
  mgCurrency(e.currency);
  if (!Un.test(String(e.jrvxId || ""))) throw new Error("invalid_jrvx_id");
  if (!ta.has(e.currency)) throw new Error("invalid_currency");
  if (typeof e.transactionId != "string" || !ra.test(e.transactionId)) throw new Error("invalid_transaction_id");
  if (!Number.isSafeInteger(e.amount) || (Math.abs(e.amount) > 1e9 && e.operationType!=="admin_adjustment")) throw new Error("invalid_amount");
  if (typeof e.operationType != "string" || !e.operationType || e.operationType.length > 80) throw new Error("invalid_operation_type");
  St(e);
}
o(br, "validInput");
l(br, "validInput");
async function Pn(e, t, r = []) {
  br(t);
  let n = await e.prepare("SELECT * FROM cas_transactions WHERE transaction_id=?").bind(t.transactionId).first();
  if (n) return de(n, t);
  for (let i = 0; i < Y; i++) {
    let s = await e.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency=?").bind(t.jrvxId, t.currency).first();
    if (!s) throw Error("wallet_not_found");
    let a = Number(s.balance), c = a + t.amount;
    if (c < 0 || !Number.isSafeInteger(c) || c > Number.MAX_SAFE_INTEGER) {
      let u = await e.prepare("SELECT * FROM cas_transactions WHERE transaction_id=?").bind(t.transactionId).first();
      if (u) return de(u, t);
      throw Error(c < 0 ? "insufficient_balance" : "balance_limit");
    }
    try{mgRequireCapacity(c,await mgReservedHeadroom(e,t.jrvxId,{pokerIntent:['poker_buyin','poker_rebuy'].includes(t.operationType),releasePoker:t.operationType==='poker_cashout'}))}
    catch(error){const receipt=await e.prepare('SELECT * FROM cas_transactions WHERE transaction_id=?').bind(t.transactionId).first();if(receipt)return de(receipt,t);throw error}
    try {
      return await e.batch([U(e, t, a), ...r]), { ok: true, balance: c, duplicate: false };
    } catch (u) {
      let d = await e.prepare("SELECT * FROM cas_transactions WHERE transaction_id=?").bind(t.transactionId).first();
      if (d) return de(d, t);
      if (String(u).includes("wallet_balance_mismatch") && i < Y - 1) {
        await bt(i);
        continue;
      }
      throw u;
    }
  }
  throw Error("transaction_retry_exhausted");
}
o(Pn, "transactWith");
l(Pn, "transactWith");
function U(e, t, r) {
  br(t);
  let n = r + t.amount;
  if (!Number.isSafeInteger(r) || r < 0 || !Number.isSafeInteger(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) throw Error("invalid_balance");
  return e.prepare("INSERT INTO cas_transactions (transaction_id,jrvx_id,currency,amount,balance_before,balance_after,operation_type,source,actor_id,metadata_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(t.transactionId, t.jrvxId, t.currency, t.amount, r, n, t.operationType, Er(t), vr(t), St(t), t.timestamp || Date.now());
}
o(U, "ledgerStatement");
l(U, "ledgerStatement");
function de(e, t) {
  let r;
  try {
    r = JSON.parse(e.metadata_json || "{}");
  } catch {
    throw new Error("transaction_corrupt");
  }
  if (!(e.jrvx_id === t.jrvxId && e.currency === t.currency && Number(e.amount) === t.amount && e.operation_type === t.operationType && String(e.source || "") === Er(t) && String(e.actor_id || "") === vr(t) && JSON.stringify(Me(r)) === St(t))) throw new Error("transaction_id_conflict");
  return { ok: true, duplicate: true, balance: Number(e.balance_after), entry: { transactionId: e.transaction_id, jrvxId: e.jrvx_id, currency: e.currency, amount: Number(e.amount), balanceBefore: Number(e.balance_before), balanceAfter: Number(e.balance_after), operationType: e.operation_type, source: e.source, actorId: e.actor_id, createdAt: Number(e.created_at), metadata: r } };
}
o(de, "duplicate");
l(de, "duplicate");
var In = /* @__PURE__ */ new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]), Rn = { exact: 36, split: 18, street: 12, corner: 9, dozen1: 3, dozen2: 3, dozen3: 3, col1: 3, col2: 3, col3: 3, red: 2, black: 2, even: 2, odd: 2, low: 2, high: 2 }, ia = /^[A-Za-z0-9_-]{8,96}$/, aa = /^JRVX-[A-Z]{4}\d{8}$/, Nn = Y;
function q(e, t) {
  return e.length === t.length && e.every((r, n) => r === t[n]);
}
o(q, "equal");
l(q, "equal");
function Sr(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new Error("invalid_bet");
  let t = String(e.type || "");
  if (!Object.hasOwn(Rn, t)) throw new Error("invalid_bet_type");
  if (e.numbers !== void 0 && !Array.isArray(e.numbers)) throw new Error("invalid_bet_numbers");
  let r = e.numbers || [];
  if (r.length > 4 || r.some((i) => !Number.isInteger(i) || i < 0 || i > 36) || new Set(r).size !== r.length) throw new Error("invalid_bet_numbers");
  let n = [...new Set(r)].sort((i, s) => i - s);
  if (t === "exact") {
    if (n.length !== 1) throw new Error("invalid_straight");
  } else if (t === "split") {
    let i = n[0] === 0 && n[1] >= 1 && n[1] <= 3, s = n[0] >= 1 && n[1] === n[0] + 3, a = n[0] >= 1 && n[1] === n[0] + 1 && Math.floor((n[0] - 1) / 3) === Math.floor((n[1] - 1) / 3);
    if (n.length !== 2 || !(i || s || a)) throw new Error("invalid_split");
  } else if (t === "street") {
    let i = q(n, [0, 1, 2]) || q(n, [0, 2, 3]), s = n[0] >= 1 && q(n, [n[0], n[0] + 1, n[0] + 2]) && (n[0] - 1) % 3 === 0;
    if (n.length !== 3 || !(i || s)) throw new Error("invalid_street");
  } else if (t === "corner") {
    let i = q(n, [0, 1, 2, 3]), s = n[0] >= 1 && n[0] <= 32 && q(n, [n[0], n[0] + 1, n[0] + 3, n[0] + 4]) && (n[0] - 1) % 3 !== 2;
    if (n.length !== 4 || !(i || s)) throw new Error("invalid_corner");
  } else if (n.length) throw new Error("unexpected_bet_numbers");
  return { type: t, numbers: n, multiplier: Rn[t] };
}
o(Sr, "normalizeBet");
l(Sr, "normalizeBet");
function $n(e, t) {
  let { type: r, numbers: n } = Sr(e);
  if (!Number.isInteger(t) || t < 0 || t > 36) throw new Error("invalid_roulette_number");
  return ["exact", "split", "street", "corner"].includes(r) ? n.includes(t) : t === 0 ? false : r === "red" ? In.has(t) : r === "black" ? !In.has(t) : r === "even" ? t % 2 === 0 : r === "odd" ? t % 2 === 1 : r === "low" ? t <= 18 : r === "high" ? t >= 19 : r.startsWith("dozen") ? Math.floor((t - 1) / 12) + 1 === Number(r.at(-1)) : r.startsWith("col") ? (t - 1) % 3 + 1 === Number(r.at(-1)) : false;
}
o($n, "wins");
l($n, "wins");
function Fn() {
  let e = new Uint32Array(1), t = 2 ** 32 - 2 ** 32 % 37;
  do
    crypto.getRandomValues(e);
  while (e[0] >= t);
  return e[0] % 37;
}
o(Fn, "randomNumber");
l(Fn, "randomNumber");
function Vn(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new Error("invalid_spin_request");
  let t = String(e.jrvxId || ""), r = String(e.spinId || "");
  if (!aa.test(t) || !ia.test(r)) throw new Error("invalid_spin_identity");
  let n = mgCurrency(e.currency);
  if (n !== "MG") throw new Error("invalid_currency");
  let i = e.amount;
  if (!Number.isSafeInteger(i) || i < 1 || i > 1e6) throw new Error("invalid_amount");
  return { jrvxId: t, spinId: r, currency: n, amount: i, bet: Sr(e.bet) };
}
o(Vn, "validate");
l(Vn, "validate");
function ot(e, t) {
  let r = JSON.parse(e.data_json);
  if (r.currency !== t.currency || r.amount !== t.amount || r.bet.type !== t.bet.type || !q(r.bet.numbers, t.bet.numbers)) throw new Error("spin_id_conflict");
  return { ...r, duplicate: true };
}
o(ot, "fromHistory");
l(ot, "fromHistory");
async function xe(e, t, r, n) {
  let i = await e.prepare(`SELECT progression_json,stats_json,progress_version,
  (SELECT balance FROM cas_wallets WHERE jrvx_id=cas_users.jrvx_id AND currency='MG') AS mg,
  (SELECT version FROM cas_wallets WHERE jrvx_id=cas_users.jrvx_id AND currency='MG') AS mg_version
  FROM cas_users WHERE jrvx_id=?`).bind(t.jrvxId).first();
  if (!i) throw new Error("cas_user_not_found");
  let s = { MG: Number(i.mg) }, a = { id: t.jrvxId, wallet: s, progress: JSON.parse(i.progression_json || "{}"), stats: JSON.parse(i.stats_json || "{}") };
  return { ...r, duplicate: n, settlementBalanceAfter: r.balanceAfter, balanceAfter: s[t.currency], wallet: s, walletRevision: { MG: Number(i.mg_version) }, progress: Ue(a), progressVersion: Number(i.progress_version) };
}
o(xe, "currentResult");
l(xe, "currentResult");
async function Kn(e, t) {
  let r = Vn(t), n = `roulette:${r.jrvxId}:${r.spinId}`, i = await e.prepare("SELECT data_json FROM cas_game_history WHERE event_id=?").bind(n).first();
  if (i) return xe(e, r, ot(i, r), true);
  let s = Fn(), a = $n(r.bet, s), c = a ? r.amount * r.bet.multiplier : 0, u = c - r.amount;
  for (let d = 0; d < Nn; d++) {
    let p = await e.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency=?").bind(r.jrvxId, r.currency).first();
    if (!p) throw new Error("wallet_not_found");
    let h = Number(p.balance);
    if (!Number.isSafeInteger(h)||h<0) throw Error("invalid_stored_wallet");
    if (h < r.amount) {
      let A = await e.prepare("SELECT data_json FROM cas_game_history WHERE event_id=?").bind(n).first();
      if (A) return xe(e, r, ot(A, r), true);
      throw new Error("insufficient_balance");
    }
    try{mgRequireCapacity(h-r.amount,await mgReservedHeadroom(e,r.jrvxId),r.amount*r.bet.multiplier)}
    catch(error){const receipt=await e.prepare('SELECT data_json FROM cas_game_history WHERE event_id=?').bind(n).first();if(receipt)return xe(e,r,ot(receipt,r),true);throw error}
    let w = await e.prepare("SELECT progression_json,stats_json,progress_version FROM cas_users WHERE jrvx_id=?").bind(r.jrvxId).first();
    if (!w) throw new Error("cas_user_not_found");
    let y = { id: r.jrvxId, progress: JSON.parse(w.progression_json || "{}"), stats: JSON.parse(w.stats_json || "{}") };
    V(y, "roulette_spin", { bet: r.amount }, true), V(y, a ? "roulette_win" : "roulette_loss", { bet: r.amount, profit: u }, true), a && r.bet.type === "exact" && V(y, "roulette_straight", {}, true);
    let m = Date.now(), g = h + u;
    y.wallet = { MG: g };
    let E = { eventId: n, jrvxId: r.jrvxId, currency: r.currency, amount: r.amount, bet: r.bet, number: s, won: a, payout: c, profit: u, balanceAfter: g, progress: Ue(y), progressVersion: Number(w.progress_version), timestamp: m }, b = [U(e, { transactionId: `${n}:bet`, jrvxId: r.jrvxId, currency: r.currency, amount: -r.amount, operationType: "roulette_bet", source: "roulette-server", actorId: r.jrvxId, metadata: { eventId: n, bet: r.bet }, timestamp: m }, h)];
    c && b.push(U(e, { transactionId: `${n}:payout`, jrvxId: r.jrvxId, currency: r.currency, amount: c, operationType: "roulette_payout", source: "roulette-server", actorId: r.jrvxId, metadata: { eventId: n, number: s }, timestamp: m }, h - r.amount)), b.push(e.prepare("INSERT INTO cas_game_history (event_id,jrvx_id,game,event_type,data_json,created_at) VALUES (?,?,?,?,?,?)").bind(n, r.jrvxId, "roulette", "spin", JSON.stringify(E), m)), b.push(e.prepare("UPDATE cas_users SET progression_json=?,stats_json=?,progress_version=progress_version+1,updated_at=? WHERE jrvx_id=? AND progress_version=?").bind(JSON.stringify(y.progress), JSON.stringify(y.stats), m, r.jrvxId, Number(w.progress_version)));
    try {
      return await e.batch(b), await xe(e, r, E, false);
    } catch (A) {
      let H = await e.prepare("SELECT data_json FROM cas_game_history WHERE event_id=?").bind(n).first();
      if (H) return xe(e, r, ot(H, r), true);
      if ((String(A).includes("wallet_balance_mismatch") || String(A).includes("progress_version_mismatch")) && d < Nn - 1) {
        await bt(d);
        continue;
      }
      throw A;
    }
  }
  throw new Error("roulette_retry_exhausted");
}
o(Kn, "settleRoulette");
l(Kn, "settleRoulette");
var sa = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"], oa = ["\u2660", "\u2665", "\u2666", "\u2663"], Gn = /^JRVX-[A-Z]{4}\d{8}$/, ca = /^[A-Za-z0-9_-]{8,96}$/, zn = /* @__PURE__ */ new Set(["deal", "hit", "stand", "double", "split", "insurance", "decline_insurance"]);
function W(e) {
  let t = 0, r = 0;
  for (let n of e) n.r === "A" ? (t += 11, r++) : ["J", "Q", "K"].includes(n.r) ? t += 10 : t += Number(n.r);
  for (; t > 21 && r; ) t -= 10, r--;
  return t;
}
o(W, "handValue");
l(W, "handValue");
function Xn() {
  let e = [];
  for (let t = 0; t < 6; t++) for (let r of oa) for (let n of sa) e.push({ r: n, s: r });
  for (let t = e.length - 1; t > 0; t--) {
    let r = new Uint32Array(1), n = 2 ** 32 - 2 ** 32 % (t + 1);
    do
      crypto.getRandomValues(r);
    while (r[0] >= n);
    let i = r[0] % (t + 1);
    [e[t], e[i]] = [e[i], e[t]];
  }
  return e;
}
o(Xn, "freshShoe");
l(Xn, "freshShoe");
function kt() {
  return { shoe: [], hands: [], dealer: [], active: false, hand: 0, hideDealer: true, insuranceOffered: false, insuranceResolved: false, insuranceBet: 0, baseBet: 0, wagered: 0, roundId: 0, currency: "MG", lastResults: [] };
}
o(kt, "blankState");
l(kt, "blankState");
function L(e) {
  if (!e.shoe.length) throw new Error("shoe_exhausted");
  return e.shoe.pop();
}
o(L, "draw");
l(L, "draw");
function Je(e) {
  return JSON.parse(JSON.stringify(e));
}
o(Je, "clone");
l(Je, "clone");
function Pe(e) {
  return !e.fromSplit && e.cards.length === 2 && W(e.cards) === 21;
}
o(Pe, "natural");
l(Pe, "natural");
function He(e) {
  return e.dealer.length === 2 && W(e.dealer) === 21;
}
o(He, "dealerNatural");
l(He, "dealerNatural");
function kr(e) {
  let t = Je(e);
  return t.shoeCount = t.shoe.length, delete t.shoe, t.hideDealer && t.dealer.length > 1 && (t.dealer[1] = { r: "?", s: "?" }), t;
}
o(kr, "publicState");
l(kr, "publicState");
function qn(e) {
  e.active = false, e.hideDealer = false;
  let t = W(e.dealer), r = He(e), n = e.insuranceBet && r ? e.insuranceBet * 3 : 0, i = [];
  for (let s of e.hands) {
    let a = W(s.cards), c = Pe(s), u = 0, d = "loss";
    a > 21 || r && !c || (c && !r ? (u = s.bet * 2.5, d = "win") : t > 21 || a > t ? (u = s.bet * 2, d = "win") : a === t && (u = s.bet, d = "push")), s.outcome = d, s.profit = u - s.bet, n += u, i.push({ cards: Je(s.cards), value: a, bet: s.bet, outcome: d, profit: s.profit, natural: c && d === "win" });
  }
  return e.lastResults = i, { settled: true, payout: n, profit: n - e.wagered, results: i, dealer: Je(e.dealer), wagered: e.wagered };
}
o(qn, "settle");
l(qn, "settle");
function xt(e) {
  if (!He(e) && e.hands.some((t) => W(t.cards) <= 21 && !Pe(t))) for (; W(e.dealer) < 17; ) e.dealer.push(L(e));
  return qn(e);
}
o(xt, "dealerPlayAndSettle");
l(xt, "dealerPlayAndSettle");
function Ae(e) {
  let t = e.hands[e.hand];
  t && (t.done = true);
  let r = e.hands.findIndex((n, i) => i > e.hand && !n.done);
  return r >= 0 ? (e.hand = r, null) : xt(e);
}
o(Ae, "advance");
l(Ae, "advance");
function sr(e, t) {
  if (!e.insuranceOffered || e.insuranceResolved) throw new Error("insurance_unavailable");
  let r = 0;
  if (e.insuranceResolved = true, t) {
    if (r = e.baseBet / 2, !Number.isSafeInteger(r) || r < 1) throw new Error("insurance_unavailable");
    e.insuranceBet = r, e.wagered += r;
  }
  return He(e) || Pe(e.hands[0]) ? { charge: r, settlement: xt(e) } : { charge: r, settlement: null };
}
o(sr, "resolveInsurance");
l(sr, "resolveInsurance");
function Yn(e, t) {
  let r = Je(e || kt()), n = String(t.action || "");
  if (!zn.has(n)) throw new Error("invalid_action");
  let i = 0, s = null;
  if (n === "deal") {
    if (r.active) throw new Error("round_active");
    let a = Number(t.bet), c = String(t.currency || "");
    if (!Number.isSafeInteger(a) || a < 2 || a > 1e6 || a % 2 !== 0) throw new Error("invalid_bet");
    if (c !== "MG") throw new Error("invalid_currency");
    r.shoe.length < 78 && (r.shoe = Xn()), r.roundId++, r.currency = c, r.baseBet = a, r.wagered = a, r.insuranceBet = 0, r.hands = [{ cards: [L(r), L(r)], bet: a, fromSplit: false, done: false, doubled: false }], r.dealer = [L(r), L(r)], r.hand = 0, r.active = true, r.hideDealer = true, r.insuranceOffered = r.dealer[0].r === "A", r.insuranceResolved = !r.insuranceOffered, r.lastResults = [], i = a, !r.insuranceOffered && (He(r) || Pe(r.hands[0])) && (s = xt(r));
  } else {
    if (!r.active) throw new Error("no_active_round");
    if (n === "insurance" || n === "decline_insurance") {
      let a = sr(r, n === "insurance");
      i = a.charge, s = a.settlement;
    } else if (r.insuranceOffered && !r.insuranceResolved && (s = sr(r, false).settlement), !s) {
      let a = r.hands[r.hand];
      if (!a || a.done) throw new Error("hand_not_active");
      if (n === "hit") a.cards.push(L(r)), W(a.cards) >= 21 && (s = Ae(r));
      else if (n === "stand") s = Ae(r);
      else if (n === "double") {
        if (a.cards.length !== 2 || a.doubled) throw new Error("double_unavailable");
        i = a.bet, r.wagered += i, a.bet *= 2, a.doubled = true, a.cards.push(L(r)), s = Ae(r);
      } else if (n === "split") {
        if (a.cards.length !== 2 || a.cards[0].r !== a.cards[1].r || r.hands.length >= 4) throw new Error("split_unavailable");
        i = a.bet, r.wagered += i;
        let c = a.cards.pop(), u = { cards: [c, L(r)], bet: a.bet, fromSplit: true, done: false, doubled: false };
        a.cards.push(L(r)), a.fromSplit = true, r.hands.splice(r.hand + 1, 0, u), a.cards[0].r === "A" ? (a.done = true, u.done = true) : (a.done = W(a.cards) >= 21, u.done = W(u.cards) >= 21), a.done && (s = Ae(r));
      }
    }
  }
  return { state: r, charge: i, payout: s?.payout || 0, settlement: s };
}
o(Yn, "applyBlackjackAction");
l(Yn, "applyBlackjackAction");
function Zn(e) {
  if (e.currency !== undefined) mgCurrency(e.currency);
  let t = String(e.jrvxId || ""), r = String(e.actionId || ""), n = String(e.action || "");
  if (!Gn.test(t) || !ca.test(r)) throw new Error("invalid_action_identity");
  if (!zn.has(n)) throw new Error("invalid_action");
  let i = e.expectedVersion;
  if (!Number.isSafeInteger(i) || i < 0) throw new Error("invalid_expected_version");
  return { jrvxId: t, actionId: r, action: n, bet: e.bet, currency: e.currency, expectedVersion: i };
}
o(Zn, "validateRequest");
l(Zn, "validateRequest");
async function Ie(e, t, r) {
  let n = JSON.parse(t.result_json);
  if (n.action !== r.action || n.requestBet !== (r.action === "deal" ? Number(r.bet) : null) || n.requestCurrency !== (r.action === "deal" ? String(r.currency) : null) || n.expectedVersion !== r.expectedVersion) throw new Error("action_id_conflict");
  let i = await xr(e, r.jrvxId), s = await e.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency=?").bind(r.jrvxId, n.currency).first();
  return { ...n, originalBalanceAfter: n.balanceAfter, actionVersion: n.version, balanceAfter: Number(s?.balance || 0), state: i.state, version: i.version, duplicate: true };
}
o(Ie, "duplicate2");
l(Ie, "duplicate");
async function xr(e, t) {
  if (!Gn.test(t)) throw new Error("invalid_jrvx_id");
  let r = await e.prepare("SELECT state_json,version FROM cas_blackjack_state WHERE jrvx_id=?").bind(t).first();
  if (!r) throw new Error("blackjack_state_not_found");
  return { state: kr(JSON.parse(r.state_json || "{}")?.hands ? JSON.parse(r.state_json) : kt()), version: Number(r.version) };
}
o(xr, "blackjackState");
l(xr, "blackjackState");
async function Qn(e, t) {
  let r = Zn(t), n = await e.prepare("SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?").bind(r.jrvxId, r.actionId).first();
  if (n) return Ie(e, n, r);
  for (let i = 0; i < Y; i++) {
    let s = await e.prepare("SELECT state_json,version FROM cas_blackjack_state WHERE jrvx_id=?").bind(r.jrvxId).first();
    if (!s) throw new Error("blackjack_state_not_found");
    if (Number(s.version) !== r.expectedVersion) {
      let b = await e.prepare("SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?").bind(r.jrvxId, r.actionId).first();
      if (b) return Ie(e, b, r);
      throw new Error("stale_state");
    }
    let a = JSON.parse(s.state_json || "{}"), c = a?.hands ? a : kt();
    if(r.action==='deal'){
      try{
      if(c.active)throw Error('round_active');
      const bet=Number(r.bet);if(!Number.isSafeInteger(bet)||bet<2||bet>1e6||bet%2)throw Error('invalid_bet');
      mgCurrency(r.currency);
      const current=await e.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency='MG'").bind(r.jrvxId).first();
      if(!current)throw Error('wallet_not_found');
      if(current.balance<bet)throw Error('insufficient_balance');
      mgRequireCapacity(current.balance-bet,await mgReservedHeadroom(e,r.jrvxId,{blackjackDeal:bet}));
      }catch(error){const receipt=await e.prepare('SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?').bind(r.jrvxId,r.actionId).first();if(receipt)return Ie(e,receipt,r);throw error}
    }
    let u = Yn(c, r), d = u.state, p = d.currency, h = await e.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency=?").bind(r.jrvxId, p).first();
    if (!h) throw new Error("wallet_not_found");
    let f = Number(h.balance);
    if (f < u.charge) {
      let b = await e.prepare("SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?").bind(r.jrvxId, r.actionId).first();
      if (b) return Ie(e, b, r);
      throw new Error("insufficient_balance");
    }
    let _ = f - u.charge + u.payout, w = Date.now(), y = `blackjack:${r.jrvxId}:${r.actionId}`, m = { action: r.action, requestBet: r.action === "deal" ? Number(r.bet) : null, requestCurrency: r.action === "deal" ? String(r.currency) : null, expectedVersion: r.expectedVersion, actionId: r.actionId, roundId: d.roundId, currency: p, balanceAfter: _, version: Number(s.version) + 1, actionVersion: Number(s.version) + 1, state: kr(d), settlement: u.settlement, duplicate: false }, g = null, E = null;
    if (u.settlement) {
      let b = await e.prepare("SELECT progression_json,stats_json,progress_version FROM cas_users WHERE jrvx_id=?").bind(r.jrvxId).first();
      if (!b) throw new Error("cas_user_not_found");
      g = Number(b.progress_version), E = { id: r.jrvxId, progress: JSON.parse(b.progression_json || "{}"), stats: JSON.parse(b.stats_json || "{}") }, V(E, "blackjack_hand", {}, true), V(E, u.settlement.profit > 0 ? "blackjack_win" : "blackjack_loss", { bet: u.settlement.wagered, profit: u.settlement.profit }, true), u.settlement.results.some((H) => H.natural) && V(E, "blackjack_natural", {}, true);
      E.wallet = { MG: _ }, m.progress = Ue(E);
    }
    let k = [];
    if (u.charge && k.push(U(e, { transactionId: `${y}:bet`, jrvxId: r.jrvxId, currency: p, amount: -u.charge, operationType: "blackjack_bet", source: "blackjack-server", actorId: r.jrvxId, metadata: { action: r.action, roundId: d.roundId }, timestamp: w }, f)), u.payout && k.push(U(e, { transactionId: `${y}:payout`, jrvxId: r.jrvxId, currency: p, amount: u.payout, operationType: "blackjack_payout", source: "blackjack-server", actorId: r.jrvxId, metadata: { roundId: d.roundId, results: u.settlement?.results }, timestamp: w }, f - u.charge)), k.push(e.prepare("INSERT INTO cas_blackjack_actions (jrvx_id,action_id,expected_version,expected_progress_version,result_json,created_at) VALUES (?,?,?,?,?,?)").bind(r.jrvxId, r.actionId, Number(s.version), g, JSON.stringify(m), w)), k.push(e.prepare("UPDATE cas_blackjack_state SET state_json=?,version=version+1,updated_at=? WHERE jrvx_id=? AND version=?").bind(JSON.stringify(d), w, r.jrvxId, Number(s.version))), u.settlement) {
      let b = `blackjack:${r.jrvxId}:${d.roundId}`;
      k.push(e.prepare("INSERT INTO cas_game_history (event_id,jrvx_id,game,event_type,data_json,created_at) VALUES (?,?,?,?,?,?)").bind(b, r.jrvxId, "blackjack", "round", JSON.stringify({ currency: p, wagered: u.settlement.wagered, profit: u.settlement.profit, results: u.settlement.results, dealer: u.settlement.dealer, roundId: d.roundId }), w)), k.push(e.prepare("UPDATE cas_users SET progression_json=?,stats_json=?,progress_version=progress_version+1,updated_at=? WHERE jrvx_id=? AND progress_version=?").bind(JSON.stringify(E.progress), JSON.stringify(E.stats), w, r.jrvxId, g));
    }
    try {
      return await e.batch(k), m;
    } catch (b) {
      let A = await e.prepare("SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?").bind(r.jrvxId, r.actionId).first();
      if (A) return Ie(e, A, r);
      if (/wallet_balance_mismatch|blackjack_version_mismatch|progress_version_mismatch/.test(String(b)) && i < Y - 1) {
        await bt(i);
        continue;
      }
      throw b;
    }
  }
  throw new Error("blackjack_retry_exhausted");
}
o(Qn, "blackjackAction");
l(Qn, "blackjackAction");
var ei = /^JRVX-[A-Z]{4}\d{8}$/, ua = /^[A-Za-z0-9:_-]{4,180}$/, da = /* @__PURE__ */ new Set(["poker_hand", "poker_win", "poker_showdown", "blackjack_hand", "blackjack_win", "blackjack_loss", "blackjack_natural", "roulette_spin", "roulette_win", "roulette_loss", "roulette_straight"]), la = `SELECT u.*,
 (SELECT balance FROM cas_wallets WHERE jrvx_id=u.jrvx_id AND currency='MG') AS mg,
 (SELECT version FROM cas_wallets WHERE jrvx_id=u.jrvx_id AND currency='MG') AS mg_version
 FROM cas_users u WHERE u.jrvx_id=?`;
function At(e) {
  if (!ei.test(String(e))) throw Error("invalid_jrvx_id");
}
o(At, "validId");
l(At, "validId");
function ti(e) {
  if (typeof e != "string" || !ua.test(e)) throw Error("invalid_event_id");
}
o(ti, "validEventId");
l(ti, "validEventId");
function Te(e, t = {}) {
  try {
    let r = JSON.parse(e || "null");
    return r && typeof r == "object" && !Array.isArray(r) ? r : t;
  } catch {
    return t;
  }
}
o(Te, "objectJSON");
l(Te, "objectJSON");
function ri(e) {
  try {
    let t = JSON.parse(e || "[]");
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
o(ri, "listJSON");
l(ri, "listJSON");
function or(e) {
  let t = Number(e);
  if (e == null || !Number.isSafeInteger(t) || t < 0 || t > Number.MAX_SAFE_INTEGER) throw Error("invalid_stored_wallet");
  return t;
}
o(or, "walletNumber");
l(or, "walletNumber");
function ni(e) {
  if (!e) throw Error("cas_user_not_found");
  let t = { MG: or(e.mg) }, r = { id: e.jrvx_id, jrvxId: e.jrvx_id, nickname: e.nickname, enabled: e.enabled === 1, role: e.role, profile: Te(e.profile_json), friends: ri(e.friends_json).filter((i) => ei.test(String(i))), progress: Te(e.progression_json), stats: Te(e.stats_json), wallet: t, createdAt: Number(e.created_at), updatedAt: Number(e.updated_at) }, n = Ue(r);
  return r.pokerHands = n.stats.poker.hands, r.pokerWins = n.stats.poker.wins, { ok: true, account: r, wallet: t, walletRevision: { MG: Number(e.mg_version) || 0 }, progress: n, progressVersion: Number(e.progress_version) || 0, serverTime: Date.now() };
}
o(ni, "fromRow");
l(ni, "fromRow");
async function T(e, t) {
  At(t); const snapshot=ni(await e.prepare(la).bind(t).first());
  return {...snapshot,economy:MG_CONTRACT,dailyBonus:await mgService.dailyStatus(e,t)};
}
o(T, "readAccount");
l(T, "readAccount");
function fe(e) {
  if (e === null || typeof e == "string" || typeof e == "boolean") return e;
  if (typeof e == "number") {
    if (!Number.isFinite(e)) throw Error("invalid_history");
    return e;
  }
  if (Array.isArray(e)) return e.map(fe);
  if (!e || typeof e != "object") throw Error("invalid_history");
  let t = {};
  for (let r of Object.keys(e).sort()) {
    if (["__proto__", "prototype", "constructor"].includes(r)) throw Error("invalid_history");
    t[r] = fe(e[r]);
  }
  return t;
}
o(fe, "canonical2");
l(fe, "canonical");
async function je(e) {
  let t = new TextEncoder().encode(JSON.stringify(fe(e)));
  if (t.length > 65536) throw Error("history_too_large");
  let r = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(r), (n) => n.toString(16).padStart(2, "0")).join("");
}
o(je, "fingerprint");
l(je, "fingerprint");
async function ht(e, t, r, n) {
  let i = await e.prepare("SELECT jrvx_id,data_json FROM cas_game_history WHERE event_id=?").bind(t).first();
  if (!i) return null;
  let s = Te(i.data_json, null);
  if (i.jrvx_id !== r || !s || s.inputFingerprint !== n) throw Error("event_id_conflict");
  return s;
}
o(ht, "existingEvent");
l(ht, "existingEvent");
function ii(e) {
  return /progress_version_mismatch|wallet_balance_mismatch/.test(String(e));
}
o(ii, "retryable");
l(ii, "retryable");
async function It(e, t, r, n, i) {
  At(t), ti(r);
  let s = await je(n), a = await ht(e, r, t, s);
  if (a) return { ...await T(e, t), duplicate: true, eventId: r, reward: a.reward || null };
  for (let c = 0; c < 6; c++) {
    let u = await T(e, t);
    if (!u.account.enabled && n.eventType !== "hand") throw Error("cas_account_disabled");
    let d = u.account, p = i(d), h = Date.now(), f = { ...n.history, eventId: r, inputFingerprint: s, progressVersion: u.progressVersion, events: n.events || [], reward: p?.reward || null, timestamp: h }, _ = [], w = Number(p?.reward?.rewardMg) || 0;
    if (w) {
      let y = u.wallet.MG, m = y + w;
      if (!Number.isSafeInteger(m) || m > Number.MAX_SAFE_INTEGER) throw Error("balance_limit");
      _.push(U(e, { transactionId: `${r}:reward`, jrvxId: t, currency: "MG", amount: w, operationType: "daily_reward", source: "progression-server", actorId: t, metadata: { missionId: n.missionId, rewardXp: p.reward.rewardXp }, timestamp: h }, y));
    }
    _.push(e.prepare("INSERT INTO cas_game_history (event_id,jrvx_id,game,event_type,data_json,created_at) VALUES (?,?,?,?,?,?)").bind(r, t, "poker", n.eventType, JSON.stringify(f), h)), _.push(e.prepare("UPDATE cas_users SET progression_json=?,stats_json=?,progress_version=progress_version+1,updated_at=? WHERE jrvx_id=? AND progress_version=?").bind(JSON.stringify(d.progress), JSON.stringify(d.stats), h, t, u.progressVersion));
    try {
      return await e.batch(_), { ...await T(e, t), duplicate: false, eventId: r, reward: p?.reward || null };
    } catch (y) {
      if (a = await ht(e, r, t, s), a) return { ...await T(e, t), duplicate: true, eventId: r, reward: a.reward || null };
      if (ii(y) && c < 5) continue;
      throw y;
    }
  }
  throw Error("progress_retry_exhausted");
}
o(It, "mutateProgress");
l(It, "mutateProgress");
async function ai(e, t, r, n, i = {}) {
  if (!Array.isArray(n) || !n.length || n.length > 8) throw Error("invalid_progress_events");
  let s = n.map((c) => {
    if (!c || !da.has(c.event) || !c.data || typeof c.data != "object" || Array.isArray(c.data)) throw Error("invalid_progress_event");
    return { event: c.event, data: fe(c.data) };
  }), a = fe(i);
  if (Array.isArray(a) || !a || typeof a != "object") throw Error("invalid_history");
  return It(e, t, r, { events: s, history: a, eventType: "hand" }, (c) => {
    for (let u of s) V(c, u.event, u.data, true);
  });
}
o(ai, "applyProgressEvents");
l(ai, "applyProgressEvents");
async function Rt(e, t, r = Date.now()) {
  At(t);
  let n = Q(r), i = `login:${t}:${n}`;
  return It(e, t, i, { eventType: "login", history: { date: n }, events: [] }, (s) => {
    Bn(s, r);
  });
}
o(Rt, "touchCasLogin");
l(Rt, "touchCasLogin");
async function si(e, t, r) {
  if (typeof r != "string" || !/^[a-z_]{1,64}$/.test(r)) throw Error("invalid_mission_id");
  let n = Q(), i = `daily:${t}:${n}:${r}`;
  return It(e, t, i, { eventType: "daily_reward", missionId: r, history: { date: n, missionId: r }, events: [] }, (s) => {
    let a = Wn(s, r);
    if (!a.ok) throw Error(a.error);
    return { reward: a };
  });
}
o(si, "claimDailyReward");
l(si, "claimDailyReward");
var oi = /^JRVX-[A-Z]{4}\d{8}$/, wt = "jrvx_cas_session", _t = "jrvx_cas_logged_out", cr = "JRVX-JRVX11101111", mt = new TextEncoder(), pa = new TextDecoder();
function le(e) {
  let t = {};
  for (let r of String(e.headers.get("cookie") || "").split(";")) {
    let n = r.indexOf("=");
    if (!(n < 1)) try {
      t[r.slice(0, n).trim()] = decodeURIComponent(r.slice(n + 1).trim());
    } catch {
    }
  }
  return t;
}
o(le, "cookies");
l(le, "cookies");
function ur(e) {
  let t = "";
  for (let r of e) t += String.fromCharCode(r);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
o(ur, "b64");
l(ur, "b64");
function dr(e) {
  let t = e.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t + "=".repeat((4 - t.length % 4) % 4)), (r) => r.charCodeAt(0));
}
o(dr, "unb64");
l(dr, "unb64");
async function Nt(e) {
  if (typeof e.JRVX_SESSION_SECRET != "string" || e.JRVX_SESSION_SECRET.length < 32) throw Error("session_secret_missing");
  return crypto.subtle.importKey("raw", mt.encode(e.JRVX_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
o(Nt, "sessionKey");
l(Nt, "sessionKey");
async function Ar(e, t) {
  let r = ur(mt.encode(JSON.stringify(t)));
  return r + "." + ur(new Uint8Array(await crypto.subtle.sign("HMAC", await Nt(e), mt.encode(r))));
}
o(Ar, "signSession");
l(Ar, "signSession");
async function Ir(e, t) {
  try {
    if (String(t).length > 2048) return null;
    let [r, n, ...i] = String(t || "").split(".");
    if (!r || !n || i.length || !await crypto.subtle.verify("HMAC", await Nt(e), dr(n), mt.encode(r))) return null;
    let s = JSON.parse(pa.decode(dr(r)));
    return oi.test(s.id) && typeof s.sid == "string" && s.sid.length === 36 && Number.isFinite(s.exp) && s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}
o(Ir, "decodeSession");
l(Ir, "decodeSession");
async function Rr(e, t) {
  if (!t || t.length > 256 || !e.IDENTITY) throw Error("identity_session_missing");
  let r = new AbortController(), n = setTimeout(() => r.abort(), 5e3);
  try {
    let i = await e.IDENTITY.fetch(new Request("https://id.jrvx.ru/api/integrations/verify?app=cas", { headers: { cookie: "jrvx_session=" + encodeURIComponent(t), accept: "application/json" }, signal: r.signal }));
    if (!i.ok) throw Error("identity_rejected");
    let s = await i.json(), a = s.user, c = String(a?.jrvx_id || "").toUpperCase();
    if (s.ok !== true || s.app?.app_key !== "cas" || a?.status !== "active" || !oi.test(c) || !Number.isFinite(s.session?.expiresAt) || s.session.expiresAt <= Date.now()) throw Error("identity_rejected");
    return { id: c, nickname: String(a.profile?.display_name || a.username || "\u0418\u0433\u0440\u043E\u043A").trim().slice(0, 32) || "\u0418\u0433\u0440\u043E\u043A", identityExpiry: s.session.expiresAt };
  } finally {
    clearTimeout(n);
  }
}
o(Rr, "verifyIdentityCookie");
l(Rr, "verifyIdentityCookie");
async function Nr(e, t, r) {
  if (!t || t.exp <= Date.now()) throw Error("session_expired");
  let n = await e.DB.prepare("SELECT s.expires_at,s.revoked,u.enabled,u.role,u.nickname FROM cas_sessions s JOIN cas_users u ON u.jrvx_id=s.jrvx_id WHERE s.sid=? AND s.jrvx_id=?").bind(t.sid, t.id).first();
  if (!n || n.revoked || n.enabled !== 1 || n.expires_at <= Date.now()) throw Error("session_rejected");
  let i = t.oidc ? await kn(e, t.sid, t.id) : await Rr(e, r);
  if (i.id !== t.id) throw Error("identity_mismatch");
  return { ...i, ...t.oidc ? { oidc: true } : {}, sid: t.sid, exp: Math.min(t.exp, n.expires_at, i.identityExpiry), role: t.id === cr ? "SUPERADMIN" : n.role, casNickname: n.nickname };
}
o(Nr, "verifyLive");
l(Nr, "verifyLive");
async function ct(e, t) {
  let r = le(e);
  if (r[_t] === "1") return null;
  let n = await Ir(t, r[wt]);
  try {
    return await Nr(t, n, r.jrvx_session);
  } catch (i) {
    if (i?.message === "identity_unavailable") throw i;
    return null;
  }
}
o(ct, "verifiedRequest");
l(ct, "verifiedRequest");
async function Tr(e, t) {
  let r = Date.now();
  await e.DB.batch([e.DB.prepare("INSERT OR IGNORE INTO cas_users(jrvx_id,nickname,enabled,role,created_at,updated_at) VALUES(?,?,1,?,?,?)").bind(t.id, t.nickname, t.id === cr ? "SUPERADMIN" : "USER", r, r), ...["MG"].map((i) => e.DB.prepare("INSERT OR IGNORE INTO cas_wallets(jrvx_id,currency,balance,updated_at) VALUES(?,?,0,?)").bind(t.id, i, r)), e.DB.prepare("INSERT OR IGNORE INTO cas_blackjack_state(jrvx_id,state_json,version,updated_at) VALUES(?,'{}',0,?)").bind(t.id, r)]);
  let n = await e.DB.prepare("SELECT enabled,role,nickname FROM cas_users WHERE jrvx_id=?").bind(t.id).first();
  if (n?.enabled !== 1) throw Error("cas_account_disabled");
  return { ...t, role: t.id === cr ? "SUPERADMIN" : n.role, casNickname: n.nickname };
}
o(Tr, "ensureAccount");
l(Tr, "ensureAccount");
var De = l((e, t, r) => `${e}=${encodeURIComponent(t)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${r}`, "cookie");
function ci(e) {
  let t = new Uint32Array(1), r = 2 ** 32 - 2 ** 32 % e;
  do
    crypto.getRandomValues(t);
  while (t[0] >= r);
  return t[0] % e;
}
o(ci, "secureInt");
l(ci, "secureInt");
var yt = [{ id: "1-2", sb: 1, bb: 2, min: 20 }, { id: "2-4", sb: 2, bb: 4, min: 40 }, { id: "5-10", sb: 5, bb: 10, min: 100 }, { id: "10-20", sb: 10, bb: 20, min: 200 }, { id: "25-50", sb: 25, bb: 50, min: 500 }, { id: "50-100", sb: 50, bb: 100, min: 1e3 }, { id: "100-200", sb: 100, bb: 200, min: 2e3 }], jr = "23456789TJQKA", ha = "SHDC", wa = ["\u0421\u0442\u0430\u0440\u0448\u0430\u044F \u043A\u0430\u0440\u0442\u0430", "\u041F\u0430\u0440\u0430", "\u0414\u0432\u0435 \u043F\u0430\u0440\u044B", "\u0422\u0440\u043E\u0439\u043A\u0430", "\u0421\u0442\u0440\u0438\u0442", "\u0424\u043B\u0435\u0448", "\u0424\u0443\u043B\u043B-\u0445\u0430\u0443\u0441", "\u041A\u0430\u0440\u0435", "\u0421\u0442\u0440\u0438\u0442-\u0444\u043B\u0435\u0448"], J = { 2: "\u0434\u0432\u043E\u0435\u043A", 3: "\u0442\u0440\u043E\u0435\u043A", 4: "\u0447\u0435\u0442\u0432\u0451\u0440\u043E\u043A", 5: "\u043F\u044F\u0442\u0451\u0440\u043E\u043A", 6: "\u0448\u0435\u0441\u0442\u0451\u0440\u043E\u043A", 7: "\u0441\u0435\u043C\u0451\u0440\u043E\u043A", 8: "\u0432\u043E\u0441\u044C\u043C\u0451\u0440\u043E\u043A", 9: "\u0434\u0435\u0432\u044F\u0442\u043E\u043A", 10: "\u0434\u0435\u0441\u044F\u0442\u043E\u043A", 11: "\u0432\u0430\u043B\u0435\u0442\u043E\u0432", 12: "\u0434\u0430\u043C", 13: "\u043A\u043E\u0440\u043E\u043B\u0435\u0439", 14: "\u0442\u0443\u0437\u043E\u0432" }, Tn = l((e) => yt.find((t) => t.id === e) || yt[0], "tableById"), tr = l((e) => JSON.parse(JSON.stringify(e)), "clone");
function ui() {
  let e = [];
  for (let t of jr) for (let r of ha) e.push(t + r);
  for (let t = e.length - 1; t > 0; t--) {
    let r = ci(t + 1);
    [e[t], e[r]] = [e[r], e[t]];
  }
  return e;
}
o(ui, "makeDeck");
l(ui, "makeDeck");
function Dr(e, t) {
  for (let r = 0; r < Math.max(e?.length || 0, t?.length || 0); r++) {
    let n = (e?.[r] || 0) - (t?.[r] || 0);
    if (n) return n;
  }
  return 0;
}
o(Dr, "compareScore");
l(Dr, "compareScore");
function di(e) {
  let t = e.map((u) => jr.indexOf(u[0]) + 2).sort((u, d) => d - u), r = {};
  for (let u of t) r[u] = (r[u] || 0) + 1;
  let n = Object.entries(r).map(([u, d]) => [Number(d), Number(u)]).sort((u, d) => d[0] - u[0] || d[1] - u[1]), i = e.every((u) => u[1] === e[0][1]), s = [...new Set(t)];
  s[0] === 14 && s.push(1);
  let a = 0;
  for (let u = 0; u <= s.length - 5; u++) if (s[u] - s[u + 4] === 4) {
    a = s[u];
    break;
  }
  if (i && a) return [8, a];
  if (n[0][0] === 4) return [7, n[0][1], n[1][1]];
  if (n[0][0] === 3 && n[1]?.[0] >= 2) return [6, n[0][1], n[1][1]];
  if (i) return [5, ...t];
  if (a) return [4, a];
  if (n[0][0] === 3) return [3, n[0][1], ...n.slice(1).map((u) => u[1]).sort((u, d) => d - u)];
  let c = n.filter((u) => u[0] === 2);
  return c.length >= 2 ? [2, c[0][1], c[1][1], n.find((u) => u[0] === 1)?.[1] || 0] : c.length === 1 ? [1, c[0][1], ...n.filter((u) => u[0] === 1).map((u) => u[1]).sort((u, d) => d - u)] : [0, ...t];
}
o(di, "score5");
l(di, "score5");
function gt(e) {
  if (e.length < 5) return null;
  let t = null;
  for (let r = 0; r < e.length - 4; r++) for (let n = r + 1; n < e.length - 3; n++) for (let i = n + 1; i < e.length - 2; i++) for (let s = i + 1; s < e.length - 1; s++) for (let a = s + 1; a < e.length; a++) {
    let c = di([e[r], e[n], e[i], e[s], e[a]]);
    (!t || Dr(c, t) > 0) && (t = c);
  }
  return t;
}
o(gt, "bestHand");
l(gt, "bestHand");
function Or(e = [], t = []) {
  let r = [...e, ...t].filter((a) => a && a !== "??");
  if (!r.length) return "";
  if (r.length >= 5) {
    let a = gt(r);
    return a ? a[0] === 1 ? `\u041F\u0430\u0440\u0430 ${J[a[1]] || ""}`.trim() : a[0] === 2 ? `\u0414\u0432\u0435 \u043F\u0430\u0440\u044B: ${J[a[1]] || ""} \u0438 ${J[a[2]] || ""}`.trim() : a[0] === 3 ? `\u0422\u0440\u043E\u0439\u043A\u0430 ${J[a[1]] || ""}`.trim() : a[0] === 7 ? `\u041A\u0430\u0440\u0435 ${J[a[1]] || ""}`.trim() : wa[a[0]] || "" : "";
  }
  let n = {};
  for (let a of r) {
    let c = jr.indexOf(a[0]) + 2;
    n[c] = (n[c] || 0) + 1;
  }
  let i = Object.entries(n).map(([a, c]) => [Number(a), c]).sort((a, c) => c[1] - a[1] || c[0] - a[0]), s = i.filter((a) => a[1] === 2).map((a) => a[0]);
  return i[0]?.[1] === 4 ? `\u041A\u0430\u0440\u0435 ${J[i[0][0]] || ""}`.trim() : i[0]?.[1] === 3 ? `\u0422\u0440\u043E\u0439\u043A\u0430 ${J[i[0][0]] || ""}`.trim() : s.length >= 2 ? `\u0414\u0432\u0435 \u043F\u0430\u0440\u044B: ${J[s[0]] || ""} \u0438 ${J[s[1]] || ""}`.trim() : s.length === 1 ? `\u041F\u0430\u0440\u0430 ${J[s[0]] || ""}`.trim() : "\u0421\u0442\u0430\u0440\u0448\u0430\u044F \u043A\u0430\u0440\u0442\u0430";
}
o(Or, "handName");
l(Or, "handName");
function li(e, { tableId: t = "1-2", currency: r = "MG", mode: n = "online", allowedIds: i = [] } = {}) {
  mgCurrency(r);
  if (!yt.some((s) => s.id === t) || !["MG"].includes(r) || !["online", "friend", "jarvis"].includes(n)) throw Error("invalid_table");
  return { id: e, table: Tn(t), currency: r, mode: n, allowedIds: i, players: [null, null], deck: [], community: [], pot: 0, currentBet: 0, lastRaiseSize: Tn(t).bb, handNo: 0, dealerSeat: 1, smallBlindSeat: null, bigBlindSeat: null, street: "waiting", active: false, pending: [], turnSeat: null, turnDeadline: 0, nextHandAt: 0, lastResult: null, revision: 0, log: [], watchers: [], createdAt: Date.now(), closed: false };
}
o(li, "createRoom");
l(li, "createRoom");
function j(e, t) {
  return e.players.findIndex((r) => r?.id === t);
}
o(j, "seated");
l(j, "seated");
function Tt(e) {
  return !e.closed && !e.active && e.players.every((t) => t && t.connected && t.stack >= e.table.bb);
}
o(Tt, "canStart");
l(Tt, "canStart");
function ee(e, t, r = "action") {
  e.log.push({ kind: r, street: e.street, text: t }), e.log = e.log.slice(-80);
}
o(ee, "log");
l(ee, "log");
function Be(e, t, r, n) {
  let i = e.players[t], s = Math.min(i.stack, r);
  return i.stack -= s, i.bet += s, i.contribution += s, e.pot += s, i.lastAction = n, ee(e, `${i.nickname}: ${n} ${s} ${e.currency}`, "bet"), s;
}
o(Be, "post");
l(Be, "post");
function jt(e, t) {
  e.turnDeadline = Date.now() + t, e.nextHandAt = 0;
}
o(jt, "arm");
l(jt, "arm");
function lr(e, { id: t, nickname: r }, n) {
  if (e.closed || e.players.every(Boolean) || j(e, t) >= 0) throw Error("table_full");
  if (e.mode === "friend" && !e.allowedIds.includes(t)) throw Error("private_table_forbidden");
  if (!Number.isSafeInteger(n) || n < e.table.min || n > 1e9) throw Error("invalid_buyin");
  if (e.pot + e.players.reduce((s, a) => s + (a?.stack || 0), 0) + n > 1e9) throw Error("table_escrow_limit");
  let i = e.players[0] ? 1 : 0;
  return e.players[i] = { id: t, nickname: r, seat: i, stack: n, bet: 0, contribution: 0, hole: [], folded: false, lastAction: "\u0413\u043E\u0442\u043E\u0432", wonLast: 0, connected: true, disconnectDeadline: 0 }, e.revision++, ee(e, `${r} \u0437\u0430\u043D\u044F\u043B \u043C\u0435\u0441\u0442\u043E ${i + 1}`, "join"), i;
}
o(lr, "addSeat");
l(lr, "addSeat");
function pr(e, t = 15e3) {
  if (!Tt(e)) throw Error("hand_not_ready");
  e.handNo++, e.deck = ui(), e.community = [], e.pot = 0, e.currentBet = e.table.bb, e.lastRaiseSize = e.table.bb, e.active = true, e.street = "preflop", e.lastResult = null, e.dealerSeat = 1 - e.dealerSeat, e.smallBlindSeat = e.dealerSeat, e.bigBlindSeat = 1 - e.dealerSeat;
  for (let r of e.players) r.hole = [e.deck.pop(), e.deck.pop()], r.bet = 0, r.contribution = 0, r.folded = false, r.wonLast = 0, r.lastAction = "";
  Be(e, e.smallBlindSeat, e.table.sb, "SB"), Be(e, e.bigBlindSeat, e.table.bb, "BB"), e.pending = [0, 1], e.turnSeat = e.smallBlindSeat, jt(e, t), e.revision++, ee(e, `\u0420\u0430\u0437\u0434\u0430\u0447\u0430 #${e.handNo}`, "deal"), Ot(e);
}
o(pr, "startHand");
l(pr, "startHand");
function Cr(e) {
  let [t, r] = e.players;
  if (t.contribution === r.contribution) return;
  let n = t.contribution > r.contribution ? t : r, i = n === t ? r : t, s = n.contribution - i.contribution;
  n.contribution -= s, n.bet = Math.max(0, n.bet - s), n.stack += s, e.pot -= s, ee(e, `${n.nickname}: \u0432\u043E\u0437\u0432\u0440\u0430\u0442 ${s} ${e.currency}`, "refund");
}
o(Cr, "refundUncalled");
l(Cr, "refundUncalled");
function Dt(e, t, r, n = 5e3) {
  let i = e.pot, s = {};
  if (t.length === 1) e.players[t[0]].stack += i, s[e.players[t[0]].id] = i;
  else {
    let a = Math.floor(i / 2), c = i - a * 2;
    for (let u of t) {
      let d = a + (u === e.bigBlindSeat ? c : 0);
      e.players[u].stack += d, s[e.players[u].id] = d;
    }
  }
  for (let a of e.players) a.wonLast = s[a.id] || 0;
  return e.lastResult = { type: r, winners: t.map((a) => e.players[a].id), winnerNickname: t.length === 1 ? e.players[t[0]].nickname : "\u041D\u0438\u0447\u044C\u044F", pot: i, awards: s, winningHand: r === "fold" ? "\u041F\u043E\u0431\u0435\u0434\u0430 \u043F\u043E\u0441\u043B\u0435 \u0444\u043E\u043B\u0434\u0430" : Or(e.players[t[0]].hole, e.community), text: t.length === 1 ? `${e.players[t[0]].nickname} \u0437\u0430\u0431\u0438\u0440\u0430\u0435\u0442 \u0431\u0430\u043D\u043A ${i} ${e.currency}` : `\u0411\u0430\u043D\u043A \u0440\u0430\u0437\u0434\u0435\u043B\u0451\u043D: ${i} ${e.currency}` }, e.pot = 0, e.active = false, e.street = "showdown", e.turnSeat = null, e.turnDeadline = 0, e.pending = [], e.nextHandAt = Date.now() + n, ee(e, e.lastResult.text, "result"), e.lastResult;
}
o(Dt, "finish");
l(Dt, "finish");
function Mr(e, t) {
  Cr(e);
  let r = gt([...e.players[0].hole, ...e.community]), n = gt([...e.players[1].hole, ...e.community]), i = Dr(r, n);
  return Dt(e, i > 0 ? [0] : i < 0 ? [1] : [0, 1], "showdown", t);
}
o(Mr, "showdown");
l(Mr, "showdown");
function Jr(e, t) {
  for (Cr(e); e.community.length < 5; ) e.community.push(e.deck.pop());
  return Mr(e, t);
}
o(Jr, "runout");
l(Jr, "runout");
function pi(e, t, r) {
  if (e.street === "river") return Mr(e, r);
  for (let n of e.players) n.bet = 0;
  return e.currentBet = 0, e.lastRaiseSize = e.table.bb, e.street === "preflop" ? (e.community.push(e.deck.pop(), e.deck.pop(), e.deck.pop()), e.street = "flop") : e.street === "flop" ? (e.community.push(e.deck.pop()), e.street = "turn") : (e.community.push(e.deck.pop()), e.street = "river"), e.players.some((n) => n.stack === 0) ? Jr(e, r) : (e.pending = [0, 1], e.turnSeat = e.bigBlindSeat, jt(e, t), ee(e, e.street.toUpperCase(), "street"), null);
}
o(pi, "advanceStreet");
l(pi, "advanceStreet");
function ut(e, t, r, n) {
  if (e.pending = e.pending.filter((i) => e.players[i].stack > 0), e.players.some((i) => i.stack === 0)) {
    let i = e.players.find((s) => s.stack > 0);
    if (!i || i.bet >= e.currentBet) return Jr(e, n);
  }
  return e.pending.length ? (e.turnSeat = e.pending.includes(1 - t) ? 1 - t : e.pending[0], jt(e, r), null) : pi(e, r, n);
}
o(ut, "afterAction");
l(ut, "afterAction");
function Re(e, t, { action: r, amount: n, handNo: i, revision: s }, a = 15e3, c = 5e3) {
  let u = j(e, t);
  if (u < 0) throw Error("not_seated");
  if (Number(i) !== e.handNo || Number(s) !== e.revision) throw Error("stale_state");
  if (!e.active || e.turnSeat !== u) throw Error("out_of_turn");
  let d = e.players[u], p = e.players[1 - u], h = Math.max(0, e.currentBet - d.bet), f = null;
  if (r = String(r).toLowerCase(), (r === "all-in" || r === "allin") && (n = d.stack + d.bet, r = p.stack === 0 || n <= e.currentBet ? "call" : "raise"), r === "fold") d.folded = true, d.lastAction = "\u0424\u043E\u043B\u0434", f = Dt(e, [1 - u], "fold", c);
  else if (r === "check") {
    if (h) throw Error("cannot_check");
    d.lastAction = "\u0427\u0435\u043A", e.pending = e.pending.filter((_) => _ !== u), f = ut(e, u, a, c);
  } else if (r === "call") Be(e, u, h, h ? "\u041A\u043E\u043B\u043B" : "\u0427\u0435\u043A"), e.pending = e.pending.filter((_) => _ !== u), f = ut(e, u, a, c);
  else if (r === "raise" || r === "bet") {
    if (p.stack === 0) throw Error("opponent_all_in");
    let _ = d.stack + d.bet, w = Number(n), y = e.currentBet + e.lastRaiseSize;
    if (!Number.isSafeInteger(w) || w <= e.currentBet || w > _ || w < y && w !== _) throw Error("invalid_raise");
    let m = w - e.currentBet;
    Be(e, u, w - d.bet, `\u0420\u0435\u0439\u0437 \u0434\u043E ${w}`), e.currentBet = w, m >= e.lastRaiseSize && (e.lastRaiseSize = m), e.pending = [1 - u], f = ut(e, u, a, c);
  } else throw Error("invalid_action");
  return e.revision++, Ot(e), f;
}
o(Re, "act");
l(Re, "act");
function fr(e, t, r = 5e3) {
  let n = j(e, t);
  if (n < 0) return null;
  let i = e.players[n], s = null;
  e.active && (s = Dt(e, [1 - n], "fold", r));
  let a = i.stack;
  return e.players[n] = null, e.active = false, e.street = "waiting", e.community = [], e.pot = 0, e.turnSeat = null, e.turnDeadline = 0, e.nextHandAt = 0, e.pending = [], e.revision++, e.players.every((c) => !c) && (e.closed = true), { cashout: a, result: s };
}
o(fr, "removeSeat");
l(fr, "removeSeat");
function O(e, t = "") {
  let r = j(e, t), n = e.street === "showdown" && e.lastResult?.type === "showdown", i = e.players.map((u, d) => u ? { ...tr(u), hole: d === r || n ? [...u.hole] : u.hole.length ? ["??", "??"] : [] } : null), s = r >= 0 ? tr(i[r]) : null;
  s && (s.toCall = e.active ? Math.max(0, e.currentBet - s.bet) : 0, s.yourTurn = e.active && e.turnSeat === r, s.currentHandName = Or(e.players[r].hole, e.community));
  let a = e.players[e.turnSeat], c = (a?.stack || 0) + (a?.bet || 0);
  return { mode: e.mode, roomId: e.id, tableId: e.table.id, currency: e.currency, revision: e.revision, active: e.active, seats: i, community: [...e.community], pot: e.pot, street: e.street, handNo: e.handNo, you: s, turnSeat: e.turnSeat, dealerSeat: e.dealerSeat, smallBlindSeat: e.smallBlindSeat, bigBlindSeat: e.bigBlindSeat, smallBlind: e.table.sb, bigBlind: e.table.bb, currentBet: e.currentBet, minRaiseTo: Math.min(c, e.currentBet + e.lastRaiseSize), minBuyIn: e.table.min, lastResult: e.lastResult, actionLog: tr(e.log.slice(-40)), canStart: Tt(e), turnDeadline: e.turnDeadline, nextHandAt: e.nextHandAt, serverTime: Date.now(), authoritative: true, spectator: r < 0 };
}
o(O, "stateFor");
l(O, "stateFor");
function dt(e) {
  return { roomId: e.id, mode: e.mode, tableId: e.table.id, currency: e.currency, seated: e.players.filter(Boolean).length, active: e.active, handNo: e.handNo, street: e.street, spectators: e.watchers.length, private: e.mode === "friend", closed: e.closed };
}
o(dt, "summary");
l(dt, "summary");
function Ot(e) {
  if (e.players.some((r) => r && (!Number.isSafeInteger(r.stack) || r.stack < 0 || !Number.isSafeInteger(r.bet) || r.bet < 0))) throw Error("poker_stack_invariant");
  let t = [...e.deck, ...e.community, ...e.players.flatMap((r) => r?.hole || [])];
  if (new Set(t).size !== t.length) throw Error("poker_duplicate_card");
  if (!Number.isSafeInteger(e.pot) || e.pot < 0) throw Error("poker_pot_invariant");
  if (e.pot + e.players.reduce((r, n) => r + (n?.stack || 0), 0) > 1e9) throw Error("poker_escrow_invariant");
}
o(Ot, "assertRoom");
l(Ot, "assertRoom");
var Ct = "JRVX-JRVX11101111", _a = /^JRVX-[A-Z]{4}\d{8}$/, ma = /^[A-Za-z0-9_-]{8,96}$/, K = l((e, t = {}) => {
  try {
    return JSON.parse(e || "null") ?? t;
  } catch {
    return t;
  }
}, "parse"), $e = l(async (e, t, r = []) => (await e.prepare(t).bind(...r).all()).results || [], "rows"), fi = l((e) => Math.max(1, Math.min(200, Math.trunc(Number(e) || 100))), "limit"), Z = l((e) => e.id === Ct ? "SUPERADMIN" : e.role, "role");
function Fe(e) {
  if (!_a.test(String(e))) throw Error("invalid_player_id");
}
o(Fe, "assertId");
l(Fe, "assertId");
function Br(e) {
  if (!e.enabled || !["ADMIN", "SUPERADMIN"].includes(Z(e))) throw Error("admin_forbidden");
}
o(Br, "assertAdmin");
l(Br, "assertAdmin");
function hi(e, t, r, n = {}) {
  let i = ["admin_set_role", "admin_delete_user", "admin_set_enabled"].includes(r) || r === "admin_update_user" && (n.role !== void 0 || n.enabled !== void 0);
  if (t.id === Ct && i) throw Error("founder_protected");
  if (Z(e) !== "SUPERADMIN" && Z(t) !== "USER") throw Error("admin_target_forbidden");
}
o(hi, "assertTarget");
l(hi, "assertTarget");
function wi(e, t = null) {
  let r = e.account, n = e.progress;
  return { id: r.id, nickname: r.nickname, enabled: r.enabled, role: Z(r), mg: e.wallet.MG, pokerHands: n.stats.poker.hands, pokerWins: n.stats.poker.wins, level: n.level, xp: n.xp, online: !!t, roomId: t?.room_id || "", createdAt: r.createdAt, profile: r.profile };
}
o(wi, "userView");
l(wi, "userView");
async function _i(e) {
  return (await $e(e, `SELECT u.jrvx_id,u.nickname,u.enabled,u.role,u.created_at,u.profile_json,u.progression_json,u.stats_json,
  (SELECT balance FROM cas_wallets WHERE jrvx_id=u.jrvx_id AND currency='MG') AS mg,
  c.room_id,CASE WHEN s.sid IS NOT NULL THEN c.jrvx_id END AS online_id FROM cas_users u LEFT JOIN cas_connections c ON c.jrvx_id=u.jrvx_id AND c.online=1
  LEFT JOIN cas_sessions s ON s.sid=c.sid AND s.revoked=0 AND s.expires_at>?
  ORDER BY u.jrvx_id LIMIT 1000`, [Date.now()])).map((r) => {
    let n = K(r.progression_json), i = K(r.stats_json);
    return { id: r.jrvx_id, nickname: r.nickname, enabled: r.enabled === 1, role: r.jrvx_id === Ct ? "SUPERADMIN" : r.role, mg: Number(r.mg) || 0, pokerHands: Number(i.poker?.hands) || 0, pokerWins: Number(i.poker?.wins) || 0, level: Ce(n.xp).level, xp: Number(n.xp) || 0, online: !!r.online_id, roomId: r.room_id || "", createdAt: Number(r.created_at), profile: K(r.profile_json) };
  });
}
o(_i, "users");
l(_i, "users");
async function hr(e) {
  return (await $e(e, `SELECT c.jrvx_id,c.nickname,c.room_id,c.spectating,c.last_seen,c.connected_at,u.role
 FROM cas_connections c JOIN cas_sessions s ON s.sid=c.sid JOIN cas_users u ON u.jrvx_id=c.jrvx_id
 WHERE c.online=1 AND s.revoked=0 AND s.expires_at>? AND u.enabled=1 ORDER BY c.connected_at DESC LIMIT 1000`, [Date.now()])).map((t) => ({ playerId: t.jrvx_id, nickname: t.nickname, role: t.jrvx_id === Ct ? "SUPERADMIN" : t.role, roomId: t.room_id, spectating: t.spectating, lastSeen: Number(t.last_seen), connectedAt: Number(t.connected_at) }));
}
o(hr, "sessions");
l(hr, "sessions");
async function wr(e) {
  return (await $e(e, "SELECT summary_json FROM cas_poker_rooms WHERE closed=0 ORDER BY updated_at DESC LIMIT 500")).map((t) => K(t.summary_json, null)).filter(Boolean);
}
o(wr, "rooms");
l(wr, "rooms");
async function mi(e, t) {
  let r = [], n = [];
  if (t.playerId && (Fe(t.playerId), r.push("jrvx_id=?"), n.push(t.playerId)), t.currency) {
    if (!["MG"].includes(t.currency)) throw Error("invalid_currency");
    r.push("currency=?"), n.push(t.currency);
  }
  return n.push(fi(t.limit)), (await $e(e, "SELECT * FROM cas_transactions" + (r.length ? " WHERE " + r.join(" AND ") : "") + " ORDER BY created_at DESC,transaction_id DESC LIMIT ?", n)).map((i) => ({ transactionId: i.transaction_id, accountId: i.jrvx_id, user: i.jrvx_id, currency: i.currency, delta: Number(i.amount), amount: Number(i.amount), balanceBefore: Number(i.balance_before), balanceAfter: Number(i.balance_after), type: i.operation_type, source: i.source, actorId: i.actor_id, createdAt: Number(i.created_at), metadata: K(i.metadata_json) }));
}
o(mi, "ledger");
l(mi, "ledger");
async function yi(e, t) {
  let r = [], n = [];
  for (let [i, s] of [["target_id", "playerId"], ["actor_id", "actorId"]]) t[s] && (Fe(t[s]), r.push(i + "=?"), n.push(t[s]));
  return n.push(fi(t.limit)), (await $e(e, "SELECT * FROM cas_audit_log" + (r.length ? " WHERE " + r.join(" AND ") : "") + " ORDER BY created_at DESC,audit_id DESC LIMIT ?", n)).map((i) => ({ auditId: i.audit_id, actorId: i.actor_id, action: i.action, targetId: i.target_id, status: i.status, details: K(i.details_json), createdAt: Number(i.created_at) }));
}
o(yi, "audit");
l(yi, "audit");
async function gi(e) {
  let t = new TextEncoder().encode(JSON.stringify(e));
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", t)), (r) => r.toString(16).padStart(2, "0")).join("");
}
o(gi, "inputHash");
l(gi, "inputHash");
function X(e) {
  if (!Number.isSafeInteger(e) || e < 0 || e > Number.MAX_SAFE_INTEGER) throw Error("invalid_balance");
  return e;
}
o(X, "balance");
l(X, "balance");
function _r(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw Error("invalid_profile");
  let t = {};
  for (let r of Object.keys(e).sort()) {
    let n = e[r];
    if (r === "bio" && typeof n == "string" && n.length <= 500) t[r] = n;
    else if (r === "avatarId" && typeof n == "string" && /^[A-Za-z0-9_-]{1,32}$/.test(n)) t[r] = n;
    else if (r === "accentColor" && typeof n == "string" && /^#[0-9a-f]{6}$/i.test(n)) t[r] = n;
    else if (r === "locale" && ["ru", "en"].includes(n)) t[r] = n;
    else throw Error("invalid_profile_field");
  }
  return t;
}
o(_r, "profilePatch");
l(_r, "profilePatch");
function Ei(e) {
  let t = String(e.type), r = String(e.playerId || "");
  if (Fe(r), !ma.test(String(e.opId || ""))) throw Error("invalid_operation_id");
  if (Object.hasOwn(e,"ms") || ["admin_set_balance","admin_set_mura_tokens"].includes(t)) throw Error("currency_retired");
  let n = { type: t, id: r, opId: e.opId };
  if (t === "admin_set_balances") {
    if (e.mg === void 0) throw Error("invalid_balance");
    e.mg !== void 0 && (n.mg = X(e.mg));
  } else if (t === "admin_set_enabled") {
    if (typeof e.enabled != "boolean") throw Error("invalid_enabled");
    n.enabled = e.enabled;
  } else if (t === "admin_delete_user") n.enabled = false;
  else if (t === "admin_set_role") {
    if (!["USER", "ADMIN"].includes(e.role)) throw Error("invalid_role");
    n.role = e.role;
  } else if (t === "admin_set_nickname") {
    if (typeof e.nickname != "string" || !e.nickname.trim() || e.nickname.trim().length > 32) throw Error("invalid_nickname");
    n.nickname = e.nickname.trim();
  } else if (t === "admin_set_profile") n.profile = _r(e.profile);
  else if (t === "admin_update_user") {
    let i = 0;
    if (e.nickname !== void 0) {
      if (typeof e.nickname != "string" || !e.nickname.trim() || e.nickname.trim().length > 32) throw Error("invalid_nickname");
      n.nickname = e.nickname.trim(), i++;
    }
    if (e.mg !== void 0 && (n.mg = X(e.mg), i++), e.enabled !== void 0) {
      if (typeof e.enabled != "boolean") throw Error("invalid_enabled");
      n.enabled = e.enabled, i++;
    }
    if (e.role !== void 0) {
      if (!["USER", "ADMIN"].includes(e.role)) throw Error("invalid_role");
      n.role = e.role, i++;
    }
    if (e.profile !== void 0 && (n.profile = _r(e.profile), i++), !i) throw Error("invalid_admin_patch");
  } else throw Error("unknown_admin_operation");
  return n;
}
o(Ei, "normalize");
l(Ei, "normalize");
async function mr(e, t, r) {
  let n = await e.prepare("SELECT details_json FROM cas_audit_log WHERE audit_id=?").bind(t).first();
  if (!n) return false;
  if (K(n.details_json).inputFingerprint !== r) throw Error("admin_operation_conflict");
  return true;
}
o(mr, "previous");
l(mr, "previous");
async function vi(e, t, r, n) {
  let i = e.CAS_SESSIONS.getByName(t);
  n ? await i.closeAll("CAS account blocked") : (await i.push({ type: "account_status", enabled: r.account.enabled, role: Z(r.account), nickname: r.account.nickname }), await i.push({ type: "account_wallet", ...r }), await i.push({ type: "progress_state", ...r, reason: "admin-sync" }));
}
o(vi, "notifyTarget");
l(vi, "notifyTarget");
async function bi(e, t, r) {
  let n = e.DB, i = Ei(r), s = `admin:${t.id}:${i.opId}`, a = await gi(i), c = await mr(n, s, a);
  for (let u = 0; u < 5; u++) {
    let d = (await T(n, t.id)).account;
    Br(d);
    let p = await T(n, i.id);
    if (hi(d, p.account, i.type, i), i.role !== void 0 && Z(d) !== "SUPERADMIN") throw Error("admin_role_forbidden");
    if (!c) {
      let f = {};
      if (i.mg !== void 0 && (f.mgVersion = p.walletRevision.MG), i.profile !== void 0) {
        let m = await n.prepare("SELECT profile_json FROM cas_users WHERE jrvx_id=?").bind(i.id).first();
        if (JSON.stringify(K(m?.profile_json)) !== JSON.stringify(p.account.profile)) continue;
        f.profileJson = m.profile_json;
      }
      let _ = Date.now(), w = { input: i, inputFingerprint: a, expected: f }, y = [n.prepare("INSERT INTO cas_audit_log(audit_id,actor_id,action,target_id,status,details_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(s, t.id, i.type, i.id, "ok", JSON.stringify(w), _)];
      for (let m of ["MG"]) {
        let g = i[m.toLowerCase()];
        if (g === void 0) continue;
        let E = p.wallet[m], k = g - E;
        k !== 0 && y.push(U(n, { jrvxId: i.id, transactionId: `${s}:${m}`, currency: m, amount: k, operationType: "admin_adjustment", source: "admin-server", actorId: t.id, metadata: { opId: i.opId, targetId: i.id, requestedBalance: g }, timestamp: _ }, E));
      }
      i.nickname !== void 0 && i.nickname !== p.account.nickname && y.push(n.prepare("UPDATE cas_users SET nickname=?,updated_at=? WHERE jrvx_id=?").bind(i.nickname, _, i.id)), i.role !== void 0 && i.role !== Z(p.account) && y.push(n.prepare("UPDATE cas_users SET role=?,updated_at=? WHERE jrvx_id=?").bind(i.role, _, i.id)), i.profile !== void 0 && y.push(n.prepare("UPDATE cas_users SET profile_json=?,updated_at=? WHERE jrvx_id=?").bind(JSON.stringify({ ...p.account.profile, ...i.profile }), _, i.id)), i.enabled !== void 0 && i.enabled !== p.account.enabled && (y.push(n.prepare("UPDATE cas_users SET enabled=?,updated_at=? WHERE jrvx_id=?").bind(i.enabled ? 1 : 0, _, i.id)), i.enabled || (y.push(n.prepare("UPDATE cas_sessions SET revoked=1 WHERE jrvx_id=?").bind(i.id)), y.push(n.prepare("UPDATE cas_connections SET online=0 WHERE jrvx_id=?").bind(i.id))));
      try {
        await n.batch(y);
      } catch (m) {
        if (c = await mr(n, s, a), c || /wallet_balance_mismatch|admin_snapshot_mismatch/.test(String(m)) && u < 4) continue;
        throw m;
      }
    }
    let h = await T(n, i.id);
    try {
      await vi(e, i.id, h, !h.account.enabled);
    } catch {
    }
    return { type: "admin_result", action: i.type, user: wi(h), duplicate: c, atomic: i.type === "admin_update_user", softBlocked: i.type === "admin_delete_user", ...h };
  }
  throw Error("admin_retry_exhausted");
}
o(bi, "mutation");
l(bi, "mutation");
async function Si(e, t, r) {
  try {
    Fe(t);
    let n = (await T(e.DB, t)).account;
    Br(n);
    let i = String(r?.type || ""), s = Date.now();
    if (i === "admin_list_users") return { type: "admin_users", users: await _i(e.DB), serverTime: s };
    if (i === "admin_get_sessions") return { type: "admin_sessions", sessions: await hr(e.DB), rooms: await wr(e.DB), serverTime: s };
    if (i === "admin_get_ledger") return { type: "admin_ledger", entries: await mi(e.DB, r), serverTime: s };
    if (i === "admin_get_audit") return { type: "admin_audit", entries: await yi(e.DB, r), serverTime: s };
    if (i === "admin_get_dashboard") {
      let [a, c, u] = await Promise.all([wr(e.DB), hr(e.DB), e.DB.prepare("SELECT (SELECT COUNT(*) FROM cas_users) AS accounts,(SELECT COUNT(*) FROM cas_transactions) AS transactions,(SELECT COUNT(*) FROM cas_audit_log) AS auditEntries").bind().first()]);
      return { type: "admin_dashboard", dashboard: { ...u, version: "3.0.17", serverTime: s, online: c.length, connections: c.length, rooms: a.length, publicRooms: a.filter((d) => d.mode !== "friend" && d.private !== true).length, pokerPlayers: a.reduce((d, p) => d + (Number(p.seated) || 0), 0), spectators: c.filter((d) => d.spectating).length }, rooms: a, sessions: c, serverTime: s };
    }
    return i === "admin_rename_player" || i === "admin_create_user" ? { type: "admin_error", message: "JRVX ID \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442\u0441\u044F Identity. \u041F\u0440\u043E\u0444\u0438\u043B\u044C CAS \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0432\u0445\u043E\u0434\u0430; ID \u0438\u0437\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0432 JRVX ID." } : await bi(e, n, r);
  } catch (n) {
    let i = mgErrorCode(n);
    return { type: "admin_error", message: i.startsWith("invalid_") || i.startsWith("admin_") || i === "founder_protected" || i === "cas_user_not_found" || i==='balance_limit' ? i : "server_error" };
  }
}
o(Si, "handleAdmin");
l(Si, "handleAdmin");
var Oe = /^JRVX-[A-Z]{4}\d{8}$/, Et = "jrvx-cas-online", ya = "v3.0.17", ki = "v3.0.17", ga = 1e4, lt = l((e, t = 200) => new Response(JSON.stringify(e), { status: t, headers: { "content-type": "application/json", "cache-control": "no-store" } }), "json");
async function pe(e) {
  return (await e.prepare("SELECT summary_json FROM cas_poker_rooms WHERE closed=0 ORDER BY updated_at DESC LIMIT 200").all()).results.map((r) => JSON.parse(r.summary_json)).filter((r) => r.mode === "online").map(({ players: r, ...n }) => n);
}
o(pe, "publicRooms");
l(pe, "publicRooms");
var Ea = class extends fa {
  static {
    o(this, "CasSessionBase");
  }
  static {
    l(this, "CasSession");
  }
  constructor(e, t) {
    super(e, t), this.ctx = e, this.env = t, this.queue = Promise.resolve();
  }
  serial(e) {
    let t = this.queue.then(e);
    return this.queue = t.catch(() => {
    }), t;
  }
  async rate() {
    return this.serial(async () => {
      let e = await this.ctx.storage.get("rate") || { since: Date.now(), count: 0 };
      return Date.now() - e.since >= 6e4 && (e = { since: Date.now(), count: 0 }), e.count++, await this.ctx.storage.put("rate", e), e.count <= 240;
    });
  }
  send(e, t) {
    try {
      e.send(JSON.stringify(t));
    } catch {
    }
  }
  async fetch(e) {
    return this.serial(async () => {
      if (e.headers.get("upgrade")?.toLowerCase() !== "websocket") return lt({ error: "upgrade_required" }, 426);
      let t;
      try {
        t = JSON.parse(e.headers.get("x-cas-verified-session"));
      } catch {
        return lt({ error: "unauthorized" }, 401);
      }
      if (!Oe.test(t?.id) || !t.sid || t.exp <= Date.now()) return lt({ error: "unauthorized" }, 401);
      if (this.beforeWebSocketOpen) {
        let u = await this.beforeWebSocketOpen(t);
        if (u) return u;
      }
      let r = (await this.ctx.storage.get("generation") || 0) + 1;
      await this.ctx.storage.put("generation", r);
      for (let u of this.ctx.getWebSockets()) {
        this.send(u, { type: "session_replaced" });
        try {
          u.close(4001, "Replaced by new connection");
        } catch {
        }
      }
      let n = new WebSocketPair(), i = n[0], s = n[1];
      this.ctx.acceptWebSocket(s);
      let a = Date.now(), c = Math.min(t.exp, a + ga);
      return s.serializeAttachment({ identity: t, identityToken: e.headers.get("x-cas-id-token"), generation: r, hello: false, helloDeadline: c, lastActivity: a, minute: a, count: 0, burst: a, burstCount: 0 }), await this.ctx.storage.setAlarm(c), new Response(null, { status: 101, webSocket: i });
    });
  }
  async webSocketMessage(e, t) {
    return this.serial(async () => {
      let r = e.deserializeAttachment();
      if (!r || r.generation !== await this.ctx.storage.get("generation")) return;
      if (typeof t != "string" || new TextEncoder().encode(t).length > 4096) {
        e.close(1009, "Frame too large");
        return;
      }
      let n = Date.now();
      if (!r.hello && Number(r.helloDeadline) && n > r.helloDeadline) {
        e.close(1008, "Hello timeout"), await this.disconnect(r);
        return;
      }
      if (n - r.minute >= 6e4 && (r.minute = n, r.count = 0), n - r.burst >= 1e3 && (r.burst = n, r.burstCount = 0), ++r.count > 120 || ++r.burstCount > 25) {
        this.send(e, { type: "error", message: "rate_limit" }), e.close(1008, "Rate limit");
        return;
      }
      r.lastActivity = n, e.serializeAttachment(r);
      let i;
      try {
        if (i = JSON.parse(t), !i || typeof i != "object" || Array.isArray(i) || typeof i.type != "string" || !i.type) throw Error();
      } catch {
        this.send(e, { type: "error", message: "invalid_message" });
        return;
      }
      try {
        let s = await Nr(this.env, r.identity, r.identityToken);
        if (r.identity = s, e.serializeAttachment(r), r.hello && await this.ctx.storage.setAlarm(s.exp), i.type === "hello") {
          await this.hello(e, r, i);
          return;
        }
        if (!r.hello) throw Error("hello_required");
        await this.command(e, r, i), await this.presence(r.identity);
      } catch (s) {
        let a = mgErrorCode(s), c = a==="currency_retired" ? 409 : a==="payment_unavailable" ? 503 : a==="economy_migration_required" ? 503 : /session_|identity_|cas_account_disabled/.test(a);
        this.send(e, { type: i.type?.startsWith("admin_") ? "admin_error" : i.type?.startsWith("progress_") ? "progress_error" : "poker_error", message: c ? "unauthorized" : /^[a-z_]+$/.test(a) ? a : "server_error" }), c && (e.close(4003, "Session verification failed"), await this.disconnect(r));
      }
    });
  }
  async seat(e) {
    return await this.env.DB.prepare("SELECT room_id FROM cas_poker_seats WHERE jrvx_id=?").bind(e).first();
  }
  async presence(e) {
    let t = await this.seat(e.id), r = await this.ctx.storage.get("spectating") || "";
    await this.env.DB.prepare("INSERT INTO cas_connections(jrvx_id,sid,room_id,spectating,nickname,last_seen,connected_at,online) VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(jrvx_id) DO UPDATE SET sid=excluded.sid,room_id=excluded.room_id,spectating=excluded.spectating,nickname=excluded.nickname,last_seen=excluded.last_seen,online=1").bind(e.id, e.sid, t?.room_id || "", r, e.casNickname || e.nickname, Date.now(), Date.now()).run();
  }
  async friends(e) {
    let t = await T(this.env.DB, e), r = [];
    for (let n of t.account.friends) {
      let i = await this.env.DB.prepare("SELECT u.nickname,c.last_seen,c.online FROM cas_users u LEFT JOIN cas_connections c ON c.jrvx_id=u.jrvx_id WHERE u.jrvx_id=? AND u.enabled=1").bind(n).first();
      i && r.push({ id: n, nickname: i.nickname, online: !!i.online && i.last_seen > Date.now() - 6e4 });
    }
    return r;
  }
  async wallet(e, t) {
    let r = await T(this.env.DB, t);
    return this.send(e, { type: "account_wallet", playerId: t, ...r, mg: r.wallet.MG, muraTokens: r.wallet.MG, pokerTokens: r.wallet.MG }), this.send(e, { type: "progress_state", ...r, source: "server" }), r;
  }
  async hello(e, t, r) {
    if (r.protocol !== Et || r.protocolVersion !== ya && r.protocolVersion !== "v3.0.16") throw Error("protocol_mismatch");
    let n = t.identity.id;
    await Rt(this.env.DB, n);
    let i = await T(this.env.DB, n), s = await this.seat(n);
    t.hello = true, t.helloDeadline = 0, t.lastActivity = Date.now(), e.serializeAttachment(t), await this.ctx.storage.setAlarm(t.identity.exp), await this.presence(t.identity);
    let a = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM cas_connections WHERE online=1 AND last_seen>?").bind(Date.now() - 6e4).first();
    if (this.send(e, { type: "hello_ack", protocol: Et, protocolVersion: r.protocolVersion, serverVersion: ki, serverTime: Date.now(), sessionExpiresAt: t.identity.exp, playerId: n, nickname: i.account.nickname, identityVerified: true, enabled: i.account.enabled, role: i.account.role, admin: ["ADMIN", "SUPERADMIN"].includes(i.account.role), count: a.n, rooms: await pe(this.env.DB), friends: await this.friends(n), reconnect: !!s, ...i, mg: i.wallet.MG, muraTokens: i.wallet.MG, pokerTokens: i.wallet.MG, pokerHands: i.account.pokerHands, pokerWins: i.account.pokerWins }), await this.wallet(e, n), this.send(e, { type: "friends_update", friends: await this.friends(n) }), s) {
      let u = await this.env.CAS_ROOMS.getByName(s.room_id).reconnect(n);
      this.send(e, { type: "poker_state", state: u });
    }
    let c = await this.ctx.storage.get("spectating");
    if (c) try {
      this.send(e, { type: "spectator_state", state: await this.env.CAS_ROOMS.getByName(c).watch(n) });
    } catch {
      await this.ctx.storage.delete("spectating");
    }
  }
  async command(e, t, r) {
    let n = t.identity.id, i = String(r.type || "");
    if (i === "activity") {
      let c = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM cas_connections WHERE online=1 AND last_seen>?").bind(Date.now() - 6e4).first();
      this.send(e, { type: "presence", count: c.n, rooms: await pe(this.env.DB), serverTime: Date.now(), sessionExpiresAt: t.identity.exp });
      return;
    }
    if (i.startsWith("admin_")) {
      this.send(e, await Si(this.env, n, r));
      return;
    }
    if (i === "progress_get") {
      await this.wallet(e, n);
      return;
    }
    if (r.currency !== undefined) mgCurrency(r.currency);
    if (i === "progress_event" || i === "wallet_sync_balance" || i.startsWith("mura_tokens_")) throw Error("client_economy_forbidden");
    if (i === "progress_claim_daily") {
      let c = await si(this.env.DB, n, String(r.missionId || ""));
      await this.wallet(e, n), this.send(e, { type: "progress_reward", missionId: r.missionId, ...c.reward });
      return;
    }
    if (i === "friend_add" || i === "friend_remove") {
      let c = String(r.playerId || "");
      if (!Oe.test(c) || c === n) throw Error("invalid_friend");
      if (i === "friend_add" && !await this.env.DB.prepare("SELECT jrvx_id FROM cas_users WHERE jrvx_id=? AND enabled=1").bind(c).first()) throw Error("friend_not_found");
      i === "friend_add" ? await this.env.DB.prepare("UPDATE cas_users SET friends_json=json_insert(friends_json,'$[#]',?),updated_at=? WHERE jrvx_id=? AND NOT EXISTS(SELECT 1 FROM json_each(friends_json) WHERE value=?)").bind(c, Date.now(), n, c).run() : await this.env.DB.prepare("UPDATE cas_users SET friends_json=(SELECT COALESCE(json_group_array(value),'[]') FROM json_each(friends_json) WHERE value<>?),updated_at=? WHERE jrvx_id=?").bind(c, Date.now(), n).run(), this.send(e, { type: "friends_update", friends: await this.friends(n) });
      return;
    }
    if (i === "poker_rooms") {
      this.send(e, { type: "poker_rooms", rooms: await pe(this.env.DB) });
      return;
    }
    if (i === "poker_watch" || i === "poker_unwatch") {
      let c = await this.ctx.storage.get("spectating");
      if (c) {
        try {
          await this.env.CAS_ROOMS.getByName(c).watch(n, false);
        } catch {
        }
        await this.ctx.storage.delete("spectating");
      }
      if (i === "poker_watch") {
        let u = String(r.roomId || "");
        if (!/^r-[a-f0-9-]{36}$/.test(u)) throw Error("invalid_room_id");
        let d = await this.env.CAS_ROOMS.getByName(u).watch(n);
        await this.ctx.storage.put("spectating", u), this.send(e, { type: "spectator_state", state: d });
      }
      return;
    }
    let s = await this.seat(n), a = null;
    if (i === "poker_join" || i === "poker_accept_invite") {
      if (typeof r.opId != "string" || !/^[A-Za-z0-9:_-]{1,100}$/.test(r.opId)) throw Error("invalid_operation_id");
      let c = "join:" + r.opId, u = JSON.stringify([i, r.mode || "online", r.tableId || "1-2", r.currency || "MG", r.buyIn, r.friendId || "", r.roomId || ""]), d = await this.ctx.storage.get(c);
      if (d && d.signature !== u) throw Error("action_id_conflict");
      if (d?.roomId) {
        a = await this.env.CAS_ROOMS.getByName(d.roomId).join(t.identity, Number(r.buyIn), r.opId), this.send(e, { type: "poker_state", state: a.you ? a : null, requestId: r.opId }), await this.wallet(e, n);
        return;
      }
      if (d || await this.ctx.storage.put(c, { signature: u }), s) a = await this.env.CAS_ROOMS.getByName(s.room_id).reconnect(n);
      else if (i === "poker_accept_invite") {
        let p = String(r.roomId || "");
        if (!/^r-[a-f0-9-]{36}$/.test(p)) throw Error("invalid_room_id");
        a = await this.env.CAS_ROOMS.getByName(p).join(t.identity, Number(r.buyIn), r.opId);
      } else {
        let p = String(r.tableId || "1-2"), h = String(r.currency || "MG"), f = ["friend", "jarvis"].includes(r.mode) ? r.mode : "online";
        if (!yt.some((w) => w.id === p) || !["MG"].includes(h)) throw Error("invalid_table");
        let _ = { tableId: p, currency: h, mode: f };
        if (f === "friend") {
          let w = String(r.friendId || "");
          if (!Oe.test(w) || w === n || !await this.env.DB.prepare("SELECT jrvx_id FROM cas_users WHERE jrvx_id=? AND enabled=1").bind(w).first()) throw Error("invalid_friend");
          _.allowedIds = [n, w];
          let y = d?.privateRoom || "r-" + crypto.randomUUID();
          await this.ctx.storage.put(c, { signature: u, privateRoom: y }), await this.env.CAS_ROOMS.getByName(y).configure(y, _), a = await this.env.CAS_ROOMS.getByName(y).join(t.identity, Number(r.buyIn), r.opId), await this.env.CAS_SESSIONS.getByName(w).push({ type: "poker_invite", fromId: n, fromNickname: t.identity.casNickname || t.identity.nickname, roomId: y, tableId: p, currency: h, buyIn: Number(r.buyIn), expiresAt: Date.now() + 6e4 });
        } else if (f === "jarvis") {
          let w = d?.privateRoom || "r-" + crypto.randomUUID();
          await this.ctx.storage.put(c, { signature: u, privateRoom: w }), await this.env.CAS_ROOMS.getByName(w).configure(w, _), a = await this.env.CAS_ROOMS.getByName(w).join(t.identity, Number(r.buyIn), r.opId);
        } else a = await this.env.CAS_LOBBY.getByName(`${p}:${h}`).join(t.identity, _, Number(r.buyIn), r.opId);
      }
      a?.roomId && await this.ctx.storage.put(c, { signature: u, roomId: a.roomId });
    } else if (i === "poker_leave") s && await this.env.CAS_ROOMS.getByName(s.room_id).leave(n, r.opId);
    else {
      if (!s) throw Error("not_seated");
      let c = this.env.CAS_ROOMS.getByName(s.room_id);
      if (i === "poker_start") a = await c.start(n, r.opId, r.revision);
      else if (i === "poker_action") a = await c.action(n, r);
      else if (i === "poker_rebuy") a = await c.rebuy(n, Number(r.amount), r.opId);
      else throw Error("unknown_command");
    }
    this.send(e, { type: "poker_state", state: a, requestId: r.opId || r.actionId || "" }), await this.wallet(e, n);
  }
  async push(e) {
    for (let t of this.ctx.getWebSockets()) {
      let r = t.deserializeAttachment();
      r?.hello && r.identity.exp > Date.now() && (this.send(t, e), e.type === "poker_state" && e.state?.lastResult && !e.state.active && await this.wallet(t, r.identity.id));
    }
  }
  async closeAll(e = "Session revoked") {
    let t = this.ctx.getWebSockets();
    for (let r of t) {
      let n = r.deserializeAttachment();
      try {
        r.close(4003, e);
      } catch {
      }
      n && await this.disconnect(n);
    }
  }
  async disconnect(e) {
    if (e.generation !== await this.ctx.storage.get("generation")) return;
    let t = e.identity.id;
    await this.env.DB.prepare("UPDATE cas_connections SET online=0,last_seen=? WHERE jrvx_id=? AND sid=?").bind(Date.now(), t, e.identity.sid).run();
    let r = await this.seat(t);
    r && await this.env.CAS_ROOMS.getByName(r.room_id).disconnect(t);
    let n = await this.ctx.storage.get("spectating");
    if (n) try {
      await this.env.CAS_ROOMS.getByName(n).watch(t, false);
    } catch {
    }
  }
  async webSocketClose(e) {
    return this.serial(async () => {
      let t = e.deserializeAttachment();
      t && await this.disconnect(t);
    });
  }
  async webSocketError(e) {
    return this.webSocketClose(e);
  }
  async alarm() {
    return this.serial(async () => {
      let e = Date.now(), t = 1 / 0;
      for (let r of this.ctx.getWebSockets()) {
        let n = r.deserializeAttachment();
        if (!n) {
          try {
            r.close(4003, "Session invalid");
          } catch {
          }
          continue;
        }
        if (n.identity.exp <= e) {
          try {
            r.close(4003, "Session expired");
          } catch {
          }
          await this.disconnect(n);
          continue;
        }
        if (!n.hello && Number(n.helloDeadline) && n.helloDeadline <= e) {
          try {
            r.close(1008, "Hello timeout");
          } catch {
          }
          await this.disconnect(n);
          continue;
        }
        t = Math.min(t, n.hello ? Number(n.identity.exp) : Number(n.helloDeadline) || Number(n.identity.exp));
      }
      Number.isFinite(t) && t > e && await this.ctx.storage.setAlarm(t);
    });
  }
}, x = "http:v1:lease", se = "http:v1:box", st = "http:v1:invites", jn = "http:v1:opens", Dn = "http:v1:cursor", C = "http:v1:pending", D = Object.freeze({ leaseMs: 45e3, mailboxMs: 12e4, events: 96, mailboxBytes: 65536, eventBytes: 6e4, batch: 48, responseBytes: 524288, receipts: 256, opens: 128, commandBytes: 4096 }), Se = o((e) => typeof e == "string" && /^[A-Za-z0-9:_-]{1,100}$/.test(e), "httpId"), ke = o((e) => new TextEncoder().encode(JSON.stringify(e)).length, "httpBytes"), oe = o((e, t) => `http:v1:r:${e}:${t}`, "httpReceiptKey"), S = o((e, t = 409) => Object.assign(Error(e), { httpStatus: t }), "httpFault"), va = o((e) => /^(invalid_|unknown_command$|not_seated$|protocol_mismatch$|client_economy_forbidden$|insufficient_balance$|stale_state$|action_id_conflict$|turn_expired$|.*_unavailable$|.*_required$|.*_limit$|mission_|daily_|reward_|already_|admin_|founder_protected$|friend_not_found$|invite_expired$)/.test(e), "httpDefinitive"), On = o((e) => ["activity", "progress_get", "poker_rooms", "admin_list_users", "admin_get_sessions", "admin_get_ledger", "admin_get_audit", "admin_get_dashboard"].includes(e), "httpReadOnly"), Bs = class extends Ea {
  static {
    o(this, "CasSession");
  }
  async beforeWebSocketOpen(e) {
    let t = this.httpIdentity(e);
    if (await this.ctx.storage.get(C)) {
      let n = await this.ctx.storage.get(x);
      if (n && !n.closed && n.identity.id === t.id) try {
        await this.httpReconcile(n);
      } catch {
      }
      if (await this.ctx.storage.get(C)) return lt({ error: "command_outcome_unknown", outcome: "unknown" }, 409);
    }
    await this.ctx.storage.transaction(async (n) => {
      let i = await n.get(x);
      i && !i.closed && (i.closed = "session_replaced", await n.put(x, i));
    });
  }
  async httpLimit(e) {
    return this.ctx.storage.transaction(async (t) => {
      let r = Date.now(), n = await t.get("http:v1:rate");
      if ((!n || r - n.since >= 6e4) && (n = { since: r, total: 0, open: 0, poll: 0, command: 0, close: 0 }), n.total++, n[e] = (n[e] || 0) + 1, await t.put("http:v1:rate", n), n.total > 180 || n.open > 10 || n.poll > 120 || n.command > 120 || n.close > 20) throw S("rate_limit", 429);
    });
  }
  httpIdentity(e) {
    if (!Oe.test(e?.id) || typeof e.sid != "string" || e.sid.length !== 36 || !Number.isFinite(e.exp) || e.exp <= Date.now()) throw S("unauthorized", 401);
    return { id: e.id, sid: e.sid, exp: e.exp, nickname: String(e.nickname || ""), casNickname: String(e.casNickname || ""), role: String(e.role || "USER") };
  }
  async httpGuard(e, t, { renew: r = true } = {}) {
    let n = this.httpIdentity(e), i = await this.ctx.storage.get(x);
    if (!i || i.identity.id !== n.id || i.identity.sid !== n.sid) throw S("unauthorized", 401);
    if (i.generation !== Number(t.generation) || i.connectionId !== t.connectionId || i.generation !== await this.ctx.storage.get("generation")) throw S("session_replaced");
    if (i.closed) throw S(i.closed === "session_replaced" ? "session_replaced" : i.closed === "session_revoked" ? "unauthorized" : "lease_expired", i.closed === "session_revoked" ? 401 : 409);
    if (i.expiresAt <= Date.now()) throw await this.httpExpire(i, "lease_expired"), S("lease_expired");
    return r && (i.identity = n, i.lastSeen = Date.now(), i.expiresAt = Math.min(n.exp, Date.now() + D.leaseMs), await this.ctx.storage.transaction(async (s) => {
      let a = await s.get(x);
      if (!a || a.closed || a.generation !== i.generation) throw S("session_replaced");
      a.identity = n, a.lastSeen = i.lastSeen, a.expiresAt = i.expiresAt, await s.put(x, a);
    }), await this.httpAlarm()), i;
  }
  async httpAlarm() {
    let e = await this.ctx.storage.get(x), t = e && !e.closed ? e.expiresAt : 1 / 0, r = await this.ctx.storage.get("generation");
    for (let n of this.ctx.getWebSockets()) {
      let i = n.deserializeAttachment();
      i?.generation === r && (t = Math.min(t, i.hello ? i.identity.exp : i.helloDeadline || i.identity.exp));
    }
    Number.isFinite(t) && await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, t));
  }
  async httpExpire(e, t) {
    let r = false;
    await this.ctx.storage.transaction(async (n) => {
      let i = await n.get(x);
      i && !i.closed && i.generation === e.generation && (i.closed = t, await n.put(x, i), r = true);
    }), r && await this.disconnect({ identity: e.identity, generation: e.generation });
  }
  async httpAppendTx(e, t, r) {
    let n = await e.get(se) || { generation: t.generation, seq: t.startCursor, floor: t.startCursor, events: [] };
    if (n.generation !== t.generation) throw S("session_replaced");
    let i = Date.now();
    for (let s of r) {
      if (ke(s) > D.eventBytes) throw S("response_too_large", 413);
      n.events.push({ seq: ++n.seq, message: s, at: i });
    }
    for (; n.events.length && (n.events.length > D.events || ke(n.events) > D.mailboxBytes || n.events[0].at < i - D.mailboxMs); ) n.floor = n.events.shift().seq;
    return await e.put(se, n), await e.put(Dn, n.seq), n;
  }
  async httpAppend(e, t) {
    t.length && await this.ctx.storage.transaction(async (r) => {
      let n = await r.get(x);
      !n || n.closed || n.generation !== e || n.expiresAt <= Date.now() || await this.httpAppendTx(r, n, t);
    });
  }
  httpSink(e, t) {
    let r = { identity: e.identity, generation: e.generation, hello: true };
    return { send: o((n) => t.push(JSON.parse(n)), "send"), serializeAttachment: o((n) => {
      r = n;
    }, "serializeAttachment"), deserializeAttachment: o(() => r, "deserializeAttachment") };
  }
  async httpSnapshot(e) {
    let t = e.identity.id, r = await T(this.env.DB, t), n = await this.friends(t), i = await this.seat(t), s = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM cas_connections WHERE online=1 AND last_seen>?").bind(Date.now() - 6e4).first(), a = await pe(this.env.DB), c = [{ type: "hello_ack", protocol: Et, protocolVersion: e.hello.protocolVersion, serverVersion: ki, serverTime: Date.now(), sessionExpiresAt: e.identity.exp, playerId: t, nickname: r.account.nickname, identityVerified: true, enabled: r.account.enabled, role: r.account.role, admin: ["ADMIN", "SUPERADMIN"].includes(r.account.role), count: s.n, rooms: a, friends: n, reconnect: !!i, ...r, mg: r.wallet.MG, muraTokens: r.wallet.MG, pokerTokens: r.wallet.MG, pokerHands: r.account.pokerHands, pokerWins: r.account.pokerWins }, { type: "account_wallet", playerId: t, ...r, mg: r.wallet.MG, muraTokens: r.wallet.MG, pokerTokens: r.wallet.MG }, { type: "progress_state", ...r, source: "server" }, { type: "friends_update", friends: n }, { type: "presence", count: s.n, rooms: a, serverTime: Date.now(), sessionExpiresAt: e.identity.exp }], u = i ? (await this.env.CAS_ROOMS.getByName(i.room_id).transportSnapshot(t)).state : null;
    c.push({ type: "poker_state", state: u, requestId: e.lastJoinId || "" });
    let d = await this.ctx.storage.get("spectating"), p = d ? (await this.env.CAS_ROOMS.getByName(d).transportSnapshot(t, "", "", true)).state : null;
    c.push({ type: "spectator_state", state: p });
    let h = await this.ctx.storage.get(st) || [];
    return c.push(...h.filter((f) => f.expiresAt > Date.now())), c;
  }
  async httpEnvelope(e, t, { requestId: r = "", resync: n = true } = {}) {
    if (!Number.isSafeInteger(t) || t < 0) throw S("invalid_cursor", 400);
    let i = await this.ctx.storage.get(se);
    if (!i || i.generation !== e.generation) throw S("session_replaced");
    if (t > i.seq) throw S("invalid_cursor", 400);
    let s = false;
    if (n && t < i.floor) {
      let p = await this.httpSnapshot(e);
      await this.httpAppend(e.generation, p), i = await this.ctx.storage.get(se), t = Math.max(i.floor, i.seq - p.length), s = true;
    }
    let a = i.events.filter((p) => p.seq > t).slice(0, D.batch).map(({ seq: p, message: h }) => ({ seq: p, message: h })), c = a.length ? a[a.length - 1].seq : t, u = { ok: true, connectionId: e.connectionId, generation: e.generation, cursor: c, serverCursor: i.seq, messages: a, expiresAt: e.expiresAt, serverTime: Date.now(), hasMore: c < i.seq };
    s && (u.resyncRequired = true);
    let d = await this.ctx.storage.get(C);
    if (d && (u.currentUnknownRequestId = d.requestId), r || d) {
      r = r || d.requestId;
      let p = await this.ctx.storage.get(oe(d?.requestId === r ? d.generation : e.generation, r));
      u.requestId = r, u.receipt = { requestId: r, status: p?.status || "not_found", ...p?.error ? { error: p.error } : {}, ...p?.status === "unknown" ? { outcome: "unknown" } : {} };
    }
    if (ke(u) > D.responseBytes) throw S("response_too_large", 413);
    return u;
  }
  async httpOpen(e, t) {
    return this.serial(async () => {
      let r = this.httpIdentity(e);
      if (await this.httpLimit("open"), !Se(t.connectionId) || !Se(t.openId) || t.hello?.type !== "hello" || ke(t.hello) > D.commandBytes) throw S("invalid_open", 400);
      if (t.hello.protocol !== Et || !["v3.0.17", "v3.0.16"].includes(t.hello.protocolVersion)) throw S("protocol_mismatch", 400);
      let n = await je({ connectionId: t.connectionId, hello: t.hello }), i, s = false;
      if (await this.ctx.storage.transaction(async (a) => {
        let c = (await a.get(jn) || []).filter((w) => w.until > Date.now()), u = c.find((w) => w.sid === r.sid && w.openId === t.openId), d = await a.get(x);
        if (u) {
          if (u.signature !== n) throw S("request_id_conflict");
          if (!d || d.generation !== u.generation || d.closed) throw S("session_replaced");
          if (d.expiresAt <= Date.now()) throw S("lease_expired");
          i = d;
          return;
        }
        if (c.length >= D.opens) throw S("open_capacity");
        let p = (await a.get("generation") || 0) + 1, h = await a.get(Dn) || 0, f = await a.get(C), _ = (d?.receiptIds || []).filter((w) => !(f && f.generation === d.generation && f.requestId === w));
        for (let w = 0; w < _.length; w += 128) await a.delete(_.slice(w, w + 128).map((y) => oe(d.generation, y)));
        i = { version: 1, identity: r, connectionId: t.connectionId, openId: t.openId, signature: n, generation: p, startCursor: h, hello: t.hello, opening: true, createdAt: Date.now(), lastSeen: Date.now(), expiresAt: Math.min(r.exp, Date.now() + D.leaseMs), receiptIds: [], pending: f || null }, c.push({ sid: r.sid, openId: t.openId, signature: n, generation: p, until: r.exp }), await a.put("generation", p), await a.put(x, i), await a.put(jn, c), await a.put(se, { generation: p, seq: h, floor: h, events: [] }), s = true;
      }), s) for (let a of this.ctx.getWebSockets()) {
        this.send(a, { type: "session_replaced" });
        try {
          a.close(4001, "Replaced by HTTP connection");
        } catch {
        }
      }
      if (i.opening) {
        let a = [], c = this.httpSink(i, a), u = c.deserializeAttachment();
        await this.hello(c, u, t.hello), await this.ctx.storage.transaction(async (d) => {
          let p = await d.get(x);
          if (!p || p.closed || p.generation !== i.generation) throw S("session_replaced");
          let h = await d.get(st) || [];
          a.push(...h.filter((f) => f.expiresAt > Date.now())), p.opening = false, await this.httpAppendTx(d, p, a), await d.put(x, p), i = p;
        });
      }
      return await this.httpReconcile(i), await this.httpAlarm(), this.httpEnvelope(i, i.startCursor);
    });
  }
  async httpFinish(e, t, r) {
    await this.ctx.storage.transaction(async (n) => {
      let i = await n.get(x);
      if (!i || i.closed || i.generation !== e.generation) throw S("session_replaced");
      let s = t.generation || e.generation;
      t.completedAt = Date.now(), t.generation = i.generation, delete t.command, r.push({ type: "transport_receipt", requestId: t.requestId, status: t.status, ...t.error ? { error: t.error } : {}, ...t.status === "unknown" ? { outcome: "unknown" } : {} }), await this.httpAppendTx(n, i, r), await n.put(oe(i.generation, t.requestId), t), i.receiptIds.includes(t.requestId) || i.receiptIds.push(t.requestId), s !== i.generation && await n.delete(oe(s, t.requestId));
      let a = await n.get(C);
      t.status !== "unknown" ? (i.pending = null, a?.requestId === t.requestId && a.generation === s && await n.delete(C)) : a?.requestId === t.requestId && (a.generation = i.generation, await n.put(C, a), i.pending = a), ["poker_join", "poker_accept_invite"].includes(t.commandType) && t.status === "complete" && (i.lastJoinId = t.operationId), await n.put(x, i);
    });
  }
  async httpReconcile(e) {
    let t = await this.ctx.storage.get(C);
    if (!t) return;
    if (t.identityId !== e.identity.id) throw S("unauthorized", 401);
    let r = await this.ctx.storage.get(oe(t.generation, t.requestId));
    if (!r || !["pending", "unknown"].includes(r.status)) return;
    let n = t.command, i = n.type, s = [], a = false;
    if (i === "progress_claim_daily") {
      let c = { eventType: "daily_reward", missionId: String(n.missionId || ""), history: { date: t.day, missionId: String(n.missionId || "") }, events: [] }, u = await ht(this.env.DB, `daily:${e.identity.id}:${t.day}:${n.missionId}`, e.identity.id, await je(c));
      u && (a = true, s.push({ type: "progress_reward", missionId: n.missionId, ...u.reward }));
    } else if (/^poker_(join|accept_invite|start|action|rebuy|leave)$/.test(i)) {
      let c = await this.seat(e.identity.id), u = t.roomId || c?.room_id, d = n.actionId || n.opId, p = "";
      if (i === "poker_join" || i === "poker_accept_invite" ? p = JSON.stringify(["join", Number(n.buyIn)]) : i === "poker_start" ? p = JSON.stringify(["start", n.revision]) : i === "poker_action" ? p = JSON.stringify([n.action, n.amount ?? null, n.handNo, n.revision]) : i === "poker_rebuy" ? p = JSON.stringify(["rebuy", Number(n.amount)]) : p = "leave", u && Se(d)) {
        let h = await this.env.CAS_ROOMS.getByName(u).transportSnapshot(e.identity.id, d, p);
        h.committed && (a = true, s.push({ type: "poker_state", state: h.state, requestId: d }));
      }
    }
    if (a) {
      let c = this.httpSink(e, s);
      await this.wallet(c, e.identity.id), r.status = "complete", delete r.error, await this.httpFinish(e, r, s), e.pending = null;
      return;
    }
    r.status !== "unknown" && (r.status = "unknown", r.error = "manual_reconciliation_required", await this.httpFinish(e, r, []));
  }
  async httpCommand(e, t) {
    return this.serial(async () => {
      await this.httpLimit("command");
      let r = await this.httpGuard(e, t);
      if (!Se(t.requestId) || !t.command || typeof t.command != "object" || Array.isArray(t.command) || typeof t.command.type != "string" || !t.command.type || t.command.type === "hello" || ke(t.command) > D.commandBytes) throw S("invalid_command", 400);
      let n = t.after === void 0 ? r.startCursor : t.after;
      if (!Number.isSafeInteger(n) || n < 0) throw S("invalid_cursor", 400);
      let i = await this.ctx.storage.get(se);
      if (!i || i.generation !== r.generation) throw S("session_replaced");
      if (n > i.seq) throw S("invalid_cursor", 400);
      let s = await je(t.command), a = oe(r.generation, t.requestId), c = await this.ctx.storage.get(a);
      if (c) {
        if (c.signature !== s) throw S("request_id_conflict");
        return await this.httpReconcile(r), this.httpEnvelope(r, n, { requestId: t.requestId });
      }
      let u = await this.ctx.storage.get(C);
      if (u) return { ...await this.httpEnvelope(r, n, { requestId: u.requestId }), ok: false, error: "command_outcome_unknown", httpStatus: 409 };
      if (r.receiptIds.length >= D.receipts) throw S("receipt_capacity");
      let d = t.command, p = await this.seat(r.identity.id), h = { requestId: t.requestId, generation: r.generation, signature: s, status: "pending", startedAt: Date.now(), commandType: d.type, operationId: String(d.actionId || d.opId || "") }, f = { requestId: t.requestId, generation: r.generation, identityId: r.identity.id, signature: s, command: d, roomId: p?.room_id || "", day: Q(), startedAt: Date.now() };
      await this.ctx.storage.transaction(async (m) => {
        let g = await m.get(x);
        if (!g || g.closed || g.generation !== r.generation) throw S("session_replaced");
        if (await m.get(C)) throw S("command_outcome_unknown");
        g.pending = f, g.receiptIds.push(t.requestId), await m.put(C, f), await m.put(a, h), await m.put(x, g);
      }), r.pending = f;
      let _ = [], w = this.httpSink(r, _), y = w.deserializeAttachment();
      try {
        if (await this.command(w, y, d), !On(d.type) && _.some((m) => m.type === "admin_error" && m.message === "server_error")) throw Error("dispatch_outcome_unknown");
        h.status = "complete", await this.httpFinish(r, h, _), r.pending = null;
        try {
          await this.presence(r.identity);
        } catch {
        }
      } catch (m) {
        let g = mgErrorCode(m);
        if (m?.httpStatus) throw m;
        h.status = va(g) || On(d.type) ? "failed" : "unknown", h.error = h.status === "unknown" ? "manual_reconciliation_required" : /^[a-z_]+$/.test(g) ? g : "server_error", h.status === "failed" && _.push({ type: d.type.startsWith("admin_") ? "admin_error" : d.type.startsWith("progress_") ? "progress_error" : "poker_error", message: g }), await this.httpFinish(r, h, _), h.status === "unknown" && await this.httpReconcile(r);
      }
      return await this.httpAlarm(), this.httpEnvelope(r, n, { requestId: t.requestId });
    });
  }
  async httpPoll(e, t) {
    return this.serial(async () => {
      await this.httpLimit("poll");
      let r = await this.httpGuard(e, t);
      if (r.opening) throw S("hello_required");
      if (t.requestId && !Se(t.requestId)) throw S("invalid_request_id", 400);
      await this.httpReconcile(r);
      try {
        await this.presence(r.identity);
      } catch {
      }
      return this.httpEnvelope(r, Number(t.after), { requestId: t.requestId || "" });
    });
  }
  async httpClose(e, t) {
    return this.serial(async () => {
      await this.httpLimit("close");
      let r = await this.httpGuard(e, t, { renew: false });
      return await this.httpExpire(r, "lease_closed"), { ok: true, connectionId: r.connectionId, generation: r.generation, closed: true, serverTime: Date.now() };
    });
  }
  async push(e) {
    e?.type === "poker_invite" && await this.ctx.storage.transaction(async (n) => {
      let i = (await n.get(st) || []).filter((s) => s.expiresAt > Date.now() && s.roomId !== e.roomId);
      e.expiresAt > Date.now() && i.push(e), await n.put(st, i.slice(-32));
    }), await super.push(e);
    let t = await this.ctx.storage.get(x);
    if (!t || t.closed || t.opening || t.expiresAt <= Date.now() || t.generation !== await this.ctx.storage.get("generation")) return;
    let r = [e];
    if (e.type === "poker_state" && e.state?.lastResult && !e.state.active) try {
      await this.wallet(this.httpSink(t, r), t.identity.id);
    } catch {
    }
    await this.httpAppend(t.generation, r);
  }
  async closeAll(e = "Session revoked") {
    let t = await this.ctx.storage.get(x);
    return t && !t.closed && await this.httpExpire(t, "session_revoked"), super.closeAll(e);
  }
  async alarm() {
    await this.serial(async () => {
      let e = await this.ctx.storage.get(x);
      e && !e.closed && e.expiresAt <= Date.now() && await this.httpExpire(e, "lease_expired");
    }), await super.alarm(), await this.httpAlarm();
  }
}, F = l((e) => JSON.parse(JSON.stringify(e)), "copy"), ce = l((e) => {
  if (typeof e != "string" || !/^[A-Za-z0-9:_-]{1,100}$/.test(e)) throw Error("invalid_operation_id");
  return e;
}, "validOp"), ba = l((e) => {
  if (typeof e != "string" || !/^[A-Za-z0-9:_-]{1,120}$/.test(e)) throw Error("invalid_room_id");
  return e;
}, "roomId"), Ws = class extends xi {
  static {
    o(this, "PokerRoom");
  }
  static {
    l(this, "PokerRoom");
  }
  constructor(e, t) {
    super(e, t), this.ctx = e, this.env = t, this.sql = e.storage.sql, this.sql.exec("CREATE TABLE IF NOT EXISTS state(k TEXT PRIMARY KEY,v TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts(user_id TEXT NOT NULL,op_id TEXT NOT NULL,signature TEXT NOT NULL,PRIMARY KEY(user_id,op_id))"), this.queue = Promise.resolve();
  }
  serial(e) {
    let t = this.queue.then(e);
    return this.queue = t.catch(() => {
    }), t;
  }
  load(e) {
    let t = this.sql.exec("SELECT v FROM state WHERE k=?", e).toArray()[0];
    const value=t ? JSON.parse(t.v) : null; if(e==="room" && value?.currency) mgCurrency(value.currency); return value;
  }
  put(e, t) {
    this.sql.exec("INSERT OR REPLACE INTO state(k,v) VALUES(?,?)", e, JSON.stringify(t));
  }
  deadline(e) {
    if (e?.closed) return null;
    let t = [e?.emptyDeadline, e?.turnDeadline, e?.nextHandAt, e?.botTurnAt, ...(e?.players || []).map((r) => r?.disconnectDeadline)].filter((r) => r > 0);
    return t.length ? Math.min(...t) : null;
  }
  async save(e) {
    await this.ctx.storage.transaction(async () => {
      this.put("room", e);
      let t = this.deadline(e);
      t ? await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, t)) : await this.ctx.storage.deleteAlarm();
    });
  }
  async configure(e, t) {
    return this.serial(async () => {
      await this.recover();
      let r = this.load("room");
      return r || (r = li(ba(e), t), r.emptyDeadline = Date.now() + 6e4, await this.save(r), await this.index(r)), dt(r);
    });
  }
  async index(e) {
    await this.env.DB.prepare("INSERT INTO cas_poker_rooms(room_id,summary_json,closed,updated_at) VALUES(?,?,?,?) ON CONFLICT(room_id) DO UPDATE SET summary_json=excluded.summary_json,closed=excluded.closed,updated_at=excluded.updated_at").bind(e.id, JSON.stringify({ ...dt(e), players: e.players.filter(Boolean).map((t) => ({ id: t.id, nickname: t.nickname, stack: t.stack, connected: t.connected, disconnectDeadline: t.disconnectDeadline })), pot: e.pot, turnSeat: e.turnSeat, turnDeadline: e.turnDeadline, createdAt: e.createdAt }), e.closed ? 1 : 0, Date.now()).run();
  }
  receipt(e, t, r) {
    let n = this.sql.exec("SELECT signature FROM receipts WHERE user_id=? AND op_id=?", e, t).toArray()[0];
    if (n && n.signature !== r) throw Error("action_id_conflict");
    return !!n;
  }
  progress(e, t) {
    return t ? e.players.filter((r) => r && r.id !== e.botId).map((r) => ({ id: r.id, eventId: `poker:${e.id}:${e.handNo}:${r.id}`, events: [{ event: "poker_hand", data: { bet: r.contribution, profit: (t.awards[r.id] || 0) - r.contribution } }, ...t.type === "showdown" ? [{ event: "poker_showdown", data: {} }] : [], ...t.winners.includes(r.id) && t.winners.length === 1 ? [{ event: "poker_win", data: { pot: t.pot, win: Math.max(0, (t.awards[r.id] || 0) - r.contribution) } }] : []], history: { roomId: e.id, handNo: e.handNo, currency: e.currency, pot: t.pot, result: t, profit: (t.awards[r.id] || 0) - r.contribution } })) : [];
  }
  async plan(e, { user: t, op: r, signature: n, finance: i = null, progress: s = [] } = {}) {
    e.botId && (e.botTurnAt = e.active && e.players[e.turnSeat]?.id === e.botId ? Date.now() + 650 : 0), Ot(e);
    let a = { next: e, user: t, op: r, signature: n, finance: i, progress: s };
    return await this.ctx.storage.transaction(async () => {
      this.put("plan", a), await this.ctx.storage.setAlarm(Date.now() + 1e3);
    }), await this.recover(), O(this.load("room"), t);
  }
  async recover() {
    let e = this.load("plan");
    if (e) try {
      if (e.finance) {
        let t = e.finance, r = e.next, n = t.kind === "buyin" ? [this.env.DB.prepare("INSERT INTO cas_poker_seats(jrvx_id,room_id,currency,joined_at) VALUES(?,?,?,?)").bind(t.id, r.id, r.currency, Date.now())] : t.kind === "cashout" ? [this.env.DB.prepare("DELETE FROM cas_poker_seats WHERE jrvx_id=? AND room_id=?").bind(t.id, r.id)] : [];
        await Pn(this.env.DB, { transactionId: t.txId, jrvxId: t.id, currency: r.currency, amount: t.amount, operationType: "poker_" + t.kind, source: "poker-room", metadata: { roomId: r.id, handNo: r.handNo } }, n);
      }
      for (let t of e.progress) await ai(this.env.DB, t.id, t.eventId, t.events, t.history);
      await this.index(e.next), await this.ctx.storage.transaction(async () => {
        this.put("room", e.next), e.op && this.sql.exec("INSERT OR IGNORE INTO receipts(user_id,op_id,signature) VALUES(?,?,?)", e.user, e.op, e.signature), this.sql.exec("DELETE FROM state WHERE k='plan'");
        let t = this.deadline(e.next);
        t ? await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, t)) : await this.ctx.storage.deleteAlarm();
      }), this.notify(e.next, e.finance?.kind === "cashout" ? e.finance.id : null);
    } catch (t) {
      if (e.finance && ["buyin", "rebuy"].includes(e.finance.kind) && /insufficient_balance|cas_account_disabled|balance_limit|exposure_limit|UNIQUE constraint failed: cas_poker_seats/.test(String(t)) && !await this.env.DB.prepare("SELECT transaction_id FROM cas_transactions WHERE transaction_id=?").bind(e.finance.txId).first()) {
        this.sql.exec("DELETE FROM state WHERE k='plan'");
        let n = this.load("room");
        throw n && await this.save(n), t;
      }
      throw await this.ctx.storage.setAlarm(Date.now() + 2e3), t;
    }
  }
  notify(e, t = null) {
    let r = [];
    for (let n of e.players.filter((i) => i && i.id !== e.botId)) r.push(this.env.CAS_SESSIONS.getByName(n.id).push({ type: "poker_state", state: O(e, n.id) }));
    for (let n of e.watchers) r.push(this.env.CAS_SESSIONS.getByName(n).push({ type: "spectator_state", state: O(e) }));
    t && r.push(this.env.CAS_SESSIONS.getByName(t).push({ type: "poker_state", state: null, roomId: e.id })), !e.closed && e.mode === "online" && e.players.filter(Boolean).length === 1 && r.push(this.env.CAS_LOBBY.getByName(`${e.table.id}:${e.currency}`).offer(e.id)), this.ctx.waitUntil(Promise.allSettled(r));
  }
  async join(e, t, r) {
    return this.serial(async () => {
      await this.recover();
      let n = this.load("room");
      if (!n) throw Error("room_not_found");
      let i = ce(r), s = JSON.stringify(["join", t]);
      if (this.receipt(e.id, i, s)) return O(n, e.id);
      if (j(n, e.id) >= 0) return this.attachInternal(n, e.id);
      if (n.mode === "friend" && Date.now() > n.createdAt + 6e4) throw Error("invite_expired");
      let a = F(n);
      return a.emptyDeadline = 0, lr(a, { id: e.id, nickname: e.casNickname || e.nickname }, t), n.mode === "jarvis" && (a.botId = "bot-" + n.id, lr(a, { id: a.botId, nickname: "JRVX" }, t), a.houseBuyIn = t), this.plan(a, { user: e.id, op: i, signature: s, finance: { kind: "buyin", id: e.id, amount: -t, txId: `poker:${n.id}:${e.id}:${i}:buyin` } });
    });
  }
  async attachInternal(e, t) {
    let r = j(e, t);
    if (r < 0) return null;
    let n = e.players[r];
    return (!n.connected || n.disconnectDeadline) && (n.connected = true, n.disconnectDeadline = 0, e.revision++, await this.save(e), await this.index(e), this.notify(e)), O(e, t);
  }
  async reconnect(e) {
    return this.serial(async () => {
      await this.recover();
      let t = this.load("room");
      return t ? this.attachInternal(t, e) : null;
    });
  }
  async disconnect(e) {
    return this.serial(async () => {
      await this.recover();
      let t = this.load("room"), r = t ? j(t, e) : -1;
      if (r < 0) return;
      let n = t.players[r];
      n.connected && (n.connected = false, n.disconnectDeadline = Date.now() + 3e4, t.revision++, await this.save(t), await this.index(t), this.notify(t));
    });
  }
  async action(e, t) {
    return this.serial(async () => {
      await this.recover();
      let r = this.load("room");
      if (!r) throw Error("room_not_found");
      let n = ce(t.actionId || t.opId), i = JSON.stringify([t.action, t.amount ?? null, t.handNo, t.revision]);
      if (this.receipt(e, n, i)) return O(r, e);
      if (r.active && r.turnDeadline <= Date.now()) throw Error("turn_expired");
      let s = F(r), a = Re(s, e, t);
      return this.plan(s, { user: e, op: n, signature: i, progress: this.progress(s, a) });
    });
  }
  async start(e, t, r) {
    return this.serial(async () => {
      await this.recover();
      let n = this.load("room"), i = ce(t), s = JSON.stringify(["start", r]);
      if (this.receipt(e, i, s)) return O(n, e);
      if (j(n, e) < 0) throw Error("not_seated");
      if (r !== n.revision) throw Error("stale_state");
      let a = F(n);
      return pr(a), this.plan(a, { user: e, op: i, signature: s });
    });
  }
  async rebuy(e, t, r) {
    return this.serial(async () => {
      await this.recover();
      let n = this.load("room"), i = ce(r), s = JSON.stringify(["rebuy", t]);
      if (this.receipt(e, i, s)) return O(n, e);
      let a = j(n, e);
      if (a < 0 || n.active) throw Error("rebuy_unavailable");
      if (!Number.isSafeInteger(t) || t <= 0 || t > 1e9 || n.pot + n.players.reduce((u, d) => u + (d?.stack || 0), 0) + t > 1e9) throw Error("invalid_buyin");
      let c = F(n);
      return c.players[a].stack += t, c.revision++, this.plan(c, { user: e, op: i, signature: s, finance: { kind: "rebuy", id: e, amount: -t, txId: `poker:${n.id}:${e}:${i}:rebuy` } });
    });
  }
  async leaveInternal(e, t) {
    let r = this.load("room");
    if (!r || j(r, e) < 0) return null;
    let n = "leave";
    if (this.receipt(e, t, n)) return null;
    let i = F(r), s = null;
    if (i.active) {
      let u = j(i, e);
      i.players[u].folded = true, i.turnSeat = u, s = Re(i, e, { action: "fold", handNo: i.handNo, revision: i.revision });
    }
    let a = this.progress(i, s), c = fr(i, e);
    return i.botId && fr(i, i.botId), await this.plan(i, { user: e, op: t, signature: n, finance: { kind: "cashout", id: e, amount: c.cashout, txId: `poker:${r.id}:${e}:${t}:cashout` }, progress: a }), null;
  }
  async leave(e, t) {
    return this.serial(async () => (await this.recover(), this.leaveInternal(e, ce(t))));
  }
  async watch(e, t = true) {
    return this.serial(async () => {
      await this.recover();
      let r = this.load("room");
      if (!r || r.mode !== "online" || r.closed) throw Error("table_unavailable");
      if (r.watchers = r.watchers.filter((n) => n !== e), t) {
        if (r.watchers.length >= 100) throw Error("spectator_limit");
        r.watchers.push(e);
      }
      return await this.save(r), await this.index(r), t ? O(r) : null;
    });
  }
  async transportSnapshot(e, t = "", r = "", n = false) {
    return this.serial(async () => {
      let i = this.load("room");
      if (!i) return { state: null, committed: false };
      if (!Oe.test(e)) throw Error("invalid_player_id");
      let s = t ? this.sql.exec("SELECT signature FROM receipts WHERE user_id=? AND op_id=?", e, t).toArray()[0] : null;
      if (s && s.signature !== r) throw Error("action_id_conflict");
      let a = j(i, e) >= 0, c = n && i.mode === "online" && i.watchers.includes(e) && !i.closed;
      return { state: a ? O(i, e) : c ? O(i) : null, committed: !!s };
    });
  }
  async inspect() {
    return this.serial(async () => {
      await this.recover();
      let e = this.load("room");
      return e ? dt(e) : null;
    });
  }
  async alarm() {
    return this.serial(async () => {
      await this.recover();
      let e = this.load("room");
      if (!(!e || e.closed)) {
        if (e.players.every((t) => !t) && e.emptyDeadline && e.emptyDeadline <= Date.now()) {
          e.closed = true, e.emptyDeadline = 0, e.revision++, await this.plan(e);
          return;
        }
        for (let t of e.players.filter(Boolean)) !t.connected && t.disconnectDeadline && t.disconnectDeadline <= Date.now() && await this.leaveInternal(t.id, `timeout-${t.disconnectDeadline}`);
        if (e = this.load("room"), e.active && e.botId && e.players[e.turnSeat]?.id === e.botId && e.botTurnAt <= Date.now()) {
          let t = F(e), r = t.players[t.turnSeat], n = Re(t, r.id, { action: Math.max(0, t.currentBet - r.bet) ? "call" : "check", handNo: t.handNo, revision: t.revision });
          await this.plan(t, { progress: this.progress(t, n) });
        } else if (e.active && e.turnDeadline <= Date.now()) {
          let t = e.players[e.turnSeat], r = `turn-${e.handNo}-${e.revision}`, n = F(e), i = Re(n, t.id, { action: Math.max(0, e.currentBet - t.bet) ? "fold" : "check", handNo: e.handNo, revision: e.revision });
          await this.plan(n, { user: t.id, op: r, signature: "timeout", progress: this.progress(n, i) });
        } else if (!e.active && e.nextHandAt && e.nextHandAt <= Date.now()) {
          let t = F(e);
          if (t.nextHandAt = 0, t.botId) {
            let r = t.players.find((n) => n?.id === t.botId);
            r && r.stack < t.table.bb && (r.stack = Math.max(0, Math.min(t.houseBuyIn, 1e9 - t.players.filter((n) => n && n.id !== t.botId).reduce((n, i) => n + i.stack, 0))));
          }
          Tt(t) ? pr(t) : t.revision++, await this.plan(t);
        } else await this.save(e);
      }
    });
  }
}, Us = class extends xi {
  static {
    o(this, "PokerLobby");
  }
  static {
    l(this, "PokerLobby");
  }
  constructor(e, t) {
    super(e, t), this.ctx = e, this.env = t, this.queue = Promise.resolve();
  }
  async offer(e) {
    let t = this.queue.then(async () => {
      let r = await this.ctx.storage.get("waiting") || [];
      r.includes(e) || await this.ctx.storage.put("waiting", [...r, e]);
    });
    return this.queue = t.catch(() => {
    }), t;
  }
  async join(e, t, r, n) {
    let i = this.queue.then(async () => {
      let s = `join:${e.id}:${ce(n)}`, a = JSON.stringify([t, r]), c = await this.ctx.storage.get(s);
      if (c) {
        if (c.signature !== a) throw Error("action_id_conflict");
        return this.env.CAS_ROOMS.getByName(c.target).join(e, r, n);
      }
      let u = await this.ctx.storage.get("waiting") || [], d = [], p = "";
      for (let f of u) {
        let _ = await this.env.CAS_ROOMS.getByName(f).inspect();
        _ && !_.closed && _.seated < 2 && (p || (p = f), d.push(f));
      }
      p || (p = "r-" + crypto.randomUUID(), await this.env.CAS_ROOMS.getByName(p).configure(p, t), d.push(p)), await this.ctx.storage.put("waiting", d), await this.ctx.storage.put(s, { target: p, signature: a });
      let h = await this.env.CAS_ROOMS.getByName(p).join(e, r, n);
      return h.seats.every(Boolean) && await this.ctx.storage.put("waiting", d.filter((f) => f !== p)), h;
    });
    return this.queue = i.catch(() => {
    }), i;
  }
}, Sa = "3.0.17", v = l((e, t = 200, r = {}) => new Response(JSON.stringify(e), { status: t, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...r } }), "json");
async function Cn(e, t) {
  let r = new URL(t.url).pathname;
  if (t.method !== "GET" || r !== "/" && r !== "/index.html" || e.status !== 200 || !/^text\/html(?:;|$)/i.test(e.headers.get("content-type") || "")) return e;
  let n = await e.clone().text(), i = '<script data-jrvx-module="startup-guard" src="assets/startup-recovery-v317.js"><\/script>', s = "#jrvxStartupRecovery[hidden]{display:none!important}";
  if (n.split(i).length !== 2 || n.split(s).length !== 2) return e;
  let a = n.replace(i, `<script data-jrvx-module="startup-guard">
/* Runs before styles and the application bundles, including on older Safari. */
(function () {
  'use strict';
  var ready = false, failure = null, failureSource = '', deadline = 25000, timer, releasedStyles = 0;

  function stylesheetLoaded(event) {
    var target = event.target || event.srcElement;
    if (target && target.tagName === 'LINK' && target.getAttribute('rel') === 'stylesheet') target.setAttribute('data-jrvx-style-loaded', 'true');
  }

  function releaseStalledStyles() {
    // Pending stylesheet requests suppress painting even of the inline shell.
    // After terminal failure, remove only unfinished application stylesheets.
    // A manual reload is required; missing styles must never become a ready app.
    var links = document.querySelectorAll('link[rel=stylesheet]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (!link.sheet && link.getAttribute('data-jrvx-style-loaded') !== 'true' && applicationURL(link.getAttribute('href')) && link.parentNode) {
        link.parentNode.removeChild(link);
        releasedStyles++;
      }
    }
  }

  function applicationURL(source) {
    if (!source) return false;
    if (/^(?:\\.\\/|\\/)?(?:assets|modules)\\//.test(source)) return true;
    var origin = window.location.origin;
    return !!origin && (source.indexOf(origin + '/assets/') === 0 || source.indexOf(origin + '/modules/') === 0);
  }

  function reloadFresh() {
    var retry = document.getElementById('jrvxStartupRetry'), tasks = [], reloaded = false;
    function reload() { if (!reloaded) { reloaded = true; window.location.reload(); } }
    if (retry) { retry.disabled = true; retry.textContent = '\u041F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026'; }
    // A partial deployment can mix a new document with an older cached shell.
    // Only CAS application shell caches and its root service worker are reset.
    // Identity cookies, browser storage, profiles and server game state are kept.
    if (typeof window.Promise !== 'function') return reload();
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(navigator.serviceWorker.getRegistrations().then(function (registrations) {
          return Promise.all(registrations.map(function (registration) {
            var worker = registration.active || registration.waiting || registration.installing;
            var source = worker && worker.scriptURL.split('?')[0], origin = window.location.origin;
            if (registration.scope === origin + '/' && (source === origin + '/service-worker.js' || source === origin + '/sw.js')) return registration.unregister();
          }));
        }));
      }
      if (window.caches && window.caches.keys) {
        tasks.push(window.caches.keys().then(function (keys) {
          return Promise.all(keys.filter(function (key) { return /^jrvx-cas-.*-shell$/.test(key); }).map(function (key) { return window.caches.delete(key); }));
        }));
      }
    } catch (_) {}
    setTimeout(reload, 4000);
    Promise.all(tasks).then(reload, reload);
  }

  function recovery() {
    var panel = document.getElementById('jrvxStartupRecovery');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'jrvxStartupRecovery';
      panel.setAttribute('role', 'alert');
      panel.innerHTML = '<div class="jrvxStartupCard"><strong>JRVX CAS</strong><h1 id="jrvxStartupTitle"></h1><p id="jrvxStartupMessage"></p><button id="jrvxStartupRetry" type="button">\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443</button></div>';
      (document.body || document.documentElement).appendChild(panel);
      document.getElementById('jrvxStartupRetry').onclick = reloadFresh;
    }
    return panel;
  }

  function show() {
    if (!failure || ready) return;
    var panel = recovery();
    panel.setAttribute('data-failed-resource', failureSource);
    document.getElementById('jrvxStartupTitle').textContent = failure === 'timeout' ? '\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438' : '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C JRVX CAS';
    document.getElementById('jrvxStartupMessage').textContent = navigator.onLine === false ? '\u041D\u0435\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0441 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u043E\u043C. \u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443.' : failure === 'runtime' ? '\u0412\u043E \u0432\u0440\u0435\u043C\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0432\u043E\u0437\u043D\u0438\u043A\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.' : failure === 'timeout' ? '\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0430\u0439\u0442\u0430 \u043F\u0440\u0435\u0432\u044B\u0441\u0438\u043B\u043E 25 \u0441\u0435\u043A\u0443\u043D\u0434. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443.' : '\u0427\u0430\u0441\u0442\u044C \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0430\u0439\u0442\u0430 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.';
    document.getElementById('jrvxStartupRetry').hidden = false;
    panel.hidden = false;
  }

  function fail(reason) {
    if (ready) return;
    if (reason === 'timeout') releaseStalledStyles();
    if (!failure || failure === 'timeout') failure = reason;
    show();
  }

  function resourceError(event) {
    var target = event.target || event.srcElement, tag = target && target.tagName;
    if (tag === 'SCRIPT' && applicationURL(target.getAttribute('src')) || tag === 'LINK' && target.getAttribute('rel') === 'stylesheet' && applicationURL(target.getAttribute('href'))) {
      failureSource = target.getAttribute('src') || target.getAttribute('href') || '';
      if (window.console && window.console.warn) window.console.warn('[JRVX startup] Failed resource: ' + (target.getAttribute('src') || target.getAttribute('href')));
      fail('resource');
    } else if (applicationURL(event.filename) && /\\.js(?:[?#]|$)/.test(event.filename)) {
      failureSource = event.filename;
      if (window.console && window.console.warn) window.console.warn('[JRVX startup] Interface error: ' + event.filename);
      // Syntax errors in a downloaded bundle do not fire the script's error event.
      fail('runtime');
    }
  }

  function finish() {
    // Poker queues its own zero-delay boot from DOMContentLoaded. Our earlier
    // listener must wait for that queued work rather than fail before it runs.
    function checkShell() {
      if (failure && (failure !== 'timeout' || releasedStyles > 0)) return show();
      if (!window.JRVXLegacyRuntimeV312 || !window.Poker59 || !document.getElementById('v69Home')) {
        if (failure === 'timeout') return show();
        return setTimeout(checkShell, 50);
      }
      ready = true;
      failure = null;
      clearTimeout(timer);
      var panel = document.getElementById('jrvxStartupRecovery');
      if (panel) panel.hidden = true;
    }
    setTimeout(checkShell, 0);
  }

  window.addEventListener('error', resourceError, true);
  window.addEventListener('load', stylesheetLoaded, true);
  window.addEventListener('online', show, false);
  window.addEventListener('offline', show, false);
  document.addEventListener('DOMContentLoaded', finish, false);
  timer = setTimeout(function () { fail('timeout'); }, deadline);
  window.JRVXStartupGuard = { state: function () { return { ready: ready, failure: failure, releasedStyles: releasedStyles }; } };
  // This shell does not depend on a downloaded script or stylesheet.
  var initial = recovery();
  document.getElementById('jrvxStartupTitle').textContent = '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C JRVX CAS';
  document.getElementById('jrvxStartupMessage').textContent = '\u041F\u043E\u0434\u0433\u043E\u0442\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u043C \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441. \u0415\u0441\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u0435\u0440\u0432\u0451\u0442\u0441\u044F, \u0437\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0435\u0451.';
  document.getElementById('jrvxStartupRetry').hidden = true;
  initial.hidden = false;
}());
<\/script>`).replace(s, `#jrvxStartupRecovery[hidden]{display:none!important}
#jrvxStartupRetry[hidden]{display:none!important}`), c = new Headers(e.headers);
  return c.delete("content-length"), c.delete("content-encoding"), c.delete("etag"), new Response(a, { status: e.status, statusText: e.statusText, headers: c });
}
o(Cn, "casStartupDocument");
function ka() {
  return new Response(`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JRVX CAS \xB7 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F</title>
<link rel="icon" href="data:,">
<style>
html{color-scheme:dark;background:#0b1018;color:#edf2f8;font:16px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}body{max-width:34rem;margin:0 auto;padding:28px 20px}h1{font-size:25px;line-height:1.2;margin:10px 0 24px}small,p{color:#b7c2d0}ul{list-style:none;padding:0;margin:24px 0}li{padding:12px 0;border-bottom:1px solid #283442}.ok{color:#8ce0bd}a{display:inline-block;color:#cbd9ef;padding:12px 0}noscript{color:#f0c47f}
</style>
</head>
<body>
<small>JRVX CAS \xB7 \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430 Safari</small>
<h1>\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B</h1>
<ul>
<li class="ok">HTML \u043F\u043E\u043B\u0443\u0447\u0435\u043D</li>
<li id="probe-js">JavaScript: \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442\u0441\u044F\u2026</li>
<li id="probe-size">\u042D\u043A\u0440\u0430\u043D: \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442\u0441\u044F\u2026</li>
</ul>
<noscript>JavaScript \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D. \u0421\u0430\u043C HTML \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D.</noscript>
<p>\u042D\u0442\u0430 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442 \u0444\u0430\u0439\u043B\u044B \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F, \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0438 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0438\u0433\u0440\u044B.</p>
<p>\u0415\u0441\u043B\u0438 \u043E\u043D\u0430 \u0432\u0438\u0434\u043D\u0430, \u0441\u043E\u043E\u0431\u0449\u0438\u0442\u0435, \u043F\u043E\u044F\u0432\u0438\u043B\u0430\u0441\u044C \u043B\u0438 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \xABJavaScript \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442\xBB. \u042D\u0442\u043E \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u043B\u0438\u0447\u0438\u0442\u044C \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 HTML \u043E\u0442 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430.</p>
<a href="/">\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 CAS</a>
<script data-jrvx-module="safari-probe">
(function () {
  document.getElementById('probe-js').textContent = 'JavaScript \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442';
  document.getElementById('probe-js').className = 'ok';
  document.getElementById('probe-size').textContent = '\u042D\u043A\u0440\u0430\u043D: ' + window.innerWidth + ' \xD7 ' + window.innerHeight;
}());
<\/script>
</body>
</html>
`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-jrvx-safari-probe": "1" } });
}
o(ka, "casSafariProbe");
function yr(e, t) {
  if (e.status === 101) return e;
  let r = new Headers(e.headers);
  return r.set("x-frame-options", "DENY"), r.set("x-content-type-options", "nosniff"), r.set("referrer-policy", "same-origin"), r.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()"), r.set("cross-origin-opener-policy", "same-origin"), r.set("cross-origin-resource-policy", "same-origin"), r.set("strict-transport-security", "max-age=31536000"), r.set("content-security-policy", `default-src 'self'; script-src 'self' 'sha256-3VzAmKSY1RdxCuTn/1PYz/ySarYo0TI/DYu7qO1Qu9k='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss://${t.host}; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://id.jrvx.ru`), t.pathname === "/__safari_probe" && r.set("content-security-policy", r.get("content-security-policy").replace("script-src ", "script-src 'sha256-4wx4bUIOGmrS7s6qGSCGIYm8L5Nls68ziH06+w4ZPdg=' ")), (t.pathname === "/" || t.pathname.endsWith(".html") || ["/service-worker.js", "/sw.js", "/manifest.webmanifest", "/pwa-precache.json"].includes(t.pathname)) && r.set("cache-control", "no-cache, no-store, must-revalidate"), new Response(e.body, { status: e.status, statusText: e.statusText, headers: r });
}
o(yr, "security");
l(yr, "security");
async function Ne(e, t = 4096) {
  if (!e.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw Error("invalid_content_type");
  if (Number(e.headers.get("content-length") || 0) > t) throw Error("request_too_large");
  let r = e.body?.getReader();
  if (!r) throw Error("invalid_json");
  let n = 0, i = [];
  for (; ; ) {
    let { done: c, value: u } = await r.read();
    if (c) break;
    if (n += u.byteLength, n > t) throw await r.cancel(), Error("request_too_large");
    i.push(u);
  }
  let s = new Uint8Array(n), a = 0;
  for (let c of i) s.set(c, a), a += c.byteLength;
  try {
    let c = JSON.parse(new TextDecoder().decode(s));
    if (!c || typeof c != "object" || Array.isArray(c)) throw Error("invalid_json");
    return c;
  } catch {
    throw Error("invalid_json");
  }
}
o(Ne, "boundedJSON");
l(Ne, "boundedJSON");
function vt(e) {
  let t = new URL(e.url);
  return t.origin === "https://cas.jrvx.ru" || t.origin === "https://cas-backend.jrvx.ru" ? "https://cas.jrvx.ru" : null;
}
o(vt, "canonicalOrigin");
function ue(e) {
  let t = vt(e);
  return !!t && e.headers.get("origin") === t;
}
o(ue, "sameOrigin");
l(ue, "sameOrigin");
async function gr(e, t, r = false) {
  if (t.JRVX_OIDC_ENABLED === "true") return v(r ? { authenticated: false, mode: "production", requiresAuthentication: true, user: null, loginUrl: "https://cas.jrvx.ru/auth/jrvx/start" } : { ok: false, error: "login_required", login_url: "https://cas.jrvx.ru/auth/jrvx/start" }, 401);
  try {
    let n = await Tr(t, await Rr(t, le(e).jrvx_session)), i = Date.now(), s = Math.min(i + 36e5, n.identityExpiry), a = crypto.randomUUID();
    await t.DB.prepare("DELETE FROM cas_sessions WHERE jrvx_id=? AND (expires_at<=? OR revoked=1)").bind(n.id, i).run(), await t.DB.prepare("INSERT INTO cas_sessions(sid,jrvx_id,expires_at,created_at) VALUES(?,?,?,?)").bind(a, n.id, s, i).run(), await Rt(t.DB, n.id);
    let c = await Ar(t, { id: n.id, sid: a, exp: s }), u = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    return u.append("set-cookie", De(wt, c, Math.max(1, Math.floor((s - Date.now()) / 1e3)))), u.append("set-cookie", De(_t, "", 0)), new Response(JSON.stringify(r ? { authenticated: true, mode: "production", requiresAuthentication: true, user: n } : { ok: true, user: n }), { headers: u });
  } catch {
    return v(r ? { authenticated: false, mode: "production", requiresAuthentication: true, user: null } : { ok: false, error: "identity_verification_failed" }, 401);
  }
}
o(gr, "login");
l(gr, "login");
async function Ai(e, t) {
  const requestPath=new URL(e.url).pathname;
  if ((requestPath.startsWith("/api/")||requestPath==="/ws") && !await mgReady(t.DB)) return v({ok:false,error:"economy_migration_required",economy:MG_CONTRACT},503);
  let r = new URL(e.url), n = r.pathname;
  if (!vt(e)) return v({ ok: false, error: "invalid_host" }, 421);
  if (t.JRVX_AUTH_MODE !== "production") return v({ ok: false, error: "production_auth_required" }, 503);
  if (n.startsWith("/auth/jrvx/")) {
    let s = e.headers.get("cf-connecting-ip") || "local";
    if (!await t.CAS_SESSIONS.getByName("rate:" + s).rate()) return v({ ok: false, error: "rate_limit" }, 429);
    let a = await An(e, t, { ensureAccount: Tr, signSession: Ar, touchCasLogin: Rt, cookie: De });
    if (a) return a;
  }
  if (n === "/__safari_probe" && e.method === "GET") return ka();
  if (n === "/health" && e.method === "GET") try {
    if (!t.DB || !t.CAS_ROOMS || !t.CAS_SESSIONS || !t.CAS_LOBBY || !t.IDENTITY || !t.ASSETS) throw Error();
    await Nt(t);
    let s = await t.DB.prepare("SELECT 1 AS ok").first();
    return v({ ok: s.ok === 1, service: "jrvx-cas", version: Sa, build: t.JRVX_BUILD_ID || "unknown" });
  } catch {
    return v({ ok: false, service: "jrvx-cas" }, 503);
  }
  if (n === "/auth/config" && e.method === "GET") return v({ mode: "production", requiresAuthentication: true, remoteVerifierConfigured: !!t.IDENTITY, loginUrl: t.JRVX_OIDC_ENABLED === "true" ? "https://cas.jrvx.ru/auth/jrvx/start" : "https://id.jrvx.ru" });
  if (n.startsWith("/api/transport/")) {
    let s = { "/api/transport/open": "POST", "/api/transport/command": "POST", "/api/transport/poll": "GET", "/api/transport/close": "POST" };
    if (!s[n]) return v({ ok: false, error: "not_found" }, 404);
    if (e.method !== s[n]) return v({ ok: false, error: "method_not_allowed" }, 405);
    if (e.method === "POST" && !ue(e)) return v({ ok: false, error: "invalid_origin" }, 403);
    let a = await ct(e, t);
    if (!a) {
      let d = e.headers.get("cf-connecting-ip") || "local";
      return await t.CAS_SESSIONS.getByName("rate:" + d).rate() ? v({ ok: false, error: "unauthorized" }, 401) : v({ ok: false, error: "rate_limit" }, 429);
    }
    let c = e.method === "GET" ? { connectionId: r.searchParams.get("connectionId"), generation: Number(r.searchParams.get("generation")), after: Number(r.searchParams.get("after") || 0), requestId: r.searchParams.get("requestId") || "" } : await Ne(e, 16384), u = t.CAS_SESSIONS.getByName(a.id);
    try {
      let d = n.endsWith("/open") ? await u.httpOpen(a, c) : n.endsWith("/command") ? await u.httpCommand(a, c) : n.endsWith("/close") ? await u.httpClose(a, c) : await u.httpPoll(a, c), p = d.httpStatus || 200;
      return delete d.httpStatus, v(d, p);
    } catch (d) {
      let p = mgErrorCode(d), h = /^[a-z_]+$/.test(p) ? p : "server_error", f = Number(d?.httpStatus) || (/unauthorized|session_expired/.test(h) ? 401 : /response_too_large/.test(h) ? 413 : /rate_limit/.test(h) ? 429 : /^invalid_|protocol_mismatch/.test(h) ? 400 : /session_replaced|lease_expired|hello_required|request_id_conflict|command_outcome_unknown|receipt_capacity|open_capacity|balance_limit/.test(h) ? 409 : 500);
      return v({ ok: false, error: f === 500 ? "server_error" : h, serverTime: Date.now(), ...c.requestId ? { requestId: c.requestId } : {}, ...f === 500 ? { outcome: "unknown" } : {} }, f);
    }
  }
  if (n.startsWith("/api/") || n.startsWith("/auth/") || n === "/ws") {
    let s = e.headers.get("cf-connecting-ip") || "local";
    if (!await t.CAS_SESSIONS.getByName("rate:" + s).rate()) return v({ ok: false, error: "rate_limit" }, 429);
  }
  if (n === "/auth/me" && e.method === "GET") {
    if (le(e)[_t] === "1") return v({ authenticated: false, mode: "production", requiresAuthentication: true, user: null }, 401);
    let s = await ct(e, t);
    return s ? v({ authenticated: true, mode: "production", requiresAuthentication: true, user: s }) : gr(e, t, true);
  }
  if (n === "/auth/login" && e.method === "POST") return ue(e) ? gr(e, t) : v({ ok: false, error: "invalid_origin" }, 403);
  if (n === "/auth/logout" && e.method === "POST") {
    if (!ue(e)) return v({ ok: false, error: "invalid_origin" }, 403);
    let s = await Ir(t, le(e)[wt]);
    s && (s.oidc && await xn(t, s.sid), await t.DB.prepare("UPDATE cas_sessions SET revoked=1 WHERE sid=? AND jrvx_id=?").bind(s.sid, s.id).run(), await t.CAS_SESSIONS.getByName(s.id).closeAll("Logged out"));
    let a = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    return a.append("set-cookie", De(wt, "", 0)), a.append("set-cookie", De(_t, "1", 86400)), new Response('{"ok":true}', { headers: a });
  }
  if (n.startsWith("/api/") || n === "/ws") {
    if (e.method === "POST" && !ue(e)) return v({ ok: false, error: "invalid_origin" }, 403);
    let s = await ct(e, t);
    if (!s) return v({ ok: false, error: "unauthorized" }, 401);
    if (n === "/api/me" && e.method === "GET") return v(await T(t.DB, s.id));
    if (n === "/api/wallet/exchange") return v({ok:false,error:"currency_retired",economy:MG_CONTRACT},410);
    if (n === "/api/shop/catalog" && e.method === "GET") return v({ok:true,...mgService.catalog(),economy:MG_CONTRACT});
    if (n === "/api/shop/purchases" && e.method === "GET") return v({...await mgService.listPurchases(t.DB,s.id),economy:MG_CONTRACT});
    if (n === "/api/shop/checkout" && e.method === "POST") {
      const input=await Ne(e);
      if(input.ownerId!==undefined && input.ownerId!==s.id) return v({ok:false,error:"intent_owner_mismatch"},409);
      return v({ok:true,checkout:await mgService.createCheckout(t.DB,s.id,input.packageId,{provider:input.provider,requestId:input.requestId||input.operationId})});
    }
    if (n === "/api/wallet/daily" && e.method === "POST") {
      const input=await Ne(e);
      if(input.ownerId!==undefined && input.ownerId!==s.id) return v({ok:false,error:"intent_owner_mismatch"},409);
      const result=await mgService.claimDaily(t.DB,s.id);
      const account=await T(t.DB,s.id);
      await t.CAS_SESSIONS.getByName(s.id).push({type:"account_wallet",...account}).catch(()=>{});
      return v({...result,...account});
    }
    if (n === "/api/history" && e.method === "GET") {
      let a = r.searchParams.get("game");
      if (a && !["poker", "blackjack", "roulette"].includes(a)) return v({ ok: false, error: "invalid_game" }, 400);
      const filter=a ? " AND game=?" : "",parameters=a?[s.id,a]:[s.id];
      const query="SELECT event_id,game,event_type,data_json,created_at,0 legacy FROM cas_game_history WHERE jrvx_id=?"+filter+
        " UNION ALL SELECT event_id,game,event_type,data_json,created_at,1 legacy FROM cas_legacy_game_history_v330 WHERE jrvx_id=? AND json_extract(data_json,'$.currency')='MS'"+filter+" ORDER BY created_at DESC LIMIT 50";
      const result=await t.DB.prepare(query).bind(...parameters,...parameters).all();
      return v({ok:true,economy:MG_CONTRACT,history:result.results.map(row=>{
        const original=JSON.parse(row.data_json);
        const data=row.legacy?{archived:true,number:original.number,won:original.won,roundId:original.roundId}:original;
        return{eventId:row.event_id,game:row.game,eventType:row.event_type,createdAt:row.created_at,legacy:!!row.legacy,data};
      })});
    }
    if(n==="/api/wallet/transactions" && e.method==="GET"){
      const result=await t.DB.prepare("SELECT transaction_id,amount,balance_before,balance_after,operation_type,created_at FROM cas_transactions WHERE jrvx_id=? AND currency='MG' ORDER BY created_at DESC,transaction_id DESC LIMIT 100").bind(s.id).all();
      return v({ok:true,economy:MG_CONTRACT,transactions:result.results.map(row=>({id:row.transaction_id,currency:'MG',amount:row.amount,balanceBefore:row.balance_before,balanceAfter:row.balance_after,operationType:row.operation_type,createdAt:row.created_at}))});
    }
    if (n === "/api/rooms" && e.method === "GET") return v({ ok: true, rooms: await pe(t.DB), serverTime: Date.now() });
    if (n === "/api/roulette/spin" && e.method === "POST") {
      let a = await Ne(e);
      if (a.ownerId !== void 0 && a.ownerId !== s.id) return v({ ok: false, error: "intent_owner_mismatch" }, 409);
      return v({ ok: true, result: await Kn(t.DB, { ...a, jrvxId: s.id }) });
    }
    if (n === "/api/blackjack/state" && e.method === "GET") return v({ ok: true, economy:MG_CONTRACT, ...await xr(t.DB, s.id) });
    if (n === "/api/blackjack/action" && e.method === "POST") {
      let a = await Ne(e);
      if (a.ownerId !== void 0 && a.ownerId !== s.id) return v({ ok: false, error: "intent_owner_mismatch" }, 409);
      return v({ ok: true, result: await Qn(t.DB, { ...a, jrvxId: s.id }) });
    }
    if (n === "/ws" && e.method === "GET") {
      if (e.headers.get("upgrade")?.toLowerCase() !== "websocket") return v({ error: "upgrade_required" }, 426);
      if (!ue(e)) return v({ error: "invalid_origin" }, 403);
      let a = new Headers(e.headers);
      return a.set("x-cas-verified-session", JSON.stringify(s)), a.set("x-cas-id-token", le(e).jrvx_session), t.CAS_SESSIONS.getByName(s.id).fetch(new Request(e, { headers: a }));
    }
    return v({ ok: false, error: "not_found" }, 404);
  }
  if (n === "/sw.js" && (e.method === "GET" || e.method === "HEAD")) {
    let s = new URL(e.url);
    return s.pathname = "/service-worker.js", t.ASSETS.fetch(new Request(s, e));
  }
  if (e.method !== "GET" && e.method !== "HEAD") return v({ ok: false, error: "method_not_allowed" }, 405);
  let i;
  try {
    i = decodeURIComponent(n);
  } catch {
    return v({ error: "invalid_path" }, 400);
  }
  if (i.includes("..") || i.includes("\\") || i.includes("\0") || !(["/", "/index.html", "/offline.html", "/manifest.webmanifest", "/service-worker.js", "/pwa-precache.json"].includes(i) || /^\/(modules|assets)\/[A-Za-z0-9_./-]+\.(js|mjs|css|json|svg|png|jpg|jpeg|webp|ico|woff2?|mp3|wav|ogg)$/.test(i))) return v({ error: "not_found" }, 404);
  if (n === "/") {
    let s = new URL(e.url);
    return s.pathname = "/index.html", Cn(await t.ASSETS.fetch(new Request(s, e)), e);
  }
  return n === "/index.html" ? Cn(await t.ASSETS.fetch(e), e) : t.ASSETS.fetch(e);
}
o(Ai, "handler");
l(Ai, "handler");
var Ps = { async fetch(e, t) {
  let r = await xa(e, "cas");
  if (r !== null) return r;
  let n = new URL(e.url), i = vt(e) ? new URL(n.pathname + n.search, vt(e)) : n;
  try {
    return yr(await Ai(e, t), i);
  } catch (s) {
    let a = mgErrorCode(s), c = a==="currency_retired" ? 409 : a==="payment_unavailable" ? 503 : a==="economy_migration_required" ? 503 : a === "identity_unavailable" ? 503 : a === "cas_account_disabled" ? 403 : a === "request_too_large" ? 413 : a === "invalid_content_type" ? 415 : /insufficient_balance|balance_limit|stale_state|id_conflict|retry_exhausted/.test(a) ? 409 : /^invalid_|^unexpected_|round_active|no_active_round|hand_not_active|_unavailable$/.test(a) ? 400 : 500;
    return c === 500 && console.error("CAS request failed", { path: n.pathname, error: a.slice(0, 200) }), yr(v({ ok: false, error: c === 500 ? "server_error" : a }, c), i);
  }
} };
async function xa(e, t) {
  let n = { cas: { public: "cas.jrvx.ru", upstream: "http://cas-reg.jrvx.ru" }, id: { public: "id.jrvx.ru", upstream: "http://id-reg.jrvx.ru" }, planner: { public: "planner.jrvx.ru", upstream: "http://planner-reg.jrvx.ru" } }[t], i = new URL(e.url);
  if (!n || i.hostname !== n.public || e.method !== "GET" || i.search || !/^\/\.well-known\/acme-challenge\/[A-Za-z0-9_-]{1,256}$/.test(i.pathname)) return null;
  let s = { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }, a, c, u = new AbortController(), d = o(() => {
    if (c) try {
      c.cancel().catch(() => {
      });
    } catch {
    }
  }, "cancel");
  try {
    let p = (async () => {
      let f = await fetch(n.upstream + i.pathname, { method: "GET", redirect: "manual", signal: u.signal, headers: { accept: "text/plain", "cache-control": "no-cache" } });
      if (f.status !== 200) {
        if (f.body) try {
          f.body.cancel().catch(() => {
          });
        } catch {
        }
        return new Response(f.status === 404 ? "Not found" : "Validation upstream unavailable", { status: f.status === 404 ? 404 : 502, headers: s });
      }
      if (!f.body) throw new Error("missing_validation");
      c = f.body.getReader();
      let _ = f.headers.get("content-length");
      if (_ !== null && (!/^\d+$/.test(_) || Number(_) > 4096)) throw new Error("oversize_validation");
      let w = [], y = 0;
      for (; ; ) {
        let E = await c.read();
        if (E.done) break;
        if (y += E.value.byteLength, y > 4096) throw new Error("oversize_validation");
        w.push(E.value);
      }
      if (!y) throw new Error("missing_validation");
      let m = new Uint8Array(y), g = 0;
      for (let E of w) m.set(E, g), g += E.byteLength;
      return new Response(m, { status: 200, headers: s });
    })(), h = new Promise((f, _) => {
      a = setTimeout(() => {
        u.abort(), d(), _(new Error("validation_timeout"));
      }, 2e3);
    });
    return await Promise.race([p, h]);
  } catch {
    return new Response("Validation upstream unavailable", { status: 502, headers: s });
  } finally {
    if (clearTimeout(a), u.abort(), d(), c) try {
      c.releaseLock();
    } catch {
    }
  }
}
o(xa, "jrvxAcmeRelay");
export {
  Bs as CasSession,
  Us as PokerLobby,
  Ws as PokerRoom,
  Ps as default
};
