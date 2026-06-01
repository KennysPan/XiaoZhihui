const dataService = require('../../../../utils/dataService.js');

const ANNOUNCEMENT_STORAGE_KEY = 'home_announcement_records_v2';

function getDefaultAnnouncements() {
  return [];
}

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    announcementList: [],
    detailVisible: false,
    selectedAnnouncement: null
  },
  setMenuButtonLayout() {
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    if (menu && menu.top && menu.height) {
      this.setData({
        menuButtonTop: menu.top,
        menuButtonHeight: menu.height
      });
    }
  },


  onLoad() {
    this.setMenuButtonLayout();
    this.loadAnnouncements();
  },

  async loadAnnouncements() {
    try {
      const apiAnnouncements = await dataService.getAnnouncements();
      this.setData({
        announcementList: apiAnnouncements.length ? apiAnnouncements : this.getAnnouncementList()
      });
    } catch (error) {
      this.setData({
        announcementList: this.getAnnouncementList()
      });
    }
  },

  getAnnouncementList() {
    const records = wx.getStorageSync(ANNOUNCEMENT_STORAGE_KEY);
    if (Array.isArray(records)) {
      return records;
    }

    return getDefaultAnnouncements();
  },

  showAnnouncementDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) {
      return;
    }

    this.setData({
      selectedAnnouncement: item,
      detailVisible: true
    });
  },

  hideAnnouncementDetail() {
    this.setData({
      selectedAnnouncement: null,
      detailVisible: false
    });
  },

  btnBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/teacher/main/home/home'
        });
      }
    });
  },

  noop() {}
});
