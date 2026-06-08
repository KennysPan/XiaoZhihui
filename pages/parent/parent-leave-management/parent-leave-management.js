const Ext = require('../utils/Ext');
const {
  getLocalChildren,
  mergeStudentsByIdentity
} = require('../add-child/addChildData');

Page({
  data: {
    children: [],
    leaveTypes: ['事假', '病假', '公假', '其他'],
    currentTypeIndex: 0,
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    reason: '',
    isSubmitting: false,
    attachments: []
  },

  onLoad(options) {
    this.initDates();
    this.loadChildren();
  },

  initDates() {
    const today = this.getCurrentDate();
    this.setData({ startDate: today, endDate: today });
  },

  getCurrentDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  async loadChildren() {
    let localChildren = [];
    try {
      localChildren = getLocalChildren(wx);
    } catch (err) {
      console.error('[请假申请] 读取本地孩子失败:', err);
    }

    try {
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      console.log('[请假申请] 孩子列表:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = mergeStudentsByIdentity(res.data.students || [], localChildren);
        const children = students.map(s => ({
          id: s.studentId || s.id,
          name: s.studentName || s.name,
          className: s.className,
          relationName: s.relationName,
          checked: false
        }));
        this.setData({ children });
      } else {
        this.setData({ children: localChildren.map(s => ({
          id: s.studentId || s.id,
          name: s.studentName || s.name,
          className: s.className,
          relationName: s.relationName,
          checked: false
        })) });
      }
    } catch (err) {
      console.error('[请假申请] 加载孩子失败:', err);
      this.setData({ children: localChildren.map(s => ({
        id: s.studentId || s.id,
        name: s.studentName || s.name,
        className: s.className,
        relationName: s.relationName,
        checked: false
      })) });
    }
  },

  selectChild(e) {
    const index = e.currentTarget.dataset.index;
    const children = this.data.children.map((child, i) => ({
      ...child, checked: i === index ? !child.checked : child.checked
    }));
    this.setData({ children });
  },

  selectType(e) { 
    this.setData({ currentTypeIndex: e.currentTarget.dataset.index }); 
  },
  
  onReasonInput(e) { 
    this.setData({ reason: e.detail.value }); 
  },
  
  updateDateTime(e) { 
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value }); 
  },

  addAttachment() {
    wx.chooseMessageFile({
      count: 9 - this.data.attachments.length,
      type: 'all',
      success: (res) => {
        const newFiles = res.tempFiles.map(file => {
          let sizeStr = '';
          if (file.size < 1024) {
            sizeStr = file.size + 'B';
          } else if (file.size < 1024 * 1024) {
            sizeStr = (file.size / 1024).toFixed(1) + 'KB';
          } else {
            sizeStr = (file.size / (1024 * 1024)).toFixed(1) + 'MB';
          }
          
          let type = 'file';
          if (file.type === 'image' || /\.(jpg|jpeg|png|gif|bmp)$/i.test(file.name)) {
            type = 'image';
          }
          
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            path: file.path,
            size: file.size,
            sizeStr: sizeStr,
            type: type
          };
        });
        
        const attachments = [...this.data.attachments, ...newFiles];
        this.setData({ attachments });
        
        wx.showToast({
          title: `已添加 ${newFiles.length} 个附件`,
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  removeAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const attachments = this.data.attachments.filter((_, i) => i !== index);
    this.setData({ attachments });
  },

  previewAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const file = this.data.attachments[index];
    if (file.type === 'image') {
      wx.previewImage({
        urls: [file.path],
        current: file.path
      });
    }
  },

  getSelectedChildren() { 
    return this.data.children.filter(c => c.checked); 
  },

  validateForm() {
    const selectedChildren = this.getSelectedChildren();
    if (selectedChildren.length === 0) { 
      wx.showToast({ title: '请至少选择一个孩子', icon: 'none' }); 
      return false; 
    }
    if (!this.data.reason.trim()) { 
      wx.showToast({ title: '请输入请假原因', icon: 'none' }); 
      return false; 
    }
    const startDateTime = new Date(`${this.data.startDate} ${this.data.startTime}`);
    const endDateTime = new Date(`${this.data.endDate} ${this.data.endTime}`);
    if (endDateTime <= startDateTime) { 
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' }); 
      return false; 
    }
    return true;
  },

  // 修复 submitForm 方法中的参数格式
async submitForm() {
  if (this.data.isSubmitting) return;
  if (!this.validateForm()) return;

  this.setData({ isSubmitting: true });
  wx.showLoading({ title: '提交中...', mask: true });

  try {
    const selectedChildren = this.getSelectedChildren();
    
    // 根据API文档，正确的参数格式
    for (const child of selectedChildren) {
      // 构建开始和结束时间（完整格式）
      const startDateTime = `${this.data.startDate} ${this.data.startTime}:00`;
      const endDateTime = `${this.data.endDate} ${this.data.endTime}:00`;
      
      console.log('[请假申请] 提交参数:', {
        StudentId: child.id,
        TypeId: this.data.currentTypeIndex + 1,
        StartTime: startDateTime,
        EndTime: endDateTime,
        Reason: this.data.reason
      });
      
      const res = await Ext.Post(`${Ext.Url}/api/leaves/records`, {
        StudentId: child.id,
        TypeId: this.data.currentTypeIndex + 1,
        StartTime: startDateTime,
        EndTime: endDateTime,
        Reason: this.data.reason
      });
      
      console.log('[请假申请] 提交响应:', res);
      
      // 如果返回错误码
      if (res.code !== 0 && res.code !== 20000) {
        throw new Error(res.message || '提交失败');
      }
    }
    
    wx.hideLoading();
    wx.showModal({
      title: '提交成功',
      content: `请假申请已提交，请等待老师审核`,
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  } catch (err) {
    wx.hideLoading();
    console.error('[请假申请] 提交失败:', err);
    wx.showToast({ title: err.message || '提交失败，请重试', icon: 'none' });
  } finally {
    this.setData({ isSubmitting: false });
  }
},

  goBack() { 
    wx.navigateBack(); 
  }
});
