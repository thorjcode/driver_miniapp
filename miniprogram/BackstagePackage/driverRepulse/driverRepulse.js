// BackstagePackage/driverRepulse/driverRepulse.js
var app = getApp();
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nothing: true,
    DataList: [],
    page:0,
    total: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      page:0,
      total: 0,
      DataList: [],
    })
    let page = this.data.page
    this.getInfo(page)
    this.DocCount()
  },


  // 查询数据总数
  DocCount() {
    db.collection('DriverApplyList').where({
        'repulse': true,
      })
      .count({
        success: res => {
          if (res.errMsg == "collection.count:ok") {
            this.setData({
              total: res.total
            })
          }
        },
        fail: err => {}
      })
  },

// 查询所有
getInfo(page) {
    let DataList = this.data.DataList
    db.collection('DriverApplyList').where({
        'repulse': true
      })
      .skip(page)
      .limit(10)
      .get({
        success: res => {
          if (res.errMsg == "collection.get:ok" && res.data.length > 0) {
            let data = res.data
            for (let i = 0; i < data.length; i++) {
                DataList.push(data[i])
            }
            this.setData({
                DataList:DataList,
                nothing: false
            })
          }
        },
        fail: err => {

        }
      })
  },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
      let total = this.data.total
      let page = this.data.page
      let DataList = this.data.DataList
      if (DataList.length < total) {
          page = DataList.length
          this.getInfo(page)
      } else {
          wx.showToast({
              icon: "none",
              title: '没有数据了哟',
              duration: 1000,
          })
      }
  },
})