App({
  globalData: {
    themeColor: '#4A90E2',
    storageKeys: {
      playlists: 'playlists',
      songs: 'songs',
      tags: 'customTags',
      settings: 'appSettings',
      userInfo: 'userInfo'
    },
    cloudEnv: {
      env: 'cloud1-d4g3brd02c9ce73a7'
    },
    collections: {
      songlist: 'songlist',
      playlists: 'playlists',
      customTags: 'customTags',
      users: 'users'
    },
    userInfo: null
  },

  onLaunch() {
    this.initStorage();
    this.initCloud();
    this.checkLogin();
  },

  initStorage() {
    const storageKeys = this.globalData.storageKeys;

    if (!wx.getStorageSync(storageKeys.playlists)) {
      wx.setStorageSync(storageKeys.playlists, []);
    }

    if (!wx.getStorageSync(storageKeys.songs)) {
      wx.setStorageSync(storageKeys.songs, []);
    }

    if (!wx.getStorageSync(storageKeys.tags)) {
      wx.setStorageSync(storageKeys.tags, []);
    }

    if (!wx.getStorageSync(storageKeys.settings)) {
      wx.setStorageSync(storageKeys.settings, {
        sortBy: 'createTime',
        sortOrder: 'desc'
      });
    }

    const savedUserInfo = wx.getStorageSync(storageKeys.userInfo);
    if (savedUserInfo) {
      this.globalData.userInfo = savedUserInfo;
    }
  },

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

  getCloudDB() {
    return wx.cloud.database();
  },

  callCloudFunction(name, data) {
    return wx.cloud.callFunction({
      name: name,
      data: data
    });
  },

  checkLogin() {
    const savedUserInfo = wx.getStorageSync(this.globalData.storageKeys.userInfo);
    if (savedUserInfo) {
      this.globalData.userInfo = savedUserInfo;
    }
  },

  async login() {
    return new Promise((resolve) => {
      wx.getUserProfile({
        desc: '用于获取您的昵称和头像',
        success: async (res) => {
          const userInfo = res.userInfo;
          this.globalData.userInfo = userInfo;
          wx.setStorageSync(this.globalData.storageKeys.userInfo, userInfo);

          const cloudRes = await wx.cloud.callFunction({
            name: 'updateUserInfo',
            data: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              gender: userInfo.gender
            }
          });

          if (cloudRes.result.success) {
            resolve({ success: true, data: userInfo });
          } else {
            resolve({ success: false, message: cloudRes.result.message });
          }
        },
        fail: (err) => {
          console.error('获取用户信息失败', err);
          resolve({ success: false, message: '获取用户信息失败' });
        }
      });
    });
  },

  async getUserInfoFromCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo'
      });
      if (res.result.success) {
        this.globalData.userInfo = res.result.data;
        wx.setStorageSync(this.globalData.storageKeys.userInfo, res.result.data);
        return res.result.data;
      }
      return null;
    } catch (err) {
      console.error('从云端获取用户信息失败', err);
      return null;
    }
  }
});