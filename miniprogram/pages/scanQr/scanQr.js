// pages/scanQr/scanQr.js
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
		DriverInfo: [],
		OrderType: '',

		StartLatitude: '',
		StartLongitude: '',
		StartAddress: '',
		Start: false,

		EndLatitude: '',
		EndLongitude: '',
		EndAddress: '',
		End: false,

		BuyerPhone: '',
		PaidPrice: '',
		Distance: '',
		isAgree: false,

		orderId: '',
		Price: '',
		AddPrice: '',
		Minute: '',

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {},

	// 扫码
	ScanQrCode(e) {
		// 允许从相机和相册扫码
		wx.scanCode({
			// 扫码类型
			scanType: ['qrCode'],
			success: res => {
				console.log('扫描二维码成功', )
				if (res.errMsg == 'scanCode:ok') {
					let data = res.result
					this.getQrData(data)
				}
			},
			fail: res => {
				console.log('扫描二维码失败：', res)
				wx.showToast({
					title: '扫描失败！',
					icon: 'error',
					duration: 1000,
					mask: true
				})
			}
		})
	},

	// 检查二维码
	getQrData(data) {
		var data = JSON.parse(data)
		let openID = data[0].openID
		console.log("二维码data里的openID：", data[0].openID)
		db.collection('DriverApplyList').where({
			'_openid': openID
		}).get({
			success: res => {
				console.log('查询代驾成功：', res.errMsg, res.data.length, res)
				if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
					if (res.data[0].forbidden) {
						wx.showToast({
							title: '该代驾已被禁用！',
							icon: 'none',
							duration: 1500,
							mask: true
						})
						return;
					} else if (res.data[0].working) {
						wx.showToast({
							title: '该代驾正在工作中！',
							icon: 'none',
							duration: 1500,
							mask: true
						})
						return;
					} else if (res.data[0].online == false) {
						wx.showToast({
							title: '该代驾不在线！',
							icon: 'none',
							duration: 1500,
							mask: true
						})
						return;
					} else {
						this.setData({
							DriverInfo: res.data,
							steps: 2
						})
					}
				}
			},
			fail: res => {
				console.log('查询代驾失败！', res)
			}
		})
	},

	//计时订单
	timeOrder() {
		this.setData({
			OrderType: 'timePrice',
			steps: 3
		})
	},

	//一口价订单
	fixedOrder() {
		this.setData({
			OrderType: 'fixedPrice',
			steps: 3
		})
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

	// 点击确认
	confirm() {
		this.setData({
			steps: 4
		})
		this.getDistance()
		this.getPrice()
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

	//打开协议文件
	OpenAgreement() {
		wx.navigateTo({
			url: '../agreement/agreement',
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

	//下单按钮
	placeOrder() {
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
		} else if (this.data.OrderType == 'fixedPrice' && this.data.PaidPrice == '') {
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
			// 进行确认提示
			wx.showModal({
				title: '温馨提示',
				content: '是否确认下单?',
				mask: true,
				success: res => {
					if (res.confirm) {
						if (this.data.OrderType == 'fixedPrice') {
							this.submitFixedOrder()
							return;
						}
						if (this.data.OrderType == 'timePrice') {
							this.submitTimeOrder()
							return;
						}
					}
				}
			})
		}
	},

	submitFixedOrder() {
		let userInfo = wx.getStorageSync('UserInfo')
		let nickName = userInfo.nickName
		db.collection('OrderList')
			.add({
				data: {
					Steps: 3,
					ValidOrder: true, //订单有效性
					OrderPay: false, //支付状态
					CancelAwait: false, //取消等待
					OrderReceiving: true, //是否被接单
					CountTime: false, //计时状态
					AdminCancelOrder: false, //管理员取消订单
					DriverCancelOrder: false, //司机取消订单
					FinishOrder: false, //客户完成订单状态
					DriverFinishOrder: false, //司机完成订单状态
					Buyer: nickName,
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

					DriverId: this.data.DriverInfo[0]._id,
					DriverOpenId: this.data.DriverInfo[0]._openid,
					Driver: this.data.DriverInfo[0].name,
					DriverPhone: this.data.DriverInfo[0].phone,
					Driving: this.data.DriverInfo[0].driving,
					DrivingAge: this.data.DriverInfo[0].drivingAge,
					DrivreLatitude: this.data.DriverInfo[0].latitude,
					DriverLongitude: this.data.DriverInfo[0].longitude,
					OrderReceiveTime: formatTime(new Date())
				},
				success: res => {
					// console.log('下单成功', res)
					if (res.errMsg == 'collection.add:ok') {
						this.setData({
							orderId: res._id
						})
						// this.payOrder() //支付
						this.TestpayOrder()//模拟支付
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
	},

	//支付订单
	payOrder() {
		var that = this
		let totalFee = Number(this.data.PaidPrice)
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.PaidPrice}（元）`,
			mask: true,
			success: res => {
				if (res.confirm) {
					wx.cloud.callFunction({
						name: 'pay',
						data: {
							outTradeNo: this.data.orderId, //订单号
							outDriverId: this.data.DriverInfo[0]._id,
							goodName: "代驾费",
							totalFee: totalFee,
						},
						success: res => {
							const payment = res.result.payment
							wx.requestPayment({
								...payment,
								success(res) {
									console.log('pay success', res)
									that.paysuccess()
								},
								fail(err) {
									console.error('pay fail', err)
									wx.showToast({
										title: '支付失败！',
										icon: 'none',
										duration: 1000,
										mask: true,
									})
									wx.navigateBack({
										delta: 1 //返回上一层
									})
								}
							})
						},
					})
				}
			}
		})
	},

	paysuccess() {
		db.collection('OrderList').doc(this.data.orderId).update({
			data: {
				OrderPay: true, //支付状态
			},
			success: res => {
				console.log('支付成功，更新订单支付状态成功', res.errMsg, res.stats.updated)
				if (res.errMsg == "document.update:ok") {
					db.collection('DriverApplyList').doc(this.data.DriverInfo[0]._id, ).update({
						data: {
							working: true,
						},
						success: res => {
							console.log('扫码下单成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok") {
								console.log('下单成功', res)
								wx.showModal({
									title: '温馨提示',
									content: `下单成功！`,
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
							console.log('扫码下单成功，更新代驾工作状态true失败', err)
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
			fail: err => {
				wx.hideLoading()
				console.log('支付成功，更新订单支付状态失败', err)
				wx.showToast({
					title: '网络错误，下单失败！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		})
	},



	//模拟支付
	TestpayOrder() {
		var that = this
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.PaidPrice}（元）`,
			mask: true,
			success: res => {
				if (res.confirm) {
					db.collection('OrderList').doc(that.data.orderId).update({
						data: {
							OrderPay: true, //支付状态
						},
						success: res => {
							console.log('支付成功，更新订单支付状态成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								db.collection('DriverApplyList').doc(that.data.DriverInfo[0]._id, ).update({
									data: {
										working: true,
									},
									success: res => {
										console.log('扫码下单成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
										if (res.errMsg == "document.update:ok") {
											console.log('下单成功', res)
											wx.showModal({
												title: '温馨提示',
												content: `下单成功！`,
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
										console.log('扫码下单成功，更新代驾工作状态true失败', err)
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
						fail: err => {
							wx.hideLoading()
							console.log('支付成功，更新订单支付状态失败', err)
							wx.showToast({
								title: '网络错误，下单失败！',
								icon: 'none',
								mask: true,
								duration: 1000,
							})
						}
					})
				}
			}
		})
	},

	submitTimeOrder() {
		let userInfo = wx.getStorageSync('UserInfo')
		let nickName = userInfo.nickName
		db.collection('OrderList')
			.add({
				data: {
					Steps: 3,
					ValidOrder: true, //订单有效性
					OrderPay: false, //支付状态
					CancelAwait: false, //取消等待
					OrderReceiving: true, //是否被接单
					CountTime: false, //计时状态
					AdminCancelOrder: false, //管理员取消订单
					DriverCancelOrder: false, //司机取消订单
					DriverCancelOrder: false, //司机完成订单状态
					FinishOrder: false, //客户完成订单状态
					DriverFinishOrder: false, //司机完成订单状态
					Buyer: nickName,
					OrderType: 'timePrice',
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

					DriverId: this.data.DriverInfo[0]._id,
					DriverOpenId: this.data.DriverInfo[0]._openid,
					Driver: this.data.DriverInfo[0].name,
					DriverPhone: this.data.DriverInfo[0].phone,
					Driving: this.data.DriverInfo[0].driving,
					DrivingAge: this.data.DriverInfo[0].drivingAge,
					DrivreLatitude: this.data.DriverInfo[0].latitude,
					DriverLongitude: this.data.DriverInfo[0].longitude,
					OrderReceiveTime: formatTime(new Date())
				},
				success: res => {
					// console.log('下单成功', res)
					if (res.errMsg == 'collection.add:ok') {
						db.collection('DriverApplyList').doc(this.data.DriverInfo[0]._id, ).update({
							data: {
								working: true,
							},
							success: res => {
								console.log('扫码下单成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
								if (res.errMsg == "document.update:ok") {
									console.log('下单成功', res)
									wx.showModal({
										title: '温馨提示',
										content: `下单成功！`,
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
								console.log('扫码下单成功，更新代驾工作状态true失败', err)
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
	},

	//取消下单
	cancelPlaceOrder() {
		//返回上一层
		wx.navigateBack({
			delta: 1
		})
	},

})