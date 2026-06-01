// pages/agent/login/login.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    showPassword: false
  },

  onLoad() {
    // 检查是否已登录
    if (Ext.isLogin() && wx.getStorageSync('agentInfo')) {
      wx.reLaunch({ url: '/pages/agent/home/home' });
    }
    // 初始化 Mock 数据
    const MockData = require('../../../utils/mockData.js');
    MockData.initMockData();
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  backToRoleSelect() {
    wx.removeStorageSync('selected_role');
    wx.removeStorageSync('selected_role_path');
    wx.reLaunch({ url: '/pages/roleSelect/roleSelect?manual=1' });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  async handleLogin() {
    const { phone, password } = this.data;
    
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '登录中...' });

    try {
      // 模拟登录（实际应调用真实接口）
      // const res = await Ext.Post(Ext.Url + '/api/agent/login', { phone, password });
      
      // 模拟成功响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (phone === '13800138000' && password === '123456') {
        const agentInfo = {
          id: 1001,
          name: '张代理商',
          phone: phone,
          company: '校徽科技有限公司',
          region: '北京市朝阳区'
        };
        
        // 保存登录信息
        const token = 'mock_token_' + Date.now();
        Ext.saveToken({ accessToken: token });
        const app = getApp();
        app.setLoginStatus(token, agentInfo);
        
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/agent/home/home' });
        }, 1500);
      } else {
        wx.showToast({ title: '手机号或密码错误（测试账号：13800138000/123456）', icon: 'none', duration: 3000 });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 演示账号快速登录
  quickLogin() {
    this.setData({
      phone: '13800138000',
      password: '123456'
    });
    this.handleLogin();
  }
});
