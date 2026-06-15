const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 获取歌曲列表云函数
exports.main = async (event, context) => {
  const { playlistId } = event;
  
  try {
    let query = db.collection('songlist');
    
    // 如果指定了歌单ID，则筛选该歌单的歌曲
    if (playlistId) {
      query = query.where({
        playlistId: playlistId
      });
    }
    
    // 按创建时间倒序获取所有歌曲
    const result = await query.orderBy('createTime', 'desc').get();
    
    return {
      success: true,
      message: '获取成功',
      data: result.data
    };
  } catch (err) {
    return {
      success: false,
      message: '获取失败',
      error: err.message
    };
  }
};