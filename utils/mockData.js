// utils/mockData.js
class MockData {
  static STORAGE_KEYS = {
    AGENT_INFO: 'agentInfo',
    AGENT_SCHOOLS: 'agent_schools',
    AGENT_ORDERS: 'agent_orders',
    AGENT_INCOME: 'agent_income'
  };

  static parseDateTime(value) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value.replace(' ', 'T'));
    }
    return new Date(value);
  }

  static getTime(value) {
    const time = this.parseDateTime(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  // 初始化 Mock 数据（代理商）
  static initMockData() {
    console.log('[MockData] 初始化代理商 Mock 数据');
    
    // 模拟代理商信息
    if (!wx.getStorageSync(this.STORAGE_KEYS.AGENT_INFO)) {
      const agentInfo = {
        id: 1001,
        name: '张明',
        phone: '13912345678',
        avatar: 'https://via.placeholder.com/150',
        level: '金牌代理',
        joinDate: '2024-01-15'
      };
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_INFO, agentInfo);
    }

    // 模拟学校列表
    if (!wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS)) {
      const mockSchools = [
        { id: 1, name: '第一小学', address: '文化路66号', contactPerson: '李校长', contactPhone: '13800000001', studentCount: 1240, badgeStock: 500, status: 'active', createTime: '2024-03-01' },
        { id: 2, name: '第二实验小学', address: '育才路88号', contactPerson: '王主任', contactPhone: '13800000002', studentCount: 980, badgeStock: 230, status: 'active', createTime: '2024-03-05' },
        { id: 3, name: '阳光双语学校', address: '花园路18号', contactPerson: '张校长', contactPhone: '13800000003', studentCount: 560, badgeStock: 45, status: 'active', createTime: '2024-03-10' },
        { id: 4, name: '红旗小学', address: '红旗街1号', contactPerson: '赵老师', contactPhone: '13800000004', studentCount: 720, badgeStock: 0, status: 'inactive', createTime: '2024-03-15' },
        { id: 5, name: '育才中学', address: '育新路99号', contactPerson: '孙主任', contactPhone: '13800000005', studentCount: 1500, badgeStock: 120, status: 'active', createTime: '2024-03-20' }
      ];
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS, mockSchools);
    }

    // 模拟订单
    if (!wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS)) {
      const mockOrders = [
        { id: 'ORD202604001', schoolId: 1, schoolName: '第一小学', badgeCount: 200, totalAmount: 1000, unitPrice: 5, status: 'completed', createTime: '2026-04-28 10:30:00', remark: '急需补货', logisticsNo: 'SF1234567890' },
        { id: 'ORD202604002', schoolId: 2, schoolName: '第二实验小学', badgeCount: 100, totalAmount: 500, unitPrice: 5, status: 'shipped', createTime: '2026-04-25 14:20:00', remark: '', logisticsNo: 'YT9876543210' },
        { id: 'ORD202604003', schoolId: 3, schoolName: '阳光双语学校', badgeCount: 300, totalAmount: 1500, unitPrice: 5, status: 'pending', createTime: '2026-04-29 09:15:00', remark: '尽快发货' },
        { id: 'ORD202604004', schoolId: 1, schoolName: '第一小学', badgeCount: 150, totalAmount: 750, unitPrice: 5, status: 'completed', createTime: '2026-04-20 16:45:00', remark: '', logisticsNo: 'ST5554443332' },
        { id: 'ORD202604005', schoolId: 4, schoolName: '红旗小学', badgeCount: 80, totalAmount: 400, unitPrice: 5, status: 'pending', createTime: '2026-04-29 11:30:00', remark: '新合作学校' }
      ];
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_ORDERS, mockOrders);
    }

    // 模拟收益明细
    if (!wx.getStorageSync(this.STORAGE_KEYS.AGENT_INCOME)) {
      const mockIncome = {
        totalIncome: 28600,
        thisMonthIncome: 3420,
        records: [
          { id: 1, date: '2026-04-28', amount: 1280, orderId: 'ORD202604001', commission: 128, type: '订单收益' },
          { id: 2, date: '2026-04-27', amount: 500, orderId: 'ORD202604002', commission: 50, type: '订单收益' },
          { id: 3, date: '2026-04-25', amount: 750, orderId: 'ORD202604004', commission: 75, type: '订单收益' },
          { id: 4, date: '2026-04-22', amount: 300, orderId: '', commission: 300, type: '活动奖励' },
          { id: 5, date: '2026-04-20', amount: 200, orderId: '', commission: 200, type: '推荐奖励' },
          { id: 6, date: '2026-04-18', amount: 450, orderId: 'ORD202603015', commission: 45, type: '订单收益' }
        ]
      };
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_INCOME, mockIncome);
    }
  }

  // 获取代理商信息
  static getAgentInfo() {
    return wx.getStorageSync(this.STORAGE_KEYS.AGENT_INFO) || null;
  }

  // 统一拦截
  static getTeacherProfile() {
    return {
      id: 103,
      teacherId: 103,
      name: 'Teacher Demo',
      realName: 'Teacher Demo',
      userName: 'g123456',
      phone: '13800000000',
      role: 3,
      classIds: ['101', '102'],
      classes: this.getClasses()
    };
  }

  static getClasses() {
    return [
      { id: '101', classId: '101', name: 'Class 1', className: 'Class 1', gradeName: 'Grade 1', roomNo: 'A101', courseName: 'General', studentCount: 3, bgColor: '#74E2B6' },
      { id: '102', classId: '102', name: 'Class 2', className: 'Class 2', gradeName: 'Grade 2', roomNo: 'A102', courseName: 'General', studentCount: 2, bgColor: '#87CEEB' }
    ];
  }

  static getDefaultClass() {
    return this.getClasses()[0];
  }

  static getClassById(classId) {
    return this.getClasses().find(item => String(item.classId) === String(classId) || String(item.id) === String(classId)) || this.getDefaultClass();
  }

  static getStudents() {
    return [
      { id: 10101, studentId: 10101, name: 'Student A', studentName: 'Student A', gender: 1, genderText: 'Male', classId: '101', className: 'Class 1', studentNumber: 'S10101' },
      { id: 10102, studentId: 10102, name: 'Student B', studentName: 'Student B', gender: 0, genderText: 'Female', classId: '101', className: 'Class 1', studentNumber: 'S10102' },
      { id: 10103, studentId: 10103, name: 'Student C', studentName: 'Student C', gender: 1, genderText: 'Male', classId: '101', className: 'Class 1', studentNumber: 'S10103' },
      { id: 10201, studentId: 10201, name: 'Student D', studentName: 'Student D', gender: 0, genderText: 'Female', classId: '102', className: 'Class 2', studentNumber: 'S10201' },
      { id: 10202, studentId: 10202, name: 'Student E', studentName: 'Student E', gender: 1, genderText: 'Male', classId: '102', className: 'Class 2', studentNumber: 'S10202' }
    ];
  }

  static getStudentById(studentId) {
    return this.getStudents().find(item => String(item.id) === String(studentId) || String(item.studentId) === String(studentId)) || this.getStudents()[0];
  }

  static getLeaveList() {
    return [
      { id: 1, studentId: 10101, name: '李明', leaveName: '病假申请', date: '2026-05-25 08:00:00', endTime: '2026-05-25 17:00:00', status: '未处理', statusId: 0, type: '病假', typeId: 1, teacher: '', reason: '发烧需要就医休息', approverRemark: '' },
      { id: 2, studentId: 10102, name: '王小雨', leaveName: '事假申请', date: '2026-05-24 08:00:00', endTime: '2026-05-24 12:00:00', status: '已通过', statusId: 1, type: '事假', typeId: 2, teacher: '王老师', reason: '家中有事需要请假半天', approverRemark: '同意请假' }
    ];
  }

  static getLeaveByIndex(index) {
    const list = this.getLeaveList();
    return list[Number(index) || 0] || list[0];
  }
  static mockResponse(apiUrl, method, data) {
    // 代理商登录
    if (apiUrl.includes('/api/agent/login') && method === 'POST') {
      if (data.phone === '13912345678' && data.password === '123456') {
        return {
          code: 200,
          data: {
            token: 'mock_token_' + Date.now(),
            agentInfo: this.getAgentInfo()
          },
          message: '登录成功'
        };
      }
      return { code: 401, message: '手机号或密码错误' };
    }
    
    // 获取代理商信息
    if (apiUrl.includes('/api/agent/info') && method === 'GET') {
      return { code: 200, data: this.getAgentInfo() };
    }
    
    // 学校列表
    if (apiUrl.includes('/api/agent/schools') && method === 'GET') {
      const schools = wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS) || [];
      // 支持搜索
      const keyword = data.keyword || '';
      let filteredSchools = schools;
      if (keyword) {
        filteredSchools = schools.filter(s => s.name.includes(keyword) || s.address.includes(keyword));
      }
      return { code: 200, data: filteredSchools };
    }
    
    // 添加学校
    if (apiUrl.includes('/api/agent/schools/add') && method === 'POST') {
      const schools = wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS) || [];
      const newSchool = {
        id: Date.now(),
        ...data,
        status: 'active',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      schools.push(newSchool);
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS, schools);
      return { code: 200, data: newSchool, message: '添加成功' };
    }
    
    // 更新学校库存
    if (apiUrl.includes('/api/agent/schools/updateStock') && method === 'POST') {
      const schools = wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS) || [];
      const index = schools.findIndex(s => s.id === data.schoolId);
      if (index !== -1) {
        schools[index].badgeStock = data.stock;
        wx.setStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS, schools);
        return { code: 200, message: '更新成功' };
      }
      return { code: 404, message: '学校不存在' };
    }
    
    // 订单列表
    if (apiUrl.includes('/api/agent/orders') && method === 'GET') {
      let orders = wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS) || [];
      // 按状态筛选
      if (data.status && data.status !== 'all') {
        orders = orders.filter(o => o.status === data.status);
      }
      // 按时间倒序
      orders.sort((a, b) => this.getTime(b.createTime) - this.getTime(a.createTime));
      return { code: 200, data: orders };
    }
    
    // 创建订单
    if (apiUrl.includes('/api/agent/orders/create') && method === 'POST') {
      const orders = wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS) || [];
      const schools = wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS) || [];
      
      // 生成订单号
      const orderId = 'ORD' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\s/g, '') + Math.floor(Math.random() * 1000);
      
      const newOrder = {
        id: orderId,
        schoolId: data.schoolId,
        schoolName: data.schoolName,
        badgeCount: data.badgeCount,
        totalAmount: data.badgeCount * 5,
        unitPrice: 5,
        status: 'pending',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        remark: data.remark || ''
      };
      orders.unshift(newOrder);
      wx.setStorageSync(this.STORAGE_KEYS.AGENT_ORDERS, orders);
      
      // 更新学校库存（减少）
      const schoolIndex = schools.findIndex(s => s.id === data.schoolId);
      if (schoolIndex !== -1 && schools[schoolIndex].badgeStock >= data.badgeCount) {
        schools[schoolIndex].badgeStock -= data.badgeCount;
        wx.setStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS, schools);
      }
      
      return { code: 200, data: newOrder, message: '订单创建成功' };
    }
    
    // 统计数据
    if (apiUrl.includes('/api/agent/statistics') && method === 'GET') {
      const orders = wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS) || [];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const monthOrders = orders.filter(o => {
        const orderDate = this.parseDateTime(o.createTime);
        return orderDate.getMonth() + 1 === currentMonth && orderDate.getFullYear() === currentYear;
      });
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalSchools = (wx.getStorageSync(this.STORAGE_KEYS.AGENT_SCHOOLS) || []).filter(s => s.status === 'active').length;
      
      // 今日收益（今日完成的订单总额的10%）
      const today = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter(o => o.createTime.startsWith(today) && o.status === 'completed');
      const todayIncome = todayOrders.reduce((sum, o) => sum + o.totalAmount * 0.1, 0);
      
      // 本月收益
      const monthIncome = monthOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount * 0.1, 0);
      
      return {
        code: 200,
        data: {
          todayIncome: Math.floor(todayIncome),
          monthOrderCount: monthOrders.length,
          totalSchools,
          pendingOrders,
          monthIncome: Math.floor(monthIncome),
          totalIncome: wx.getStorageSync(this.STORAGE_KEYS.AGENT_INCOME)?.totalIncome || 28600
        }
      };
    }
    
    // 收益明细
    if (apiUrl.includes('/api/agent/income/records') && method === 'GET') {
      const income = wx.getStorageSync(this.STORAGE_KEYS.AGENT_INCOME) || {};
      let records = income.records || [];
      // 分页
      const page = data.page || 1;
      const pageSize = data.pageSize || 10;
      const start = (page - 1) * pageSize;
      const paginatedRecords = records.slice(start, start + pageSize);
      return {
        code: 200,
        data: {
          total: records.length,
          records: paginatedRecords,
          totalIncome: income.totalIncome || 0,
          thisMonthIncome: income.thisMonthIncome || 0
        }
      };
    }
    
    // 订单详情
    if (apiUrl.includes('/api/agent/order/detail') && method === 'GET') {
      const orders = wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS) || [];
      const order = orders.find(o => o.id === data.orderId);
      if (order) {
        return { code: 200, data: order };
      }
      return { code: 404, message: '订单不存在' };
    }
    
    // 取消订单
    if (apiUrl.includes('/api/agent/order/cancel') && method === 'POST') {
      const orders = wx.getStorageSync(this.STORAGE_KEYS.AGENT_ORDERS) || [];
      const index = orders.findIndex(o => o.id === data.orderId);
      if (index !== -1 && orders[index].status === 'pending') {
        orders[index].status = 'cancelled';
        wx.setStorageSync(this.STORAGE_KEYS.AGENT_ORDERS, orders);
        return { code: 200, message: '取消成功' };
      }
      return { code: 400, message: '无法取消该订单' };
    }
    
    return null;
  }
}

module.exports = MockData;
