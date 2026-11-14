import { getBaseUrl } from '../constants/config';

describe('API base URL', () => {
  it('uses the same-origin /api proxy on the web, even when a LAN URL is set for phones', () => {
    expect(getBaseUrl('web', 'http://192.168.1.5:3001/api')).toBe('/api');
  });

  it('uses the LAN URL on a phone, else the emulator or simulator host', () => {
    expect(getBaseUrl('android', 'http://192.168.1.5:3001/api')).toBe('http://192.168.1.5:3001/api');
    expect(getBaseUrl('android', undefined)).toBe('http://10.0.2.2:3001/api');
    expect(getBaseUrl('ios', undefined)).toBe('http://localhost:3001/api');
  });
});
