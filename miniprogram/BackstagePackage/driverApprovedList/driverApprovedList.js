// BackstagePackage/driverApprovedList/driverApprovedList.js
const db = wx.cloud.database();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		publishList: [], // 已审核的数据列表
		Putotal: 0, // 已审核的条数
		page: 0, // 默认查询第一页
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		//console.log('onLoad执行了')

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function (options) {
		//console.log('onShow执行了')
		this.setData({
			publishList: [], // 已审核的数据列表
		})
		this.queryCount()
		let page = this.data.page
		this.queryPublished(page)
	},

	// 查询数据的条数
	queryCount() {
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

	// 查询已审核的数据
	queryPublished(page) {
		let publishList = this.data.publishList
		db.collection('DriverApplyList')
			.where({
				'audit': true
			}).orderBy('AuditTime', 'desc')
			.skip(page) //从page数之后的数开始加载
			.limit(10)
			.get({
				success: res => {
					console.log('获取已审核成功', res.data.length)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						console.log('走已审核-if', )
						let data = res.data
						for (let i = 0; i < data.length; i++) {
							publishList.push(data[i])
						}
						this.setData({
							publishList: publishList, //给已发布列表赋值
						})

					} else {
						console.log('走已审核-else', )
						wx.showToast({
							title: '暂时没有已审核的数据哦',
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

	// 点击跳转到审核详情页/已发布详情页
	Navigate: function (e) {
		let id = e.currentTarget.dataset.id
		let url = '../driverApproved/driverApproved'

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

		let Putotal = this.data.Putotal
		console.log('触底总条数', Putotal)
		let publishList = this.data.publishList.length
		console.log('触底的列表数', publishList)
		if (publishList < Putotal) {
			page = publishList
			console.log('触底重新去查询已发布的page', page)
			this.queryPublished(page)
		} else {
			wx.showToast({
				title: '看到底了哟！',
				icon: 'none',
				duration: 1000,
			})
		}
	},
})