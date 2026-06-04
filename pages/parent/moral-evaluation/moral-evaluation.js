const Ext = require('../utils/Ext');

Page({
  data: {
    children: [],
    selectedChild: null,
    selectedChildId: null,
    selectedChildIndex: -1,
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
        const children = this.normalizeChildren(students);
        
        this.setData({ children });
        
        if (children.length > 0) {
          this.setData({
            selectedChild: children[0],
            selectedChildId: children[0].studentId,
            selectedChildIndex: 0
          });
          this.loadEvaluationData();
        }
      } else {
        this.setData({ children: [], selectedChild: null, selectedChildId: null, selectedChildIndex: -1 });
      }
    } catch (err) {
      console.error('[德育评价] 加载孩子失败:', err);
      this.setData({ children: [], selectedChild: null, selectedChildId: null, selectedChildIndex: -1 });
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
        uniqueKey: `${keyId}-${index}`,
        name: student.studentName || student.name || '学生',
        className: student.className || student.class || ''
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

  selectChild(e) {
    const index = Number(e.currentTarget.dataset.index);
    const child = this.data.children[index];
    if (!child) return;

    this.setData({
      selectedChild: child,
      selectedChildId: child.studentId,
      selectedChildIndex: index,
      loading: true
    });
    this.loadEvaluationData();
  },

  async loadEvaluationData() {
    const childId = this.data.selectedChildId;
    if (childId === null || childId === undefined || childId === '') {
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
