// BackstagePackage/driverApproved/driverApproved.js
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
		openId: '',
		StatusList: '',

		idCardImg: [],
		drivingImg: [],
		forbiddenSwitch: false,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (e) {
		let id = e.id
		console.log('审核列表传过来的数据：', e, id)
		this.setData({
			Id: id
		})
		this.getinfo(id)
	},

	// 查询详细信息
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
						openId: res.data[0]._openid,
						StatusList: data,
						forbiddenSwitch: res.data[0].forbidden,
						drivingImg: res.data[0].drivingImg,
						idCardImg: res.data[0].idCardImg,
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

	// 禁用状态
	forbidden(e) {
		let Id = this.data.Id
		console.log('点击了switch', e)
		let value = e.detail.value
		if (value) {
			console.log('修改为true')
			wx.showLoading({
				title: '加载中...',
				mask: true
			})
			db.collection('DriverApplyList').doc(Id).update({
				data: {
					forbidden: true,
					working:false,
					online:false,
					ForbiddenTime: formatTime(new Date())
				},
				success: res => {
					wx.hideLoading()
					if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
						console.log('禁用成功', res)
						this.setData({
							forbiddenSwitch: true, //显示状态
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('禁用失败', err)
					wx.showToast({
						title: '网络错误，禁用失败！',
						icon: 'none',
						mask: true,
						duration: 1500
					})
				}
			})
		} else {
			wx.showLoading({
				title: '加载中...',
				mask: true
			})
			console.log('修改为flase')
			db.collection('DriverApplyList').doc(Id).update({
				data: {
					forbidden: false,
				},
				success: res => {
					wx.hideLoading()
					if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
						console.log('解除禁用成功', res)
						this.setData({
							forbiddenSwitch: false, //显示状态
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('解除禁用失败', err)
					wx.showToast({
						title: '网络错误，解除禁用失败！',
						icon: 'none',
						mask: true,
						duration: 1500
					})
				}
			})
		}
	},
})