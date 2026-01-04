// pages/carinfo/carinfo.js
var app = getApp();
const db = wx.cloud.database()
const {
	formatTime
} = require("../../utils/util.js")
Page({

	data: {
		Fill: true,
		Filled: false,
		audit: false,
		repulse: false,
		repulseCause: '',
		forbidden: false,
		OnLineSwitch:false,
		_id: '', //自己的id
		name: '', //姓名
		phone: '', //电话
		city: '', //城市

		idCardImg: [], //身份证图片
		drivingImg: [], // 驾驶证图片

		idCardImgFileID: [],
		drivingImgFileID: [],

		isDisplayIdCartFigure: false, //身份证示例图
		isDisplayDrivingFigure: false, //驾驶证示例图
		isAgree: false, //同意协议

		// 选择器数据
		PickerData: {
			'drivingAge': '',
			'driving': '',
		},
		// 驾龄选择器
		PickerList: [{
				'id': 'drivingAge',
				'title': '驾龄：',
				'pickerlist': ['五年', '五年以上']
			},
			{
				'id': 'driving',
				'title': '驾驶证：',
				'pickerlist': ['C1', 'C2', 'B1', 'B2', 'A3', ]
			},
		],
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (e) {
		let openId = app.globalData.openId
		console.log('全局的openid', openId)
		db.collection('DriverApplyList').where({
				'_openid': openId,
			})
			.get({
				success: res => {
					console.log('查询申请信息成功', res, )
					if (res.errMsg == "collection.get:ok" && res.data[0].audit == false) {
						console.log('已提交', res.data.length)
						this.setData({
							_id: res.data[0]._id,
							name: res.data[0].name,
							phone: res.data[0].phone,
							drivingAge: res.data[0].drivingAge,
							driving: res.data[0].driving,
							city: res.data[0].city,
							idCardImg: res.data[0].idCardImg,
							drivingImg: res.data[0].drivingImg,
							ApplyTime: res.data[0].ApplyTime,
							AuditTime: res.data[0].AuditTime,

							Fill: false,
							Filled: true, //显示已提交
							audit: false,
							repulse: false,
							forbidden: false,
						})
					}
					if (res.errMsg == "collection.get:ok" && res.data[0].audit == true) {
						console.log('已通过审核', res.data.length)
						this.setData({
							_id: res.data[0]._id,
							name: res.data[0].name,
							phone: res.data[0].phone,
							drivingAge: res.data[0].drivingAge,
							driving: res.data[0].driving,
							city: res.data[0].city,
							idCardImg: res.data[0].idCardImg,
							drivingImg: res.data[0].drivingImg,
							ApplyTime: res.data[0].ApplyTime,
							AuditTime: res.data[0].AuditTime,
							OnLineSwitch:res.data[0].online,

							Fill: false,
							Filled: false,
							audit: true, //显示已通过审核
							repulse: false,
							forbidden: false,
						})
					}
					if (res.errMsg == "collection.get:ok" && res.data[0].repulse == true) {
						console.log('已打回', res.data.length)
						this.setData({
							_id: res.data[0]._id,
							name: res.data[0].name,
							phone: res.data[0].phone,
							drivingAge: res.data[0].drivingAge,
							driving: res.data[0].driving,
							city: res.data[0].city,
							idCardImg: res.data[0].idCardImg,
							drivingImg: res.data[0].drivingImg,
							RepulseCause: res.data[0].RepulseCause,
							ApplyTime: res.data[0].ApplyTime,
							AuditTime: res.data[0].AuditTime,
							RepulseTime: res.data[0].RepulseTime,

							Fill: false,
							Filled: false,
							audit: false,
							repulse: true, //显示已打回
							forbidden: false,
						})
					}
					if (res.errMsg == "collection.get:ok" && res.data[0].forbidden == true) {
						console.log('已禁用', res.data.length)
						this.setData({
							_id: res.data[0]._id,
							name: res.data[0].name,
							phone: res.data[0].phone,
							drivingAge: res.data[0].drivingAge,
							driving: res.data[0].driving,
							city: res.data[0].city,
							idCardImg: res.data[0].idCardImg,
							drivingImg: res.data[0].drivingImg,
							RepulseCause: res.data[0].RepulseCause,
							ApplyTime: res.data[0].ApplyTime,
							AuditTime: res.data[0].AuditTime,
							RepulseTime: res.data[0].RepulseTime,
							ForbiddenTime: res.data[0].ForbiddenTime,

							Fill: false,
							Filled: false,
							audit: false,
							repulse: false,
							forbidden: true, //显示已禁用
						})
					}

				},
				fail: err => {
					console.log('查询失败', err)
					wx.showToast({
						title: '网络错误！查询失败',
						duration: 1000,
						icon: "none",
						mask: true,
					})
				}
			})
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
	//获取输入框的数据
	inputName(e) {
		console.log("输入姓名", e.detail.value)
		let name = this.data.name
		let value = e.detail.value
		name = value
		this.setData({
			name: value,
			name
		})
	},
	inputPhone(e) {
		console.log("输入电话", e.detail.value)
		let phone = this.data.phone
		let value = e.detail.value
		phone = value
		this.setData({
			phone: value,
			phone
		})
	},

	//获取选择器数据
	PickerData(e) {
		console.log("获取选择器的数据", e.currentTarget.id, e.detail.value)
		let PickerData = this.data.PickerData
		let id = e.currentTarget.id
		let value = e.detail.value
		let list = e.currentTarget.dataset.pickerlist
		PickerData[id] = list[value]
		this.setData({
			PickerData
		})
	},


	// 选择身份证图片
	ChooseidCardImg() {
		wx.chooseImage({
			count: 2, //可选择图片数
			sizeType: ['compressed'], //压缩图
			sourceType: ['album'], //从相册选择
			success: (res) => {
				if (this.data.idCardImg.length != 0) {
					this.setData({
						idCardImg: this.data.idCardImg.concat(res.tempFilePaths)
					})
				} else {
					this.setData({
						idCardImg: res.tempFilePaths
					})
				}
			}
		});
	},

	// 预览身份证图片
	PreiewidCardImg(e) {
		wx.previewImage({
			urls: this.data.idCardImg,
			current: e.currentTarget.dataset.url
		});
	},

	// 删除身份证图片
	DelidCardImg(e) {
		wx.showModal({
			title: '提示',
			content: '确定要删除这张照片吗？',
			cancelText: '取消',
			confirmText: '确定',
			success: res => {
				if (res.confirm) {
					this.data.idCardImg.splice(e.currentTarget.dataset.index, 1);
					this.setData({
						idCardImg: this.data.idCardImg
					})
				}
			}
		})
	},

	//打开身份证示例图
	OpenIdCardFigure() {
		this.setData({
			isDisplayIdCartFigure: true, //购买凭证示例图
		})
	},

	// 选择驾驶证图片
	ChoosedrivingImg() {
		wx.chooseImage({
			count: 2, //可选择图片数
			sizeType: ['compressed'], //压缩图
			sourceType: ['album'], //从相册选择
			success: (res) => {
				if (this.data.drivingImg.length != 0) {
					this.setData({
						drivingImg: this.data.drivingImg.concat(res.tempFilePaths)
					})
				} else {
					this.setData({
						drivingImg: res.tempFilePaths
					})
				}
			}
		});
	},

	// 预览驾驶证图片
	PreiewdrivingImg(e) {
		wx.previewImage({
			urls: this.data.drivingImg,
			current: e.currentTarget.dataset.url
		});
	},
	// 删除驾驶证图片
	DeldrivingImg(e) {
		wx.showModal({
			title: '提示',
			content: '确定要删除这张照片吗？',
			cancelText: '取消',
			confirmText: '确定',
			success: res => {
				if (res.confirm) {
					this.data.drivingImg.splice(e.currentTarget.dataset.index, 1);
					this.setData({
						drivingImg: this.data.drivingImg
					})
				}
			}
		})
	},

	//打开驾驶证示例图
	OpenDrivingFigure() {
		this.setData({
			isDisplayDrivingFigure: true, //车辆示例图
		})
	},

	//关闭示例图
	closeFigure() {
		this.setData({
			isDisplayIdCartFigure: false, //身份证示例图
			isDisplayDrivingFigure: false, //驾驶证示例图
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

	//提交
	Submit() {
		let PickerData = this.data.PickerData
		let name = this.data.name
		let phone = this.data.phone
		let idCardImg = this.data.idCardImg
		let drivingImg = this.data.drivingImg
		let isAgree = this.data.isAgree
		console.log('确认提交按钮里的数据', name, phone, PickerData)
		if (name == "") {
			wx.showToast({
				title: '请填写姓名！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		if (phone == '') {
			wx.showToast({
				title: '请填写电话！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		if (phone.length != 11) {
			wx.showToast({
				title: '请填写11位电话号！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		if (PickerData['drivingAge'].length == '') {
			wx.showToast({
				title: '请选驾龄！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		if (PickerData['driving'].length == '') {
			wx.showToast({
				title: '请选驾驶证类型！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		// 图片为空时报错
		if (idCardImg.length != 2) {
			wx.showToast({
				title: '请上传身份证图片！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		// 图片为空时报错
		if (drivingImg.length != 2) {
			wx.showToast({
				title: '请上传驾驶证图片！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}
		if (!isAgree) {
			wx.showToast({
				title: '请先同意协议要求！',
				duration: 1000,
				icon: "none",
				mask: true,
			})
			return;
		}

		this.UploadidCardImg(idCardImg, drivingImg)
	},


	// 上传图片
	UploadidCardImg(idCardImg, drivingImg) {
		console.log('需要上传的身份证图片：', idCardImg)
		let idCardImgFileID = [] //把图片以数组保存
		wx.showLoading({
			title: '上传图片...',
			mask: true
		})
		// 保存图片
		for (let i = 0; i < this.data.idCardImg.length; i++) {
			const fileName = this.data.idCardImg[i];
			const cloudPath = "idCardImg/" + Date.now() + Math.floor(Math.random(0, 1) * 10000000) + '.jpg';
			wx.cloud.uploadFile({
					cloudPath,
					filePath: fileName,
				}).then(res => {
					wx.hideLoading()
					idCardImgFileID.push(res.fileID)
					if (idCardImgFileID.length == this.data.idCardImg.length) {
						console.log('上传车辆凭证图片成功')
						this.setData({
							idCardImgFileID: idCardImgFileID,
						})
						this.UploaddrivingImg(drivingImg)
					}
				})
				.catch(err => {
					// uploadFile上传图片失败
					wx.hideLoading()
					console.log('上传身份证图片失败！', err)
					wx.showToast({
						title: '上传身份证图片失败',
						duration: 1500,
						icon: 'none',
						mask: true,
					})
				})
		}
	},


	// 上传图片
	UploaddrivingImg(drivingImg) {
		console.log('需要上传的驾驶证图片：', drivingImg)
		wx.showLoading({
			title: '上传图片...',
			mask: true
		})
		let drivingImgFileID = [] //把图片以数组保存
		// 保存图片
		for (let i = 0; i < this.data.drivingImg.length; i++) {
			const fileName = this.data.drivingImg[i]; //this.data.imgList是数组类型，把imgList转换字符串fileName
			const cloudPath = "drivingImg/" + Date.now() + Math.floor(Math.random(0, 1) * 10000000) + '.jpg'; // CarInfoImg/是存图片的文件夹，若没有会自动创建
			wx.cloud.uploadFile({
					cloudPath,
					filePath: fileName, //filePath需要字符串才能上传
				}).then(res => {
					wx.hideLoading()
					drivingImgFileID.push(res.fileID)
					console.log('车辆图片drivingImgFileID：', drivingImgFileID, '类型', typeof drivingImgFileID)
					if (drivingImgFileID.length == this.data.drivingImg.length) {
						console.log('上传车辆图片成功')
						this.setData({
							drivingImgFileID: drivingImgFileID,
						})
						this.SubmitData()

					}
				})
				.catch(err => {
					// uploadFile上传图片失败
					wx.hideLoading()
					console.log('上传驾驶证图片失败！', err)
					wx.showToast({
						title: '上传驾驶证图片失败！',
						duration: 1500,
						icon: 'none',
						mask: true,
					})
				})
		}
	},

	// 上传数据
	SubmitData() {
		let myCity = wx.getStorageSync('MyCity');
		db.collection('DriverApplyList')
			.add({
				data: {
					audit: false,
					repulse: false,
					forbidden: false,
					working: false,
					online:false,
					name: this.data.name,
					phone: this.data.phone,
					score: Number(1),
					finishOrder: Number(0),
					wallet: Number(0),
					drivingAge: this.data.PickerData.drivingAge,
					driving: this.data.PickerData.driving,
					city: myCity,
					idCardImg: this.data.idCardImgFileID,
					drivingImg: this.data.drivingImgFileID,
					ApplyTime: formatTime(new Date())
				},
				success: res => {
					console.log('写入成功', res.errMsg)
					wx.showToast({
						title: '提交成功',
						icon: "success",
						duration: 1000,
					})

					this.onLoad() //刷新页面
				},
				fail: err => {
					console.log('写入失败', err)
					//则把已经上传的图片删除
					let imgFileID = this.data.idCardImgFileID.concat(this.data.drivingImgFileID)
					wx.cloud.deleteFile({
						fileList: imgFileID,
						success: res => {
							console.log('删除已经上传的图片成功：', res.errMsg)
							if (res.errMsg == "cloud.deleteFile:ok") {
								wx.showToast({
									title: '上传失败！请稍后重试',
									icon: 'none',
									duration: 1000,
								})
							}
						},
						fail: err => {
							wx.showToast({
								title: '网络错误，上传失败！',
								icon: 'none',
								duration: 1000,
							})
						}
					})
				}
			})
	},

	//重新申请
	AgainApply() {
		wx.showLoading({
			title: '加载中...',
			mask: true
		})
		wx.cloud.deleteFile({
			fileList: this.data.idCardImg,
			success: res => {
				wx.hideLoading()
				if (res.errMsg == "cloud.deleteFile:ok") {
					console.log('删除关联的身份证图片成功：', res.errMsg)
					wx.cloud.deleteFile({
						fileList: this.data.drivingImg,
						success: res => {
							if (res.errMsg == "cloud.deleteFile:ok") {
								console.log('删除关联的驾驶证图片成功：', res.errMsg)
								let _id = this.data._id
								db.collection('DriverApplyList')
									.doc(_id)
									.remove({
										success: res => {
											if (res.errMsg == "document.remove:ok" && res.stats.removed > 0) {
												console.log('重新申请成功', res)
												this.setData({
													Fill: true,
													Filled: false,
													audit: false,
													repulse: false,
													forbidden: false,

													name: '',
													phone: '',
													drivingAge: '',
													driving: '',
													city: '',
													idCardImg: '',
													drivingImg: '',
													repulseCause: '',
													ApplyTime: '',
													AuditTime: '',
													RepulseTime: '',
												})
												this.onLoad()
											}
										},
										fail: res => {
											console.log('重新申请，删除数据库的失败', err)
											wx.showToast({
												title: '重新申请失败！',
												icon: 'none',
												duration: 1000,
											})
										}
									})
							}
						},
						fail: err => {
							console.log('重新申请，删除关联的驾驶证图片失败', err)
							wx.showToast({
								title: '网络错误，重新申请失败！',
								icon: 'none',
								duration: 1000,
							})
						}
					})
				}
			},
			fail: err => {
				wx.hideLoading()
				console.log('重新申请，删除关联的身份证图片失败', err)
				wx.showToast({
					title: '网络错误，重新申请失败！',
					icon: 'none',
					duration: 1000,
				})
			}
		})
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})