const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 删除歌曲云函数
exports.main = async (event, context) => {
  const { songId } = event;
  
  if (!songId) {
    return {
      success: false,
      message: '歌曲ID不能为空'
    };
  }
  
  try {
    // 从云数据库 songlist 集合删除
    const result = await db.collection('songlist').doc(songId).remove();
    
    return {
      success: true,
      message: '删除成功',
      data: result
    };
  } catch (err) {
    return {
      success: false,
      message: '删除失败',
      error: err.message
    };
  }
};