const Ext = require('../utils/Ext');

Page({
  data: {
    children: [],
    selectedChildId: null,
    currentEvaluation: null,
    evaluationRecords: [],
    loading: false,
    showDetailModal: false,
    currentRecordDetail: null
  },

  onLoad() {
    this.loadChildren();
  },

  async loadChildren() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      console.log('[德育评价] 家长信息:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = res.data.students || [];
        const children = students.map(s => ({
          id: s.studentId,
          name: s.studentName,
          className: s.className
        }));
        
        this.setData({ children });
        
        if (children.length > 0) {
          this.setData({ selectedChildId: children[0].id });
          this.loadEvaluationData();
        }
      } else {
        this.setData({ children: [] });
      }
    } catch (err) {
      console.error('[德育评价] 加载孩子失败:', err);
      this.setData({ children: [] });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  selectChild(e) {
    const childId = e.currentTarget.dataset.id;
    this.setData({ selectedChildId: childId, loading: true });
    this.loadEvaluationData();
  },

  async loadEvaluationData() {
    const childId = this.data.selectedChildId;
    if (!childId) {
      this.setData({ loading: false });
      return;
    }
    
    try {
      // 获取评价列表
      const res = await Ext.Get(`${Ext.Url}/api/evaluations`, { 
        studentId: childId 
      });
      
      console.log('[德育评价] 评价数据:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const items = res.data.items || [];
        
        // 取最新的作为当前评价
        const current = items.length > 0 ? items[0] : null;
        
        this.setData({
          currentEvaluation: current,
          evaluationRecords: items
        });
      } else {
        this.setData({ currentEvaluation: null, evaluationRecords: [] });
      }
    } catch (err) {
      console.error('[德育评价] 加载评价数据失败:', err);
      this.setData({ currentEvaluation: null, evaluationRecords: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  viewRecordDetail(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.evaluationRecords[index];
    this.setData({
      showDetailModal: true,
      currentRecordDetail: record
    });
  },

  closeDetailModal() {
    this.setData({
      showDetailModal: false,
      currentRecordDetail: null
    });
  },

  stopPropagation() {},

  goBack() {
    wx.navigateBack();
  }
});
