// pages/home/home.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command;
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		UserLogin: false,
		openId: '',

		myCity: '您的城市',
		serviceCity: '',
		servicecity: false,

		StartLatitude: '',
		StartLongitude: '',
		StartAddress: '',
		Start: false,

		EndLatitude: '',
		EndLongitude: '',
		EndAddress: '',
		End: false,


		driverId: '',
		driverScore: '',
		driverLatitude: '',
		driverLongitude: '',
		interval: '',
		driverWork: false,

		validOrder: false,

		OrderReceiveId: '',
		OrderReceiving: false,
		OrderWorking: false,

		OnLineSwitch: false,

		innerAudioContext: '',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {},
	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {
		this.data.innerAudioContext.stop(); //页面切换暂停播放
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
		let innerAudioContext = wx.createInnerAudioContext() //创建普通播放声音实例
		let myCity = wx.getStorageSync('MyCity');
		app.isLogin()
		this.setData({
			UserLogin: app.globalData.UserLogin,
			openId: app.globalData.openId,
			innerAudioContext,
			myCity,
			serviceCity: '',
			OrderReceiveId: '',
			OrderReceiving: false,
			OrderWorking: false,
		})

		if (this.data.UserLogin) {
			this.getServiceCity()
			this.getDriverInfo()
			this.getMyValidOrder()
		} else {
			clearInterval(this.data.interval) //清除计时器
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
			//退出登录，清除状态
			this.setData({
				UserLogin: false,
				openId: '',

				myCity: '您的城市',
				serviceCity: '',
				servicecity: false,

				StartLatitude: '',
				StartLongitude: '',
				StartAddress: '',
				Start: false,

				EndLatitude: '',
				EndLongitude: '',
				EndAddress: '',
				End: false,


				driverId: '',
				driverScore: '',
				driverLatitude: '',
				driverLongitude: '',
				interval: '',
				driverWork: false,

				validOrder: false,

				OrderReceiveId: '',
				OrderReceiving: false,
				OrderWorking: false,

				OnLineSwitch: false,

				innerAudioContext: '',
			})
		}
	},

	// 获取服务城市
	getServiceCity() {
		db.collection('MiniAppInfo')
			.get({
				success: res => {
					console.log('获取服务城市成功：', res.errMsg, res.data.length);
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						if (this.data.myCity == res.data[0].City) {
							console.log('该城市已开通服务');
							this.setData({
								serviceCity: res.data[0].City,
								servicecity: true,
							})
						} else {
							wx.showModal({
								title: '您当前的城市还未开通服务！',
								content: `服务城市：${res.data[0].City}`,
								showCancel: false,
								confirmText: '关闭',
								mask: true,
							})
							this.setData({
								servicecity: false,
							})
							let driverId = this.data.driverId
							db.collection('DriverApplyList').doc(driverId).update({
								data: {
									online: false, //下线状态
								},
								success: res => {
									console.log('不在服务城市，下线成功', res)
									if (res.errMsg == "document.update:ok") {
										this.setData({
											OnLineSwitch: false, //显示状态
										})
									}
								},
								fail: err => {
									console.log('不在服务城市，下线失败', err)
								}
							})
						}
					} else {
						console.log('还未设置服务城市！', );
						this.setData({
							servicecity: false,
						})
					}
				},
				fail: err => {
					console.log('获取服务城市失败：', err);
				}
			})
	},

	// 获取代驾司机信息
	getDriverInfo() {
		let openId = this.data.openId
		db.collection('DriverApplyList')
			.where({
				'_openid': openId,
				'audit': true,
				'forbidden': false,
			})
			.get({
				success: res => {
					console.log('查询代驾信息成功：', res.errMsg, res.data.length)
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						this.setData({
							driverId: res.data[0]._id,
							driverScore: res.data[0].score,
							driverWork: true,
							OnLineSwitch: res.data[0].online,
						})
						this.WatcherOrderReceiving() //监听订单派送

						//定时更新代驾司机的位置
						return new Promise((resolve, reject) => {
							let _locationChangeFn = (res) => {
								// console.log('代驾实时位置变动，经度', res.longitude)
								// console.log('代驾实时位置变动，纬度', res.latitude)
								const longitude = Number(res.longitude) // 经度
								const latitude = Number(res.latitude) // 纬度 
								this.setData({
									driverLongitude: longitude,
									driverLatitude: latitude,
								})
								wx.offLocationChange(_locationChangeFn)
								this.data.interval = setInterval(() => { // 每隔15秒自动上传一次当前位置信息
									this.UpdateDriverLocation()
								}, 15000);
							}
							wx.startLocationUpdateBackground({
								success: (res) => {
									// console.log('开启前后台实时获取位置成功')
									wx.onLocationChange(_locationChangeFn)
									resolve()
								},
								fail: (err) => {
									console.log('前后台时接收位置消息失败', err)
									reject()
									wx.showModal({
										title: "申请授权位置信息",
										content: "你是代驾司机，请选择：使用小程序时和离开后允许",
										showCancel: false,
										confirmText: "去设置",
										success: res => {
											if (res.confirm) {
												wx.openSetting()
											}
										}
									})
								}
							})
						})
					} else {
						clearInterval(this.data.interval) //清除计时器
						this.setData({
							driverWork: false
						})
					}
				},
				fail: err => {
					console.log('查询代驾信息失败：', err);
				}
			})
	},

	//更新代驾位置
	UpdateDriverLocation() {
		let driverId = this.data.driverId
		let longitude = this.data.driverLongitude
		let latitude = this.data.driverLatitude
		db.collection('DriverApplyList').doc(driverId).update({
			data: {
				longitude: longitude,
				latitude: latitude,
				location: db.Geo.Point(longitude, latitude)
			},
			success: res => {
				if (res.errMsg == "document.update:ok") {
					// console.log('更新代驾位置成功', res.errMsg)
				}
			},
			fail: err => {
				console.log('更新代驾位置失败', err)
			}
		})

	},

	//监听订单派送
	WatcherOrderReceiving() {
		let that = this
		var watcherDriver = db.collection('DriverApplyList')
			.where({
				'_openid': this.data.openId,
				'online': true,
				'working': false,
			})
			.watch({
				onChange: function (Dres) {
					console.log('监听代驾工作状态...', Dres.docs.length)
					if (Dres.docs.length > 0) {
						console.log('代驾空闲中')
						that.watcherSysOrder()
					} else {
						console.log('代驾工作中')
						that.watcherDriverOrder()
					}
				},
				onError: function (err) {
					watcherDriver.close() // 关闭监听
				}
			})
	},


	//监听系统派单状态
	watcherSysOrder() {
		let that = this
		let driverScore =  Number(this.data.driverScore)
		var watcherSysOrder = db.collection('OrderList')
			.where({
				// 'OrderReceiveScore': driverScore, //用代驾自己的评分去和订单的评分匹配
				'ValidOrder': true,
				'OrderReceiving': false
			})
			.orderBy('PlaceOrderTime', 'desc')
			.watch({
				onChange: function (snapshot) {
					console.log('监听订单列表：', snapshot.docs.length)
					if (snapshot.docs.length > 0) {
						if (snapshot.docs[0]._openid == that.data.openId) {
							console.log('代驾自己下的单，自己将收不到')
						} else {
							console.log('继续等待接单...')
							let OrderReceiveScore = Number(snapshot.docs[0].OrderReceiveScore)
							if (driverScore  === OrderReceiveScore || driverScore  >= OrderReceiveScore) {
								console.log('接到系统派送的订单：', snapshot.docs[0]._id)
								that.setData({
									OrderReceiveId: snapshot.docs[0]._id,
									OrderReceiving: true //显示订单消息提示
								})
								that.data.innerAudioContext.autoplay = true
								that.data.innerAudioContext.src = '../miniprogram/mp3/newOrderTips.mp3'
								that.data.innerAudioContext.onPlay(() => {
									console.log('开始播放')
								})
							}else{
								console.log('接到系统派送的订单,dddddddddddddddddddddd：',)
							}
						}
					} else {
						that.setData({
							OrderReceiveId: '',
							OrderReceiving: false
						})
					}
				},
				onError: function (err) {
					watcherSysOrder.close() // 关闭监听
				}
			})
	},


	//监听代驾订单状态
	watcherDriverOrder() {
		let that = this
		var watcher = db.collection('OrderList')
			.where({
				'DriverOpenId': this.data.openId,
				'ValidOrder': true,
				'DriverFinishOrder':false,
			})
			.watch({
				onChange: function (snapshot) {
					if (snapshot.docs.length > 0) {
						console.log('已接到订单：', snapshot.docs[0]._id, )
						that.setData({
							OrderReceiveId: snapshot.docs[0]._id,
							OrderWorking: true,
						})
					} else {
						that.setData({
							OrderReceiveId: '',
							OrderWorking: false
						})
					}
				},
				onError: function (err) {
					watcher.close() // 关闭监听
				}
			})
	},

	// 跳转代驾接单
	driverWork() {
		if (this.data.servicecity) {
			if (this.data.OnLineSwitch) {
				let id = this.data.OrderReceiveId
				let url = '../driverWork/driverWork'
				wx.navigateTo({
					url: `${url}?id=${id}`,
				})
			} else {
				wx.showToast({
					title: '你当前处于下线状态！',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		} else {
			wx.showToast({
				title: '您当前的城市还未开通服务！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}
	},

	//跳转到我的二维码
	myQr() {
		if (this.data.servicecity) {
			if (this.data.OnLineSwitch) {
				if (this.data.OrderWorking) {
					wx.showToast({
						title: '你还有进行中的订单！',
						icon: 'none',
						mask: true,
						duration: 700,
					})
				} else {
					wx.navigateTo({
						url: '../myQr/myQr',
					})
				}
			} else {
				wx.showToast({
					title: '你当前处于下线状态！',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		} else {
			wx.showToast({
				title: '您当前的城市还未开通服务！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
		}
	},

	//查询自己的有效进行中的订单
	getMyValidOrder() {
		let openId = this.data.openId
		db.collection('OrderList')
			.where({
				'_openid': openId,
				'ValidOrder': true,
			})
			.get({
				success: res => {
					console.log('查询有效订单成功：', res);
					if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
						console.log('有自己还在进行中的订单')
						this.setData({
							validOrder: true,
							StartLatitude: '',
							StartLongitude: '',
							StartAddress: '',
							Start: false,

							EndLatitude: '',
							EndLongitude: '',
							EndAddress: '',
							End: false,
						})
					} else {
						this.setData({
							validOrder: false
						})
					}
				},
				fail: err => {
					console.log('查询有效订单失败：', err);
				}
			})
	},

	//跳转到进行中订单
	validOrder() {
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				wx.navigateTo({
					url: '../homeOrder/homeOrder',
				})
			} else {
				wx.showToast({
					title: '您当前的城市还未开通服务！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		} else {
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
		}
	},

	//跳转到扫码下单
	scanQr() {
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				wx.navigateTo({
					url: '../scanQr/scanQr',
				})
			} else {
				wx.showToast({
					title: '您当前的城市还未开通服务！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		} else {
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
		}
	},

	//点击起点输入框
	startFocus(e) {
		let value = e.detail.value
		console.log('点击了起点输入框', value)
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				if (this.data.validOrder) {
					this.validOrder()
				} else {
					if (value == '') {
						this.startLocation()
					}
				}
			} else {
				wx.showToast({
					title: '您当前的城市还未开通服务！',
					icon: 'none',
					mask: true,
					duration: 1000,
				})
			}
		} else {
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
		}
	},

	startInput(e) {
		let value = e.detail.value
		console.log('编辑了起点输入框', value)
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				if (value == '') {
					this.setData({
						Start: false
					})
				}
			}
		}
	},

	endFocus(e) {
		let value = e.detail.value
		console.log('点击了终点输入框', value)
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				if (this.data.validOrder) {
					this.validOrder()
				} else {
					if (value == '') {
						this.endLocation()
					}
				}
			} else {
				wx.showToast({
					title: '您当前的城市还未开通服务！',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		} else {
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
		}
	},

	endInput(e) {
		let value = e.detail.value
		console.log('编辑了终点输入框', value)
		if (this.data.UserLogin) {
			if (this.data.servicecity) {
				if (value == '') {
					this.setData({
						End: false
					})
				}
			}
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

	// 点击确认
	confirm() {
		if (this.data.UserLogin) {
			if (this.data.serviceCity) {
				if (this.data.validOrder) {
					this.validOrder()
				} else {
					let StartAddress = this.data.StartAddress
					let EndAddress = this.data.EndAddress
					let StartLatitude = this.data.StartLatitude
					let StartLongitude = this.data.StartLongitude
					let EndLatitude = this.data.EndLatitude
					let EndLongitude = this.data.EndLongitude
					wx.navigateTo({
						url: '../homeOrder/homeOrder',
						success: function (res) {
							// 通过eventChannel向被打开页面传送数据
							res.eventChannel.emit('acceptDataFromOpenerPage', {
								StartAddress: `${StartAddress}`,
								EndAddress: `${EndAddress}`,
								StartLatitude: `${StartLatitude}`,
								StartLongitude: `${StartLongitude}`,
								EndLatitude: `${EndLatitude}`,
								EndLongitude: `${EndLongitude}`,
							})
						}
					})
				}
			} else {
				wx.showToast({
					title: '您当前的城市还未开通服务！',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		} else {
			wx.showToast({
				title: '请先登录！',
				icon: 'none',
				mask: true,
				duration: 700,
			})
		}
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

	// 在线状态
	OnLineBtn(e) {
		console.log('点击了switch', e)
		let value = e.detail.value
		let driverId = this.data.driverId
		let openId = this.data.openId
		if (this.data.serviceCity) {
			db.collection('OrderList')
				.where({
					'DriverOpenId': openId,
					'ValidOrder': true,
				})
				.get({
					success: res => {
						console.log('查询有效订单成功：', res.errMsg,res.data.length,res);
						if (res.errMsg == 'collection.get:ok' && res.data.length > 0) {
							wx.showToast({
								title: '你还有进行中的订单！',
								icon: 'none',
								mask: true,
								duration: 1000,
							})
							if (value) {
								this.setData({
									OnLineSwitch: false, //显示状态
								})
							} else {
								this.setData({
									OnLineSwitch: true, //显示状态
								})
							}
						} else {
							if (value) {
								console.log('修改为true')
								wx.showLoading({
									title: '上线中...',
									mask: true
								})
								db.collection('DriverApplyList').doc(driverId).update({
									data: {
										online: true, //在线状态
									},
									success: res => {
										wx.hideLoading()
										console.log('上线成功', res)
										if (res.errMsg == "document.update:ok") {
											this.setData({
												OnLineSwitch: true, //显示状态
											})
										} else {
											this.setData({
												OnLineSwitch: false, //显示状态
											})
										}
									},
									fail: err => {
										wx.hideLoading()
										console.log('上线失败', err)
										wx.showToast({
											title: '网络错误，上线失败！',
											icon: 'none',
											mask: true,
											duration: 1000
										})
									}
								})
							} else {
								wx.showLoading({
									title: '下线中...',
									mask: true
								})
								console.log('修改为flase')
								db.collection('DriverApplyList').doc(driverId).update({
									data: {
										online: false, //下线状态
									},
									success: res => {
										wx.hideLoading()
										console.log('下线成功', res)
										if (res.errMsg == "document.update:ok") {
											this.setData({
												OnLineSwitch: false, //显示状态
												OrderReceiveId: '',
												OrderReceiving: false,
												OrderWorking: false,
											})
										} else {
											this.setData({
												OnLineSwitch: true, //显示状态
											})
										}
									},
									fail: err => {
										wx.hideLoading()
										console.log('下线失败', err)
										wx.showToast({
											title: '网络错误，下线失败！',
											icon: 'none',
											mask: true,
											duration: 1000
										})
									}
								})
							}
						}
					},
					fail: err => {
						console.log('查询有效订单失败：', err);
						wx.showToast({
							title: '网络错误！',
							icon: 'none',
							mask: true,
							duration: 1000
						})
						if (value) {
							this.setData({
								OnLineSwitch: false, //显示状态
							})
						} else {
							this.setData({
								OnLineSwitch: true, //显示状态
							})
						}
					}
				})
		} else {
			wx.showToast({
				title: '您当前的城市还未开通服务！',
				icon: 'none',
				mask: true,
				duration: 1000,
			})
			if (value) {
				this.setData({
					OnLineSwitch: false, //显示状态
				})
			} else {
				this.setData({
					OnLineSwitch: true, //显示状态
				})
			}
		}
	},

	OnLineFQA() {
		wx.showModal({
			title: '温馨提示',
			content: '需打开在线状态才能接到订单，下班后也应关闭在线状态！感谢您的配合',
			showCancel: false,
			mask: true,
		})
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