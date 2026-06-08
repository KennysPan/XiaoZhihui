// pages/login/login.js
const Ext = require('../utils/Ext');

const QUICK_LOGIN_ACCOUNT = {
  phone: '13900000005',
  password: 'aA123456!'
};

Page({
  data: {
    phone: '',
    password: '',
    isHide: true,
    isLogining: false
  },

  onLoad() {
    if (Ext.isLogin()) {
      wx.redirectTo({ url: '/pages/parent/home/home' });
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPwdInput(e) {
    this.setData({ password: e.detail.value });
  },

  backToRoleSelect() {
    wx.removeStorageSync('selected_role');
    wx.removeStorageSync('selected_role_path');
    wx.reLaunch({ url: '/pages/roleSelect/roleSelect?manual=1' });
  },

  togglePassword() {
    this.setData({ isHide: !this.data.isHide });
  },

  quickLogin() {
    this.setData({
      phone: QUICK_LOGIN_ACCOUNT.phone,
      password: QUICK_LOGIN_ACCOUNT.password
    }, () => this.onLogin());
  },

  async onLogin() {
    const { phone, password, isLogining } = this.data;
    if (isLogining) return;

    if (!phone?.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!password?.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ isLogining: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const res = await Ext.Post(`${Ext.Url}/api/sessions`, {
        LoginKey: phone.trim(),
        Password: password.trim()
      });

      if ((res.code === 0 || res.code === 20000) && res.data?.accessToken) {
        const token = res.data.accessToken;
        const userId = res.data.user?.userId || null;
        const roles = res.data.roles || [];

        Ext.saveToken({ accessToken: token });
        if (userId) wx.setStorageSync('userId', userId);
        Ext.saveRoles(roles);

        // 检查是否是家长角色
        if (!Ext.isParent()) {
          wx.showModal({
            title: '提示',
            content: '当前账号不是家长账号，请使用家长账号登录',
            showCancel: false,
            success: () => {
              Ext.clearToken();
              this.setData({ isLogining: false });
              wx.hideLoading();
            }
          });
          return;
        }

        const app = getApp();
        if (app?.globalData) {
          app.globalData.token = token;
          app.globalData.userId = userId;
        }

        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/parent/home/home' });
        }, 500);
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' });
      }
    } catch (err) {
      console.error('[Login] 异常:', err);
      wx.showToast({ title: err.message || '网络异常', icon: 'none' });
    } finally {
      this.setData({ isLogining: false });
      wx.hideLoading();
    }
  },

  ClickForgetPwd() {
    wx.navigateTo({ url: '/pages/parent/repassword/repassword' });
  }

});
