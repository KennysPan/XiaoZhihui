const Ext = require('../utils/Ext');

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
    showTimelineModal: false,
    timelineData: [],
    selectedDate: null,
    selectedDateStr: '',
    selectedRecord: null,
    filterYear: 2026,
    filterMonth: 5,
    showDatePicker: false,
    loading: false,
    years: [2024, 2025, 2026, 2027],
    months: [
      { value: 1, name: '1月' }, { value: 2, name: '2月' }, { value: 3, name: '3月' },
      { value: 4, name: '4月' }, { value: 5, name: '5月' }, { value: 6, name: '6月' },
      { value: 7, name: '7月' }, { value: 8, name: '8月' }, { value: 9, name: '9月' },
      { value: 10, name: '10月' }, { value: 11, name: '11月' }, { value: 12, name: '12月' }
    ],
    attendanceTypes: {
      1: { name: '正常', icon: '✅', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
      2: { name: '迟到', icon: '⏰', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f' },
      3: { name: '早退', icon: '🏃', color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591' },
      4: { name: '缺勤', icon: '❌', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7' },
      6: { name: '请假', icon: '📝', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' }
    }
  },

  onLoad(options) {
    console.log('[Attendance] 页面加载');
    if (options.childId) {
      this.setData({ selectedChildId: parseInt(options.childId) });
    }
    this.loadChildren();
  },

  onShow() {
    console.log('[Attendance] 页面显示');
    if (this.data.selectedChildId) {
      this.loadAttendanceData();
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
      const res = await Ext.Get(`${Ext.Url}/api/attendances/results`, {
        studentId: this.data.selectedChildId,
        startDate: startDate,
        endDate: endDate
      });
      
      console.log('[Attendance] 考勤数据:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const items = res.data.items || [];
        this.processAttendanceData(items);
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

  // 处理考勤数据
  processAttendanceData(records) {
    const statistics = {
      totalDays: records.length,
      present: records.filter(r => r.statusId === 1).length,
      late: records.filter(r => r.statusId === 2).length,
      earlyLeave: records.filter(r => r.statusId === 3).length,
      absent: records.filter(r => r.statusId === 4).length,
      leave: records.filter(r => r.statusId === 6).length
    };
    
    // 格式化记录
    const formattedRecords = records.map(record => ({
      ...record,
      dateStr: record.attendanceDate,
      statusName: this.data.attendanceTypes[record.statusId]?.name || '未知',
      timelineDetails: this.generateTimelineForDate(record)
    }));
    
    this.setData({ 
      statistics, 
      attendanceRecords: formattedRecords 
    });
  },

  // 生成时间线数据
  generateTimelineForDate(record) {
    const timeline = [];
    
    if (record.statusId === 6) {
      timeline.push({ 
        time: '08:30', 
        title: '请假申请', 
        description: record.remark || '请假中', 
        icon: '📝', 
        color: '#1890ff' 
      });
      return timeline;
    }
    if (record.statusId === 4) {
      timeline.push({ 
        time: '全天', 
        title: '缺勤', 
        description: '今日未到校打卡', 
        icon: '❌', 
        color: '#ff4d4f' 
      });
      return timeline;
    }
    if (record.firstCheckTime) {
      timeline.push({ 
        time: record.firstCheckTime, 
        title: '入校打卡', 
        description: record.statusId === 2 ? '迟到打卡' : '正常到校', 
        icon: record.statusId === 2 ? '⏰' : '🚪', 
        color: record.statusId === 2 ? '#faad14' : '#52c41a' 
      });
    }
    if (record.lastCheckTime) {
      timeline.push({ 
        time: record.lastCheckTime, 
        title: '离校打卡', 
        description: record.statusId === 3 ? '早退离校' : '正常离校', 
        icon: record.statusId === 3 ? '🏃' : '🏠', 
        color: record.statusId === 3 ? '#fa8c16' : '#52c41a' 
      });
    }
    if (timeline.length === 0) {
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

  openTimelineModal(e) {
    const date = e.currentTarget.dataset.date;
    const record = this.data.attendanceRecords.find(r => r.attendanceDate === date);
    if (record) {
      this.setData({
        showTimelineModal: true,
        selectedDate: date,
        selectedDateStr: record.dateStr,
        selectedRecord: record,
        timelineData: record.timelineDetails
      });
    }
  },

  closeTimelineModal() {
    this.setData({ showTimelineModal: false, selectedRecord: null, timelineData: [] });
  },

  stopPropagation() {},
  
  changeMonth(e) {
    const { year, month } = e.currentTarget.dataset;
    if (year && month) {
      this.setData({ filterYear: year, filterMonth: month });
      this.loadAttendanceData();
    }
  },
  
  openDatePicker() { this.setData({ showDatePicker: true }); },
  closeDatePicker() { this.setData({ showDatePicker: false }); },
  onYearChange(e) { this.setData({ filterYear: parseInt(e.detail.value) }); },
  onMonthChange(e) { this.setData({ filterMonth: parseInt(e.detail.value) }); },
  confirmFilter() { this.closeDatePicker(); this.loadAttendanceData(); },
  
  getWeekdayName(weekday) { 
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday]; 
  },
  
  goBack() { 
    wx.navigateBack(); 
  }
});
