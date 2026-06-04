// pages/agent/repair/repair.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    list: [],
    loading: false,
    showDetail: false,
    currentItem: null,
    statusOptions: ['未维修', '维修中', '已维修']
  },

  onShow() {
    this.loadData();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果没有上一页，跳转到首页
        wx.switchTab({ url: '/pages/agent/home/home' });
      }
    });
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const res = await Ext.Get(Ext.Url + '/api/repair/list');

      if (res.code === 200) {
        // 处理数据，确保每条记录都有 statusCode
        const list = (res.data || []).map(item => ({
          ...item,
          statusCode: this.getStatusCode(item.status),
          phone: item.phone || item.reportPhone || '',
          content: item.content || item.description || '',
          createTime: item.createTime || item.reportTime || Ext.formatSimpleDate(new Date())
        }));
        this.setData({ list });
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载维修列表失败', err);
      wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 根据状态文字获取状态码
  getStatusCode(status) {
    const map = {
      '未维修': 0,
      '维修中': 1,
      '已维修': 2
    };
    return map[status] !== undefined ? map[status] : 0;
  },

  openDetail(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      currentItem: item,
      showDetail: true
    });
  },

  closeDetail() {
    this.setData({
      showDetail: false,
      currentItem: null
    });
  },

  async changeStatus(e) {
    const status = e.currentTarget.dataset.status;
    const statusCode = parseInt(e.currentTarget.dataset.statusCode, 10);
    const item = this.data.currentItem;

    // 如果状态相同，不重复请求
    if (item.status === status) {
      wx.showToast({ title: '状态未变化', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '更新中...' });

    try {
      const res = await Ext.Post(Ext.Url + '/api/repair/updateStatus', {
        id: item.id,
        status: status,
        statusCode: statusCode
      });

      if (res.code === 200) {
        wx.showToast({ title: '状态更新成功', icon: 'success' });
        
        // 更新当前显示项的状态
        this.setData({
          'currentItem.status': status,
          'currentItem.statusCode': statusCode
        });
        
        // 刷新列表
        await this.loadData();
        
        // 延迟关闭弹窗，让用户看到更新结果
        setTimeout(() => {
          this.closeDetail();
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '更新失败', icon: 'none' });
      }
    } catch (err) {
      console.error('更新状态失败', err);
      wx.showToast({ title: '网络错误，更新失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 阻止滚动穿透
  preventMove() {
    return;
  }
});