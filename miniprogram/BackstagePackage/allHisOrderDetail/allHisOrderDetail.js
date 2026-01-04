// BackstagePackage/allHisOrderDetail/allHisOrderDetail.js
const db = wx.cloud.database()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		OrderInfo: [],
		default_score: 0,
		score: 0,
		score_text_arr: ['非常差', '差', '一般', '好', '非常好'],
		score_text: "",
		score_img_arr: [],
		OrderScore: '',

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(e) {
		let Id = e.id
		this.setData({
			orderId: Id,
		})
		console.log('订单详情页面接收的id：', Id)
		this.GetMyOrders(Id)
		this._default_score(this.data.default_score);
	},
	// 获取订单数据
	GetMyOrders(Id) {
		wx.showLoading({
			title: '查询中...'
		})
		db.collection('OrderList')
			.where({
				'_id': Id,
			})
			.get({
				success: res => {
					wx.hideLoading()
					console.log('查询订单成功', res.errMsg, res.data.length, res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						this.setData({
							OrderInfo: res.data,
							OrderScore:res.data[0].OrderScore,
						})
						let score = res.data[0].OrderScore;
						this._default_score(score);
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

	//初始化星的数量
	_default_score: function (tauch_score = 0) {
		var score_img = [];
		var score = 0;
		for (let i = 0; i < 5; i++) {
			if (i < tauch_score) {
				score_img[i] = "../../pages/images/star_on.png"
				score = i;
			} else {
				score_img[i] = "../../pages/images/star_off.png"
			}
		}
		this.setData({
			score_img_arr: score_img,
			score_text: this.data.score_text_arr[score]
		});
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