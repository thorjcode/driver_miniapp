// BackstagePackage/backstageHome/backstageHome.js
var app = getApp();
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		superAdmin: false, //超级管理员默认为否,按权限显示模块
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (e) {
		// 导航栏显示欢迎管理员
		let userInfo = wx.getStorageSync('UserInfo')
		let nickName = userInfo.nickName
		wx.setNavigationBarTitle({
			title: `欢迎 ${nickName?nickName:''} 管理员`
		})
		this.adminInfo()
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

	},

	//检查是否为超级管理员，按权限显示模块
	adminInfo() {
		let openId = app.globalData.openId
		db.collection('UserList').where({
			'_openid': openId, //根据全局openid检查该管理员是否未超级管理员
		}).field({
			'_openid': true,
			'level': true
		}).get({
			success: res => {
				console.log('查询管理员信息成功')
				if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
					if (res.data[0].level === 2 && res.data[0]._openid === openId) {
						console.log('是超级管理员')
						this.setData({
							superAdmin: true, //是超级管理员
						})
					} else {
						console.log('是普通管理员')
						this.setData({
							superAdmin: false, //不是超级管理员
						})
					}
				}
			},
			fail: err => {
				wx.showToast({
					title: '网络错误！请稍后重试',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		})
	},

	// 跳转函数
	Navigate: function (e) {
		let url = e.currentTarget.dataset.url
		wx.navigateTo({
			url: `${url}`,
		})
	},

})