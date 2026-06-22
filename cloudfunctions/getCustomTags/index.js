const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  try {
    const result = await db.collection('customTags').where({
      openId: OPENID
    }).orderBy('createTime', 'desc').get();

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