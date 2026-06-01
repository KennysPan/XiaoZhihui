Component({
  data: {
    selected: 0,
    animatingIndex: -1,
    isSwitching: false,
    list: [
      {
        pagePath: '/pages/teacher/main/home/home',
        text: '首页',
        iconPath: '/assets/tabbar/home.png',
        selectedIconPath: '/assets/tabbar/home-active.png',
        tabMode: 'native'
      },
      {
        pagePath: '/pages/teacher/main/scan/scan',
        text: '扫一扫',
        iconPath: '/assets/tabbar/scan.png',
        selectedIconPath: '/assets/tabbar/scan-active.png',
        tabMode: 'native'
      },
      {
        pagePath: '/pages/teacher/main/profile/TeacherHome',
        text: '我的',
        iconPath: '/assets/tabbar/user.png',
        selectedIconPath: '/assets/tabbar/user-active.png',
        tabMode: 'native'
      }
    ]
  },

  lifetimes: {
    attached() {
      this.updateSelected();
      this._routeTimer = setTimeout(() => {
        this.updateSelected();
        this._routeTimer = null;
      }, 0);
    },

    ready() {
      this.updateSelected();
    },

    detached() {
      if (this._switchTimer) {
        clearTimeout(this._switchTimer);
        this._switchTimer = null;
      }
      if (this._animationTimer) {
        clearTimeout(this._animationTimer);
        this._animationTimer = null;
      }
      if (this._routeTimer) {
        clearTimeout(this._routeTimer);
        this._routeTimer = null;
      }
    }
  },

  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },

  methods: {
    getTeacherList() {
      return [
        {
          pagePath: '/pages/teacher/main/home/home',
          text: '首页',
          iconPath: '/assets/tabbar/home.png',
          selectedIconPath: '/assets/tabbar/home-active.png',
          tabMode: 'native'
        },
        {
          pagePath: '/pages/teacher/main/scan/scan',
          text: '扫一扫',
          iconPath: '/assets/tabbar/scan.png',
          selectedIconPath: '/assets/tabbar/scan-active.png',
          tabMode: 'native'
        },
        {
          pagePath: '/pages/teacher/main/profile/TeacherHome',
          text: '我的',
          iconPath: '/assets/tabbar/user.png',
          selectedIconPath: '/assets/tabbar/user-active.png',
          tabMode: 'native'
        }
      ];
    },

    getAgentList() {
      return [
        {
          pagePath: '/pages/agent/home/home',
          text: '首页',
          iconPath: '/images/tabbar/home.png',
          selectedIconPath: '/images/tabbar/home-active.png',
          tabMode: 'agent'
        },
        {
          pagePath: '/pages/agent/orders/orders',
          text: '订单',
          iconPath: '/images/tabbar/orders.png',
          selectedIconPath: '/images/tabbar/orders-active.png',
          tabMode: 'agent'
        },
        {
          pagePath: '/pages/agent/profile/profile',
          text: '我的',
          iconPath: '/images/tabbar/mine.png',
          selectedIconPath: '/images/tabbar/mine-active.png',
          tabMode: 'agent'
        }
      ];
    },

    getParentList() {
      return [
        {
          pagePath: '/pages/parent/home/home',
          text: '首页',
          iconPath: '/assets/tabbar/home.png',
          selectedIconPath: '/assets/tabbar/home-active.png',
          tabMode: 'parent'
        },
        {
          pagePath: '/pages/parent/scan/scan',
          text: '扫一扫',
          iconPath: '/assets/tabbar/scan.png',
          selectedIconPath: '/assets/tabbar/scan-active.png',
          tabMode: 'parent'
        },
        {
          pagePath: '/pages/parent/parentCenter/parentcenter',
          text: '我的',
          iconPath: '/assets/tabbar/user.png',
          selectedIconPath: '/assets/tabbar/user-active.png',
          tabMode: 'parent'
        }
      ];
    },

    getListByPath(path) {
      if (path.indexOf('/pages/agent/') === 0) {
        return this.getAgentList();
      }
      if (path.indexOf('/pages/parent/') === 0) {
        return this.getParentList();
      }
      return this.getTeacherList();
    },

    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      if (this.data.isSwitching) {
        return;
      }

      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && path === '/' + currentPage.route) {
        this.setData({ animatingIndex: index });
        this.clearTapAnimation();
        return;
      }

      const target = this.data.list[index];
      this.setData({
        selected: index,
        animatingIndex: index,
        isSwitching: true
      });

      this._switchTimer = setTimeout(() => {
        const complete = () => {
          this.setData({ isSwitching: false });
          this.clearTapAnimation();
        };

        if (target && target.tabMode === 'native') {
          wx.switchTab({ url: path, complete });
        } else {
          wx.redirectTo({ url: path, complete });
        }
        this._switchTimer = null;
      }, 120);
    },

    updateSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (!currentPage) {
        return;
      }

      const currentPath = '/' + currentPage.route;
      const list = this.getListByPath(currentPath);
      const selected = list.findIndex((item) => item.pagePath === currentPath);
      this.setData({
        list,
        selected: selected === -1 ? 0 : selected
      });
    },

    clearTapAnimation() {
      if (this._animationTimer) {
        clearTimeout(this._animationTimer);
      }

      this._animationTimer = setTimeout(() => {
        this.setData({ animatingIndex: -1 });
        this._animationTimer = null;
      }, 260);
    }
  }
});
