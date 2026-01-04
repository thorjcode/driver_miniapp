// pages/myWallet/myWallet.js
const app = getApp();
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		DriverInfo: [],
		isShowInput: false,
		CashNum: '',
		Proportion: '',
		wallet: '',
		ShowWallet: '',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.getDriverInfo()
		this.getAppInfo()

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


	// 获取订单数据
	getDriverInfo() {
		wx.showLoading({
			title: '查询中...'
		})
		db.collection('DriverApplyList')
			.where({
				'_openid': app.globalData.openId
			})
			.get({
				success: res => {
					wx.hideLoading()
					console.log('查询代驾信息成功', res.errMsg, res.data.length, res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						this.getAppInfo()
						this.setData({
							DriverInfo: res.data,
							wallet: res.data[0].wallet
						})

					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('查询代驾信息失败', err)
					wx.showToast({
						title: '网络错误！查询失败',
						duration: 1000,
						icon: 'none',
						mask: true
					})
				}
			})
	},
	// 获取数据
	getAppInfo() {
		db.collection('MiniAppInfo')
			.get({
				success: res => {
					console.log('查询比例成功', res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						let wallet = Number(this.data.wallet)
						console.log('原余额：', wallet)
						let ShowWallet = Number(wallet * res.data[0].Proportion / 100).toFixed(2)
						console.log('显示可提现的金额：', ShowWallet, '比例：', res.data[0].Proportion)
						this.setData({
							ShowWallet,
						})
					}
				},
				fail: err => {
					console.log('查询比例失败', err)
				}
			})
	},

	//提现按钮
	cashBtn() {
		if (this.data.DriverInfo[0].forbidden) {
			wx.showToast({
				title: '该账户已被禁用！请联系客服',
				duration: 1500,
				icon: 'none',
				mask: true
			})
		} else {
			this.setData({
				isShowInput: true,
			})
		}
	},

	//获取输入框数据
	InputCash(e) {
		let value = e.detail.value
		console.log('输入金额：', value)
		let CashNum = this.data.CashNum
		CashNum = value
		this.setData({
			CashNum: value,
			CashNum
		})

	},

	//确认提现按钮
	cashConfirmBtn() {
		let CashNum = Number(this.data.CashNum)
		let ShowWallet = Number(this.data.ShowWallet)
		if (CashNum == '' && CashNum === 0) {
			wx.showToast({
				title: '输入为空！',
				duration: 1000,
				icon: 'none',
				mask: true
			})
		} else if (CashNum > ShowWallet) {
			wx.showToast({
				title: '您输入的金额大于您的余额！',
				duration: 1000,
				icon: 'none',
				mask: true
			})
		} else {
			//提现的代码写在这里
			wx.showToast({
				title: '提现成功',
				duration: 1000,
				icon: 'success',
				mask: true
			})
		}

	},

	//取消提现按钮
	cashCancelBtn() {
		this.setData({
			isShowInput: false,
		})
	},

	// 代驾订单记录
	goDriverOrder() {
		wx.navigateTo({
			url: '../driverOrder/driverOrder',
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