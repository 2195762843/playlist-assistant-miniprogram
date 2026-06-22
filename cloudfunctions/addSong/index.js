const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { songData } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    const now = Date.now();
    const dataToAdd = {
      ...songData,
      createTime: now,
      updateTime: now,
      isFavorite: false,
      openId: OPENID
    };
    
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