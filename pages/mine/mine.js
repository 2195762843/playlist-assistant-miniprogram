// 我的页面
const { Stats, PlaylistStorage, SongStorage, TagStorage } = require('../../utils/storage');

Page({
  data: {
    stats: {
      totalPlaylists: 0,
      totalSongs: 0,
      pinnedPlaylists: 0,
      favoriteSongs: 0,
      tagsCount: 0
    }
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    // 每次显示页面时刷新统计数据
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  // 加载统计数据
  loadStats() {
    const stats = Stats.get();
    this.setData({ stats });
  },

  // 跳转到标签管理
  goToTags() {
    wx.navigateTo({
      url: '/pages/tags/tags'
    });
  },

  // 清空所有数据
  clearAllData() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          // 清空所有存储
          wx.clearStorageSync();

          // 重新初始化存储
          const app = getApp();
          app.initStorage();

          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });

          // 重新加载统计
          setTimeout(() => {
            this.loadStats();
          }, 1000);
        }
      }
    });
  }
});
