const dataService = require('../../../../utils/dataService.js');

const STORAGE_KEY = 'honor_wall_records';

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultRecords() {
  return [];
}

function getCoveredClassCount(records = []) {
  return new Set(records.map(item => item.className).filter(Boolean)).size;
}

function getMostHonoredName(records = [], field) {
  const countMap = records.reduce((map, item) => {
    const name = item[field];
    if (!name) {
      return map;
    }

    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const sortedNames = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);

  return sortedNames[0] || '暂无';
}

function getMostHonoredStudentNames(records = []) {
  const countMap = records.reduce((map, item) => {
    const name = item.studentName;
    if (!name) {
      return map;
    }

    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const names = Object.keys(countMap);
  if (!names.length) {
    return ['暂无'];
  }

  const maxCount = Math.max(...names.map(name => countMap[name]));
  return names.filter(name => countMap[name] === maxCount);
}

function getHonorStats(records = []) {
  return {
    coveredClassCount: getCoveredClassCount(records),
    bestStudentNames: getMostHonoredStudentNames(records),
    bestClassName: getMostHonoredName(records, 'className')
  };
}

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    records: [],
    filteredRecords: [],
    searchKeyword: '',
    coveredClassCount: 0,
    bestStudentNames: ['暂无'],
    bestClassName: '暂无',
    classOptions: [],
    studentOptions: [],
    selectedClassIndex: 0,
    selectedStudentIndex: 0,
    addVisible: false,
    detailVisible: false,
    selectedHonor: null,
    editingId: '',
    form: {
      title: '',
      studentName: '',
      className: '',
      description: ''
    }
  },
  setMenuButtonLayout() {
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    if (menu && menu.top && menu.height) {
      this.setData({
        menuButtonTop: menu.top,
        menuButtonHeight: menu.height
      });
    }
  },


  async onLoad() {
    this.setMenuButtonLayout();
    const classOptions = await dataService.getClasses();
    const selectedClass = classOptions[0] || {};
    const studentOptions = await dataService.getStudentsByClassId(selectedClass.classId);
    const selectedStudent = studentOptions[0] || {};
    const records = this.getHonorRecords();
    const honorStats = getHonorStats(records);

    this.setData({
      classOptions,
      studentOptions,
      records,
      filteredRecords: records,
      ...honorStats,
      form: {
        ...this.data.form,
        className: selectedClass.name || '',
        studentName: selectedStudent.name || ''
      }
    });
  },

  getHonorRecords() {
    const storedRecords = wx.getStorageSync(STORAGE_KEY);
    if (Array.isArray(storedRecords)) {
      return storedRecords;
    }

    return getDefaultRecords();
  },

  showAddModal() {
    const selectedClass = this.data.classOptions[this.data.selectedClassIndex] || {};
    const selectedStudent = this.data.studentOptions[this.data.selectedStudentIndex] || {};

    this.setData({
      addVisible: true,
      editingId: '',
      form: {
        title: '',
        className: selectedClass.name || '',
        studentName: selectedStudent.name || '',
        description: ''
      }
    });
  },

  showHonorDetail(e) {
    const record = e.currentTarget.dataset.record;
    if (!record) {
      return;
    }

    this.setData({
      selectedHonor: record,
      detailVisible: true
    });
  },

  updateFilteredRecords(keyword = this.data.searchKeyword, records = this.data.records) {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      this.setData({
        filteredRecords: records
      });
      return;
    }

    this.setData({
      filteredRecords: records.filter(item => (
        (item.title || '').toLowerCase().includes(normalizedKeyword)
        || (item.className || '').toLowerCase().includes(normalizedKeyword)
        || (item.studentName || '').toLowerCase().includes(normalizedKeyword)
      ))
    });
  },

  onSearchInput(e) {
    const searchKeyword = e.detail.value;
    this.setData({
      searchKeyword
    });
    this.updateFilteredRecords(searchKeyword);
  },

  hideHonorDetail() {
    this.setData({
      detailVisible: false,
      selectedHonor: null
    });
  },

  hideAddModal() {
    this.setData({
      addVisible: false,
      editingId: '',
      form: {
        ...this.data.form,
        title: '',
        description: ''
      }
    });
  },

  async editHonor() {
    const record = this.data.selectedHonor;
    if (!record) {
      return;
    }

    const selectedClassIndex = Math.max(
      this.data.classOptions.findIndex(item => item.name === record.className),
      0
    );
    const selectedClass = this.data.classOptions[selectedClassIndex] || {};
    const studentOptions = await dataService.getStudentsByClassId(selectedClass.classId);
    const selectedStudentIndex = Math.max(
      studentOptions.findIndex(item => item.name === record.studentName),
      0
    );

    this.setData({
      detailVisible: false,
      addVisible: true,
      editingId: record.id,
      selectedClassIndex,
      selectedStudentIndex,
      studentOptions,
      form: {
        title: record.title,
        studentName: record.studentName,
        className: record.className,
        description: record.description === '暂无说明' ? '' : record.description
      }
    });
  },

  deleteHonor() {
    const record = this.data.selectedHonor;
    if (!record) {
      return;
    }

    wx.showModal({
      title: '删除荣誉',
      content: '确定删除这条荣誉记录吗？',
      confirmColor: '#e5484d',
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        const records = this.data.records.filter(item => item.id !== record.id);
        wx.setStorageSync(STORAGE_KEY, records);
        this.setData({
          records,
          filteredRecords: records,
          ...getHonorStats(records),
          detailVisible: false,
          selectedHonor: null
        });
        this.updateFilteredRecords(this.data.searchKeyword, records);

        wx.showToast({
          title: '已删除',
          icon: 'success'
        });
      }
    });
  },

  async onClassChange(e) {
    const selectedClassIndex = Number(e.detail.value);
    const selectedClass = this.data.classOptions[selectedClassIndex] || {};
    const studentOptions = await dataService.getStudentsByClassId(selectedClass.classId);
    const selectedStudent = studentOptions[0] || {};

    this.setData({
      selectedClassIndex,
      selectedStudentIndex: 0,
      studentOptions,
      form: {
        ...this.data.form,
        className: selectedClass.name || '',
        studentName: selectedStudent.name || ''
      }
    });
  },

  onStudentChange(e) {
    const selectedStudentIndex = Number(e.detail.value);
    const selectedStudent = this.data.studentOptions[selectedStudentIndex] || {};

    this.setData({
      selectedStudentIndex,
      form: {
        ...this.data.form,
        studentName: selectedStudent.name || ''
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  submitHonor() {
    const form = this.data.form;
    if (!form.title.trim()) {
      wx.showToast({
        title: '请输入荣誉名称',
        icon: 'none'
      });
      return;
    }

    const editingId = this.data.editingId;
    const record = {
      id: editingId || `honor-${Date.now()}`,
      title: form.title.trim(),
      studentName: form.studentName,
      className: form.className,
      description: form.description.trim() || '暂无说明',
      date: formatDate()
    };
    const records = editingId
      ? this.data.records.map(item => (item.id === editingId ? { ...item, ...record, date: item.date } : item))
      : [record].concat(this.data.records);

    wx.setStorageSync(STORAGE_KEY, records);
    this.setData({
      records,
      filteredRecords: records,
      ...getHonorStats(records),
      addVisible: false,
      editingId: '',
      form: {
        ...form,
        title: '',
        description: ''
      }
    });
    this.updateFilteredRecords(this.data.searchKeyword, records);

    wx.showToast({
      title: editingId ? '已保存' : '已添加',
      icon: 'success'
    });
  },

  noop() {},

  btnBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/teacher/main/home/home'
        });
      }
    });
  }
});
