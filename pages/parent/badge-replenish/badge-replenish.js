const Ext = require('../utils/Ext');

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
    selectedChildrenKeys: [],
    allSelected: false,
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
    try {
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = res.data.students || [];
        const childrenList = this.normalizeChildren(students);
        
        const childQuantities = {};
        childrenList.forEach(child => {
          childQuantities[child.selectKey] = 1;
        });
        
        this.setData({
          childrenList,
          selectedChildrenKeys: [],
          allSelected: false,
          childQuantities
        });
      }
    } catch (err) {
      console.error('加载孩子失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  normalizeChildren(students) {
    return (students || []).map((student, index) => {
      const studentId = this.resolveChildStudentId(student);
      const keyId = studentId !== null && studentId !== undefined && studentId !== ''
        ? studentId
        : (student.studentNumber || `child-${index}`);
      return {
        ...student,
        id: keyId,
        studentId,
        selectKey: `${keyId}-${index}`,
        uniqueKey: `${keyId}-${index}`,
        name: student.studentName || student.name || '学生',
        className: student.className || student.class || '',
        gradeName: student.gradeName || student.grade || '',
        avatar: student.avatar || '',
        selected: false
      };
    });
  },

  resolveChildStudentId(student) {
    const keys = ['studentId', 'id', 'childId', 'studentNumber'];
    for (let i = 0; i < keys.length; i++) {
      const value = student[keys[i]];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  },

  toggleSelectChild(e) {
    const childKey = e.currentTarget.dataset.key;
    let selectedKeys = [...this.data.selectedChildrenKeys];
    const index = selectedKeys.indexOf(childKey);
    
    if (index === -1) {
      selectedKeys.push(childKey);
    } else {
      selectedKeys.splice(index, 1);
    }
    
    const childrenList = this.data.childrenList.map(child => ({
      ...child,
      selected: selectedKeys.indexOf(child.selectKey) !== -1
    }));

    this.setData({
      childrenList,
      selectedChildrenKeys: selectedKeys,
      allSelected: childrenList.length > 0 && selectedKeys.length === childrenList.length
    });
    this.calculateTotal();
  },

  toggleSelectAll() {
    const nextSelected = !this.data.allSelected;
    const childrenList = this.data.childrenList.map(child => ({
      ...child,
      selected: nextSelected
    }));
    const selectedChildrenKeys = nextSelected
      ? childrenList.map(child => child.selectKey)
      : [];

    this.setData({
      childrenList,
      selectedChildrenKeys,
      allSelected: nextSelected && childrenList.length > 0
    });
    this.calculateTotal();
  },

  decreaseQuantity(e) {
    const childKey = e.currentTarget.dataset.key;
    const currentQty = this.data.childQuantities[childKey];
    if (currentQty > 1) {
      const childQuantities = { ...this.data.childQuantities, [childKey]: currentQty - 1 };
      this.setData({ childQuantities });
      this.calculateTotal();
    }
  },

  increaseQuantity(e) {
    const childKey = e.currentTarget.dataset.key;
    const currentQty = this.data.childQuantities[childKey];
    if (currentQty < 10) {
      const childQuantities = { ...this.data.childQuantities, [childKey]: currentQty + 1 };
      this.setData({ childQuantities });
      this.calculateTotal();
    } else {
      wx.showToast({ title: '单个孩子最多补办10枚', icon: 'none' });
    }
  },

  calculateTotal() {
    let totalQuantity = 0;
    const selectedKeys = this.data.selectedChildrenKeys;
    
    selectedKeys.forEach(key => {
      totalQuantity += this.data.childQuantities[key] || 0;
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

  isSelected(childKey) {
    return this.data.selectedChildrenKeys.indexOf(childKey) !== -1;
  },

  isAllSelected() {
    return this.data.childrenList.length > 0 && 
           this.data.selectedChildrenKeys.length === this.data.childrenList.length;
  },

  async submitOrder() {
    if (this.data.selectedChildrenKeys.length === 0) {
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
      for (const childKey of this.data.selectedChildrenKeys) {
        const child = this.data.childrenList.find(c => c.selectKey === childKey) || {};
        orderItems.push({
          childId: child.studentId,
          childName: child.name,
          quantity: this.data.childQuantities[childKey],
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
