function pickFirst(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function getStatusId(item = {}) {
  const rawText = pickFirst(item.statusName, item.statusText, item.statusCode, item.status) || '';
  const text = String(rawText).toUpperCase();

  if (
    text.indexOf('驳回') !== -1
    || text.indexOf('拒绝') !== -1
    || text.indexOf('未通过') !== -1
    || text.indexOf('REJECT') !== -1
    || text.indexOf('DENY') !== -1
  ) {
    return 3;
  }
  if (text.indexOf('通过') !== -1 || text.indexOf('APPROVED') !== -1 || text.indexOf('PASS') !== -1) {
    return 2;
  }
  if (
    text.indexOf('待') !== -1
    || text.indexOf('未处理') !== -1
    || text.indexOf('PENDING') !== -1
    || text.indexOf('WAIT') !== -1
  ) {
    return 1;
  }

  const numericStatus = Number(pickFirst(item.statusId, item.approvalStatus, item.status, 1));
  if (numericStatus === 0) {
    return 1;
  }
  if ([1, 2, 3].includes(numericStatus)) {
    return numericStatus;
  }
  return 1;
}

function getStatusName(statusId, item = {}) {
  const explicit = pickFirst(item.statusName, item.statusText);
  if (explicit) {
    return explicit;
  }
  return {
    1: '待审批',
    2: '已通过',
    3: '未通过'
  }[statusId] || '待审批';
}

function normalizeLeaveRecord(item = {}) {
  const statusId = getStatusId(item);
  const student = item.student || {};

  return {
    ...item,
    id: pickFirst(item.id, item.recordId, item.leaveId),
    studentId: pickFirst(item.studentId, student.id),
    studentName: pickFirst(item.studentName, item.name, student.name, '学生'),
    leaveTypeName: pickFirst(item.leaveTypeName, item.typeName, item.type, '请假'),
    startTime: pickFirst(item.startTime, item.beginTime, item.date, ''),
    endTime: pickFirst(item.endTime, item.finishTime, ''),
    reason: pickFirst(item.reason, item.remark, ''),
    applyTime: pickFirst(item.applyTime, item.createdTime, item.createTime, ''),
    remark: pickFirst(item.remark, item.approverRemark, ''),
    statusId,
    statusName: getStatusName(statusId, item)
  };
}

function getRawItems(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (!data || typeof data !== 'object') {
    return [];
  }
  if (Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  if (Array.isArray(data.records)) {
    return data.records;
  }
  if (Array.isArray(data.list)) {
    return data.list;
  }
  return [];
}

function unwrapLeaveItems(data) {
  return getRawItems(data).map(normalizeLeaveRecord);
}

function filterLeaveRecords(records = [], tabIndex = 0) {
  const targetStatus = Number(tabIndex) + 1;
  return (records || [])
    .map(normalizeLeaveRecord)
    .filter(item => item.statusId === targetStatus);
}

function getPendingLeaveRecords(data) {
  const records = Array.isArray(data) ? data : unwrapLeaveItems(data);
  return filterLeaveRecords(records, 0);
}

module.exports = {
  filterLeaveRecords,
  getPendingLeaveRecords,
  normalizeLeaveRecord,
  unwrapLeaveItems
};
