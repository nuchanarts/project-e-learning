import { bmsProvider } from '../bmsProvider';

// Build a fake (unsigned) JWT — bmsProvider only decodes, never verifies.
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'RS512', typ: 'JWT' })}.${b64(payload)}.sig`;
}

// Real MOPH response shape (account "อมล กุวาน่า"): the OUTER moph_token carries the
// plaintext cid under scopes_detail.id_card; the INNER per-org idp token carries email.
const OUTER_TOKEN = makeJwt({
  aud: '9adaeaec-f199-44b2-8219-53346114fc7a',
  sub: '019677fe-955d-76c3-8789-8a525ae8d961',
  scopes_detail: {
    id_card: '5570501054991',
    name: 'AMON',
    surname: 'KUWANA',
    birthdate: '2001-11-30',
    mobile_no: '0910586742',
  },
});

const IDP_TOKEN = makeJwt({
  iss: 'MOPH Account Center',
  sub: '07510FBBC920F@99999',
  client: { email: 'amon.ku@one.th', provider_id: '07510FBBC920F', name: 'อมล กุวาน่า' },
});

const PROVIDER_STAFF = {
  provider_id: '07510FBBC920F',
  title_th: 'นาย',
  name_th: 'อมล กุวาน่า',
  firstname_th: 'อมล',
  lastname_th: 'กุวาน่า',
  organization: [
    {
      hcode: '99999',
      hname_th: 'bms ทดสอบ',
      position: 'นักวิชาการคอมพิวเตอร์',
      position_id: '0007',
      moph_access_token_idp: IDP_TOKEN,
    },
  ],
};

beforeEach(() => {
  process.env.MOPH_BMS_AUTH_BASE_URL = 'https://bms.example/api/v1/auth';
  process.env.MOPH_BMS_APP_ID = 'app-uuid-1234';
  process.env.MOPH_BMS_ENCRYPTION_KEY = 'fD7tW8xM9pQ1rZ3yN5uA0vS2bK4gH6jk';
  process.env.MOPH_REDIRECT_URI = 'https://app.example/';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      moph_token: { status_code: 200, data: { access_token: OUTER_TOKEN } },
      provider_staff: { status_code: 200, data: PROVIDER_STAFF },
    }),
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('bmsProvider.exchangeCode', () => {
  it('extracts email from the inner idp token (client.email)', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.email).toBe('amon.ku@one.th');
  });

  it('extracts the plaintext cid from the outer token scopes_detail.id_card', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.cid).toBe('5570501054991');
  });

  it('uses provider_id as the stable sub and maps name + organizations', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.sub).toBe('07510FBBC920F');
    expect(result.name).toContain('อมล');
    expect(result.organizations[0].hcode).toBe('99999');
  });

  it('omits cid when scopes_detail.id_card is not a 13-digit number', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        moph_token: { status_code: 200, data: { access_token: makeJwt({ sub: 'x' }) } },
        provider_staff: { status_code: 200, data: PROVIDER_STAFF },
      }),
    });
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.cid).toBeUndefined();
  });
});
