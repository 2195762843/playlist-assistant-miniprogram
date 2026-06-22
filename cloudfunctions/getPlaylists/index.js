const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { keyword } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    let query = db.collection('playlists').where({
      openId: OPENID
    });

    if (keyword && keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      query = query.where(db.command.or([
        { name: db.RegExp({ regexp: lowerKeyword, options: 'i' }) },
        { description: db.RegExp({ regexp: lowerKeyword, options: 'i' }) }
      ]));
    }

    const result = await query.orderBy('isPinned', 'desc').orderBy('createTime', 'desc').get();

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