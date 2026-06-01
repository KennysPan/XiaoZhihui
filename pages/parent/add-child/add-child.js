const Ext = require('../utils/Ext');

Page({
  data: {
    idCard: '',
    canSearch: false,
    step: 1,
    searching: false,
    adding: false,
    searchResult: null,
    relationOptions: ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '其他'],
    relationIndex: 0,
    isRealData: false
  },

  onIdCardInput(e) {
    const value = e.detail.value.toUpperCase();
    this.setData({ 
      idCard: value,
      canSearch: this.validateIdCard(value)
    });
  },

  validateIdCard(id) {
    if (!id || id.length !== 18) return false;
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return reg.test(id);
  },

  async nextStep() {
    if (this.data.step === 1) {
      if (!this.data.canSearch) {
        wx.showToast({ title: '请输入正确的18位身份证号', icon: 'none' });
        return;
      }
      
      this.setData({ searching: true });
      wx.showLoading({ title: '查询中...', mask: true });
      
      try {
        // 根据身份证号查询学生信息
        const res = await Ext.Get(`${Ext.Url}/api/child/info`, { idCard: this.data.idCard });
        if ((res.code === 0 || res.code === 20000) && res.data) {
          this.setData({ 
            searchResult: res.data,
            isRealData: true,
            step: 2
          });
        } else {
          wx.showToast({ title: res.message || '未找到该学生', icon: 'none' });
        }
      } catch (err) {
        console.error('查询学生失败', err);
        wx.showToast({ title: '查询失败，请重试', icon: 'none' });
      } finally {
        this.setData({ searching: false });
        wx.hideLoading();
      }
    }
  },

  prevStep() {
    if (this.data.step === 2) {
      this.setData({ step: 1 });
    }
  },

  onRelationChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ relationIndex: index });
  },

  async confirmAdd() {
    if (!this.data.searchResult) return;
    
    this.setData({ adding: true });
    wx.showLoading({ title: '绑定中...', mask: true });
    
    try {
      const res = await Ext.Post(`${Ext.Url}/api/parent/add-child`, {
        childId: this.data.searchResult.id,
        relationName: this.data.relationOptions[this.data.relationIndex],
        idCard: this.data.idCard
      });
      
      if (res.code === 0 || res.code === 20000) {
        this.setData({ step: 3 });
        wx.showToast({ title: '绑定成功', icon: 'success' });
      } else {
        wx.showToast({ title: res.message || '绑定失败', icon: 'none' });
      }
    } catch (err) {
      console.error('绑定孩子失败', err);
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' });
    } finally {
      this.setData({ adding: false });
      wx.hideLoading();
    }
  },

  continueAdd() {
    this.setData({
      step: 1,
      idCard: '',
      canSearch: false,
      searchResult: null,
      relationIndex: 0,
      isRealData: false
    });
  },

  backToList() {
    const pages = getCurrentPages();
    const targetPage = pages.find(page => page.route === 'pages/parent-management-student/parent-management-student');
    if (targetPage && targetPage.loadChildren) {
      targetPage.loadChildren();
    }
    wx.navigateBack();
  },

  goBack() {
    wx.navigateBack();
  }
});
