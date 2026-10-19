// Minimal local virtual authenticator. No real device keys or browser automation.
// W3C WebAuthn authenticatorData and "none" attestation format; P-256 / ES256.
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';

const b64 = bytes => Buffer.from(bytes).toString('base64url');
function head(major, value) {
  if (value < 24) return Buffer.from([(major << 5) | value]);
  if (value < 256) return Buffer.from([(major << 5) | 24, value]);
  const bytes = Buffer.alloc(3); bytes[0] = (major << 5) | 25; bytes.writeUInt16BE(value, 1); return bytes;
}
function cbor(value) {
  if (typeof value === 'number') return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === 'string') { const bytes = Buffer.from(value); return Buffer.concat([head(3, bytes.length), bytes]); }
  if (Buffer.isBuffer(value)) return Buffer.concat([head(2, value.length), value]);
  if (value instanceof Map) return Buffer.concat([head(5, value.size), ...[...value].flatMap(([k, v]) => [cbor(k), cbor(v)])]);
  throw Error('Unsupported local CBOR value');
}
export function virtualPasskey(origin) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const id = randomBytes(32), rpHash = createHash('sha256').update(new URL(origin).hostname).digest();
  const publicCose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]]));
  let counter = 0;
  const credential = response => ({ id: b64(id), rawId: b64(id), type: 'public-key', clientExtensionResults: {}, authenticatorAttachment: 'platform', response });
  return {
    register(challenge) {
      const clientData = Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge, origin, crossOrigin: false }));
      const length = Buffer.alloc(2); length.writeUInt16BE(id.length);
      const authData = Buffer.concat([rpHash, Buffer.from([0x45]), Buffer.alloc(4), Buffer.alloc(16), length, id, publicCose]);
      return credential({ clientDataJSON: b64(clientData), attestationObject: b64(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]))), transports: ['internal'] });
    },
    authenticate(challenge, clientOrigin = origin) {
      const clientData = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin: clientOrigin, crossOrigin: false }));
      const count = Buffer.alloc(4); count.writeUInt32BE(++counter);
      const authData = Buffer.concat([rpHash, Buffer.from([0x05]), count]);
      const signed = Buffer.concat([authData, createHash('sha256').update(clientData).digest()]);
      return credential({ clientDataJSON: b64(clientData), authenticatorData: b64(authData), signature: b64(sign('sha256', signed, privateKey)), userHandle: null });
    }
  };
}
