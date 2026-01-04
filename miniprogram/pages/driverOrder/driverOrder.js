// pages/driverOrder/driverOrder.js
const app = getApp();
const db = wx.cloud.database()
Page({
  data: {
    total: 0, // 默认数据总数
    page: 0, // 默认查询第一页

    currentTab: 0, // 默认选中菜单
    index: 0,
    navbar: [ "进行中", '未支付',"已取消", "已完成", ], // 顶部菜单切换
    pick_name: "",
    OrdersList: [],
  },

  //顶部tab切换
  navbarTap: function (e) {
    this.setData({
      total: 0, // 默认数据总数
      page: 0, // 默认查询第一页
      OrdersList: [],

      currentTab: e.currentTarget.dataset.id
    })
    let openId = app.globalData.openId
    let page = this.data.page
    this.DocCount(openId)
    this.GetMyOrders(openId, page)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onLoad: function () {
    this.setData({
      total: 0, // 默认数据总数
      page: 0, // 默认查询第一页
      OrdersList: [],
    })
    let openId = app.globalData.openId
    let page = this.data.page
    this.DocCount(openId)
    this.GetMyOrders(openId, page)
  },
  // 查询数据总数
  DocCount(openId) {
    db.collection('OrderList').where({
        'DriverOpenId': openId,
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
  GetMyOrders(openId, page) {
    let OrdersList = this.data.OrdersList
    wx.showLoading({
      title: '查询中...'
    })
    db.collection('OrderList')
      .where({
        'DriverOpenId': openId,
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
              title: '你还没有任何订单数据！',
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
    let url = '../driverOrderDetail/driverOrderDetail'
    wx.navigateTo({
      url: `${url}?id=${id}`,
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let openId = app.globalData.openId
    let total = this.data.total
    //console.log('触底的条数', total)
    let page = this.data.page
    //console.log('触底page', page)
    let OrdersList = this.data.OrdersList
    if (OrdersList.length < total) {
      page = OrdersList.length
      this.GetMyOrders(openId, page)
    } else {
      wx.showToast({
        title: '没有数据了呢',
        duration: 1000,
        icon: "none",
      })
    }
  },
})