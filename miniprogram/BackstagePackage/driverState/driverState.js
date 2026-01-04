// BackstagePackage/driverState/driverState.js
const db = wx.cloud.database();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		DriverList: [], // 代驾列表
		Putotal: 0, // 已审核的条数
		page: 0, // 默认查询第一页
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

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
		this.setData({
			DriverList: [], // 清除列表数据
		})
		this.Count()
		let page = this.data.page
		this.GetDriver(page)
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
							Putotal: res.total, //已发布条数
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

	// 查询代驾信息
	GetDriver(page) {
		let DriverList = this.data.DriverList
		db.collection('DriverApplyList')
			.where({
				'audit': true
			}).orderBy('AuditTime', 'desc')
			.skip(page) //从page数之后的数开始加载
			.limit(10)
			.get({
				success: res => {
					wx.hideNavigationBarLoading();
					wx.stopPullDownRefresh();
					console.log('获取代驾信息成功', res.data.length)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						console.log('走-if', )
						let data = res.data
						for (let i = 0; i < data.length; i++) {
							DriverList.push(data[i])
						}
						this.setData({
							DriverList: DriverList, //给已发布列表赋值
						})

					} else {
						console.log('走-else', )
						wx.showToast({
							title: '暂时没有已审核的数据哦',
							icon: 'none',
							duration: 1000
						})
					}
				},
				fail: err => {
					wx.hideNavigationBarLoading();
					wx.stopPullDownRefresh();
					console.log('获取代驾信息失败', err)
				}
			})
	},
	// 打电话
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
		wx.showNavigationBarLoading() //在标题栏中显示加载
		this.onShow() // 重新获取数据
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {
		let page = this.data.page
		console.log('触底page', page)

		let Putotal = this.data.Putotal
		console.log('触底总条数', Putotal)
		let DriverList = this.data.DriverList.length
		console.log('触底的列表数', DriverList)
		if (DriverList < Putotal) {
			page = DriverList
			console.log('触底重新去查询的page', page)
			this.GetDriver(page)
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