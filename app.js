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
    },
    // 云开发环境配置
    cloudEnv: {
      env: 'cloud1-d4g3brd02c9ce73a7' // 云开发环境ID
    },
    // 云数据库集合名
    collections: {
      songlist: 'songlist',
      playlists: 'playlists'
    }
  },

  onLaunch() {
    // 初始化本地存储
    this.initStorage();
    // 初始化云开发
    this.initCloud();
  },

  // 初始化本地存储数据结构
  initStorage() {
    const storageKeys = this.globalData.storageKeys;

    // 初始化歌单列表
    if (!wx.getStorageSync(storageKeys.playlists)) {
      wx.setStorageSync(storageKeys.playlists, []);
    }

    // 初始化歌曲列表（本地缓存）
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
  },

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnv.env,
        traceUser: true,
      });
    }
  },

  // 获取云数据库实例
  getCloudDB() {
    return wx.cloud.database();
  },

  // 调用云函数
  callCloudFunction(name, data) {
    return wx.cloud.callFunction({
      name: name,
      data: data
    });
  }
});