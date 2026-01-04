// pages/homeOrder/homeOrder.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command;
const {
	formatTime
} = require("../../utils/util.js")

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		steps: 1,
		orderId: '',
		OrderInfo: [],

		StartLatitude: '',
		StartLongitude: '',
		StartAddress: '',

		EndLatitude: '',
		EndLongitude: '',
		EndAddress: '',

		Distance: '',
		BuyerPhone: '',
		isAgree: false,

		DriverDistance: '',
		maxDistance: 2000,

		Price: '',
		AddPrice: '',
		Minute: '',
		PaidPrice: '',

		topScore: '',

		oderAwaitInterval: '',
		Awhour: '00',
		Awminute: '00',
		Awsecond: '00',
		Awovertime: false,

		default_score: 0,
		score: 0,
		score_text_arr: ['非常差', '差', '一般', '好', '非常好'],
		score_text: "",
		score_img_arr: [],
		SubmitScore: '',

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		console.log('homeOrder的onLoad执行了')
		const eventChannel = this.getOpenerEventChannel()
		// 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
		let that = this
		eventChannel.on('acceptDataFromOpenerPage', function (e) {
			console.log('传过来的数据：', e)
			that.setData({
				StartLatitude: Number(e.StartLatitude),
				StartLongitude: Number(e.StartLongitude),
				StartAddress: e.StartAddress,

				EndLatitude: Number(e.EndLatitude),
				EndLongitude: Number(e.EndLongitude),
				EndAddress: e.EndAddress,
			})
		})
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {
		console.log('homeOrder的onHide执行了')
		clearInterval(this.data.interval) //清除计时器
		this.setData({
			interval: '',
		})
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {
		console.log('homeOrder的onUnload执行了')
		clearInterval(this.data.oderAwaitInterval) //清除计时器
		this.setData({
			oderAwaitInterval: ''
		})
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
		console.log('homeOrder的onShow执行了')

		this.getPrice()
		this.getOrderInfo()
		this._default_score(this.data.default_score)

		let Awhour = wx.getStorageSync('Awhour')
		let Awminute = wx.getStorageSync('Awminute')
		let Awsecond = wx.getStorageSync('Awsecond')
		let Awovertime = wx.getStorageSync('Awovertime')
		this.setData({
			Awhour: Awhour < 10 ? '0' + Awhour : Awhour,
			Awminute: Awminute < 10 ? '0' + Awminute : Awminute,
			Awsecond: Awsecond < 10 ? '0' + Awsecond : Awsecond,
			Awovertime,
		})
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

	//查询订单信息
	getOrderInfo() {
		let openId = app.globalData.openId
		db.collection('OrderList')
			.where({
				'_openid': openId,
				'ValidOrder': true
			})
			.get({
				success: res => {
					wx.hideNavigationBarLoading();
					wx.stopPullDownRefresh();
					console.log('查询订单成功：', res);
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						console.log('有还在进行中的订单')
						this.setData({
							steps: res.data[0].Steps,
							orderId: res.data[0]._id,
							OrderInfo: res.data,
						})

						if (res.data[0].Steps == 2) {
							console.log('订单第2步，等待接单');
							this.AwaitTime()
							this.watcherOrderReceiving()
							return;
						}

						if (res.data[0].Steps == 3) {
							console.log('订单第3步，已接单');
							this.watcherOrderCancel()
							clearInterval(this.data.oderAwaitInterval) //清除计时器
							this.setData({
								oderAwaitInterval: ''
							})
							wx.removeStorageSync('Awhour')
							wx.removeStorageSync('Awminute')
							wx.removeStorageSync('Awsecond')
							wx.removeStorageSync('Awovertime')
							return;
						}

						if (res.data[0].Steps == 4) {
							console.log('订单第4步，等待完成');
							return;
						}
					} else {
						this.getDistance()
					}
				},
				fail: err => {
					wx.hideNavigationBarLoading();
					wx.stopPullDownRefresh();
					console.log('查询订单失败：', err)
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

	//下单按钮
	placeOrder() {
		let userInfo = wx.getStorageSync('UserInfo')
		let nickName = userInfo.nickName
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
						db.collection('OrderList')
							.add({
								data: {
									Steps: 2,
									ValidOrder: true, //订单有效性
									OrderPay: false, //支付状态
									CancelAwait: false, //取消等待
									OrderReceiving: false, //是否被接单
									CountTime: false, //计时状态
									AdminCancelOrder: false, //管理员取消订单
									DriverCancelOrder: false, //司机取消订单
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
									PaidPrice: this.data.PaidPrice,
									PlaceOrderTime: formatTime(new Date())
								},
								success: res => {
									// console.log('下单成功', res)
									if (res.errMsg == 'collection.add:ok') {
										console.log('下单成功', res)
										this.setData({
											orderId: res._id
										})
										this.PushOrder()
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

	//取消下单按钮
	cancelPlaceOrder() {
		wx.navigateBack({
			delta: 1 //返回上一层
		})
	},

	//推送订单
	PushOrder() {
		console.log('系统开始派送订单')
		wx.showLoading({
			title: '系统派送中...',
			mask: true
		})
		let longitude = Number(this.data.StartLongitude)
		let latitude = Number(this.data.StartLatitude)
		console.log('要查询的经纬度', latitude)
		db.collection('DriverApplyList').where({
				'audit': true,
				'forbidden': false,
				'online': true,
				'working': false,
				location: _.geoNear({
					geometry: db.Geo.Point(longitude, latitude),
					minDistance: 0,
					maxDistance: Number(this.data.maxDistance),
				}),
			})
			.orderBy('score', 'desc')
			.get({
				success: res => {
					console.log('查询', this.data.maxDistance, '米内的代驾成功：', res.errMsg, res.data.length, res)
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						for (let i = 0; i < res.data.length; i++) {
							let topScore = Math.max(res.data[i].score)
							if (res.data[i].score == topScore) {
								console.log('最高评分', topScore)
								this.setData({
									topScore: topScore
								})
								break;
							}
						}
						let orderId = this.data.orderId
						let topScore = this.data.topScore
						db.collection('OrderList').doc(orderId).update({
							data: {
								OrderReceiveScore: topScore,
							},
							success: res => {
								console.log('修改订单为推送状态成功', res.errMsg, res.stats.updated)
								if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
									wx.hideLoading()
									console.log('派单成功', res)
									wx.showToast({
										title: '派单成功',
										icon: 'success',
										mask: true,
										duration: 1000
									})
									this.getOrderInfo() //刷新数据
								}
							},
							fail: res => {
								wx.hideLoading()
								console.log('派单失败', res)
								wx.showToast({
									title: '网络错误，派送失败！',
									icon: 'none',
									mask: true,
									duration: 1000
								})
							}
						})
					} else {
						if (this.data.maxDistance == 30000) {
							wx.hideLoading()
							wx.showModal({
								title: '温馨提示',
								content: '您附近30(Km)内暂时没有代驾，是否继续等待',
								confirmText: '继续等待',
								cancelText: '取消等待',
								mask: true,
								success: res => {
									if (res.confirm) {
										this.PushOrder()
										this.setData({
											maxDistance: 2000
										})
									} else {
										this.cancelAwait()
									}
								}
							})
						} else {
							this.setData({
								maxDistance: this.data.maxDistance + 2000
							})
							this.PushOrder()
						}
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('查询代驾失败：', err)
					wx.showToast({
						title: '网络错误，派送失败！',
						icon: 'none',
						mask: true,
						duration: 1000
					})
				}
			})
	},


	//等待司机接单
	AwaitTime() {
		console.log('等待司机接单...')
		let hour = this.data.Awhour;
		let minute = this.data.Awminute;
		let second = this.data.Awsecond;
		this.data.oderAwaitInterval = setInterval(() => {
			second++;
			if (second == 60) {
				this.setData({
					Awsecond: '00'
				})
				second = 0;
				minute++;
				if (minute == 2) {
					console.log('等待超时了', minute)
					this.setData({
						Awovertime: true
					})
					let Awovertime = true
					wx.setStorageSync('Awovertime', Awovertime) //保存到本地缓存
				}
				if (minute >= 60) {
					this.setData({
						Awminute: '00'
					})
					minute = 0;
					hour++;
					this.setData({
						Awhour: hour < 10 ? '0' + hour : hour
					})
					wx.setStorageSync('Awhour', hour) //保存到本地缓存
				} else {
					this.setData({
						Awminute: minute < 10 ? '0' + minute : minute
					})
					wx.setStorageSync('Awminute', minute) //保存到本地缓存
				}
			} else {
				this.setData({
					Awsecond: second < 10 ? '0' + second : second
				})
				wx.setStorageSync('Awsecond', second) //保存到本地缓存
			}
		}, 1000)
	},


	// 监听接单状态
	watcherOrderReceiving() {
		console.log('开始监听接单')
		let that = this
		const watcherReceiving = db.collection('OrderList').where({
			'_id': this.data.orderId
		}).watch({
			onChange: function (snapshot) {
				if (snapshot.docs[0].OrderReceiving) {
					watcherReceiving.close() // 关闭监听
					console.log('司机接单成功')
					clearInterval(that.data.oderAwaitInterval) //清除计时器
					that.setData({
						oderAwaitInterval: ''
					})
					wx.removeStorageSync('Awhour')
					wx.removeStorageSync('Awminute')
					wx.removeStorageSync('Awsecond')
					wx.removeStorageSync('Awovertime')
					that.getOrderInfo() //刷新数据
					wx.showToast({
						title: '已被接单',
						icon: 'success',
						duration: 700,
					})
				}
			},
			onError: function (err) {
				watcherReceiving.close() // 关闭监听
			}
		})
	},

	//取消等待按钮
	cancelAwait() {
		let orderId = this.data.orderId
		wx.showModal({
			title: '温馨提示',
			content: '是否取消等待?',
			mask: true,
			success: res => {
				if (res.confirm) {
					clearInterval(this.data.oderAwaitInterval) //清除计时器
					this.setData({
						oderAwaitInterval: ''
					})
					db.collection('OrderList').doc(orderId).update({
						data: {
							ValidOrder: false,
							CancelAwait: true,
							CancelAwaitTime: formatTime(new Date())
						},
						success: res => {
							console.log('取消等待成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								wx.removeStorageSync('Awhour')
								wx.removeStorageSync('Awminute')
								wx.removeStorageSync('Awsecond')
								wx.removeStorageSync('Awovertime')
								wx.showModal({
									title: '温馨提示',
									content: '取消等待成功',
									showCancel: false,
									confirmText: '返回',
									mask: true,
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
							console.log('取消等待失败', err)
							wx.showToast({
								title: '取消等待失败！',
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

	// 监听订单取消状态
	watcherOrderCancel() {
		console.log('开始监听订单取消')
		const watcherOrderCancel = db.collection('OrderList').where({
			'_id': this.data.orderId
		}).watch({
			onChange: function (snapshot) {
				if (snapshot.docs[0].DriverCancelOrder) {
					watcherOrderCancel.close() // 关闭监听
					console.log('订单已取消')
					wx.showToast({
						title: '订单已取消！',
						icon: 'success',
						duration: 700,
					})
					wx.navigateBack({
						delta: 1 //返回上一层
					})
				}
			},
			onError: function (err) {
				watcherOrderCancel.close() // 关闭监听
			}
		})
	},

	// 打电话按钮
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

	//补支付订单按钮
	payFixedOrder() {
		var that = this
		let totalFee = Number(this.data.OrderInfo[0].PaidPrice)
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.OrderInfo[0].PaidPrice}（元）`,
			mask: true,
			success: res => {
				if (res.confirm) {
					wx.cloud.callFunction({
						name: 'pay',
						data: {
							outTradeNo: this.data.orderId, //订单号
							goodName: "代驾费",
							totalFee: totalFee,
						},
						success: res => {
							const payment = res.result.payment
							wx.requestPayment({
								...payment,
								success(res) {
									console.log('pay success', res)
									that.payFixedOrder1()
								},
								fail(err) {
									console.error('pay fail', err)
									wx.showToast({
										title: '支付失败！',
										icon: 'none',
										duration: 1000,
										mask: true,
									})
								}
							})
						},
					})
				}
			}
		})
	},


	payFixedOrder1(){
		db.collection('OrderList').doc(this.data.orderId).update({
			data: {
				OrderPay: true, //支付状态
			},
			success: res => {
				console.log('支付成功，更新订单支付状态成功', res.errMsg, res.stats.updated)
				if (res.errMsg == "document.update:ok") {
					db.collection('DriverApplyList').doc(this.data.OrderInfo[0].DriverId, ).update({
						data: {
							working: true,
						},
						success: res => {
							console.log('支付成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok") {
								wx.showToast({
									title: '支付成功',
									icon: 'success',
									mask: true,
									duration: 1000,
								})
								this.getOrderInfo() //刷新数据
							}
						},
						fail: err => {
							wx.hideLoading()
							console.log('支付成功，更新代驾工作状态true失败', err)
							wx.showToast({
								title: '网络错误，支付失败！',
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
					title: '网络错误，支付失败！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		})
	},

	//模拟补支付订单按钮
	TestpayFixedOrder() {
		var that = this
		let totalFee = Number(this.data.OrderInfo[0].PaidPrice)
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.OrderInfo[0].PaidPrice}（元）`,
			mask: true,
			success: res => {
				if (res.confirm) {
					db.collection('OrderList').doc(that.data.orderId).update({
						data: {
							OrderPay: true, //支付状态
						},
						success: res => {
							console.log('支付成功，更新订单支付状态成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok") {
								db.collection('DriverApplyList').doc(that.data.OrderInfo[0].DriverId, ).update({
									data: {
										working: true,
									},
									success: res => {
										console.log('支付成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
										if (res.errMsg == "document.update:ok") {
											wx.showToast({
												title: '支付成功',
												icon: 'success',
												mask: true,
												duration: 1000,
											})
											that.getOrderInfo() //刷新数据
										}
									},
									fail: err => {
										wx.hideLoading()
										console.log('支付成功，更新代驾工作状态true失败', err)
										wx.showToast({
											title: '网络错误，支付失败！',
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
								title: '网络错误，支付失败！',
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

	//模拟支付计时单按钮
	TestpayOrder() {
		var that = this
		let totalFee = Number(this.data.OrderInfo[0].PaidPrice)
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.OrderInfo[0].PaidPrice}（元）`,
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
								wx.showToast({
									title: '支付成功',
									icon: 'success',
									mask: true,
									duration: 1000,
								})
								that.FinsTimeOrder()
							}
						},
						fail: err => {
							wx.hideLoading()
							console.log('支付成功，更新订单支付状态失败', err)
							wx.showToast({
								title: '网络错误，支付失败！',
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


	//支付计时单按钮
	payOrder() {
		var that = this
		let totalFee = Number(this.data.OrderInfo[0].PaidPrice)
		wx.showModal({
			title: '温馨提示',
			content: `支付：${this.data.OrderInfo[0].PaidPrice}（元）`,
			mask: true,
			success: res => {
				if (res.confirm) {
					wx.cloud.callFunction({
						name: 'pay',
						data: {
							outTradeNo: this.data.orderId, //订单号
							goodName: "代驾费",
							totalFee: totalFee,
						},
						success: res => {
							const payment = res.result.payment
							wx.requestPayment({
								...payment,
								success(res) {
									console.log('pay success', res)
									that.payOrder1()
								},
								fail(err) {
									console.error('pay fail', err)
									wx.showToast({
										title: '支付失败！',
										icon: 'none',
										duration: 1000,
										mask: true,
									})
								}
							})
						},
					})
				}
			}
		})
	},

	payOrder1(){
		db.collection('OrderList').doc(this.data.orderId).update({
			data: {
				OrderPay: true, //支付状态
			},
			success: res => {
				console.log('支付成功，更新订单支付状态成功', res.errMsg, res.stats.updated)
				if (res.errMsg == "document.update:ok") {
					this.FinsTimeOrder()
				}
			},
			fail: err => {
				wx.hideLoading()
				console.log('支付成功，更新订单支付状态失败', err)
				wx.showToast({
					title: '网络错误，支付失败！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		})
	},

	//完成计时订单
	FinsTimeOrder() {
		db.collection('OrderList').doc(this.data.orderId).update({
			data: {
				Steps: 5,
				FinishOrder: true,
				OrderPayTime: formatTime(new Date())
			},
			success: res => {
				wx.hideLoading()
				console.log('完成订单成功', res.errMsg, res.stats.updated)
				if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
					this.setData({
						steps: 5 //显示评分板块
					})
				}
			},
			fail: err => {
				console.log('完成订单失败', err)
				wx.hideLoading()
				wx.showToast({
					title: '网络错误，操作失败！',
					icon: 'none',
					duration: 1000,
					mask: true,
				})
			}
		})
	},

	//完成一口价订按钮
	FinsFixedOrder() {
		wx.showModal({
			title: '温馨提示',
			content: '是否确认完成该订单？',
			mask: true,
			success: res => {
				if (res.confirm) {
					db.collection('OrderList').doc(this.data.orderId).update({
						data: {
							Steps: 5,
							FinishOrder: true,
							OrderPayTime: formatTime(new Date())
						},
						success: res => {
							wx.hideLoading()
							console.log('完成订单成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								this.setData({
									steps: 5 //显示评分板块
								})
							}
						},
						fail: err => {
							console.log('完成订单失败', err)
							wx.hideLoading()
							wx.showToast({
								title: '网络错误，操作失败！',
								icon: 'none',
								duration: 1000,
								mask: true,
							})
						}
					})
				}
			}
		})
	},

	//初始化星的数量
	_default_score: function (tauch_score = 0) {
		var score_img = [];
		var score = 0;
		for (let i = 0; i < 5; i++) {
			if (i < tauch_score) {
				score_img[i] = "../images/star_on.png"
				score = i;
			} else {
				score_img[i] = "../images/star_off.png"
			}
		}
		this.setData({
			score_img_arr: score_img,
			score_text: this.data.score_text_arr[score]
		});
	},

	//获取评分
	onScore: function (e) {
		var score = e.currentTarget.dataset.score
		console.log('选择的评分：', score)
		this._default_score(score)
		this.setData({
			score: score,
		})
	},

	//提交评分
	SubmitScore() {
		console.log('提交评分', this.data.score)
		if (this.data.score != 0) {
			db.collection('DriverApplyList')
				.where({
					'_openid': this.data.OrderInfo[0].DriverOpenId
				})
				.get({
					success: res => {
						console.log('查询该单代驾成功', res);
						if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
							if (this.data.score >= 3) {
								let SubmitScore = Number(res.data[0].score + 0.1).toFixed(2)
								console.log('评分>=3，代驾评分 + 0.1，', '原评分：', res.data[0].score, '提交的评分：', SubmitScore)
								this.setData({
									SubmitScore,
								})
							} else {
								let SubmitScore = Number(res.data[0].score - 0.1).toFixed(2)
								console.log('评分<3，代驾评分 - 0.1，', '原评分：', res.data[0].score, '提交的评分：', SubmitScore)
								this.setData({
									SubmitScore,
								})
							}

							db.collection('DriverApplyList').doc(res.data[0]._id).update({
								data: {
									score: Number(this.data.SubmitScore),
								},
								success: res => {
									console.log('给代驾评分成功', res.errMsg, res.stats.updated)
									if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
										db.collection('OrderList').doc(this.data.orderId).update({
											data: {
												ValidOrder: false,
												OrderScore: Number(this.data.score),
											},
											success: res => {
												console.log('给订单评分成功', res.errMsg, res.stats.updated)
												if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
													wx.showToast({
														title: '感谢您的评分',
														icon: 'none',
														duration: 700,
													})
													wx.navigateBack({
														delta: 1 //返回上一层
													})
												}
											},
											fail: err => {
												console.log('订单评分失败', err)
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
									console.log('给代驾评分失败', err)
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
						console.log('查询代驾失败：', err)
						wx.showToast({
							title: '网络错误，操作失败！',
							icon: 'none',
							mask: true,
							duration: 1000,
						})
					}
				})
		} else {
			wx.showToast({
				title: '忙碌的世界，每个人都希望得到他人的肯定，请选择一个评分吧',
				icon: 'none',
				duration: 1000,
			})
		}
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {
		wx.showNavigationBarLoading() //在标题栏中显示加载
		this.getOrderInfo() // 重新获取数据
	},
})