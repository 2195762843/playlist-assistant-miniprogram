// 数据存储工具模块

// 获取应用实例
const app = getApp();

/**
 * 歌单数据存储操作
 */
const PlaylistStorage = {
  // 获取所有歌单
  getAll() {
    const playlists = wx.getStorageSync('playlists') || [];
    return playlists.sort((a, b) => {
      // 置顶的歌单优先显示
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 然后按创建时间排序
      return b.createTime - a.createTime;
    });
  },

  // 根据ID获取歌单
  getById(id) {
    const playlists = this.getAll();
    return playlists.find(p => p.id === id);
  },

  // 保存歌单
  save(playlist) {
    const playlists = this.getAll();
    const now = Date.now();

    if (playlist.id) {
      // 更新已有歌单
      const index = playlists.findIndex(p => p.id === playlist.id);
      if (index !== -1) {
        playlists[index] = {
          ...playlists[index],
          ...playlist,
          updateTime: now
        };
      }
    } else {
      // 新增歌单
      const newPlaylist = {
        id: `playlist_${now}_${Math.random().toString(36).substr(2, 9)}`,
        ...playlist,
        createTime: now,
        updateTime: now,
        isPinned: false,
        songCount: 0
      };
      playlists.push(newPlaylist);
    }

    wx.setStorageSync('playlists', playlists);
    return playlist.id ? playlist : playlists[playlists.length - 1];
  },

  // 删除歌单（同时删除关联的歌曲）
  delete(id) {
    const playlists = this.getAll();
    const filteredPlaylists = playlists.filter(p => p.id !== id);
    wx.setStorageSync('playlists', filteredPlaylists);

    // 同时删除该歌单下的所有歌曲
    SongStorage.deleteByPlaylistId(id);

    return true;
  },

  // 切换置顶状态
  togglePin(id) {
    const playlists = this.getAll();
    const playlist = playlists.find(p => p.id === id);
    if (playlist) {
      playlist.isPinned = !playlist.isPinned;
      playlist.updateTime = Date.now();
      wx.setStorageSync('playlists', playlists);
      return playlist.isPinned;
    }
    return false;
  },

  // 搜索歌单
  search(keyword) {
    const playlists = this.getAll();
    if (!keyword) return playlists;

    const lowerKeyword = keyword.toLowerCase();
    return playlists.filter(p =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      (p.description && p.description.toLowerCase().includes(lowerKeyword))
    );
  }
};

/**
 * 歌曲数据存储操作
 */
const SongStorage = {
  // 获取所有歌曲
  getAll() {
    return wx.getStorageSync('songs') || [];
  },

  // 根据歌单ID获取歌曲列表
  getByPlaylistId(playlistId) {
    const songs = this.getAll();
    return songs.filter(s => s.playlistId === playlistId).sort((a, b) => {
      // 收藏的歌曲优先
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // 按添加时间倒序
      return b.createTime - a.createTime;
    });
  },

  // 根据ID获取歌曲
  getById(id) {
    const songs = this.getAll();
    return songs.find(s => s.id === id);
  },

  // 保存歌曲
  save(song) {
    const songs = this.getAll();
    const now = Date.now();

    if (song.id) {
      // 更新已有歌曲
      const index = songs.findIndex(s => s.id === song.id);
      if (index !== -1) {
        songs[index] = {
          ...songs[index],
          ...song,
          updateTime: now
        };
      }
    } else {
      // 新增歌曲
      const newSong = {
        id: `song_${now}_${Math.random().toString(36).substr(2, 9)}`,
        ...song,
        createTime: now,
        updateTime: now,
        isFavorite: false,
        tags: song.tags || []
      };
      songs.push(newSong);

      // 更新歌单的歌曲数量
      this.updatePlaylistSongCount(song.playlistId);
    }

    wx.setStorageSync('songs', songs);
    return song.id ? song : songs[songs.length - 1];
  },

  // 删除歌曲
  delete(id) {
    const songs = this.getAll();
    const song = songs.find(s => s.id === id);
    const filteredSongs = songs.filter(s => s.id !== id);
    wx.setStorageSync('songs', filteredSongs);

    // 更新歌单的歌曲数量
    if (song) {
      this.updatePlaylistSongCount(song.playlistId);
    }

    return true;
  },

  // 根据歌单ID删除所有歌曲
  deleteByPlaylistId(playlistId) {
    const songs = this.getAll();
    const filteredSongs = songs.filter(s => s.playlistId !== playlistId);
    wx.setStorageSync('songs', filteredSongs);
    return true;
  },

  // 切换收藏状态
  toggleFavorite(id) {
    const songs = this.getAll();
    const song = songs.find(s => s.id === id);
    if (song) {
      song.isFavorite = !song.isFavorite;
      song.updateTime = Date.now();
      wx.setStorageSync('songs', songs);
      return song.isFavorite;
    }
    return false;
  },

  // 更新歌单的歌曲数量
  updatePlaylistSongCount(playlistId) {
    const songs = this.getByPlaylistId(playlistId);
    const playlists = PlaylistStorage.getAll();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      playlist.songCount = songs.length;
      playlist.updateTime = Date.now();
      wx.setStorageSync('playlists', playlists);
    }
  },

  // 搜索歌曲
  search(keyword, playlistId = null) {
    const songs = this.getAll();
    if (!keyword) return playlistId ? this.getByPlaylistId(playlistId) : songs;

    const lowerKeyword = keyword.toLowerCase();
    let filtered = songs.filter(s =>
      s.name.toLowerCase().includes(lowerKeyword) ||
      (s.artist && s.artist.toLowerCase().includes(lowerKeyword)) ||
      (s.mood && s.mood.toLowerCase().includes(lowerKeyword))
    );

    if (playlistId) {
      filtered = filtered.filter(s => s.playlistId === playlistId);
    }

    return filtered;
  },

  // 按标签筛选歌曲
  filterByTags(tags, playlistId = null) {
    let songs = this.getAll();
    if (playlistId) {
      songs = songs.filter(s => s.playlistId === playlistId);
    }
    if (!tags || tags.length === 0) return songs;

    return songs.filter(s =>
      s.tags && s.tags.some(tag => tags.includes(tag))
    );
  }
};

/**
 * 标签数据存储操作
 */
const TagStorage = {
  // 预设标签
  presetTags: [
    { name: '华语', color: '#FF6B6B' },
    { name: '欧美', color: '#4ECDC4' },
    { name: '日韩', color: '#45B7D1' },
    { name: '粤语', color: '#FFA07A' },
    { name: '摇滚', color: '#6C5CE7' },
    { name: '流行', color: '#FD79A8' },
    { name: '古典', color: '#A29BFE' },
    { name: '民谣', color: '#00B894' }
  ],

  // 获取所有标签（预设 + 自定义）
  getAll() {
    const customTags = wx.getStorageSync('customTags') || [];
    return [...this.presetTags, ...customTags];
  },

  // 获取自定义标签
  getCustomTags() {
    return wx.getStorageSync('customTags') || [];
  },

  // 添加自定义标签
  addCustomTag(tag) {
    const customTags = this.getCustomTags();
    const exists = customTags.some(t => t.name === tag.name);
    if (exists) {
      return { success: false, message: '标签已存在' };
    }

    if (customTags.length >= 10) {
      return { success: false, message: '自定义标签最多10个' };
    }

    customTags.push(tag);
    wx.setStorageSync('customTags', customTags);
    return { success: true };
  },

  // 删除自定义标签
  deleteCustomTag(name) {
    const customTags = this.getCustomTags();
    const filtered = customTags.filter(t => t.name !== name);
    wx.setStorageSync('customTags', filtered);
    return true;
  },

  // 更新自定义标签
  updateCustomTag(oldName, newTag) {
    const customTags = this.getCustomTags();
    const index = customTags.findIndex(t => t.name === oldName);
    if (index !== -1) {
      customTags[index] = newTag;
      wx.setStorageSync('customTags', customTags);
      return true;
    }
    return false;
  }
};

/**
 * 设置数据存储操作
 */
const SettingsStorage = {
  // 获取设置
  get() {
    return wx.getStorageSync('appSettings') || {
      sortBy: 'createTime',
      sortOrder: 'desc'
    };
  },

  // 保存设置
  save(settings) {
    wx.setStorageSync('appSettings', settings);
    return settings;
  }
};

/**
 * 统计数据
 */
const Stats = {
  // 获取统计数据
  get() {
    const playlists = PlaylistStorage.getAll();
    const songs = SongStorage.getAll();

    return {
      totalPlaylists: playlists.length,
      totalSongs: songs.length,
      pinnedPlaylists: playlists.filter(p => p.isPinned).length,
      favoriteSongs: songs.filter(s => s.isFavorite).length,
      tagsCount: TagStorage.getAll().length
    };
  }
};

module.exports = {
  PlaylistStorage,
  SongStorage,
  TagStorage,
  SettingsStorage,
  Stats
};
