// BackstagePackage/allHisOrder/allHisOrder.js
const app = getApp();
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		total: 0, // 默认数据总数
		page: 0, // 默认查询第一页

		currentTab: 0, // 默认选中菜单
		index: 0,
		navbar: ['已取消', "已完成", ], // 顶部菜单切换
		pick_name: "",
		OrdersList: [],

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.setData({
			total: 0, // 默认数据总数
			page: 0, // 默认查询第一页
			OrdersList: [],
		})
		let page = this.data.page
		this.DocCount()
		this.GetMyOrders(page)

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
	//顶部tab切换
	navbarTap: function (e) {
		this.setData({
			total: 0, // 默认数据总数
			page: 0, // 默认查询第一页
			OrdersList: [],

			currentTab: e.currentTarget.dataset.id
		})
		let page = this.data.page
		this.DocCount()
		this.GetMyOrders(page)
	},
	// 查询数据总数
	DocCount() {
		db.collection('OrderList').where({
				'ValidOrder': false,
			})
			.count({
				success: res => {
					console.log('查询数据总数成功', res.total)
					if (res.errMsg == "collection.count:ok") {
						this.setData({
							total: res.total
						})
					}
				},
				fail: err => {}
			})
	},
	// 获取订单数据
	GetMyOrders(page) {
		let OrdersList = this.data.OrdersList
		wx.showLoading({
			title: '查询中...'
		})
		db.collection('OrderList')
			.where({
				'ValidOrder': false,
			})
			.orderBy('PlaceOrderTime', 'desc')
			.skip(page)
			.limit(10)
			.get({
				success: res => {
					wx.hideLoading()
					console.log('查询订单成功', res.errMsg, res.data.length, res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						let data = res.data
						for (let i = 0; i < data.length; i++) {
							OrdersList.push(data[i])
						}
						this.setData({
							page: page,
							OrdersList: OrdersList,
						})
					} else {
						wx.showToast({
							title: '还没有任何订单数据！',
							duration: 700,
							icon: 'none',
							mask: true
						})
					}
				},
				fail: err => {
					wx.hideLoading()
					console.log('查询订单失败', err)
					wx.showToast({
						title: '网络错误！查询失败',
						duration: 1000,
						icon: 'none',
						mask: true
					})
				}
			})
	},

	// 点击跳转到订单详情页
	Navigate: function (e) {
		let id = e.currentTarget.dataset.id
		let url = '../allHisOrderDetail/allHisOrderDetail'
		wx.navigateTo({
			url: `${url}?id=${id}`,
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
	onReachBottom: function () {
		let total = this.data.total
		console.log('触底的条数', total)
		let page = this.data.page
		console.log('触底page', page)
		let OrdersList = this.data.OrdersList
		if (OrdersList.length < total) {
			page = OrdersList.length
			console.log('触底重新去获取的page', page)
			this.GetMyOrders(page)
		} else {
			wx.showToast({
				title: '没有数据了呢',
				duration: 1000,
				icon: "none",
			})
		}
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})