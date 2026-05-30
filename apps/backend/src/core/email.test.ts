import { describe, it, expect, beforeEach } from 'vitest';
import { TestEmailService, sentOtps } from './email';

describe('TestEmailService', () => {
  beforeEach(() => { sentOtps.length = 0; });

  it('records the OTP it would have sent', async () => {
    const svc = new TestEmailService();
    await svc.sendOtp('a@example.com', '123456');
    expect(sentOtps).toEqual([{ email: 'a@example.com', code: '123456' }]);
  });
});
