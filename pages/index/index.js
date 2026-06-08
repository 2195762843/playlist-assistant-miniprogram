// 首页 - 歌单列表
const { PlaylistStorage } = require('../../utils/storage');

Page({
  data: {
    playlists: [],
    displayedPlaylists: [],
    searchKeyword: '',
    isSearching: false
  },

  onLoad() {
    // 页面加载时获取数据
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPlaylists();
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.loadPlaylists();
    wx.stopPullDownRefresh();
  },

  // 加载歌单列表
  loadPlaylists() {
    const playlists = PlaylistStorage.getAll();
    const displayedPlaylists = this.formatPlaylistsForDisplay(playlists);

    this.setData({
      playlists,
      displayedPlaylists,
      isSearching: false,
      searchKeyword: ''
    });
  },

  // 格式化歌单数据用于显示
  formatPlaylistsForDisplay(playlists) {
    return playlists.map(playlist => ({
      ...playlist,
      createTimeFormat: this.formatDate(playlist.createTime)
    }));
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch(e) {
    const keyword = e.detail.value || this.data.searchKeyword;
    let results;

    if (keyword.trim()) {
      results = PlaylistStorage.search(keyword);
      this.setData({
        isSearching: true
      });
    } else {
      results = PlaylistStorage.getAll();
      this.setData({
        isSearching: false
      });
    }

    this.setData({
      displayedPlaylists: this.formatPlaylistsForDisplay(results)
    });
  },

  // 跳转到歌单详情
  goToPlaylistDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/playlist-detail/playlist-detail?id=${id}`
    });
  },

  // 跳转到新增歌单
  goToAddPlaylist() {
    wx.navigateTo({
      url: '/pages/playlist-edit/playlist-edit'
    });
  },

  // 编辑歌单
  editPlaylist(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/playlist-edit/playlist-edit?id=${id}`
    });
  },

  // 删除歌单
  deletePlaylist(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除歌单"${name}"吗？该歌单下的所有歌曲也将被删除。`,
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          PlaylistStorage.delete(id);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 重新加载列表
          setTimeout(() => {
            this.loadPlaylists();
          }, 1000);
        }
      }
    });
  },

  // 切换置顶状态
  togglePin(e) {
    const id = e.currentTarget.dataset.id;
    const isPinned = PlaylistStorage.togglePin(id);

    wx.showToast({
      title: isPinned ? '已置顶' : '已取消置顶',
      icon: 'success'
    });

    // 重新加载列表
    this.loadPlaylists();
  },

  // 阻止事件冒泡
  noop() {
    // 空函数，用于阻止事件冒泡
  }
});
