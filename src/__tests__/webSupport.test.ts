import { Alert, Platform } from 'react-native';
import { getBaseUrl } from '../constants/config';
import { showDialog } from '../lib/dialog';

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

describe('showDialog', () => {
  const original = Platform.OS;
  afterEach(() => {
    Platform.OS = original;
    jest.restoreAllMocks();
  });

  it('is Alert.alert on a phone', () => {
    Platform.OS = 'ios';
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    showDialog('T', 'M', [{ text: 'OK' }]);
    expect(alert).toHaveBeenCalledWith('T', 'M', [{ text: 'OK' }], undefined);
  });

  describe('on the web, where Alert does nothing', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('runs the action when the visitor confirms, the cancel otherwise', () => {
      const confirm = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
      Object.assign(window, { confirm });
      const action = jest.fn();
      const cancel = jest.fn();
      const buttons = [
        { text: 'Để sau', style: 'cancel' as const, onPress: cancel },
        { text: 'Đăng ký', onPress: action },
      ];
      showDialog('Đăng ký gói', 'Trừ 100 Coin', buttons);
      showDialog('Đăng ký gói', 'Trừ 100 Coin', buttons);
      expect(confirm).toHaveBeenCalledWith('Đăng ký gói\n\nTrừ 100 Coin');
      expect(action).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('shows a plain message and then runs its only button', () => {
      const alert = jest.fn();
      Object.assign(window, { alert });
      const onPress = jest.fn();
      showDialog('Đã tạo tài khoản', undefined, [{ text: 'Đăng nhập', onPress }]);
      expect(alert).toHaveBeenCalledWith('Đã tạo tài khoản');
      expect(onPress).toHaveBeenCalled();
    });
  });
});
