const Ext = require('../utils/Ext');
const dataService = require('../../../utils/dataService.js');


Page({
  data: {
    children: [],
    selectedChild: null,
    selectedChildId: null,
    selectedChildIndex: null,
    statistics: {
      totalDays: 0,
      present: 0,
      late: 0,
      earlyLeave: 0,
      absent: 0,
      leave: 0
    },
    attendanceRecords: [],
    attendanceStatusDict: [],
    showTimelineModal: false,
    timelineData: [],
    selectedDate: null,
    selectedDateStr: '',
    selectedRecord: null,
    filterYear: 2026,
    filterMonth: 5,
    showDatePicker: false,
    loading: false,
    years: [2024, 2025, 2026, 2027, 2028],
    months: [
      { value: 1, name: '1月' }, { value: 2, name: '2月' }, { value: 3, name: '3月' },
      { value: 4, name: '4月' }, { value: 5, name: '5月' }, { value: 6, name: '6月' },
      { value: 7, name: '7月' }, { value: 8, name: '8月' }, { value: 9, name: '9月' },
      { value: 10, name: '10月' }, { value: 11, name: '11月' }, { value: 12, name: '12月' }
    ],
    // 考勤状态映射（根据API返回的resultStatus）
    attendanceTypes: {
      1: { name: '正常', icon: '✅', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
      2: { name: '迟到', icon: '⏰', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f' },
      3: { name: '早退', icon: '🏃', color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591' },
      4: { name: '缺勤', icon: '❌', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7' },
      5: { name: '外出', icon: '🚪', color: '#722ed1', bgColor: '#f9f0ff', borderColor: '#d3adf7' },
      6: { name: '请假', icon: '📝', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
      7: { name: '补卡', icon: '🔄', color: '#13c2c2', bgColor: '#e6fffb', borderColor: '#87e8de' },
      8: { name: '返校', icon: '🏫', color: '#2f54eb', bgColor: '#f0f5ff', borderColor: '#adc6ff' },
      9: { name: '住宿', icon: '🏠', color: '#531dab', bgColor: '#f9f0ff', borderColor: '#d3adf7' },
      11: { name: '节假日', icon: '🎉', color: '#8c8c8c', bgColor: '#f5f5f5', borderColor: '#d9d9d9' },
      12: { name: '未知', icon: '❓', color: '#bfbfbf', bgColor: '#fafafa', borderColor: '#e8e8e8' }
    }
  },

  onLoad(options) {
    console.log('[Attendance] 页面加载');
    if (!Ext.isLogin()) {
      Ext.handleTokenExpired();
      return;
    }
    if (options.childId) {
      this.setData({ selectedChildId: parseInt(options.childId) });
    }
    this.loadAttendanceDictionaries();
    this.loadChildren();
    this.setStatusBarHeight();
  },

  onShow() {
    console.log('[Attendance] 页面显示');
    if (!Ext.isLogin()) {
      Ext.handleTokenExpired();
      return;
    }
    if (this.data.selectedChildId) {
      this.loadAttendanceData();
    }
  },

  async loadAttendanceDictionaries() {
    const dict = await dataService.fetchDictionary('attendance-statuses');
    const attendanceTypes = { ...this.data.attendanceTypes };

    dict.forEach(item => {
      const key = String(item.value);
      attendanceTypes[key] = {
        ...(attendanceTypes[key] || this.data.attendanceTypes[12]),
        name: item.name
      };
    });

    this.setData({
      attendanceStatusDict: dict,
      attendanceTypes
    });
    return dict;
  },

  getAttendanceType(statusId) {
    return this.data.attendanceTypes[statusId] || this.data.attendanceTypes[12];
  },

  // 设置状态栏高度
  setStatusBarHeight() {
    try {
      const app = getApp();
      let statusBarHeight = 44;
      if (app && app.globalData && app.globalData.statusBarHeight) {
        statusBarHeight = app.globalData.statusBarHeight;
      } else {
        const systemInfo = wx.getSystemInfoSync();
        statusBarHeight = systemInfo.statusBarHeight || 44;
      }
      this.setData({ statusBarHeight });
    } catch (err) {
      console.error('设置状态栏高度失败:', err);
    }
  },

  // 加载孩子列表
  async loadChildren() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      console.log('[Attendance] 家长信息:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = res.data.students || [];
        const children = students.map((s, index) => ({
          id: s.studentId,
          uniqueKey: `${s.studentId || s.studentNumber || s.id || 'child'}-${index}`,
          name: s.studentName,
          className: s.className,
          relationName: s.relationName
        }));
        
        this.setData({ children });
        
        // 选中孩子
        let selectedChild = null;
        let selectedChildIndex = -1;
        if (this.data.selectedChildId) {
          selectedChildIndex = children.findIndex(c => c.id === this.data.selectedChildId);
          selectedChild = children[selectedChildIndex];
        }
        if (!selectedChild && children.length > 0) {
          selectedChildIndex = 0;
          selectedChild = children[0];
        }
        
        if (selectedChild) {
          this.setData({
            selectedChild: selectedChild,
            selectedChildId: selectedChild.id,
            selectedChildIndex
          });
          this.loadAttendanceData();
        }
      } else {
        console.log('[Attendance] 无孩子数据');
        this.setData({ children: [] });
      }
    } catch (err) {
      console.error('[Attendance] 加载孩子失败:', err);
      this.setData({ children: [] });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择孩子
  selectChild(e) {
    const index = e.currentTarget.dataset.index;
    const child = this.data.children[index];
    
    console.log('[Attendance] 选择孩子:', child.name);
    
    this.setData({
      selectedChild: child,
      selectedChildId: child.id,
      selectedChildIndex: index
    });
    
    this.loadAttendanceData();
  },

  // 加载考勤数据
  async loadAttendanceData() {
    if (!this.data.selectedChildId) return;
    
    this.setData({ loading: true });
    const { filterYear, filterMonth } = this.data;
    const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(filterYear, filterMonth, 0).getDate();
    const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${lastDay}`;
    
    try {
      const [statusDict, res] = await Promise.all([
        this.loadAttendanceDictionaries(),
        Ext.Get(`${Ext.Url}/api/attendances/results`, {
          studentId: this.data.selectedChildId,
          startDate: startDate,
          endDate: endDate
        })
      ]);
      
      console.log('[Attendance] 考勤数据:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        // 提取items数组
        const items = res.data.items || [];
        this.processAttendanceData(items, statusDict);
      } else {
        this.setData({ 
          attendanceRecords: [], 
          statistics: { totalDays: 0, present: 0, late: 0, earlyLeave: 0, absent: 0, leave: 0 } 
        });
      }
    } catch (err) {
      console.error('[Attendance] 加载考勤数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理考勤数据（适配真实API字段）
  processAttendanceData(records, statusDict = this.data.attendanceStatusDict) {
    // 统计各状态数量
    const statistics = {
      totalDays: records.length,
      present: records.filter(r => r.resultStatus === 1).length,
      late: records.filter(r => r.resultStatus === 2).length,
      earlyLeave: records.filter(r => r.resultStatus === 3).length,
      absent: records.filter(r => r.resultStatus === 4).length,
      leave: records.filter(r => r.resultStatus === 6).length
    };
    
    // 格式化记录列表
    const formattedRecords = records.map(record => {
      // 格式化日期
      let dateStr = record.attendanceDate;
      if (dateStr && dateStr.includes(' ')) {
        dateStr = dateStr.split(' ')[0];
      }
      
      // 获取星期几
      const weekday = this.getWeekdayName(dateStr);
      
      // 处理打卡时间
      let checkInTime = null;
      let checkOutTime = null;
      
      if (record.firstInTime) {
        checkInTime = record.firstInTime.includes(' ') 
          ? record.firstInTime.split(' ')[1].substring(0, 5)
          : record.firstInTime.substring(0, 5);
      }
      
      if (record.lastOutTime) {
        checkOutTime = record.lastOutTime.includes(' ')
          ? record.lastOutTime.split(' ')[1].substring(0, 5)
          : record.lastOutTime.substring(0, 5);
      }
      
      // 如果没有firstInTime和lastOutTime，但resultStatus是正常，可能没有打卡记录
      if (record.resultStatus === 1 && !checkInTime && !checkOutTime) {
        checkInTime = '--:--';
        checkOutTime = '--:--';
      }
      
      return {
        id: record.id,
        attendanceDate: record.attendanceDate,
        dateStr: dateStr,
        weekday: weekday,
        statusId: record.resultStatus,
        statusName: dataService.resolveDictionaryName(
          statusDict,
          record.resultStatus,
          record.resultStatusName,
          '未知'
        ),
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        periodText: record.periodText,
        remark: record.remark,
        schoolName: record.schoolName,
        className: record.className,
        studentName: record.studentName
      };
    });
    
    // 按日期倒序排列（最新的在前面）
    formattedRecords.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
    
    this.setData({ 
      statistics, 
      attendanceRecords: formattedRecords 
    });
  },

  // 获取星期几
  getWeekdayName(dateStr) {
    if (!dateStr) return '--';
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
  },

  // 打开时间线弹窗
  openTimelineModal(e) {
    const date = e.currentTarget.dataset.date;
    const record = this.data.attendanceRecords.find(r => r.attendanceDate === date || r.dateStr === date);
    
    if (record) {
      const timelineData = this.generateTimeline(record);
      this.setData({
        showTimelineModal: true,
        selectedDate: date,
        selectedDateStr: record.dateStr,
        selectedRecord: record,
        timelineData: timelineData
      });
    }
  },

  // 生成时间线数据
  generateTimeline(record) {
    const timeline = [];
    const statusType = this.getAttendanceType(record.statusId);
    
    // 请假
    if (record.statusId === 6) {
      timeline.push({ 
        time: '--:--', 
        title: record.statusName || statusType.name,
        description: record.remark || `已${record.statusName || statusType.name}`,
        icon: statusType.icon,
        color: statusType.color
      });
      return timeline;
    }
    
    // 缺勤
    if (record.statusId === 4) {
      timeline.push({ 
        time: '全天', 
        title: record.statusName || statusType.name,
        description: '今日未到校打卡', 
        icon: statusType.icon,
        color: statusType.color
      });
      return timeline;
    }
    
    // 正常打卡
    if (record.checkInTime && record.checkInTime !== '--:--') {
      timeline.push({ 
        time: record.checkInTime, 
        title: '入校打卡', 
        description: record.statusId === 2 ? `${record.statusName || statusType.name}打卡` : '正常到校',
        icon: record.statusId === 2 ? statusType.icon : '🚪',
        color: record.statusId === 2 ? statusType.color : '#52c41a'
      });
    }
    
    if (record.checkOutTime && record.checkOutTime !== '--:--') {
      timeline.push({ 
        time: record.checkOutTime, 
        title: '离校打卡', 
        description: record.statusId === 3 ? `${record.statusName || statusType.name}离校` : '正常离校',
        icon: record.statusId === 3 ? statusType.icon : '🏠',
        color: record.statusId === 3 ? statusType.color : '#52c41a'
      });
    }
    
    // 时段说明
    if (record.periodText && timeline.length === 0) {
      timeline.push({ 
        time: '--:--', 
        title: record.periodText, 
        description: record.remark || '考勤记录', 
        icon: '📋', 
        color: '#999' 
      });
    }
    
    // 无打卡记录
    if (timeline.length === 0 && record.statusId === 1) {
      timeline.push({ 
        time: '--:--', 
        title: '暂无打卡记录', 
        description: '今日暂无考勤数据', 
        icon: '⏳', 
        color: '#999' 
      });
    }
    
    return timeline;
  },

  // 关闭弹窗
  closeTimelineModal() {
    this.setData({ 
      showTimelineModal: false, 
      selectedRecord: null, 
      timelineData: [] 
    });
  },

  stopPropagation() {},
  
  // 日期选择器
  openDatePicker() { 
    this.setData({ showDatePicker: true }); 
  },
  
  closeDatePicker() { 
    this.setData({ showDatePicker: false }); 
  },
  
  onYearChange(e) {
    const index = parseInt(e.detail.value);
    const selectedYear = this.data.years[index];
    this.setData({ filterYear: selectedYear });
    console.log('[考勤] 年份变更:', selectedYear);
  },
  
  onMonthChange(e) {
    const index = parseInt(e.detail.value);
    const selectedMonth = this.data.months[index].value;
    this.setData({ filterMonth: selectedMonth });
    console.log('[考勤] 月份变更:', selectedMonth);
  },
  
  confirmFilter() { 
    this.closeDatePicker(); 
    this.loadAttendanceData(); 
  },
  
  goBack() { 
    wx.navigateBack(); 
  }
});
