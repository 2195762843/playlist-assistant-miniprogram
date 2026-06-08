App({
  globalData: {
    // 全局主题色
    themeColor: '#4A90E2',
    // 存储键名
    storageKeys: {
      playlists: 'playlists',
      songs: 'songs',
      tags: 'customTags',
      settings: 'appSettings'
    }
  },

  onLaunch() {
    // 初始化本地存储
    this.initStorage();
  },

  // 初始化本地存储数据结构
  initStorage() {
    const storageKeys = this.globalData.storageKeys;

    // 初始化歌单列表
    if (!wx.getStorageSync(storageKeys.playlists)) {
      wx.setStorageSync(storageKeys.playlists, []);
    }

    // 初始化歌曲列表
    if (!wx.getStorageSync(storageKeys.songs)) {
      wx.setStorageSync(storageKeys.songs, []);
    }

    // 初始化自定义标签
    if (!wx.getStorageSync(storageKeys.tags)) {
      wx.setStorageSync(storageKeys.tags, []);
    }

    // 初始化设置
    if (!wx.getStorageSync(storageKeys.settings)) {
      wx.setStorageSync(storageKeys.settings, {
        sortBy: 'createTime', // createTime | name | songCount
        sortOrder: 'desc'     // asc | desc
      });
    }
  }
});
