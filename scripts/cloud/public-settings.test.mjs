import { describe, it, expect } from 'vitest';
import { publicAuthSettings } from './common.mjs';
describe('bounded public Auth observations', () => {
  it('does not confuse signup flags with a full Auth/SMTP/MFA homologation', () => {
    const result = publicAuthSettings({
      external: { email: true },
      disable_signup: false,
      mailer_autoconfirm: false,
      smtp_pass: 'must-never-be-exported',
    });
    expect(result).toEqual({
      email_enabled: true,
      signup_enabled: true,
      email_autoconfirm: false,
      smtp_callbacks_pkce_mfa_verified: false,
    });
  });
  it('keeps absent flags unknown', () => {
    expect(publicAuthSettings({})).toMatchObject({
      email_enabled: null,
      signup_enabled: null,
      email_autoconfirm: null,
    });
  });
});
