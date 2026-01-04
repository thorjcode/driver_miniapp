// pages/login/login.js
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
		Id: '',
		avatarUrl: [],
		nickName: '',
		Registered: false,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.getUserInfo()
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
	getUserInfo() {
		let openId = app.globalData.openId
		db.collection('UserList').where({
			'_openid': openId
		}).get({
			success: res => {
				console.log('查询用户成功', res)
				if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
					this.setData({
						Id: res.data[0]._id,
						nickName: res.data[0].nickName,
						avatarUrl: res.data[0].avatarUrl,
						Registered: true,
					})
					wx.setStorageSync('BefNickName', res.data[0].nickName, )
					wx.setStorageSync('BefImgFileId', res.data[0].avatarUrl)
				}

			},
			fail: err => {
				console.log('查询用户失败', err)
				// 提示网络错误
				wx.showToast({
					title: '网络错误！请稍后再试',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		})
	},

	// 获取用户头像
	onChooseAvatar(e) {
		console.log('点击获取用户头像成功', e.detail.avatarUrl)
		let avatarUrl = e.detail.avatarUrl
		this.setData({
			avatarUrl,
		})
	},

	// 获取用户昵称
	inputNickName(e) {
		console.log('获取输入昵称成功', e.detail.value)
		let nickName = e.detail.value
		this.setData({
			nickName:e.detail.value
		})

	},

	/**
	 * 确认提交按钮
	 */
	SubmitBtn(e) {
		let nickName = this.data.nickName
		let avatarUrl = this.data.avatarUrl
		var bfNickName = wx.getStorageSync('BefNickName')
		var beforeImgFileId = wx.getStorageSync('BefImgFileId')
		console.log('确认提交按钮里的位置信息：', nickName, avatarUrl)
		if (avatarUrl == "") {
			wx.showToast({
				title: '请选择头像！',
				icon: 'none',
				duration: 1000,
			})

		} else if (nickName == "") {
			wx.showToast({
				title: '请输入昵称！',
				duration: 1000,
				icon: "none"
			})
		} else if (nickName == bfNickName && avatarUrl == beforeImgFileId) {
			let userInfo = []
			userInfo.push({
				avatarUrl: avatarUrl,
				nickName: nickName,
			})
			wx.setStorageSync('UserInfo', userInfo[0]) //保存用户信息保存到本地缓存
			//返回
			wx.navigateBack({
				delta: 1
			})

		} else {
			this.SubmitData()
		}
	},


	SubmitData() {
		let openId = app.globalData.openId
		db.collection('UserList').where({
			'_openid': openId
		}).get({
			success: res => {
				console.log('根据全局openid查询用户表成功', res.data.length, res)
				if (res.errMsg == "collection.get:ok" && res.data.length == 0) { //length等于0，证明没有该用户，走写入数据库
					console.log('数据库里没有该用户')
					wx.showLoading({
						title: '加载中...',
						mask: true
					})
					let fileName = this.data.avatarUrl;
					let cloudPath = "avatarUrl/" + Date.now() + Math.floor(Math.random(0, 1) * 10000000) + '.jpg';
					wx.cloud.uploadFile({
							cloudPath,
							filePath: fileName,
						})
						.then(res => {
							console.log('上传头像成功：', res)
							let imgFileID = res.fileID
							db.collection('UserList') // 把用户信息写入数据库的用户表
								.add({
									data: {
										avatarUrl: imgFileID,
										nickName: this.data.nickName,
										level: Number(0),
										admin: false,
										registerTime: formatTime(new Date())
									},
									success: res => {
										wx.hideLoading()
										console.log('写入成功', res.errMsg, res)
										if (res.errMsg == "collection.add:ok") {
											let userInfo = []
											userInfo.push({
												avatarUrl: imgFileID,
												nickName: this.data.nickName,
											})
											wx.setStorageSync('UserInfo', userInfo[0]) //保存用户信息保存到本地缓存
											wx.showToast({
												title: '恭喜,登录成功',
												icon: "success",
												mask: true,
												duration: 1000,
											})
											//写入成功，返回
											wx.navigateBack({
												delta: 1
											})
										}
									},
									fail: err => {
										wx.hideLoading()
										console.log('用户信息写入失败', err)
										// 提示网络错误
										wx.showToast({
											title: '登录失败，请检查网络后重试！',
											icon: 'none',
											mask: true,
											duration: 1000,
										})
									}
								})

						})
						.catch(err => {
							wx.hideLoading()
							console.log('上传头像图片失败：', err)
							wx.showToast({
								title: '上传头像失败！',
								icon: 'none',
								duration: 1000,
							})
						})
				} else {
					console.log('数据库里已有该用户')
					let userInfo = []
					userInfo.push({
						avatarUrl: this.data.avatarUrl,
						nickName: this.data.nickName
					})
					wx.setStorageSync('UserInfo', userInfo[0]) //保存用户信息保存到本地缓存
					//返回
					wx.navigateBack({
						delta: 1
					})
				}
			},
			fail: err => {
				wx.hideLoading()
				console.log('根据全局openid查询用户表失败', err)
				// 提示网络错误
				wx.showToast({
					title: '网络错误！请稍后再试',
					icon: 'none',
					mask: true,
					duration: 700,
				})
			}
		})
	},

	// 注销账号
	DeleteBtn() {
		wx.showModal({
			title: '温馨提醒',
			content: `注销账号`,
			confirmText: '确定',
			confirmColor: '#ff0080',
			cancelText: '取消',
			mask: true,
			success: res => {
				if (res.confirm) {
					// 点击确认
					wx.showLoading({
						title: '注销中...',
						mask: true
					})
					var beforeImgFileId = wx.getStorageSync('BefImgFileId')
					let beforeImg = []
					beforeImg.push(beforeImgFileId)
					console.log('注销要删除的图片', beforeImg)
					wx.cloud.deleteFile({
						fileList: beforeImg,
						success: res => {
							wx.hideLoading()
							if (res.errMsg == "cloud.deleteFile:ok") {
								let Id = this.data.Id
								db.collection('UserList').doc(Id).remove({
									success: res => {
										if (res.errMsg == "document.remove:ok" && res.stats.removed > 0) {
											wx.showToast({
												title: '注销成功',
												icon: "success",
												duration: 1000,
											})
											//返回
											wx.navigateBack({
												delta: 1
											})

										}
									},
									fail: err => {
										wx.showToast({
											title: '注销失败！',
											icon: 'none',
											duration: 1000,
										})
									}
								})
							}
						},
						fail: err => {
							wx.hideLoading()
							wx.showToast({
								title: '删除图片失败',
								icon: 'none',
								duration: 1000,
							})
						}
					})
				}
			}
		})
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
		//清除缓存
		wx.removeStorageSync('BefImgFileId')
		wx.removeStorageSync('BefNickName')
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