const assert = require('assert');
const {
  filterLeaveRecords,
  getPendingLeaveRecords,
  unwrapLeaveItems
} = require('../pages/parent/leave-approval-list/leaveApprovalData.js');

const responseData = {
  data: [
    {
      id: 'pending-string',
      student: { name: '王小明' },
      typeName: '病假',
      startTime: '2026-06-05 09:00:00',
      endTime: '2026-06-05 17:00:00',
      statusId: '1',
      reason: '发烧'
    },
    {
      id: 'approved',
      studentName: '王小芳',
      leaveTypeName: '事假',
      status: 2,
      statusText: '已通过',
      reason: '家中有事'
    },
    {
      id: 'rejected',
      name: '李小亮',
      type: '其他',
      approvalStatus: '3',
      remark: '材料不足'
    }
  ],
  total: 3
};

const records = unwrapLeaveItems(responseData);

assert.strictEqual(records.length, 3);
assert.strictEqual(records[0].studentName, '王小明');
assert.strictEqual(records[0].leaveTypeName, '病假');
assert.strictEqual(records[0].statusId, 1);
assert.strictEqual(records[0].statusName, '待审批');

assert.strictEqual(filterLeaveRecords(records, 0).length, 1);
assert.strictEqual(filterLeaveRecords(records, 1)[0].id, 'approved');
assert.strictEqual(filterLeaveRecords(records, 2)[0].id, 'rejected');
assert.strictEqual(getPendingLeaveRecords({ items: records }).length, 1);

console.log('leave approval data ok');
