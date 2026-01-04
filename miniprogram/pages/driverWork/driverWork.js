// pages/driverWork/driverWork.js
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
		nohting: false,
		isAgree: false,

		Price: '',
		AddPrice: '',
		Minute: '',
		SpendTime: '',
		PaidPrice: '',

		OrderInfo: [],
		OrderId: '',

		DriverId: '',
		DriverOpenId: '',
		Driver: '',
		DriverPhone: '',
		Driving: '',
		DrivingAge: '',
		DrivreLatitude: '',
		DriverLongitude: '',

		minute: '00',
		second: '00',
		interval: '',
		CountTime: false,
		ShowBeginBtn: true,

		BeginCountTime:'',
		EndCountTime:'',

		steps: '',
		myLongitude: '',
		myLatitude: '',
		CustomerDistance: '',

		DriverFinishOrder: false,
		SubmitWallet: '',
		FinishOrder: '',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(e) {
		console.log('driverWork的onLoad执行了')
		let id = e.id
		console.log('传过来的id：', id)
		this.setData({
			OrderId: id,
		})
	},
	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {
		console.log('driverWork的onHide执行了')
		clearInterval(this.data.interval) //清除计时器
		this.setData({
			interval: '',
		})
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {
		console.log('driverWork的onUnload执行了')
		clearInterval(this.data.interval) //清除计时器
		this.setData({
			interval: '',
		})
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
		console.log('driverWork的onShow执行了')
		let minute = wx.getStorageSync('Minute');
		let second = wx.getStorageSync('Second');
		this.setData({
			minute: minute < 10 ? '0' + minute : minute,
			second: second < 10 ? '0' + second : second
		})
		this.getOrderInfo()
		this.getPrice()
	},

	//查询订单信息
	getOrderInfo() {
		wx.showLoading({
			title: '查询中...',
		})
		db.collection('OrderList').where({
			'_id': this.data.OrderId,
			'ValidOrder': true
		}).get({
			success: res => {
				wx.hideLoading()
				console.log('查询订单信息成功', res.errMsg, res.data.length)
				if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
					this.setData({
						steps: res.data[0].Steps,
						OrderId: res.data[0]._id,
						CountTime: res.data[0].CountTime,
						ShowBeginBtn: res.data[0].ShowBeginBtn,
						SpendTime: res.data[0].SpendTime,
						PaidPrice: res.data[0].PaidPrice,
						BeginCountTime:res.data[0].BeginCountTime,
						EndCountTime:res.data[0].EndCountTime,
						OrderInfo: res.data,
					})
					if (res.data[0].Steps == 2) {
						console.log('订单第2步，准备接单');
						this.getCustomerDistance()
						return;
					}
					if (res.data[0].Steps == 3) {
						console.log('订单第3步，已接单');
						this.watcherOrderCancel()
						if (res.data[0].CountTime) {
							console.log('记忆继续计时...')
							// this.StartTime()
						}
						return;
					}
					if (res.data[0].Steps == 4) {
						console.log('订单第4步，');
						
						return;
					}
				} else {
					this.setData({
						nohting: true
					})
				}
			},
			fail: res => {
				wx.hideLoading()
				console.log('查询订单信息失败', err)
				wx.showToast({
					title: '网络错误，查询失败！',
					icon: 'none',
					duration: 1000
				})
			}
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

	// 计算与订单的距离
	getCustomerDistance() {
		wx.getLocation({
			type: 'gcj02',
			success: res => {
				const myLongitude = Number(res.longitude) // 经度
				const myLatitude = Number(res.latitude) // 纬度 
				let lat1 = myLatitude
				let lng1 = myLongitude
				let lat2 = this.data.OrderInfo[0].StartLatitude
				let lng2 = this.data.OrderInfo[0].StartLongitude
				console.log('计算与客户的距离，自己的经纬度：', lat1, '客户的经纬度：', lat2)

				var radLat1 = lat1 * Math.PI / 180.0;
				var radLat2 = lat2 * Math.PI / 180.0;
				var a = radLat1 - radLat2;
				var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
				var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
				s = s * 6378.137; // 地球半径;
				s = Math.round(s * 10000) / 10000;
				let Distance = s.toFixed(2)
				this.setData({
					CustomerDistance: Distance
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

	//接单按钮
	takeOrder() {
		if (this.data.isAgree == false) {
			wx.showToast({
				title: '请先同意协议要求！',
				icon: 'none',
				duration: 1000,
			})
		} else {
			db.collection('OrderList')
				.where({
					'_id': this.data.OrderId,
				}).get({
					success: res => {
						console.log('接单前查询订单状态成功：', res.errMsg, res.data.length, res)
						if (res.errMsg == 'collection.get:ok' && res.data[0].OrderReceiving == true || res.data[0].CancelAwait == true) {
							wx.showModal({
								title: '温馨提示',
								content: '该订单已效，请返回！',
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
						} else {
							wx.showModal({
								title: '温馨提示',
								content: '是否确认接单?',
								mask: true,
								success: res => {
									if (res.confirm) {
										wx.showLoading({
											title: '加载中...',
											mask: true
										})
										db.collection('DriverApplyList')
											.where({
												'_openid': app.globalData.openId,
												'audit': true,
												'working': false,
												'forbidden': false
											}).get({
												success: res => {
													console.log('查询代驾信息成功：', res.errMsg, res.data.length)
													if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
														this.setData({
															DriverId: res.data[0]._id,
															DriverOpenId: res.data[0]._openid,
															Driver: res.data[0].name,
															DriverPhone: res.data[0].phone,
															Driving: res.data[0].driving,
															DrivingAge: res.data[0].drivingAge,
															DrivreLatitude: res.data[0].latitude,
															DriverLongitude: res.data[0].longitude,
														})
														let OrderId = this.data.OrderId
														db.collection('OrderList').doc(OrderId).update({
															data: {
																Steps: 3,
																OrderReceiving: true,
																DriverId: this.data.DriverId,
																DriverOpenId: this.data.DriverOpenId,
																Driver: this.data.Driver,
																DriverPhone: this.data.DriverPhone,
																Driving: this.data.Driving,
																DrivingAge: this.data.DrivingAge,
																DrivreLatitude: this.data.DrivreLatitude,
																DriverLongitude: this.data.DriverLongitude,
																OrderReceiveTime: formatTime(new Date())
															},
															success: res => {
																console.log('接单成功', res.errMsg, res.stats.updated)
																if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
																	db.collection('DriverApplyList').doc(this.data.DriverId).update({
																		data: {
																			working: true,
																		},
																		success: res => {
																			console.log('接单成功，更新代驾工作状态true成功', res.errMsg, res.stats.updated)
																			if (res.errMsg == "document.update:ok") {
																				wx.hideLoading()
																				this.getOrderInfo() //刷新数据
																			}
																		},
																		fail: err => {
																			wx.hideLoading()
																			console.log('接单成功，更新代驾工作状态true失败', err)
																			wx.showToast({
																				title: '网络错误，接单失败！',
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
																console.log('接单失败', err)
																wx.showToast({
																	title: '网络错误，接单失败！',
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
													console.log('查询代驾信息失败：', err)
													wx.showToast({
														title: '网络错误，接单失败！',
														icon: 'none',
														mask: true,
														duration: 1000,
													})
												}
											})
									}
								}
							})
						}
					},
					fail: err => {
						console.log('接单前查询该订单状态失败：', err)
					}
				})
		}
	},

	//取消接单按钮
	cancelTakeOrder() {
		wx.navigateBack({
			delta: 1 //返回上一层
		})
	},

	//导航按钮
	navRoad(e) {
		let latitude = this.data.OrderInfo[0].StartLatitude
		let longitude = this.data.OrderInfo[0].StartLongitude
		let name = this.data.OrderInfo[0].Buyer
		let address = this.data.OrderInfo[0].StartAddress

		wx.getLocation({
			type: 'wgs84',
			success(res) {
				wx.openLocation({
					latitude: latitude,
					longitude: longitude,
					name: address,
					address: name,
					scale: 17
				})
			},
			fail: res => {
				console.log('授权位置信息失败', res)
				wx.showModal({
					title: "申请授权位置信息",
					content: "请授权获取位置信息！如还是不能使用，请打开定位功能，关闭5G模式，再重试！",
					confirmText: "去设置",
					mask: true,
					success: res => {
						if (res.confirm) {
							wx.openSetting()
						}
					}
				})
			}
		})
	},

	// 打电话按钮
	CallPhone(e) {
		let phoneNumber = e.currentTarget.dataset.phone
		wx.showModal({
			title: '温馨提示',
			content: `是否拨打“${phoneNumber}”号码？`,
			confirmText: '拨打',
			success: res => {
				if (res.confirm) {
					wx.makePhoneCall({
						phoneNumber: phoneNumber,
					})
				}
			}
		})
	},

	//开始计时按钮
	StartTimeBtn() {
		db.collection('OrderList').doc(this.data.OrderId).update({
			data: {
				CountTime: true,
				ShowBeginBtn: false,
				BeginCountTime: formatTime(new Date())
			},
			success: res => {
				console.log('开始计时成功', res.errMsg, res.stats.updated, res)
				// this.StartTime()
				this.setData({
					CountTime: true,
					ShowBeginBtn: false,
					BeginCountTime: formatTime(new Date())
				})
			},
			fail: err => {
				console.log('开始计时失败', err)
				wx.showToast({
					title: '网络错误，操作失败！',
					icon: 'none',
					duration: 1000,
					mask: true
				})
			}
		})
	},

	//计时
	StartTime() {
		console.log('计时中...')
		let minute = this.data.minute;
		let second = this.data.second;
		this.data.interval = setInterval(() => {
			second++;
			if (second >= 60) {
				second = 0;
				minute++;
				this.setData({
					second: '00',
					minute: minute < 10 ? '0' + minute : minute,
				})
				wx.setStorageSync('Minute', minute) //保存到本地缓存
			} else {
				this.setData({
					second: second < 10 ? '0' + second : second,
				})
				wx.setStorageSync('Second', second) //保存到本地缓存
			}
		}, 1000)
	},



	//暂停计时按钮
	StopTimeBtn() {
		if (this.data.CountTime) {
			db.collection('OrderList').doc(this.data.OrderId).update({
				data: {
					CountTime: false,
					EndCountTime: formatTime(new Date())
				},
				success: res => {
					console.log('暂停计时成功', res.errMsg, res.stats.updated, res)
					if (res.errMsg == "document.update:ok") {
						clearInterval(this.data.interval) //清除计时器
						this.setData({
							interval: '',
							CountTime: false,
							EndCountTime: formatTime(new Date())
						})
					}
				},
				fail: err => {
					console.log('暂停计时失败', err)
					wx.showToast({
						title: '网络错误，暂停失败！',
						icon: 'none',
						duration: 1000,
						mask: true
					})
				}
			})
		} else {
			db.collection('OrderList').doc(this.data.OrderId).update({
				data: {
					CountTime: true,
					EndCountTime: '',
				},
				success: res => {
					console.log('继续计时成功', res.errMsg, res.stats.updated, res)
					if (res.errMsg == "document.update:ok") {
						// this.StartTime()
						this.setData({
							CountTime: true,
							EndCountTime: '',
						})
					}
				},
				fail: err => {
					console.log('继续计时失败', err)
					wx.showToast({
						title: '网络错误，继续失败！',
						icon: 'none',
						duration: 1000,
						mask: true
					})
				}
			})
		}
	},

	//结算按钮
	AccountBtn() {
		wx.showModal({
			title: '温馨提示',
			content: '是否确认结算订单？',
			mask: true,
			success: res => {
				if (res.confirm) {
					clearInterval(this.data.interval) //清除计时器
					this.setData({
						interval: ''
					})
					this.getPaiPrice() //计算支付价格
				}
			}
		})
	},

	//计算支付价格
	getPaiPrice() {

		let BeginCountTime = this.data.BeginCountTime
		let EndCountTime = this.data.EndCountTime
		var stime = Date.parse(new Date(BeginCountTime));//获得开始时间的毫秒数
		var etime = Date.parse(new Date(EndCountTime));//获得结束时间的毫秒数
		var usedTime = etime - stime; //两个时间戳相差的毫秒数
		var days = Math.floor(usedTime / (24 * 3600 * 1000));
		//计算出小时数
		var leave1 = usedTime % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
		var hours = Math.floor(leave1 / (3600 * 1000));//将剩余的毫秒数转化成小时数
		//计算相差分钟数
		var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
		var minutes = Math.floor(leave2 / (60 * 1000));//将剩余的毫秒数转化成分钟
		//计算相差秒数
		var leave3 = leave2 % (60 * 1000);//计算分钟数后剩余的毫秒数
		var seconds = Math.floor(leave3/1000);//将剩余的毫秒数转化成秒数
		var hours = hours == 0 ? "" : Number(hours)*60;//超过一小时转化为分
		var time =  Number(hours) + Number(minutes);//分钟相加

		var OrderSpentTime =  time;

		console.log("订单用时：", OrderSpentTime, '定价时间', this.data.Minute)
		if (OrderSpentTime > this.data.Minute) {
			let overTime = OrderSpentTime - this.data.Minute
			console.log("超时：", overTime, typeof (overTime))
			let overTimePrice = overTime * this.data.AddPrice
			console.log("超时价：", overTimePrice, typeof (overTimePrice))
			let PaidPrice = (Number(this.data.Price) + Number(overTimePrice)).toFixed(2)
			console.log("基础价：", this.data.Price, typeof (this.data.Price), "需支付价格：", PaidPrice, typeof (PaidPrice))
			this.setData({
				steps: 4,
				SpendTime: OrderSpentTime,
				PaidPrice
			})
		} else {
			this.setData({
				steps: 4,
				SpendTime: OrderSpentTime,
				PaidPrice: this.data.Price
			})
		}
	},

	//完成订单按钮
	finishOrder() {
		if (this.data.OrderInfo[0].DriverFinishOrder) {
			console.log('订单已结账', )
		} else {
			console.log('订单未结账', )
			wx.showModal({
				title: '温馨提示',
				content: `是否确认完成该订单？`,
				success: res => {
					if (res.confirm) {
						wx.showLoading({
							title: '加载中...',
							mask: true
						})
						db.collection('OrderList').doc(this.data.OrderId).update({
							data: {
								Steps: 4,
								PaidPrice: this.data.PaidPrice,
								SpendTime: this.data.SpendTime,
								DriverFinishOrder: true,
							},
							success: res => {
								console.log('司机完成订单成功', res.errMsg, res.stats.updated, res)
								if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
									db.collection('DriverApplyList')
										.where({
											'_openid': this.data.OrderInfo[0].DriverOpenId
										})
										.get({
											success: res => {
												console.log('查询此单司机成功', res.errMsg, res.data.length)
												if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
													let SubmitWallet = (Number(res.data[0].wallet) + Number(this.data.PaidPrice)).toFixed(2)
													console.log('此单价格：', this.data.PaidPrice, '司机原余额：', res.data[0].wallet, '要提交的价格：', SubmitWallet)

													let FinishOrder = (Number(res.data[0].finishOrder) + 1)
													console.log('原单数：', res.data[0].finishOrder, '要提交的单数：', FinishOrder)
													this.setData({
														SubmitWallet,
														FinishOrder
													})
													db.collection('DriverApplyList').doc(res.data[0]._id).update({
														data: {
															wallet: Number(this.data.SubmitWallet),
															finishOrder: Number(this.data.FinishOrder),
															working: false,
														},
														success: res => {
															console.log('订单结账成功', res.errMsg, res.stats.updated)
															if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
																clearInterval(this.data.interval) //清除计时器
																this.setData({
																	interval: ''
																})
																wx.removeStorageSync('Minute')
																wx.removeStorageSync('Second')
																wx.hideLoading()
																this.getOrderInfo() //刷新数据
																wx.showModal({
																	title: '温馨提示',
																	content: `完成订单成功！`,
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
															console.log('订单结账失败', err)
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
												wx.hideLoading()
												console.log('查询此单司机失败', err)
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
								wx.hideLoading()
								console.log('司机完成订单失败', err)
								wx.showToast({
									title: '网络错误，操作失败！',
									icon: 'none',
									duration: 1000,
									mask: true
								})
							}
						})
					}
				}
			})
		}
	},

	//取消计时订单按钮
	cancelTimeOrder() {
		wx.showModal({
			title: '温馨提示',
			content: `是否确认取消该订单？`,
			success: res => {
				if (res.confirm) {
					db.collection('OrderList').doc(this.data.OrderId).update({
						data: {
							ValidOrder: false,
							SpendTime: this.data.SpendTime,
							DriverCancelOrder: true,
							DriverCancelOrderTime: formatTime(new Date())
						},
						success: res => {
							console.log('司机取消订单成功', res.errMsg, res.stats.updated, res)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								db.collection('DriverApplyList')
									.where({
										'_openid': this.data.OrderInfo[0].DriverOpenId
									})
									.get({
										success: res => {
											console.log('查询此单司机成功', res.errMsg, res.data.length)
											if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
												db.collection('DriverApplyList').doc(res.data[0]._id).update({
													data: {
														working: false,
													},
													success: res => {
														console.log('取消订单成功，更新代驾工作状态为false成功：', res.errMsg, res.stats.updated)
														if (res.errMsg == "document.update:ok") {
															clearInterval(this.data.interval) //清除计时器
															this.setData({
																interval: ''
															})
															wx.removeStorageSync('Minute')
															wx.removeStorageSync('Second')
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
											console.log('查询此单司机失败', err)
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
							console.log('司机取消订单失败', err)
							wx.showToast({
								title: '网络错误，操作失败！',
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

	//取消一口价订单按钮
	cancelFixedOrder() {
		wx.showModal({
			title: '温馨提示',
			content: `是否确认取消该订单？`,
			success: res => {
				if (res.confirm) {
					//退费成功后才走下面代码
					db.collection('OrderList').doc(this.data.OrderId).update({
						data: {
							ValidOrder: false,
							SpendTime: this.data.SpendTime,
							DriverCancelOrder: true,
							DriverCancelOrderTime: formatTime(new Date())
						},
						success: res => {
							console.log('司机取消订单成功', res.errMsg, res.stats.updated, res)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								db.collection('DriverApplyList')
									.where({
										'_openid': this.data.OrderInfo[0].DriverOpenId
									})
									.get({
										success: res => {
											console.log('查询此单司机成功', res.errMsg, res.data.length)
											if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
												db.collection('DriverApplyList').doc(res.data[0]._id).update({
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
											console.log('查询此单司机失败', err)
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
							console.log('司机取消订单失败', err)
							wx.showToast({
								title: '网络错误，操作失败！',
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
			'_id': this.data.OrderId
		}).watch({
			onChange: function (snapshot) {
				if (snapshot.docs[0].DriverCancelOrder) {
					watcherOrderCancel.close() // 关闭监听
					console.log('订单已被管理员取消')
					clearInterval(this.data.interval) //清除计时器
					this.setData({
						interval: ''
					})
					wx.removeStorageSync('Minute')
					wx.removeStorageSync('Second')
					wx.showModal({
						title: '温馨提示',
						content: '该订单已被管理员取消！',
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
			onError: function (err) {
				watcherOrderCancel.close() // 关闭监听
			}
		})
	},
})