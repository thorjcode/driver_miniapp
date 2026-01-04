// BackstagePackage/driverAuditList/driverAuditList.js
const db = wx.cloud.database();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		unPublishList: [], // 待审核的数据列表
		unPutotal: 0, // 待审核的条数
		page: 0, // 默认查询第一页
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		//console.log('onLoad执行了', )
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function (options) {
		//console.log('onShow执行了', )
		this.setData({
			unPublishList: [], // 已审核的数据列表
		})
		this.queryCount()
		let page = this.data.page
		this.queryUnpublished(page)
	},

	// 查询房源数据的条数
	queryCount() {
		wx.showLoading({
			title: '查询中...',
		})
		db.collection('DriverApplyList')
			.where({
				'audit': false
			})
			.count({
				success: res => {
					wx.hideLoading()
					console.log('查询总条数成功', res.total)
					if (res.errMsg == "collection.count:ok") {
						console.log('待审核的条数:', res.total)
						this.setData({
							unPutotal: res.total, //待审核条数
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

	// 查询待审核的数据
	queryUnpublished(page) {
		let unPublishList = this.data.unPublishList
		db.collection('DriverApplyList')
			.where({
				'audit':false
			}).orderBy('ApplyTime', 'desc')
			.skip(page) //从page数之后的数开始加载
			.limit(10)
			.get({
				success: res => {
					console.log('获取待审核成功', res.data.length)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						console.log('走待审核-if', )
						let data = res.data
						for (let i = 0; i < data.length; i++) {
							unPublishList.push(data[i])
						}
						this.setData({
							unPublishList: unPublishList, //给待审核列表赋值
						})

					} else {
						console.log('走待审核-else', )
						wx.showToast({
							title: '暂时没有待审核的数据哦',
							icon: 'none',
							duration: 1000
						})
					}
				},
				fail: err => {
					console.log('获取待审核失败', err)
				}
			})
	},

	// 点击跳转到审核详情页
	Navigate: function (e) {
		let id = e.currentTarget.dataset.id
		let url = '../driverAudit/driverAudit'

		wx.navigateTo({
			url: `${url}?id=${id}`,
		})
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {
		let page = this.data.page
		console.log('触底page', page)

		let unPutotal = this.data.unPutotal
		console.log('触底的待审核条数', unPutotal)
		let unPublishList = this.data.unPublishList
		if (unPublishList.length < unPutotal) {
			page = unPublishList.length
			let state = false
			console.log('触底重新去查询未发布的page', page)
			this.queryUnpublished(page, state)
		} else {
			wx.showToast({
				title: '看到底了哟！',
				icon: 'none',
				duration: 1000,
			})
		}
	},

	// 查询打回记录
	goRepulse() {
		wx.navigateTo({
			url: '../driverRepulse/driverRepulse',
		})
	}
})