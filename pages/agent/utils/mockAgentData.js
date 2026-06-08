function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function resolveListData(data, fallback = []) {
  return Array.isArray(data) && data.length ? data : clone(fallback);
}

function getRepairStatusClass(status) {
  if (status === 0 || status === '0' || status === '未维修') {
    return 'pending';
  }
  if (status === 1 || status === '1' || status === '维修中') {
    return 'processing';
  }
  if (status === 2 || status === '2' || status === '已维修') {
    return 'done';
  }
  return 'pending';
}

function normalizeRepairList(list = []) {
  return (Array.isArray(list) ? list : []).map(item => ({
    ...item,
    statusClass: getRepairStatusClass(item.status)
  }));
}

function resolveRepairListData(data, fallback = []) {
  return normalizeRepairList(resolveListData(data, fallback));
}

function updateRepairStatus(list = [], id, status) {
  return normalizeRepairList(list.map(item => (
    String(item.id) === String(id)
      ? { ...item, status }
      : item
  )));
}

function getMockRepairList() {
  return normalizeRepairList(clone([
    {
      id: 'WX20260605001',
      schoolName: '青禾实验小学',
      reportUser: '刘老师',
      phone: '13800001101',
      content: '校门口一号闸机刷脸识别失败，学生通行速度变慢。',
      createTime: '2026-06-05 09:18',
      status: '未维修'
    },
    {
      id: 'WX20260604002',
      schoolName: '星河中学',
      reportUser: '王主任',
      phone: '13900002202',
      content: '三楼走廊补卡设备无法正常联网，需要检查网络模块。',
      createTime: '2026-06-04 15:42',
      status: '维修中'
    },
    {
      id: 'WX20260603003',
      schoolName: '育才第三小学',
      reportUser: '赵老师',
      phone: '13700003303',
      content: '门禁屏幕显示异常，重启后仍然花屏。',
      createTime: '2026-06-03 11:06',
      status: '已维修'
    }
  ]));
}

function getMockOrders() {
  return clone([
    {
      id: 'BH20260605001',
      schoolName: '青禾实验小学',
      badgeCount: 120,
      totalAmount: 2400,
      createTime: '2026-06-05 10:20',
      status: 'pending',
      remark: '一年级新生卡补货'
    },
    {
      id: 'BH20260604002',
      schoolName: '星河中学',
      badgeCount: 80,
      totalAmount: 1600,
      createTime: '2026-06-04 14:35',
      status: 'shipped',
      remark: '已安排顺丰发货'
    },
    {
      id: 'BH20260602003',
      schoolName: '育才第三小学',
      badgeCount: 50,
      totalAmount: 1000,
      createTime: '2026-06-02 16:10',
      status: 'completed',
      remark: '学校已签收'
    }
  ]);
}

module.exports = {
  getMockOrders,
  getMockRepairList,
  getRepairStatusClass,
  normalizeRepairList,
  resolveRepairListData,
  resolveListData,
  updateRepairStatus
};
