const assert = require('assert');

function createWx(storage) {
  return {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    clearStorageSync() {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    hideLoading() {},
    reLaunch(options) {
      storage.__reLaunchUrl = options.url;
      if (options.complete) {
        options.complete();
      }
    }
  };
}

const storage = {
  accessToken: 'expired-token',
  token_expire: Date.now() - 1000,
  selected_role: 'parent',
  mock_children: [{ id: 1, name: '张三' }]
};

global.wx = createWx(storage);
global.getApp = () => ({
  globalData: {
    token: 'expired-token',
    userInfo: { name: '用户' },
    agentInfo: { name: '代理商' }
  }
});

const Ext = require('../utils/Ext.js');

assert.strictEqual(Ext.checkTokenOnAppEntry(), true);
assert.deepStrictEqual(Object.keys(storage), ['__reLaunchUrl']);
assert.strictEqual(storage.__reLaunchUrl, '/pages/roleSelect/roleSelect?manual=1&tokenExpired=1');

const validStorage = {
  accessToken: 'valid-token',
  token_expire: Date.now() + 100000,
  selected_role: 'teacher'
};
global.wx = createWx(validStorage);
assert.strictEqual(Ext.checkTokenOnAppEntry(), false);
assert.strictEqual(validStorage.accessToken, 'valid-token');
assert.strictEqual(validStorage.__reLaunchUrl, undefined);

const emptyStorage = {};
global.wx = createWx(emptyStorage);
assert.strictEqual(Ext.checkTokenOnAppEntry(), false);
assert.deepStrictEqual(emptyStorage, {});

console.log('token expiry guard ok');
