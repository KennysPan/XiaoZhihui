// pages/agent/schools/schools.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    schools: [],
    loading: false
  },

  onLoad() {
    this.loadSchools();
  },

  async loadSchools() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(Ext.Url + '/api/agent/schools');
      if (res.code === 200) {
        this.setData({ schools: res.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.setData({ loading: false });
    }
  },

  replenish(e) {
    const school = e.currentTarget.dataset.school;
    wx.navigateTo({
      url: `/pages/agent/create/create?schoolId=${school.id}&schoolName=${school.name}`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});