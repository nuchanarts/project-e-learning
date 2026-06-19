import { bmsProvider } from '../bmsProvider';

// Real MOPH UAT token (test account "อมล กุวาน่า" / "bms ทดสอบ") — used to verify claim mapping.
// header.payload.<sig> — signature is irrelevant (we decode, never verify, server-side).
const HEADER = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9';
const PAYLOAD =
  'eyJpc3MiOiJNT1BIIEFjY291bnQgQ2VudGVyIiwic3ViIjoiMDc1MTBGQkJDOTIwRkA5OTk5OSIsImV4cCI6MTc4MTg5NTIwNywiaWF0IjoxNzgxODg0NDA3LCJhdWQiOiJNT1BIIEFQSSIsImNsaWVudCI6eyJ1c2VyX2lkIjoxMDAwMDAwLCJ1c2VyX2hhc2giOiIyOUYwRDNFNjQ4OUUzRkIyQUY0OUFDNkIyRTE5RTIxMTdFNDU4RUY0RUVFRDIwQkU0NEMxM0QxODNERTFFMDBEOEVDOEY2QTIxNDQyMEMiLCJsb2dpbiI6InByb3ZpZGVyXzU1NzA1MDEwNTQ5OTEiLCJuYW1lIjoi4Lit4Lih4LilIOC4geC4uOC4p-C4suC4meC5iOC4siIsImhvc3BpdGFsX25hbWUiOiJibXMg4LiX4LiU4Liq4Lit4LiaIiwiaG9zcGl0YWxfY29kZSI6Ijk5OTk5IiwiZW1haWwiOiJhbW9uLmt1QG9uZS50aCIsImFjY291bnRfYWN0aXZhdGVkIjp0cnVlLCJhY2NvdW50X3N1c3BlbmRlZCI6ZmFsc2UsImxhc3RfY2hhbmdlX3Bhc3N3b3JkIjoxNzgxODg0NDA3LCJsYXN0X2NvbmZpcm1fb3RwIjoxNzgxODg0NDA3LCJjaWRfaGFzaCI6IkRCRTZCQzExQzMyOTczODE2NzFFQUI4Q0M0ODlBQzYxOjUxIiwiY2lkX2VuY3J5cHQiOiI0ODY0OEI1NjJENjU2NkFCRTlGQTUyMjlFRDY1MDRFMTI2NzQ5N0RBODlBNTdBQzYyRjg3RTM0MjNGMjU2REE1Nzg3MzRBQzNENDFDMDdFQkQ3NDZDNzBERkYiLCJjaWRfYWVzIjoiSkFNMjRnTW8vUVN6OTZ6M2tyalgwUT09IiwiY2xpZW50X2lwIjoiMTcxLjEwMy43OC4zMCwgMTYyLjE1OC4xMDguMTMxIiwic2NvcGUiOlt7ImNvZGUiOiJBUFBPSU5UTUVOVF9EQVNIQk9BUkQ6MSJ9LHsiY29kZSI6Ik1PUEhfUEhSX0RBU0hCT0FSRDoxIn0seyJjb2RlIjoiQVBQT0lOVE1FTlRfQVBJOjEifSx7ImNvZGUiOiJNT1BIX1BIUl9ISUU6MSJ9LHsiY29kZSI6Ik1PUEhfQ0xBSU1fQVBJOjEifSx7ImNvZGUiOiJNT1BIX0FMRVJUX0FQSToxIn0seyJjb2RlIjoiTU9QSF9JRFBfQVBJOjEifSx7ImNvZGUiOiJJTU1VTklaQVRJT05fUEVSU09OX1VQTE9BRDoxIn0seyJjb2RlIjoiSU1NVU5JWkFUSU9OX1ZJRVc6MSJ9XSwicm9sZSI6W10sInNjb3BlX2xpc3QiOiJbQVBQT0lOVE1FTlRfREFTSEJPQVJEOjFdW01PUEhfUEhSX0RBU0hCT0FSRDoxXVtBUFBPSU5UTUVOVF9BUEk6MV1bTU9QSF9QSFJfSElFOjFdW01PUEhfQ0xBSU1fQVBJOjFdW01PUEhfQUxFUlRfQVBJOjFdW01PUEhfSURQX0FQSToxXVtJTU1VTklaQVRJT05fUEVSU09OX1VQTE9BRDoxXVtJTU1VTklaQVRJT05fVklFVzoxXSIsImFjY2Vzc19jb2RlX2xldmVsMSI6IiIsImFjY2Vzc19jb2RlX2xldmVsMiI6IiIsImFjY2Vzc19jb2RlX2xldmVsMyI6IiIsImFjY2Vzc19jb2RlX2xldmVsNCI6IiIsImFjY2Vzc19jb2RlX2xldmVsNSI6IiIsInByb3ZpZGVyX2lkIjoiMDc1MTBGQkJDOTIwRiIsInByb3ZpZGVyX3Bvc2l0aW9uX3N0ZF9pZCI6NywicHJvdmlkZXJfcG9zaXRpb25fc3RkX3R5cGVfaWQiOjk5OSwicHJvdmlkZXJfcG9zaXRpb25fc3RkX25hbWUiOiLguJnguLHguIHguKfguLTguIrguLLguIHguLLguKPguITguK3guKHguJ7guLTguKfguYDguJXguK3guKPguYwifX0';
const REAL_TOKEN = `${HEADER}.${PAYLOAD}.sig`;

const PROVIDER_STAFF = {
  title_th: 'นาย',
  firstname_th: 'อมล',
  lastname_th: 'กุวาน่า',
  organization: [
    { hcode: '99999', hname_th: 'bms ทดสอบ', position: 'นักวิชาการคอมพิวเตอร์', position_id: '7' },
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
      moph_token: { status_code: 200, data: { access_token: REAL_TOKEN } },
      provider_staff: { status_code: 200, data: PROVIDER_STAFF },
    }),
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('bmsProvider.exchangeCode', () => {
  it('extracts the plaintext email from the token client claims', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.email).toBe('amon.ku@one.th');
  });

  it('uses provider_id as the stable sub and maps name + organizations', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.sub).toBe('07510FBBC920F');
    expect(result.name).toContain('อมล');
    expect(result.organizations[0].hcode).toBe('99999');
  });

  it('does NOT expose a plaintext cid (token only carries encrypted/hashed forms)', async () => {
    const result = await bmsProvider.exchangeCode('the-code');
    expect(result.cid).toBeUndefined();
  });
});
