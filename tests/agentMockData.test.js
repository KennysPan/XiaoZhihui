const assert = require('assert');
const {
  getMockOrders,
  getMockRepairList,
  resolveListData,
  updateRepairStatus
} = require('../pages/agent/utils/mockAgentData.js');

const repairs = getMockRepairList();
assert.strictEqual(repairs.length >= 3, true);
assert.strictEqual(Boolean(repairs[0].schoolName), true);
assert.strictEqual(Boolean(repairs[0].reportUser), true);
assert.strictEqual(Boolean(repairs[0].content), true);

const orders = getMockOrders();
assert.strictEqual(orders.length >= 3, true);
assert.strictEqual(Boolean(orders[0].id), true);
assert.strictEqual(Boolean(orders[0].schoolName), true);
assert.strictEqual(typeof orders[0].badgeCount, 'number');

assert.deepStrictEqual(resolveListData([{ id: 1 }], repairs), [{ id: 1 }]);
assert.deepStrictEqual(resolveListData([], repairs), repairs);
assert.deepStrictEqual(resolveListData(null, orders), orders);

const updatedRepairs = updateRepairStatus(repairs, repairs[0].id, '已维修');
assert.strictEqual(updatedRepairs[0].status, '已维修');
assert.strictEqual(updatedRepairs[0].statusClass, 'done');
assert.strictEqual(repairs[0].status, '未维修');

console.log('agent mock data ok');
