const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 添加歌曲云函数
exports.main = async (event, context) => {
  const { songData } = event;
  
  try {
    // 添加创建时间和更新时间
    const now = Date.now();
    const dataToAdd = {
      ...songData,
      createTime: now,
      updateTime: now,
      isFavorite: false
    };
    
    // 插入到云数据库 songlist 集合
    const result = await db.collection('songlist').add({
      data: dataToAdd
    });
    
    return {
      success: true,
      message: '歌曲添加成功',
      data: {
        _id: result._id,
        ...dataToAdd
      }
    };
  } catch (err) {
    return {
      success: false,
      message: '歌曲添加失败',
      error: err.message
    };
  }
};