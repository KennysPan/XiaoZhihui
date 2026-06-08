const Ext = require('../utils/Ext');
const {
  getLocalChildren,
  mergeStudentsByIdentity
} = require('../add-child/addChildData');

Page({
  data: {
    badgeInfo: {
      id: 1,
      name: '校园徽章',
      price: 5.00,
      image: 'https://www.kennyspan.xyz:8082/badge/badge.png',
      description: '考勤校徽，可佩戴于左胸'
    },
    childrenList: [],
    selectedChildrenIds: [],
    childQuantities: {},
    totalQuantity: 0,
    totalPrice: 0,
    reason: '',
    reasonOptions: ['丢失', '损坏', '换新', '毕业留念', '其他'],
    remark: '',
    loading: false,
    submitting: false
  },

  onLoad() {
    this.loadChildren();
  },

  async loadChildren() {
    this.setData({ loading: true });
    let localChildren = [];
    try {
      localChildren = getLocalChildren(wx);
    } catch (err) {
      console.error('读取本地孩子失败', err);
    }

    try {
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = mergeStudentsByIdentity(res.data.students || [], localChildren);
        const childrenList = students.map(s => ({
          id: s.studentId || s.id,
          name: s.studentName || s.name,
          className: s.className,
          gradeName: s.gradeName,
          avatar: ''
        }));
        
        const childQuantities = {};
        childrenList.forEach(child => {
          childQuantities[child.id] = 1;
        });
        
        this.setData({ childrenList, childQuantities });
      } else {
        this.applyChildren(localChildren);
      }
    } catch (err) {
      console.error('加载孩子失败', err);
      this.applyChildren(localChildren);
      if (localChildren.length === 0) {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  applyChildren(students) {
    const childrenList = (students || []).map(s => ({
      id: s.studentId || s.id,
      name: s.studentName || s.name,
      className: s.className,
      gradeName: s.gradeName,
      avatar: ''
    }));
    const childQuantities = {};
    childrenList.forEach(child => {
      childQuantities[child.id] = 1;
    });
    this.setData({ childrenList, childQuantities });
  },

  toggleSelectChild(e) {
    const childId = e.currentTarget.dataset.id;
    let selectedIds = [...this.data.selectedChildrenIds];
    const index = selectedIds.indexOf(childId);
    
    if (index === -1) {
      selectedIds.push(childId);
    } else {
      selectedIds.splice(index, 1);
    }
    
    this.setData({ selectedChildrenIds: selectedIds });
    this.calculateTotal();
  },

  toggleSelectAll() {
    if (this.data.selectedChildrenIds.length === this.data.childrenList.length) {
      this.setData({ selectedChildrenIds: [] });
    } else {
      const allIds = this.data.childrenList.map(child => child.id);
      this.setData({ selectedChildrenIds: allIds });
    }
    this.calculateTotal();
  },

  decreaseQuantity(e) {
    const childId = e.currentTarget.dataset.id;
    const currentQty = this.data.childQuantities[childId];
    if (currentQty > 1) {
      this.setData({
        [`childQuantities.${childId}`]: currentQty - 1
      });
      this.calculateTotal();
    }
  },

  increaseQuantity(e) {
    const childId = e.currentTarget.dataset.id;
    const currentQty = this.data.childQuantities[childId];
    if (currentQty < 10) {
      this.setData({
        [`childQuantities.${childId}`]: currentQty + 1
      });
      this.calculateTotal();
    } else {
      wx.showToast({ title: '单个孩子最多补办10枚', icon: 'none' });
    }
  },

  calculateTotal() {
    let totalQuantity = 0;
    const selectedIds = this.data.selectedChildrenIds;
    
    selectedIds.forEach(id => {
      totalQuantity += this.data.childQuantities[id] || 0;
    });
    
    const totalPrice = (totalQuantity * this.data.badgeInfo.price).toFixed(2);
    
    this.setData({ totalQuantity, totalPrice });
  },

  onReasonChange(e) {
    const index = e.detail.value;
    this.setData({ reason: this.data.reasonOptions[index] });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  isSelected(childId) {
    return this.data.selectedChildrenIds.indexOf(childId) !== -1;
  },

  isAllSelected() {
    return this.data.childrenList.length > 0 && 
           this.data.selectedChildrenIds.length === this.data.childrenList.length;
  },

  async submitOrder() {
    if (this.data.selectedChildrenIds.length === 0) {
      wx.showToast({ title: '请至少选择一个孩子', icon: 'none' });
      return;
    }
    
    if (!this.data.reason) {
      wx.showToast({ title: '请选择补办原因', icon: 'none' });
      return;
    }
    
    this.setData({ submitting: true });
    wx.showLoading({ title: '生成订单中...', mask: true });
    
    try {
      const orderItems = [];
      for (const childId of this.data.selectedChildrenIds) {
        orderItems.push({
          childId: childId,
          childName: this.data.childrenList.find(c => c.id === childId)?.name,
          quantity: this.data.childQuantities[childId],
          price: this.data.badgeInfo.price,
          badgeId: this.data.badgeInfo.id,
          badgeName: this.data.badgeInfo.name
        });
      }
      
      const orderData = {
        items: orderItems,
        totalQuantity: this.data.totalQuantity,
        totalAmount: this.data.totalPrice,
        reason: this.data.reason,
        remark: this.data.remark,
        badgeInfo: this.data.badgeInfo
      };
      
      const res = await Ext.Post(`${Ext.Url}/api/order/badge/create`, orderData);
      
      wx.hideLoading();
      
      if (res.code === 0 || res.code === 20000) {
        wx.showModal({
          title: '订单已生成',
          content: `共${this.data.totalQuantity}枚校徽，总计¥${this.data.totalPrice}，即将跳转支付`,
          confirmText: '去支付',
          cancelText: '稍后',
          success: (modalRes) => {
            if (modalRes.confirm && res.data?.orderId) {
              wx.showToast({
                title: '支付功能待接入',
                icon: 'none'
              });
            } else {
              wx.navigateBack();
            }
          }
        });
      } else {
        wx.showToast({ title: res.message || '订单生成失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('提交订单失败', err);
      wx.showToast({ title: '订单生成失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
