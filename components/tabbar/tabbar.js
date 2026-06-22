Component({
  properties: {
    currentPath: {
      type: String,
      value: ''
    }
  },

  data: {
    tabs: [
      { pagePath: '/pages/index/index', text: '歌单', icon: '🎵' },
      { pagePath: '/pages/tags/tags', text: '标签', icon: '🏷️' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '👤' }
    ]
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      if (path !== this.properties.currentPath) {
        wx.redirectTo({ url: path });
      }
    }
  }
});