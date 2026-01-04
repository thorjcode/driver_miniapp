// 云函数代码
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
exports.main = async (event, context) => {
  const res = await cloud.cloudPay.unifiedOrder({
    "body": event.goodName, //商品名称或商品描述
	"outTradeNo": event.outTradeNo, //订单号
	"outDriverId":event.outDriverI,
    "spbillCreateIp": "127.0.0.1",
    "subMchId": "1111111111111", //要替换成你自己的微信支付商户号
    "totalFee" : event.totalFee,//*100, //支付的金额，单位分
    "envId": "cloud1-111111111111", //要替换成你自己的云开发环境id
    "functionName": "payCallBack" //支付成功的回调
    
  })
  return res
}