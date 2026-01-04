// BackstagePackage/driverAudit/driverAudit.js
const db = wx.cloud.database()
const {
	formatTime
} = require("../../utils/util.js")
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		repulse: false,
		RepulseCause: '',
		Id: '',
		openId: '',
		StatusList: '',
		idCardImg: [],
		drivingImg: [],
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (e) {
		let id = e.id
		console.log('审核列表传过来的数据：', id)
		this.setData({
			Id: id,
		})
		this.getinfo(id)
	},

	// 查询信息
	getinfo(id) {
		wx.showLoading({
			title: '查询中...',
			mask: true
		})
		db.collection('DriverApplyList').where({
			'_id': id
		}).get({
			success: res => {
				wx.hideLoading()
				console.log('查询成功', )
				if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
					let data = res.data
					this.setData({
						StatusList: data,
						openId: res.data[0]._openid,
						idCardImg: res.data[0].idCardImg,
						drivingImg: res.data[0].drivingImg,
					})
				}
			},
			fail: res => {
				wx.hideLoading()
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
			confirmText: '确定拨打',
			confirmColor: '#0081ff',
			cancelText: '取消',
			cancelColor: '#acb5bd',
			success: res => {
				if (res.confirm) {
					wx.makePhoneCall({
						phoneNumber: phoneNumber,
					})
				}
			},
			fail: err => {
				console.log(err)
			}
		})
	},

	// 预览照片
	PreiewidCardImg(e) {
		wx.previewImage({
			urls: this.data.idCardImg,
			current: e.currentTarget.dataset.url
		});
	},
	// 预览照片
	PreiewdrivingImg(e) {
		wx.previewImage({
			urls: this.data.drivingImg,
			current: e.currentTarget.dataset.url
		});
	},


	// 通过审核提示
	passModal() {
		wx.showModal({
			title: '确认提示',
			content: `确定通过审核吗?`,
			success: res => {
				if (res.confirm) {
					// 通过审核
					this.pass()
				}
			}
		})
	},

	// 通过审核
	pass() {
		wx.showLoading({
			title: '加载中...',
			mask: true
		})
		let userInfo = wx.getStorageSync('UserInfo')
		let nickName = userInfo.nickName
		let Id = this.data.Id
		db.collection('DriverApplyList').doc(Id).update({
			data: {
				audit: true,
				auditor: nickName,
				AuditTime: formatTime(new Date()),
			},
			success: res => {
				wx.hideLoading()
				console.log("通过审核成功", res.stats.updated)
				if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
					//返回上一层
					wx.navigateBack({
						delta: 1
					})
				}
			},
			fail: err => {
				console.log("通过审核失败", err)
				wx.hideLoading()
				wx.showToast({
					title: '网络错误，通过审核失败！',
					icon: 'none',
					duration: 1000
				})
			}
		})
	},

	// 显示打回原因
	repulseModal() {
		this.setData({
			repulse: true,
		})
	},

	/**
	 * 获取输入框数据
	 */
	InputData(e) {
		let key = e.currentTarget.dataset.key
		let value = e.detail.value
		console.log("获取输入框数据", e.currentTarget.id, e.detail.value)
		if (key == 'RepulseCause') {
			this.setData({
				RepulseCause: value
			})
		}
	},

	// 确认
	Confirm() {
		let RepulseCause = this.data.RepulseCause
		if (RepulseCause == "") {
			wx.showToast({
				title: '请填写打回原因！',
				duration: 1000,
				icon: "none"
			})
		} else {
			this.repulse()
		}
	},

	// 取消
	Cancel() {
		this.setData({
			repulse: false,
		})
	},

	// 打回申请
	repulse() {
		wx.showLoading({
			title: '打回中...',
			mask: true
		})
		let Id = this.data.Id
		const _ = db.command
		db.collection('DriverApplyList').doc(Id).update({
			data: {
				audit: _.remove(),
				repulse: true,
				RepulseCause: this.data.RepulseCause,
				RepulseTime: formatTime(new Date()),
			},
			success: res => {
				wx.hideLoading()
				if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
					//返回上一层
					wx.navigateBack({
						delta: 1
					})
				}
			},
			fail: err => {
				wx.hideLoading()
				wx.showToast({
					title: '网络错误！打回失败！',
					icon: 'none',
					duration: 1000
				})
			}
		})
	},
})