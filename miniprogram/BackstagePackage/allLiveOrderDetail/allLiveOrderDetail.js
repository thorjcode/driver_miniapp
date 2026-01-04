// BackstagePackage/allLiveOrderDetail/allLiveOrderDetail.js
const app = getApp();
const db = wx.cloud.database()
const {
	formatTime
} = require("../../utils/util.js")
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		orderId: '',
		Minute: '',
		Price: '',
		AddPrice: '',
		OrderInfo: [],

		drivertotal: 0,
		driverPage: 0,
		DriverList: [],
		RecDriver: false,

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(e) {
		let Id = e.id
		this.setData({
			orderId: Id,
		})
		console.log('订单详情页面接收的id：', Id)
		this.GetMyOrders(Id)
		this.getPrice()


	},
	//获取定价
	getPrice() {
		db.collection('MiniAppInfo')
			.get({
				success: res => {
					console.log('查询定价信息成功：', res.data.length);
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						let NowDate = new Date()
						let NowHour = NowDate.getHours()
						console.log("当前时间：", NowHour, typeof (NowHour))
						if (NowHour >= res.data[0].NightTime || NowHour <= res.data[0].MorningTime) {
							console.log("走if，晚间时间：", res.data[0].NightTime, typeof (res.data[0].NightTime), "早间时间：", res.data[0].MorningTime, typeof (res.data[0].MorningTime))
							this.setData({
								Minute: res.data[0].Minute,
								Price: res.data[0].NightPrice,
								AddPrice: res.data[0].AddPrice,

							})
						} else {
							console.log("走else，晚间时间：", res.data[0].NightTime, typeof (res.data[0].NightTime), "早间时间：", res.data[0].MorningTime, typeof (res.data[0].MorningTime))
							this.setData({
								Minute: res.data[0].Minute,
								Price: res.data[0].MorningPrice,
								AddPrice: res.data[0].AddPrice,
							})
						}
					}
				},
				fail: err => {
					console.log('查询定价信息失败：', err)
				}
			})
	},
	// 获取订单数据
	GetMyOrders(Id) {
		wx.showLoading({
			title: '查询中...'
		})
		db.collection('OrderList')
			.where({
				'_id': Id,
			})
			.get({
				success: res => {
					wx.hideLoading()
					console.log('查询订单成功', res.errMsg, res.data.length, res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						this.setData({
							OrderInfo: res.data,
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('查询订单失败', err)
					wx.showToast({
						title: '网络错误！查询失败',
						duration: 1000,
						icon: 'none',
						mask: true
					})
				}
			})
	},

	// 打电话
	CallPhone(e) {
		let phoneNumber = e.currentTarget.dataset.phone
		wx.showModal({
			title: '温馨提示',
			content: `是否拨打${phoneNumber}号码？`,
			confirmText: '拨打',
			mask: true,
			success: res => {
				if (res.confirm) {
					wx.makePhoneCall({
						phoneNumber: phoneNumber,
					})
				}
			}
		})
	},

	//推荐司机按钮
	RecDriverBtn() {
		this.setData({
			RecDriver: true,
		})
		this.getDriversCount()
		let driverPage = this.data.driverPage
		this.getDrivers(driverPage)
	},

	// 查询司机总数
	getDriversCount() {
		db.collection('DriverApplyList').where({
				'audit': true,
				'forbidden': false,
				'online': true,
				'working': false,
			})
			.count({
				success: res => {
					console.log('查询数据总数成功', res.total)
					if (res.errMsg == "collection.count:ok") {
						this.setData({
							drivertotal: res.total
						})
					}
				},
				fail: err => {}
			})
	},

	//获取司机
	getDrivers() {
		db.collection('DriverApplyList').where({
				'audit': true,
				'forbidden': false,
				'online': true,
				'working': false,
			})
			.orderBy('score', 'desc')
			.get({
				success: res => {
					console.log('查询司机成功', res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						let data = res.data
						let driverList = []
						for (let i = 0; i < data.length; i++) {
							driverList.push(data[i])
						}
						this.setData({
							DriverList: driverList
						})
					}
				},
				fail: res => {
					console.log('查询司机失败', res)
					wx.showToast({
						title: '网络错误，查询失败！',
						icon: 'none',
						duration: 1000
					})
				}
			})
	},

	//选择司机
	ChooseDriverBtn(e) {
		let driverId = e.currentTarget.dataset.id
		let driverOpenid = e.currentTarget.dataset.openid
		let driverName = e.currentTarget.dataset.name
		let phone = e.currentTarget.dataset.phone
		let driving = e.currentTarget.dataset.driving
		let drivingage = e.currentTarget.dataset.drivingage
		console.log('推荐的司机信息：', driverId, driverOpenid, driverName, phone, driving, drivingage)
		wx.showModal({
			title: '温馨提示',
			content: `是否推荐：${driverName}`,
			mask: true,
			success: res => {
				if (res.confirm) {
					db.collection('OrderList').doc(this.data.orderId).update({
						data: {
							Steps: 3,
							OrderReceiving: true,
							Driver: driverName,
							DriverId: driverId,
							DriverOpenId: driverOpenid,
							DriverPhone: phone,
							Driving: driving,
							DrivingAge: drivingage,
							OrderReceiveTime: formatTime(new Date())
						},
						success: res => {
							console.log('推荐成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								db.collection('DriverApplyList').doc(driverId).update({
									data: {
										working: true,
									},
									success: res => {
										console.log('推荐成功，更新代驾工作为true成功', res.errMsg, res.stats.updated)
										if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
											wx.showModal({
												title: '温馨提示',
												content: `推荐成功！`,
												showCancel: false,
												confirmText: '返回',
												success: res => {
													if (res.confirm) {
														wx.navigateBack({
															delta: 1 //返回上一层
														})

													}
												}
											})
										}
									},
									fail: err => {
										console.log('推荐成功，更新代驾工作为true失败', err)
										wx.showToast({
											title: '推荐失败！',
											icon: 'none',
											duration: 1000,
											mask: true
										})
									}
								})
							}
						},
						fail: err => {
							console.log('推荐失败', err)
							wx.showToast({
								title: '推荐失败！',
								icon: 'none',
								duration: 1000,
								mask: true
							})
						}
					})
				}
			}
		})
	},
	
	//scroll触底
	scrollonReachBottom() {
		let drivertotal = this.data.drivertotal
		console.log('scroll触底的条数', drivertotal)
		let driverPage = this.data.driverPage
		console.log('scroll触底page', driverPage)
		let DriverList = this.data.DriverList
		if (DriverList.length < drivertotal) {
			driverPage = DriverList.length
			this.getDrivers(driverPage)
		} else {
			wx.showToast({
				title: '没有数据了呢',
				duration: 1000,
				icon: "none",
			})
		}
	},

	//管理员取消订单按钮
	cancelOrder() {
		let orderId = this.data.orderId
		wx.showModal({
			title: '温馨提示',
			content: '请谨慎取消订单！',
			mask: true,
			success: res => {
				if (res.confirm) {
					let userInfo = wx.getStorageSync('UserInfo')
					let nickName = userInfo.nickName
					db.collection('OrderList').doc(orderId).update({
						data: {
							ValidOrder: false,
							AdminCancelOrder:true,
							AdminCancel:nickName,
							AdminCancelOrderTime: formatTime(new Date())
						},
						success: res => {
							console.log('取消订单成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								db.collection('DriverApplyList').doc(this.data.OrderInfo[0].DriverId).update({
									data: {
										working: false,
									},
									success: res => {
										console.log('取消订单成功，更新代驾工作状态为false成功：', res.errMsg, res.stats.updated)
										if (res.errMsg == "document.update:ok") {
											wx.showModal({
												title: '温馨提示',
												content: `取消订单成功！`,
												showCancel: false,
												confirmText: '返回',
												success: res => {
													if (res.confirm) {
														wx.navigateBack({
															delta: 1 //返回上一层
														})

													}
												}
											})
										}
									},
									fail: err => {
										console.log('取消订单成功，更新代驾工作状态为false失败：', err)
										wx.showToast({
											title: '网络错误，操作失败！',
											icon: 'none',
											mask: true,
											duration: 1000,
										})
									}
								})
							}
						},
						fail: err => {
							console.log('取消订单失败', err)
							wx.showToast({
								title: '取消订单失败！',
								icon: 'none',
								duration: 1000,
								mask: true
							})
						}
					})
				}
			}
		})
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})