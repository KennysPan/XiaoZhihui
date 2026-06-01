Page({
  data: {
    url: 'https://www.kennyspan.xyz:8082',
    entries: [
      { role: 'teacher', title: '教师端', desc: '班级、考勤、请假与评价管理', tag: '教学管理', path: '/pages/teacher/auth/login/login' },
      { role: 'parent', title: '家长端', desc: '孩子、考勤、请假与校园通知', tag: '家校协同', path: '/pages/parent/login/login' },
      { role: 'agent', title: '代理商端', desc: '学校、订单、补货与收益管理', tag: '渠道运营', path: '/pages/agent/login/login' }
    ]
  },

  onLoad(options = {}) {
    if (options.manual === '1') return;

    const savedPath = wx.getStorageSync('selected_role_path');
    if (savedPath) {
      wx.redirectTo({ url: savedPath });
    }
  },

  chooseRole(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.path) return;
    wx.setStorageSync('selected_role', item.role);
    wx.setStorageSync('selected_role_path', item.path);
    wx.navigateTo({ url: item.path });
  }
});
