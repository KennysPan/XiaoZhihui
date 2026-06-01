// utils/MockData.js

class MockData {
  // 存储 keys
  static STORAGE_KEYS = {
    CHILDREN: 'mock_children',
    LEAVE_RECORDS: 'mock_leave_records',
    ATTENDANCE: 'mock_attendance'
  };

  // 初始化 Mock 数据
  static initMockData() {
    console.log('[MockData] 初始化 Mock 数据');
    
    // 初始化孩子数据
    if (!wx.getStorageSync(this.STORAGE_KEYS.CHILDREN)) {
      const mockChildren = [
        { id: 2001, name: '王小明', studentId: '2021001', className: '三年级二班', gradeName: '三年级', relationName: '父亲', statusName: '在读', avatar: '', birthday: '2015-03-15', gender: 1 },
        { id: 2002, name: '王小芳', studentId: '2022002', className: '一年级五班', gradeName: '一年级', relationName: '父亲', statusName: '在读', avatar: '', birthday: '2016-08-22', gender: 2 }
      ];
      wx.setStorageSync(this.STORAGE_KEYS.CHILDREN, mockChildren);
      console.log('[MockData] 孩子数据初始化完成');
    }

    // 初始化请假记录
    if (!wx.getStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS)) {
      const mockLeaveRecords = [
        {
          id: 1001,
          studentId: 2001,
          studentName: '王小明',
          leaveTypeId: 2,
          leaveTypeName: '病假',
          reason: '感冒发烧，需在家休息',
          startTime: '2026-03-20 09:00',
          endTime: '2026-03-20 17:00',
          statusId: 1,
          statusName: '待审批',
          applyTime: '2026-03-19 08:30',
          remark: ''
        },
        {
          id: 1002,
          studentId: 2001,
          studentName: '王小明',
          leaveTypeId: 1,
          leaveTypeName: '事假',
          reason: '参加家庭活动',
          startTime: '2026-03-22 09:00',
          endTime: '2026-03-22 17:00',
          statusId: 2,
          statusName: '已通过',
          applyTime: '2026-03-18 14:20',
          remark: '同意'
        },
        {
          id: 1003,
          studentId: 2002,
          studentName: '王小芳',
          leaveTypeId: 2,
          leaveTypeName: '病假',
          reason: '身体不适',
          startTime: '2026-03-25 09:00',
          endTime: '2026-03-25 17:00',
          statusId: 1,
          statusName: '待审批',
          applyTime: '2026-03-24 10:15',
          remark: ''
        }
      ];
      wx.setStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS, mockLeaveRecords);
      console.log('[MockData] 请假记录初始化完成');
    }

    // 初始化考勤数据
    if (!wx.getStorageSync(this.STORAGE_KEYS.ATTENDANCE)) {
      const mockAttendance = this.generateMockAttendanceData();
      wx.setStorageSync(this.STORAGE_KEYS.ATTENDANCE, mockAttendance);
      console.log('[MockData] 考勤数据初始化完成');
    }
  }

  // 生成模拟考勤数据
  static generateMockAttendanceData() {
    const year = 2026;
    const month = 3;
    const daysInMonth = new Date(year, month, 0).getDate();
    const records = [];
    const statuses = [1, 1, 1, 1, 2, 1, 1, 1, 3, 1, 1, 4, 1, 1, 5, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const weekday = date.getDay();
      
      if (weekday === 0 || weekday === 6) continue;
      
      const statusId = statuses[(day - 1) % statuses.length];
      let checkInTime = null, checkOutTime = null;
      
      if (statusId === 1) {
        checkInTime = '07:55';
        checkOutTime = '17:05';
      } else if (statusId === 2) {
        checkInTime = '08:20';
        checkOutTime = '17:05';
      } else if (statusId === 3) {
        checkInTime = '07:55';
        checkOutTime = '16:30';
      }
      
      records.push({
        id: day,
        studentId: 2001,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        statusId: statusId,
        statusName: this.getStatusName(statusId),
        checkInTime: checkInTime,
        checkOutTime: checkOutTime
      });
    }
    
    return records;
  }

  static getStatusName(statusId) {
    const map = { 1: '正常', 2: '迟到', 3: '早退', 4: '缺勤', 5: '请假' };
    return map[statusId] || '正常';
  }

  // ==================== Mock API 响应 ====================
  static mockResponse(apiUrl, method, data) {
    console.log('[MockData] 拦截请求:', method, apiUrl);
    
    // 孩子列表接口
    if (apiUrl.includes('/api/parent/my-children')) {
      if (method === 'GET') {
        return {
          code: 200,
          data: wx.getStorageSync(this.STORAGE_KEYS.CHILDREN) || []
        };
      }
    }
    
    // 请假记录接口
    if (apiUrl.includes('/api/parent/leave-records')) {
      if (method === 'GET') {
        let records = wx.getStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS) || [];
        if (data && data.studentId) {
          records = records.filter(r => r.studentId === data.studentId);
        }
        return {
          code: 200,
          data: { data: records, total: records.length }
        };
      }
      if (method === 'POST') {
        const records = wx.getStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS) || [];
        const newId = Math.max(...records.map(r => r.id), 0) + 1;
        const newRecord = {
          id: newId,
          ...data,
          statusId: 1,
          statusName: '待审批',
          applyTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        records.push(newRecord);
        wx.setStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS, records);
        return { code: 200, data: newRecord };
      }
      if (method === 'PUT') {
        const records = wx.getStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS) || [];
        const index = records.findIndex(r => r.id === data.id);
        if (index !== -1) {
          records[index] = { ...records[index], ...data };
          wx.setStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS, records);
          return { code: 200, data: records[index] };
        }
        return { code: 404, message: '记录不存在' };
      }
      if (method === 'DELETE') {
        let records = wx.getStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS) || [];
        records = records.filter(r => r.id !== data.id);
        wx.setStorageSync(this.STORAGE_KEYS.LEAVE_RECORDS, records);
        return { code: 200, data: { success: true } };
      }
    }
    
    // 考勤记录接口
    if (apiUrl.includes('/api/attendances')) {
      if (method === 'GET') {
        let records = wx.getStorageSync(this.STORAGE_KEYS.ATTENDANCE) || [];
        if (data && data.studentId) {
          records = records.filter(r => r.studentId === data.studentId);
        }
        if (data && data.start && data.end) {
          records = records.filter(r => r.date >= data.start && r.date <= data.end);
        }
        return {
          code: 200,
          data: { data: records, total: records.length }
        };
      }
    }
    
    // 请假类型字典接口
    if (apiUrl.includes('/api/commons/dict/leave-record-type')) {
      const leaveTypes = [
        { id: 1, name: '事假' },
        { id: 2, name: '病假' },
        { id: 3, name: '公假' },
        { id: 4, name: '其他' }
      ];
      return { code: 200, data: leaveTypes };
    }
    
    // 登录接口 - 注意：登录不应该走 Mock
    if (apiUrl.includes('/api/sessions')) {
      console.log('[MockData] 登录接口不走 Mock，请确保网络连接正常');
      return null;
    }
    
    return null;
  }
  loadMockDetail(id) {
    const mockNotice = {
      id: id,
      title: '关于清明节放假安排的通知',
      content: `
        <p>各位家长：</p>
        <p>根据国家法定节假日规定，<strong>4月4日至4月6日放假三天</strong>，4月7日（周一）正常上课。</p>
        <p>假期安全注意事项：</p>
        <ul>
          <li>注意交通安全</li>
          <li>注意饮食卫生</li>
          <li>合理安排作息时间</li>
          <li>避免前往人群密集场所</li>
        </ul>
        <img src="https://picsum.photos/400/300?random=1" />
        <img src="https://picsum.photos/400/300?random=2" />
        <img src="https://picsum.photos/400/300?random=3" />
        <img src="https://picsum.photos/400/300?random=4" />
        <img src="https://picsum.photos/400/300?random=5" />
        <p>祝您节日安康！</p>
      `,
      publishTime: '2026-03-28',
      isImportant: true,
      viewCount: 245,
      author: '教务处'
    };
    this.setData({ notice: mockNotice });
    this.parseContent(mockNotice.content);
  }
}

module.exports = MockData;