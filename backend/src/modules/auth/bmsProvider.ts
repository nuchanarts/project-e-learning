import { encryptAppId } from './mophCrypto';

/** Clean shape the service layer consumes — mapped from the raw BMS proxy response. */
export interface MophProviderResult {
  sub: string;
  name: string;
  organizations: { hcode: string; hname: string; position: string; positionId: string }[];
  /** Present only if the MOPH token carries them (provider-dependent). */
  cid?: string;
  email?: string;
}

/** Decode a JWT payload without verifying (the BMS proxy already validated it server-side). */
function decodeJwtClaims(token: string): Record<string, any> {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Exchanges a MOPH OAuth authorization code for the provider's staff profile,
 * via the BMS Auth Proxy (server-side — keeps app_id / encryption key off the client).
 */
export const bmsProvider = {
  async exchangeCode(code: string): Promise<MophProviderResult> {
    const baseUrl = process.env.MOPH_BMS_AUTH_BASE_URL;
    const appId = process.env.MOPH_BMS_APP_ID;
    const redirectUri = process.env.MOPH_REDIRECT_URI;
    if (!baseUrl || !appId) {
      throw Object.assign(new Error('MOPH provider not configured'), { status: 503 });
    }

    const res = await fetch(`${baseUrl}/provider-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${code}` },
      body: JSON.stringify({ app_id: encryptAppId(appId), redirect_uri: redirectUri }),
    });

    if (!res.ok) {
      throw Object.assign(new Error('แลกรหัสกับ MOPH ไม่สำเร็จ'), { status: 401 });
    }

    const json: any = await res.json();
    const staff = json?.provider_staff?.data;
    const token = json?.moph_token?.data?.access_token;
    if (!staff || !token) {
      throw Object.assign(new Error('ข้อมูลจาก MOPH ไม่ครบ'), { status: 502 });
    }

    // MOPH packs the user claims inside a nested `client` object.
    const claims = decodeJwtClaims(token);
    const client = claims.client ?? {};

    const name =
      [staff.title_th, staff.firstname_th, staff.lastname_th].filter(Boolean).join(' ') ||
      String(client.name ?? '');
    const organizations = (staff.organization ?? []).map((o: any) => ({
      hcode: String(o.hcode ?? ''),
      hname: String(o.hname_th ?? ''),
      position: String(o.position ?? ''),
      positionId: String(o.position_id ?? ''),
    }));

    // `provider_id` is the stable per-person key — `sub` embeds @hospital_code,
    // which would differ per hospital for the same person.
    const sub = String(client.provider_id ?? claims.sub ?? token);
    // `email` is plaintext. The cid only arrives encrypted/hashed (cid_aes / cid_hash /
    // cid_encrypt), so we cannot surface a usable 13-digit cid — the user supplies it.
    const email = client.email ? String(client.email) : undefined;

    return {
      sub,
      name,
      organizations,
      ...(email ? { email } : {}),
    };
  },
};
