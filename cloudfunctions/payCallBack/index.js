// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
// 云函数入口函数
exports.main = async (event, context) => {
	console.log(event,"支付成功")
  //订单号 event.outTradeNo
  return await cloud.database().collection('OrderList').doc(event.outTradeNo).update({
    data: {
		OrderPay: true
    }
  }).then(res => {
	return res
  }).catch(res => {
    return res
  })
}