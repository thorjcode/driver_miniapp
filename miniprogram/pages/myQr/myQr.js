// pages/myQr/myQr.js
var app = getApp();
const db = wx.cloud.database();
const {
	MD5
} = require("./MD5.js")
const {
	formatTime
} = require("../../utils/util.js")
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		QRcodeData: "",

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (e) {
		this.ShowQRCode()
	},


	// 获取二维码
	ShowQRCode(e) {
		wx.showLoading({
			title: '加载中...',
			mask: true
		})
		let openId = app.globalData.openId
		db.collection('DriverQrList').where({
			'_openid': openId
		}).get({
			success: res => {
				wx.hideLoading()
				if (res.errMsg == "collection.get:ok" && res.data.length == 0) {
					// 生成10位的随机数字符串
					let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
					let str = "";
					let n = 25
					for (var i = 0; i < n; i++) {
						var id = Math.ceil(Math.random() * 35);
						str += chars[id];
					}
					// 对字符串MD5加密
					let md5 = MD5(str)
					let code = str + md5.toUpperCase() + str
					db.collection('DriverQrList')
						.add({
							data: {
								'code': code,
								'openID': openId,
								'updatetime': formatTime(new Date()),
							},
							success: res => {
								console.log("二维码数据写入成功：", res)
								db.collection('DriverQrList').where({
									'_openid': openId
								}).get({
									success: res => {
										let data = res.data
										this.setData({
											QRcodeData: JSON.stringify(data), // 设置二维码的值并显示
											QrcodeStats: true,
										})
									},
									fail: err => {
										console.log('查询二维码失败', err)
										wx.showToast({
											title: '网络错误！请稍后再试',
											icon: 'none',
											duration: 1000,
										})
									}
								})
							},
							fail: err => {
								console.log('二维码写入失败：', err)
								wx.showToast({
									title: '网络错误！请稍后再试',
									icon: 'none',
									duration: 1000,
								})
							}
						})
				} else {
					db.collection('DriverQrList').where({
							'_openid': openId,
						})
						.get({
							success: res => {
								console.log('查询二维码成功', res.errMsg, res)
								if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
									let data = res.data
									this.setData({
										QRcodeData: JSON.stringify(data), // 设置二维码的值并显示
										QrcodeStats: true,
									})
								}
							},
							fail: err => {
								console.log('查询二维码失败', err)
								wx.showToast({
									title: '网络错误！请稍后再试',
									icon: 'none',
									duration: 1000,
								})
							}
						})
				}
			},
			fail: err => {
				wx.hideLoading()
				console.log('查询二维码失败', err)
				wx.showToast({
					title: '网络错误！请稍后再试',
					icon: 'none',
					duration: 1000,
				})
			}
		})
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})