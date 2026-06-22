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

    // The response carries two tokens with different shapes:
    //  - outer `moph_token.access_token` → scopes_detail (plaintext cid via id_card)
    //  - per-org `moph_access_token_idp`  → client (email + provider info)
    const outer = decodeJwtClaims(token);
    const org0: any = staff.organization?.[0];
    const idpClient = (org0?.moph_access_token_idp ? decodeJwtClaims(org0.moph_access_token_idp) : {})
      .client ?? {};

    const name =
      String(staff.name_th ?? '') ||
      [staff.title_th, staff.firstname_th, staff.lastname_th].filter(Boolean).join(' ') ||
      String(idpClient.name ?? '');
    const organizations = (staff.organization ?? []).map((o: any) => ({
      hcode: String(o.hcode ?? ''),
      hname: String(o.hname_th ?? ''),
      position: String(o.position ?? ''),
      positionId: String(o.position_id ?? ''),
    }));

    // `provider_id` is the stable per-person key.
    const sub = String(staff.provider_id ?? idpClient.provider_id ?? outer.sub ?? token);
    const email = idpClient.email ? String(idpClient.email) : undefined;
    // Plaintext 13-digit cid is exposed under scopes_detail.id_card when the user
    // consented to the id_card scope; otherwise we leave it for the user to fill.
    const rawCid = outer?.scopes_detail?.id_card;
    const cid = rawCid && /^\d{13}$/.test(String(rawCid)) ? String(rawCid) : undefined;

    return {
      sub,
      name,
      organizations,
      ...(email ? { email } : {}),
      ...(cid ? { cid } : {}),
    };
  },
};
