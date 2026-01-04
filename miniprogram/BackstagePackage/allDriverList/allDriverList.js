// BackstagePackage/allDriverList/allDriverList.js
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		total: 0, // 条数
		page: 0, // 页数
		DriverList: [],

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.Count()
		let page = this.data.page
		this.getDrivers(page)
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

	// 查询数据的条数
	Count() {
		wx.showLoading({
			title: '查询中...',
		})
		db.collection('DriverApplyList')
			.where({
				'audit': true
			})
			.count({
				success: res => {
					wx.hideLoading()
					console.log('查询总条数成功', res.total)
					if (res.errMsg == "collection.count:ok") {
						console.log('已审核的条数:', res.total)
						this.setData({
							total: res.total, //已发布条数
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('查询总条数失败', err)
					wx.showToast({
						title: '网络错误,查询失败！',
						icon: 'none',
						duration: 1000,
					})
				}
			})
	},

	// 查询代驾数据
	getDrivers(page) {
		let DriverList = this.data.DriverList
		db.collection('DriverApplyList')
			.where({
				'audit': true
			}).orderBy('finishOrder', 'desc')
			.skip(page) //从page数之后的数开始加载
			.limit(10)
			.get({
				success: res => {
					console.log('获取已审核成功', res.data.length)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						let data = res.data
						for (let i = 0; i < data.length; i++) {
							DriverList.push(data[i])
						}
						this.setData({
							DriverList: DriverList,
						})
					} else {
						wx.showToast({
							title: '暂时没有数据哦',
							icon: 'none',
							duration: 1000
						})
					}
				},
				fail: err => {
					console.log('获取已审核失败', err)
				}
			})

	},

	// 点击跳转到
	Navigate: function (e) {
		let openid = e.currentTarget.dataset.openid
		console.log('要传送的openid', openid)
		let url = '../allDriverOrderList/allDriverOrderList'
		wx.navigateTo({
			url: `${url}?openid=${openid}`,
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
		let page = this.data.page
		console.log('触底page', page)

		let total = this.data.total
		console.log('触底总条数', total)
		let DriverList = this.data.DriverList.length
		console.log('触底的列表数', DriverList)
		if (DriverList < total) {
			page = DriverList
			console.log('触底重新去查询已发布的page', page)
			this.getDrivers(page)
		} else {
			wx.showToast({
				title: '看到底了哟！',
				icon: 'none',
				duration: 1000,
			})
		}
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})