const { Stats } = require('../../utils/storage');

Page({
  data: {
    stats: {
      totalPlaylists: 0,
      totalSongs: 0,
      pinnedPlaylists: 0,
      favoriteSongs: 0,
      tagsCount: 0
    },
    userInfo: null
  },

  onLoad() {
    this.loadStats();
    this.loadUserInfo();
  },

  onShow() {
    this.loadStats();
    this.loadUserInfo();
  },

  onPullDownRefresh() {
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  loadStats() {
    var that = this;
    Stats.get(function(err, stats) {
      that.setData({ stats: stats });
    });
  },

  loadUserInfo() {
    var app = getApp();
    this.setData({ userInfo: app.globalData.userInfo });
  },

  goToTags() {
    wx.navigateTo({
      url: '/pages/tags/tags'
    });
  },

  clearAllData() {
    var that = this;
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          var app = getApp();
          app.initStorage();
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
          setTimeout(function() {
            that.loadStats();
          }, 1000);
        }
      }
    });
  },

  logout() {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？退出后将不再显示您的个人信息。',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          var app = getApp();
          app.globalData.userInfo = null;
          wx.removeStorageSync('userInfo');
          that.setData({ userInfo: null });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});