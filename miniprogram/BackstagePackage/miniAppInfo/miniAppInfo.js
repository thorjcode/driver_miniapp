// BackstagePackage/miniAppInfo/miniAppInfo.js
const db = wx.cloud.database()
const {
	formatTime
} = require("../../utils/util.js")
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js')
var qqmapsdk
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		Id: '',
		City: '',
		Minute: '',
		AddPrice: '',
		Proportion: '',
		NightTime: '',
		NightPrice:'',
		MorningTime: '',
		MorningPrice:'',
		Editer: '',
		UpdateTime: '',

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		qqmapsdk = new QQMapWX({
			key: "PKGBZ-SFCRX-KVB4G-TNASK-PWGGJ-GQFSK"
		});
		this.getInfo()

	},
	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

	},


	// 获取数据
	getInfo() {
		db.collection('MiniAppInfo')
			.get({
				success: res => {
					console.log('查询成功', res)
					if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
						this.setData({
							Id: res.data[0]._id,
							City: res.data[0].City,
							Minute: res.data[0].Minute,
							AddPrice: res.data[0].AddPrice,
							Proportion: res.data[0].Proportion,
							NightTime: res.data[0].NightTime,
							NightPrice: res.data[0].NightPrice,
							MorningTime: res.data[0].MorningTime,
							MorningPrice: res.data[0].MorningPrice,
							Editer: res.data[0].Editer,
							UpdateTime: res.data[0].UpdateTime
						})
					}
				},
				fail: err => {
					console.log('查询失败', err)
				}
			})
	},

	// 选择城市
	InputCity() {
		wx.chooseLocation({
			success: res => {
				const longitude = Number(res.longitude) // 经度
				const latitude = Number(res.latitude) // 纬度
				console.log('获取经纬度成功：', res.longitude, res.latitude, res)
				qqmapsdk.reverseGeocoder({
					location: {
						latitude: latitude,
						longitude: longitude
					},
					get_poi: 1,
					poi_options: 'policy=2',
					success: res => {
						console.log('逆地址解析成功：', res);
						this.setData({
							City: res.result.address_component.city
						})
					},
					fail: err => {
						console.log('逆地址解析失败', err);
						wx.showToast({
							title: '位置获取失败！',
							icon: 'none',
							duration: 1000,
						})

					}
				})
			}
		})
	},

	// 输入服务分钟
	InputMinute(e) {
		console.log('输入的服务分钟', e.detail.value)
		this.setData({
			Minute: e.detail.value
		})
	},
	// 输入超时价
	InputAddPrice(e) {
		console.log('输入的超时价', e.detail.value)
		this.setData({
			AddPrice: e.detail.value
		})
	},
	// 输入晚时间
	InputNightTime(e) {
		console.log('输入的晚时间', e.detail.value)
		this.setData({
			NightTime: e.detail.value
		})
	},
	// 输入晚间价格
	InputNightPrice(e) {
		console.log('输入的晚间价格', e.detail.value)
		this.setData({
			NightPrice: e.detail.value
		})
	},
	// 输入早时间
	InputMorningTime(e) {
		console.log('输入的早时间', e.detail.value)
		this.setData({
			MorningTime: e.detail.value
		})
	},
	// 输入早间价格
	InputMorningPrice(e) {
		console.log('输入的早间价格', e.detail.value)
		this.setData({
			MorningPrice: e.detail.value
		})
	},
	// 输入比例
	InputProTion(e) {
		console.log('输入的比例', e.detail.value)
		this.setData({
			Proportion: e.detail.value
		})
	},


	// 提交更新数据
	submitData() {
		let Id = this.data.Id
		let city = this.data.City
		let Minute = this.data.Minute
		let AddPrice = this.data.AddPrice
		let NightTime = this.data.NightTime
		let NightPrice = this.data.NightPrice
		let MorningTime = this.data.MorningTime
		let MorningPrice = this.data.MorningPrice
		let Proportion = this.data.Proportion
		let userInfo = wx.getStorageSync('UserInfo')
		let editer = userInfo.nickName

		wx.showLoading({
			title: '加载中...',
			mask: true
		})
		db.collection('MiniAppInfo').where({
			'_id': Id
		}).get({
			success: res => {
				console.log('查询成功', res, res.data.length)
				wx.hideLoading()
				if (res.errMsg == "collection.get:ok" && res.data.length == 0) {
					console.log('走if')
					db.collection('MiniAppInfo')
						.add({
							data: {
								City: city,
								Minute: Minute,
								AddPrice: AddPrice,
								NightTime: NightTime,
								NightPrice: NightPrice,
								MorningTime: MorningTime,
								MorningPrice: MorningPrice,
								Proportion: Proportion,
								Editer: editer,
								UpdateTime: formatTime(new Date())
							},
							success: res => {
								console.log('添加成功', res.errMsg)
								if (res.errMsg == "collection.add:ok") {
									wx.showToast({
										title: '添加成功',
										icon: "success",
										duration: 1000,
									})
									this.getInfo()
								}
							},
							fail: res => {
								console.log('添加失败', res)
								wx.hideLoading()
								wx.showToast({
									title: '添加失败',
									icon: 'none',
									duration: 1000,
								})
							}
						})
				} else {
					console.log('走else')
					db.collection('MiniAppInfo').doc(Id).update({
						data: {
							City: city,
							Minute: Minute,
							AddPrice: AddPrice,
							NightTime: NightTime,
							NightPrice: NightPrice,
							MorningTime: MorningTime,
							MorningPrice: MorningPrice,
							Proportion: Proportion,
							Editer: editer,
							UpdateTime: formatTime(new Date())
						},
						success: res => {
							wx.hideLoading()
							console.log('更新成功', res.errMsg, res.stats.updated)
							if (res.errMsg == "document.update:ok" && res.stats.updated > 0) {
								wx.showToast({
									title: '更新成功',
									icon: "success",
									duration: 1000,
								})
								this.getInfo()
							}
						},
						fail: err => {
							console.log('更新失败', err)
							wx.hideLoading()
							wx.showToast({
								title: '更新失败',
								icon: 'none',
								duration: 1000,
							})
						}
					})
				}
			},
			fail: err => {
				console.log('查询失败', err)
				wx.hideLoading()
				wx.showToast({
					title: '更新失败',
					icon: 'none',
					duration: 1000,
				})
			}
		})
	},
})