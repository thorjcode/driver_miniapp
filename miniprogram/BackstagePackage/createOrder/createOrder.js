// BackstagePackage/createOrder/createOrder.js
const app = getApp()
const db = wx.cloud.database()
const {
	formatTime
} = require("../../utils/util.js")
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		steps: 1,
		OrderInfo: [],
		drivertotal: 0,
		driverPage: 0,
		DriverList: [],

		StartLatitude: '',
		StartLongitude: '',
		StartAddress: '',
		Start: false,

		EndLatitude: '',
		EndLongitude: '',
		EndAddress: '',
		End: false,

		BuyerPhone: '',
		Distance: '',
		PaidPrice: '',
		isAgree: false,
		RecDriver: false,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

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

	//点击起点输入框
	startFocus(e) {
		let value = e.detail.value
		console.log('点击了起点输入框', value)
		if (value == '') {
			this.startLocation()
		}
	},

	startInput(e) {
		let value = e.detail.value
		console.log('编辑了起点输入框', value)
		if (value == '') {
			this.setData({
				Start: false
			})
		}
	},

	endFocus(e) {
		let value = e.detail.value
		console.log('点击了终点输入框', value)
		if (value == '') {
			this.endLocation()
		}
	},

	endInput(e) {
		let value = e.detail.value
		console.log('编辑了终点输入框', value)
		if (value == '') {
			this.setData({
				End: false
			})
		}
	},

	// 选择起点位置
	startLocation() {
		wx.chooseLocation({
			success: res => {
				console.log('选择的起点位置：', res.name, res.latitude, res.longitude, )
				this.setData({
					StartAddress: res.name,
					StartLatitude: res.latitude,
					StartLongitude: res.longitude,
					Start: true
				})
			}
		})
	},

	// 选择终点位置
	endLocation() {
		wx.chooseLocation({
			success: res => {
				console.log('选择的终点位置：', res.name, res.latitude, res.longitude, )
				this.setData({
					EndAddress: res.name,
					EndLatitude: res.latitude,
					EndLongitude: res.longitude,
					End: true
				})
			}
		})
	},

	//获取输入框的电话
	inputPhone(e) {
		let value = e.detail.value
		console.log('电话：', value)
		let BuyerPhone = this.data.BuyerPhone
		BuyerPhone = value
		this.setData({
			BuyerPhone: value,
			BuyerPhone
		})
	},

	//获取输入框
	inputPrice(e) {
		let value = e.detail.value
		console.log('价格：', value)
		let PaidPrice = this.data.PaidPrice
		PaidPrice = value
		this.setData({
			PaidPrice: value,
			PaidPrice
		})
	},

	//打开协议文件
	OpenAgreement() {
		wx.navigateTo({
			url: '../../pages/agreement/agreement',
		})
	},

	//同意协议
	agreement() {
		if (this.data.isAgree) {
			this.setData({
				isAgree: false,
			})
		} else {
			this.setData({
				isAgree: true,
			})
		}
	},

	// 点击确认
	confirm() {
		this.setData({
			steps: 2,
			RecDriver: true
		})
		this.getDistance()
		this.getDriversCount()
		let driverPage = this.data.driverPage
		this.getDrivers(driverPage)
	},


	// 点击取消
	cancel() {
		this.setData({
			StartLatitude: '',
			StartLongitude: '',
			StartAddress: '',
			Start: false,

			EndLatitude: '',
			EndLongitude: '',
			EndAddress: '',
			End: false
		})
	},

	// 计算距离
	getDistance() {
		let lat1 = this.data.StartLatitude
		let lng1 = this.data.StartLongitude
		let lat2 = this.data.EndLatitude
		let lng2 = this.data.EndLongitude

		var radLat1 = lat1 * Math.PI / 180.0
		var radLat2 = lat2 * Math.PI / 180.0
		var a = radLat1 - radLat2
		var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
		var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
		s = s * 6378.137 // 地球半径;
		s = Math.round(s * 10000) / 10000
		let Distance = s.toFixed(2)
		console.log('计算距离：', Distance)
		this.setData({
			Distance,
		})
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
					} else {
						wx.showToast({
							title: '暂时没有可推荐的司机！',
							icon: 'none',
							duration: 1500
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

	//选择司机
	ChooseDriverBtn(e) {
		if (this.data.BuyerPhone == '') {
			wx.showToast({
				title: '请输入电话！',
				icon: 'none',
				duration: 1000,
			})
		} else if (this.data.BuyerPhone.length != 11) {
			wx.showToast({
				title: '请输入11位电话！',
				icon: 'none',
				duration: 1000,
			})
		} else if (this.data.PaidPrice == '') {
			wx.showToast({
				title: '请输入价格！',
				icon: 'none',
				duration: 1000,
			})
		} else if (this.data.isAgree == false) {
			wx.showToast({
				title: '请先同意协议要求！',
				icon: 'none',
				duration: 1000,
			})
		} else {
			let userInfo = wx.getStorageSync('UserInfo')
			let nickName = userInfo.nickName
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
						db.collection('OrderList')
							.add({
								data: {
									Steps: 3,
									ValidOrder: true, //订单有效性
									OrderPay: true, //支付状态
									OrderPayer: nickName, //支付者
									CancelAwait: false, //取消等待
									OrderReceiving: true, //是否被接单
									CountTime: false, //计时状态
									AdminCancelOrder:false,//管理员取消订单
									DriverCancelOrder: false, //司机取消订单
									FinishOrder: false, //客户完成订单状态
									DriverFinishOrder: false, //司机完成订单状态

									OrderType: 'fixedPrice',
									BuyerPhone: this.data.BuyerPhone,
									StartAddress: this.data.StartAddress,
									StartLatitude: this.data.StartLatitude,
									StartLongitude: this.data.StartLongitude,
									EndAddress: this.data.EndAddress,
									EndLatitude: this.data.EndLatitude,
									EndLongitude: this.data.EndLongitude,
									Distance: Number(this.data.Distance),
									PaidPrice: Number(this.data.PaidPrice),
									PlaceOrderTime: formatTime(new Date()),

									DriverId: driverId,
									DriverOpenId: driverOpenid,
									Driver: driverName,
									DriverPhone: phone,
									Driving: driving,
									DrivingAge: drivingage,
									OrderReceiveTime: formatTime(new Date())
								},
								success: res => {
									// console.log('下单成功', res)
									if (res.errMsg == 'collection.add:ok') {
										db.collection('DriverApplyList').doc(driverId).update({
											data: {
												working: true,
											},
											success: res => {
												console.log('一口价下单成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
												if (res.errMsg == "document.update:ok") {
													wx.showModal({
														title: '温馨提示',
														content: `推荐订单成功！`,
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
												wx.hideLoading()
												console.log('一口价下单成功，更新代驾工作状态true失败', err)
												wx.showToast({
													title: '网络错误，下单失败！',
													icon: 'none',
													mask: true,
													duration: 1000,
												})
											}
										})
									}
								},
								fail: res => {
									console.log('下单失败', res)
									wx.showToast({
										title: '下单失败！',
										icon: 'none',
										duration: 1000,
									})
								}
							})
					}
				}
			})
		}
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