const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    studentId: '',
    studentName: '',
    className: '',
    signDate: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    selectedPeriodKey: 'morning',
    periodOptions: [
      { key: 'morning', label: '早上', range: '07:00-09:00' },
      { key: 'noon', label: '中午', range: '11:30-13:30' },
      { key: 'evening', label: '晚上', range: '17:00-19:00' }
    ],
    reason: '',
    records: [],
    submitting: false
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


  onLoad(options = {}) {
    this.setMenuButtonLayout();
    const today = this.formatDate(new Date());
    const defaultDate = options.date || dataService.getDefaultDate() || today;
    const minDate = new Date(defaultDate);
    minDate.setDate(minDate.getDate() - 365);

    this.setData({
      studentId: options.studentId || '',
      studentName: this.safeDecode(options.studentName || ''),
      className: this.safeDecode(options.className || ''),
      signDate: defaultDate,
      dateRangeStart: this.formatDate(minDate),
      dateRangeEnd: today
    }, () => {
      this.loadSubmittedRecords();
    });
  },

  safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  },

  formatDate(date) {
    const target = new Date(date);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  bindDateChange(e) {
    this.setData({
      signDate: e.detail.value
    }, () => {
      this.loadSubmittedRecords();
    });
  },

  selectPeriod(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) {
      return;
    }

    this.setData({
      selectedPeriodKey: key
    });
  },

  bindReasonInput(e) {
    this.setData({
      reason: e.detail.value
    });
  },

  getSelectedPeriod() {
    return this.data.periodOptions.find(item => item.key === this.data.selectedPeriodKey) || this.data.periodOptions[0];
  },

  async loadSubmittedRecords() {
    if (!this.data.studentId || !this.data.signDate) {
      this.setData({
        records: []
      });
      return;
    }

    const apiRecords = await dataService.getAttendanceByStudentId(this.data.studentId, this.data.signDate);
    const records = apiRecords.slice(0, 5).map(item => ({
      id: item.id,
      signDate: (item.recognizeTime || item.recordDate || '').slice(0, 10),
      periodLabel: item.directionText || item.typeName || '考勤',
      status: item.statusName || '已记录'
    }));

    this.setData({
      records
    });
  },

  async submitMakeupSign() {
    if (!this.data.studentId) {
      wx.showToast({
        title: '请先选择学生',
        icon: 'none'
      });
      return;
    }

    if (!this.data.signDate) {
      wx.showToast({
        title: '请选择补签日期',
        icon: 'none'
      });
      return;
    }

    if (this.data.submitting) {
      return;
    }

    const selectedPeriod = this.getSelectedPeriod();

    this.setData({
      submitting: true
    });

    try {
      await dataService.submitMakeupAttendance({
        studentId: this.data.studentId,
        signDate: this.data.signDate,
        periodKey: selectedPeriod.key,
        reason: this.data.reason.trim()
      });

      this.setData({
        reason: '',
        submitting: false
      }, () => {
        this.loadSubmittedRecords();
      });

      wx.showModal({
        title: '补签成功',
        content: `${this.data.signDate} ${selectedPeriod.label}补签已提交`,
        showCancel: false,
        success: () => {
          this.refreshPreviousPage();
          wx.navigateBack({
            delta: 1
          });
        }
      });
    } catch (error) {
      console.error('补签失败', error);
      this.setData({
        submitting: false
      });
      wx.showToast({
        title: '补签失败',
        icon: 'none'
      });
    }
  },

  refreshPreviousPage() {
    const pages = getCurrentPages();
    const previousPage = pages[pages.length - 2];

    if (!previousPage) {
      return;
    }

    if (typeof previousPage.fetchAttendance === 'function') {
      previousPage.fetchAttendance();
    }

    if (typeof previousPage.updateAttendanceSummary === 'function') {
      previousPage.updateAttendanceSummary();
    }
  },

  btnBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({
          url: '/pages/teacher/attendance/attendance/Attendance'
        });
      }
    });
  }
});
