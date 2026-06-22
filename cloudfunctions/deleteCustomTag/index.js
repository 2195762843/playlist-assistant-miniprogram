const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { tagId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!tagId) {
    return {
      success: false,
      message: '标签ID不能为空'
    };
  }

  try {
    const tag = await db.collection('customTags').doc(tagId).get();
    if (!tag.data || tag.data.openId !== OPENID) {
      return {
        success: false,
        message: '标签不存在或无权删除'
      };
    }

    await db.collection('customTags').doc(tagId).remove();

    return {
      success: true,
      message: '删除成功'
    };
  } catch (err) {
    return {
      success: false,
      message: '删除失败',
      error: err.message
    };
  }
};