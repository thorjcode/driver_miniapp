// pages/me/me.js
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js')
var qqmapsdk
const app = getApp();
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		driver: false,
		UserLogin: false,
		userInfo: null,
		openId: '',
		ClickAccount: 0, // 点击次数记录
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		qqmapsdk = new QQMapWX({
			key: "PKGBZ-SFCRX-KVB4G-TNASK-PWGGJ-GQFSK"
		});
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		app.isLogin()
		this.setData({
			openId: app.globalData.openId,
			UserLogin: app.globalData.UserLogin,
			userInfo: app.globalData.userInfo,
		})
		if (this.data.UserLogin) {
			this.driver()
			console.log('已登录', )
			let myCity = wx.getStorageSync('MyCity');
			if (myCity == '') {
				this.getLocation()
			}
		}

	},

	// 获取当前位置
	getLocation() {
		wx.getLocation({
			type: 'gcj02',
			success: res => {
				let NowtLongitude = Number(res.longitude) // 经度
				let NowLatitude = Number(res.latitude) // 纬度 
				console.log('当前的经纬度', NowtLongitude, NowLatitude)
				qqmapsdk.reverseGeocoder({
					location: {
						latitude: NowLatitude,
						longitude: NowtLongitude
					},
					get_poi: 1,
					poi_options: 'policy=2',
					success: res => {
						console.log('逆地址解析成功：', res);
						let myCity = res.result.address_component.city
						wx.setStorageSync('MyCity', myCity) //保存到本地缓存	
					},
					fail: err => {
						console.log('逆地址解析失败', err);
						wx.showToast({
							title: '获取位置信息失败！请稍后重试',
							icon: 'none',
							mask: true,
							duration: 1000
						})
					}
				})
			},
			fail: res => {
				console.log('授权位置信息失败：', res)
				wx.showModal({
					title: "申请授权位置信息",
					content: "请授权获取位置信息！如还是不能使用，请打开定位功能，关闭5G模式，再重试！",
					confirmText: "去设置",
					success: res => {
						if (res.confirm) {
							wx.openSetting()
						}
					}
				})
			}
		})
	},

	//是否为司机
	driver() {
		let openId = this.data.openId
		db.collection('DriverApplyList').where({
				'_openid': openId,
				'audit': true,
			})
			.count({
				success: res => {
					console.log('查询是否为代驾成功：', res)
					if (res.total > 0) {
						this.setData({
							driver: true
						})
					}
				},
				fail: err => {
					console.log('查询是否为代驾失败：', err)
				}
			})
	},

	// 后台入口
	stagedoor() {
		let ClickAccount = this.data.ClickAccount
		ClickAccount = ClickAccount + 1
		if (ClickAccount < 5) {
			console.log('点击次数', ClickAccount)
			this.setData({
				ClickAccount: ClickAccount
			})
		} else {
			console.log('点击次数', ClickAccount)
			this.setData({
				ClickAccount: 0, // 恢复点击次数记录
			})
			this.IsAdmin() // 检查访问者身份
		}
	},

	// 检查是否为管理员
	IsAdmin() {
		let openId = this.data.openId
		wx.showLoading({
			title: '正在检验...',
			mask: true
		})
		db.collection('UserList').where({
				'_openid': openId,
				'admin': true,
			})
			.count({
				success: res => {
					wx.hideLoading()
					if (res.total > 0) {
						// 管理员跳转到管理员页面
						wx.navigateTo({
							url: '../../BackstagePackage/backstageHome/backstageHome'
						})
					} else {
						wx.showToast({
							title: '你还不是管理员！',
							icon: 'none',
							mask: true,
							duration: 1000
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					wx.showToast({
						title: '网络错误！请稍后重试',
						icon: 'none',
						mask: true,
						duration: 1000,
					})
				}
			})
	},

	// 去登录
	goLogin() {
		wx.navigateTo({
			url: '../login/login',
		})
	},


	/**
	 * 跳转到订单
	 */
	myOrder(e) {
		let UserLogin = this.data.UserLogin
		if (UserLogin) {
			wx.navigateTo({
				url: '../myOrder/myOrder',
			})
		} else {
			// 提示登录
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}

	},

	/**
	 * 跳转到账户
	 */
	myWallet(e) {
		let UserLogin = this.data.UserLogin
		if (UserLogin) {
			wx.navigateTo({
				url: '../myWallet/myWallet',
			})
		} else {
			// 提示登录
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}

	},

	/**
	 * 跳转到成为代驾
	 */
	driverApply(e) {
		let UserLogin = this.data.UserLogin
		if (UserLogin) {
			wx.navigateTo({
				url: '../driverApply/driverApply',
			})
		} else {
			// 提示登录
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}
	},


	// 清除数据退出
	exit() {
		let UserLogin = this.data.UserLogin
		if (UserLogin) {
			wx.showToast({
				title: '退出成功',
				icon: 'success',
				mask: true,
				duration: 1000,
			})
			this.setData({
				UserLogin: false,
				driver: false
			})
			wx.removeStorageSync('UserInfo')
			wx.removeStorageSync('MyCity')
		} else {
			// 提示登录
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}
	},
})