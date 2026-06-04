// utils/Ext.js
const MockData = require('./mockData.js');

let tokenExpiredRedirecting = false;
class Ext {
  static Role = { role: 0 };
  static Url = 'https://sms.kennyspan.xyz:8665';
  static User = { id: '', name: '', gender: '' };
	static Studnet ={}
	static sourceId={}

  /**
   * 格式化日期 yyyy-MM-dd
   */
  static formatSimpleDate(dateStr) {
    if (!dateStr) return '';
    const safeStr = dateStr.replace(/-/g, '/').replace('T', ' ');
    const date = new Date(safeStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- 网络请求方法 ---
  static Get(url, params = {}) {
    const mockResponse = MockData.mockResponse(url, 'GET', params);
    if (mockResponse) {
      console.log('[Ext] Mock GET:', url);
      return Promise.resolve(mockResponse);
    }

    const query = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    const fullUrl = query ? `${url}?${query}` : url;
    console.log('[接口请求]', {
      method: 'GET',
      url: fullUrl,
      params
    });
    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method: 'GET',
        header: this.getAuthHeader(),
        success: (res) => {
          console.log('[接口响应]', {
            method: 'GET',
            url: fullUrl,
            statusCode: res.statusCode,
            data: res.data
          });
          this.handleResponse(res, resolve, reject);
        },
        fail: (err) => {
          console.error('[接口失败]', {
            method: 'GET',
            url: fullUrl,
            error: err
          });
          reject(err);
        }
      });
    });
  }

  static Post(url, data = {}) {
    const mockResponse = MockData.mockResponse(url, 'POST', data);
    if (mockResponse) {
      console.log('[Ext] Mock POST:', url);
      return Promise.resolve(mockResponse);
    }

    console.log('[接口请求]', {
      method: 'POST',
      url,
      data
    });
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'POST',
        header: this.getAuthHeader(),
        data: data,
        success: (res) => {
          console.log('[接口响应]', {
            method: 'POST',
            url,
            statusCode: res.statusCode,
            data: res.data
          });
          this.handleResponse(res, resolve, reject);
        },
        fail: (err) => {
          console.error('[接口失败]', {
            method: 'POST',
            url,
            error: err
          });
          reject(err);
        }
      });
    });
  }

  static Put(url, data = {}) {
    const mockResponse = MockData.mockResponse(url, 'PUT', data);
    if (mockResponse) {
      console.log('[Ext] Mock PUT:', url);
      return Promise.resolve(mockResponse);
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'PUT',
        header: this.getAuthHeader(),
        data,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: reject
      });
    });
  }

  static Delete(url, data = {}) {
    const mockResponse = MockData.mockResponse(url, 'DELETE', data);
    if (mockResponse) {
      console.log('[Ext] Mock DELETE:', url);
      return Promise.resolve(mockResponse);
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'DELETE',
        header: this.getAuthHeader(),
        data,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: reject
      });
    });
  }
  // 内部统一处理响应逻辑
  static handleResponse(res, resolve, reject) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      resolve(res.data);
    } else if (res.statusCode === 401) {
      this.handleTokenExpired();
      reject(new Error('Unauthorized'));
    } else {
      reject(new Error(res.data.message || `HTTP错误: ${res.statusCode}`));
    }
  }

  // --- Token 管理 ---

	static getAuthHeader() {
    const storedToken = wx.getStorageSync('auth_token') || {};
		let token = wx.getStorageSync('accessToken') || storedToken.accessToken || storedToken.token || '';
		token = String(token || '').trim();
		const type = 'Bearer';
		
    if (token && !wx.getStorageSync('accessToken')) {
      wx.setStorageSync('accessToken', token);
    }

		console.log('[Header检查]', {
      tokenStatus: token ? '存在' : '缺失',
      tokenType: type,
      authorization: token ? `${type} ${token.slice(0, 20)}...` : ''
    });
	
		if (token) {
			return {
				'Authorization': `${type} ${token}`,
				'Content-Type': 'application/json'
			};
		}
		return { 'Content-Type': 'application/json' };
	}

  static saveToken(tokenData) {
  if (!tokenData) return;
  try {
    const token = String(tokenData.accessToken || tokenData.token || (typeof tokenData === 'string' ? tokenData : '')).trim();
    const type = 'Bearer';

    if (!token) {
      console.error('saveToken 失败：无法在返回数据中找到 Token 字段', tokenData);
      return;
    }

    wx.setStorageSync('auth_token', {
      ...(typeof tokenData === 'object' ? tokenData : {}),
      accessToken: token,
      tokenType: type
    });
    wx.setStorageSync('accessToken', token);
    wx.setStorageSync('tokenType', type);
    
    const expireTime = Date.now() + 10 * 24 * 60 * 60 * 1000;
    wx.setStorageSync('token_expire', expireTime);
    
    console.log('Token 已成功写入缓存');
  } catch (e) {
    console.error('保存Token异常:', e);
  }
}

  static getToken() {
    return wx.getStorageSync('auth_token');
  }

  static isTokenValid() {
    const expireTime = wx.getStorageSync('token_expire');
    if (!expireTime) return false;
    return Date.now() < (expireTime - 60000); // 提前一分钟失效
  }

  /**
   * 彻底清除登录状态
   */
  static clearToken() {
    try {
      // 1. 清除本地缓存中的所有登录相关信息
      const keys = [
        'auth_token', 
        'accessToken', 
        'tokenType', 
        'token_expire', 
        'session_data',
        'session_response',
        'teacher_class_list',
        'selected_role',
        'selected_role_path',
        'user_info', 
        'user_role', // 如果你想退出时连角色选择也重置，就加上这一行
        'teacher_Info', // 之前提到的教师详情缓存
        'agentInfo'
      ];
      
      keys.forEach(key => wx.removeStorageSync(key));

      // 2. 重置内存中的静态变量（防止切换账号不刷新页面导致的逻辑错误）
      this.Role.role = 0;
      this.User = { id: '', name: '', gender: '' };
      try {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.token = null;
          app.globalData.agentInfo = null;
          app.globalData.userInfo = {};
        }
      } catch (e) {}

      console.log('--- [安全退出] 所有登录凭证已销毁 ---');
    } catch (e) {
      console.error('清除Token异常:', e);
    }
  }

  static handleTokenExpired() {
    if (tokenExpiredRedirecting) return;
    tokenExpiredRedirecting = true;
    this.clearToken();
    wx.hideLoading();
    wx.reLaunch({
      url: '/pages/roleSelect/roleSelect?manual=1&tokenExpired=1',
      complete: () => {
        setTimeout(() => {
          tokenExpiredRedirecting = false;
        }, 1000);
      }
    });
  }
  // --- 其他工具 ---

  static decodeToken(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const arrayBuffer = wx.base64ToArrayBuffer(base64);
      const decodeString = decodeURIComponent(
        Array.prototype.map.call(new Uint8Array(arrayBuffer), (n) => '%' + n.toString(16).padStart(2, '0')).join('')
      );
      return JSON.parse(decodeString);
    } catch (e) { return null; }
  }

  static isLogin() {
    const token = wx.getStorageSync('accessToken');
    const expire = wx.getStorageSync('token_expire');
    return Boolean(token && (!expire || Date.now() < expire));
  }

  static decodeUserId() {
    const token = wx.getStorageSync('accessToken');
    const payload = this.decodeToken(token);
    const userId = payload && (
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      || payload.sub
      || payload.userId
      || payload.id
    );
    return userId || wx.getStorageSync('userId') || '1001';
  }
  static get role() {
    if (this.Role.role === 0) {
      this.Role.role = wx.getStorageSync('user_role') || 0;
    }
    return this.Role.role;
  }

  static set setrole(value) {
    const roleValue = Number(value);
    this.Role.role = roleValue;
    wx.setStorageSync('user_role', roleValue);
  }
}

module.exports = Ext;

