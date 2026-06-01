const dataService = require('../../../../utils/dataService.js');

const QUICK_LOGIN_ACCOUNT = {
  loginKey: 'g123456',
  password: 'aA123456!'
};

Page({
  data: {
    loginKey: dataService.getLoginAccount().loginKey,
    phone: dataService.getLoginAccount().phone,
    password: dataService.getLoginAccount().password,
    url: 'https://www.kennyspan.xyz:8082',
    isHide: true
  },

  onLoad() {},

  backToRoleSelect() {
    wx.removeStorageSync('selected_role');
    wx.removeStorageSync('selected_role_path');
    wx.reLaunch({ url: '/pages/roleSelect/roleSelect?manual=1' });
  },

  togglePassword() {
    this.setData({ isHide: !this.data.isHide });
  },

  etPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  etLoginKey(e) {
    const loginKey = e.detail.value;
    this.setData({ loginKey, phone: loginKey });
  },

  etPassword(e) {
    this.setData({ password: e.detail.value });
  },

  ClickForgetPwd() {
    wx.navigateTo({ url: '/pages/teacher/auth/repassword/repassword' });
  },

  quickLogin() {
    this.setData({
      loginKey: QUICK_LOGIN_ACCOUNT.loginKey,
      phone: QUICK_LOGIN_ACCOUNT.loginKey,
      password: QUICK_LOGIN_ACCOUNT.password
    }, () => this.btnLogin());
  },

  btnLogin() {
    const loginKey = (this.data.loginKey || this.data.phone || '').trim();
    const password = (this.data.password || '').trim();

    if (!loginKey || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none', duration: 2000 });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    wx.setStorageSync('selected_role', 'teacher');

    dataService.login(loginKey, password)
      .then(sessionData => dataService.initializeAppState(sessionData))
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1000,
          success: () => {
            setTimeout(() => {
              wx.switchTab({ url: '/pages/teacher/main/home/home' });
            }, 1000);
          }
        });
      })
      .catch(error => {
        wx.hideLoading();
        wx.showToast({
          title: error && error.message ? error.message : '账号或密码不正确',
          icon: 'none',
          duration: 2000
        });
      });
  }
});
