// utils/Ext.js
const MockData = require('./MockData');

class Ext {
  static Url = 'https://sms.kennyspan.xyz:8665';
  static Role = 4;
  static tokenExpiredRedirecting = false;

  // 获取 token（优先从内存，其次从存储）
  static getToken() {
    try {
      const app = getApp();
      if (app && app.globalData && app.globalData.token) {
        return app.globalData.token;
      }
    } catch (e) {}
    return wx.getStorageSync('accessToken') || null;
  }

  // 获取认证头 - 确保每个请求都带 token
  static getAuthHeader() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // 1. 封装 GET 请求
  static Get(url, params = {}) {
    const query = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    const fullUrl = query ? `${url}?${query}` : url;
    
    console.log('[Ext] GET 请求:', fullUrl);
    console.log('[Ext] Token:', this.getToken() ? '已携带' : '无Token');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method: 'GET',
        header: this.getAuthHeader(),
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: (err) => {
          console.error('[Ext] GET 请求失败:', err);
          reject(new Error('网络连接失败'));
        }
      });
    });
  }

  // 2. 封装 POST 请求
  static Post(url, data = {}) {
    console.log('[Ext] POST 请求:', url);
    console.log('[Ext] Token:', this.getToken() ? '已携带' : '无Token');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'POST',
        header: this.getAuthHeader(),
        data: data,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: (err) => {
          console.error('[Ext] POST 请求失败:', err);
          reject(new Error('网络连接失败'));
        }
      });
    });
  }

  // 3. 封装 PUT 请求
  static Put(url, data = {}) {
    console.log('[Ext] PUT 请求:', url);
    console.log('[Ext] Token:', this.getToken() ? '已携带' : '无Token');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'PUT',
        header: this.getAuthHeader(),
        data: data,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: (err) => {
          console.error('[Ext] PUT 请求失败:', err);
          reject(new Error('网络连接失败'));
        }
      });
    });
  }

  // 4. 封装 DELETE 请求
  static Delete(url, data = {}) {
    console.log('[Ext] DELETE 请求:', url);
    console.log('[Ext] Token:', this.getToken() ? '已携带' : '无Token');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'DELETE',
        header: this.getAuthHeader(),
        data: data,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: (err) => {
          console.error('[Ext] DELETE 请求失败:', err);
          reject(new Error('网络连接失败'));
        }
      });
    });
  }

// handleResponse 
static handleResponse(res, resolve, reject) {
  console.log('[Ext] 响应状态码:', res.statusCode);
  console.log('[Ext] 响应数据:', res.data);
  
  if (res.statusCode >= 200 && res.statusCode < 300) {
    // 成功响应
    resolve(res.data);
} else if (res.statusCode === 401) {
    this.handleTokenExpired();
    reject(new Error('登录过期'));
  } else if (res.statusCode === 404) {
    reject(new Error(`接口不存在: ${res.statusCode}`));
  } else if (res.statusCode === 500) {
    const errorMsg = res.data?.message || res.data?.msg || '服务器内部错误';
    reject(new Error(errorMsg));
  } else {
    const errorMsg = res.data?.message || res.data?.msg || `请求失败(${res.statusCode})`;
    reject(new Error(errorMsg));
  }
}

  // 6. 保存 token（同时保存到内存和存储）
  static saveToken(data) {
    const token = data.accessToken || data.token;
    if (token) {
      // 保存到本地存储
      wx.setStorageSync('accessToken', token);
      wx.setStorageSync("token_expire", Date.now() + 24 * 60 * 60 * 1000);
      
      // 保存到全局
      try {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.token = token;
        }
      } catch (e) {
        console.warn('[Ext] 无法获取 app 实例');
      }
      
      console.log('[Ext] Token 已保存');
    }
  }

  // 7. 清除 token
  static clearToken() {
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('token_expire');
    wx.removeStorageSync('userId');
    wx.removeStorageSync('userRoles');
    
    try {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.token = null;
        app.globalData.userId = null;
      }
    } catch (e) {}
    
    console.log('[Ext] Token 已清除');
  }

  static clearAllSavedData() {
    try {
      wx.clearStorageSync();
    } catch (e) {
      console.error('[Ext] 清空本地缓存失败:', e);
      this.clearToken();
    }

    try {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.token = null;
        app.globalData.userId = null;
        app.globalData.userInfo = {};
        app.globalData.agentInfo = null;
        app.globalData.selectedRole = 'teacher';
      }
    } catch (e) {}

    console.log('[Ext] 已清空所有本地保存数据');
  }

  static isStoredTokenExpired(now = Date.now()) {
    const token = this.getToken();
    if (!token) return false;

    const expire = Number(wx.getStorageSync('token_expire'));
    if (!expire) return true;

    return now >= expire;
  }

  static checkTokenOnAppEntry() {
    if (!this.isStoredTokenExpired()) {
      return false;
    }
    this.handleTokenExpired();
    return true;
  }

  static handleTokenExpired() {
    if (this.tokenExpiredRedirecting) return;
    this.tokenExpiredRedirecting = true;
    this.clearAllSavedData();
    wx.hideLoading();
    wx.reLaunch({
      url: '/pages/roleSelect/roleSelect?manual=1&tokenExpired=1',
      complete: () => {
        setTimeout(() => {
          this.tokenExpiredRedirecting = false;
        }, 1000);
      }
    });
  }

  // 8. 检查是否登录
  static isLogin() {
    const token = this.getToken();
    const expire = wx.getStorageSync('token_expire');
    const isValid = token && expire && Date.now() < expire;
    console.log('[Ext] 登录状态:', isValid);
    return isValid;
  }

  // 9. 获取当前用户ID
  static getUserId() {
    const storedId = wx.getStorageSync('userId');
    if (storedId) return storedId;
    
    // 尝试从 token 解析
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(escape(wx.atob(base64))));
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                  || payload['sub'] 
                  || payload['userId'] 
                  || payload['id'];
      if (userId) {
        wx.setStorageSync('userId', userId);
        return userId;
      }
    } catch (e) {
      console.error('[Ext] 解析 token 失败:', e);
    }
    return null;
  }

  // 10. 检查是否是家长角色
  static isParent() {
    const roles = this.getRoles();
    if (!roles || roles.length === 0) return false;
    
    return roles.some(role => {
      const code = role.code || role.roleCode || '';
      return code === 'BR-0004' || 
             code.toLowerCase().includes('parent') ||
             role.name === '家长' ||
             role.name === '学生家长';
    });
  }

  // 11. 获取角色列表
  static getRoles() {
    try {
      return wx.getStorageSync('userRoles') || [];
    } catch (e) {
      return [];
    }
  }

  // 12. 保存角色列表
  static saveRoles(roles) {
    try {
      wx.setStorageSync('userRoles', roles);
      console.log('[Ext] 角色列表已保存:', roles);
    } catch (e) {
      console.error('[Ext] 保存角色失败:', e);
    }
  }
}

module.exports = Ext;
