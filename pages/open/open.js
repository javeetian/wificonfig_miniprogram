const app = getApp()
Page({
  data: {
    inputText: '',
    inputText2: '',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    service_uuid:'',
    write_uuid:'',
    notify_uuid:'',
    connected: false,
    check:true,
    items: [
      { name: 'rem', value: '记住密码', checked: 'true' },
    ]
  },
  checkboxChange(e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value)
    if (e.detail.value == '') {
      this.setData({
        check: false
      })
    }
    else {
      this.setData({
        check: true
      })
    }
  },
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  bindInput2: function (e) {
    this.setData({
      inputText2: e.detail.value
    })
    console.log(e.detail.value)
  },
  Send: function () {
    var that = this
    if(that.data.inputText.length == 0)
      wx.showToast({
        title: '名称不能为空',
        icon: 'none',
        duration: 1000
      })
      else if (that.data.connected) {
        var i = 0
        var sum = 0
      var param_len = that.data.inputText.length + that.data.inputText2.length + 2
      var buffer = new ArrayBuffer(param_len + 6)
      var dataView = new Uint8Array(buffer)
      dataView[i++] = 0x55
      dataView[i++] = 0xaa
      dataView[i++] = param_len
      sum += param_len
      dataView[i++] = 0xe
      sum += 0xe
      dataView[i++] = 0x1
      sum += 0x1
      dataView[i++] = that.data.inputText.length
      sum += that.data.inputText.length
      for (var j = 0; j < that.data.inputText.length; j++) {
        dataView[i++] = that.data.inputText.charCodeAt(j)
        sum += that.data.inputText.charCodeAt(j)
      }
      dataView[i++] = that.data.inputText2.length
      sum +=  that.data.inputText2.length
      for (var j = 0; j < that.data.inputText2.length; j++) {
        dataView[i++] = that.data.inputText2.charCodeAt(j)
        sum +=  that.data.inputText2.charCodeAt(j)
      }
      dataView[i++] = 0x100 - (sum & 0xff)
        wx.writeBLECharacteristicValue({
          deviceId: that.data.connectedDeviceId,
          serviceId: that.data.service_uuid,
          characteristicId: that.data.write_uuid,
          value: buffer,
          success: function (res) {
            console.log('发送成功')
          }
        })
        if (that.data.check)
          wx.setStorage({
            key: that.data.inputText,
            data: that.data.inputText2,
        })
      wx.showLoading({
        title: '配置中...',
      })
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  onLoad: function (options) {
    var that = this
    console.log(options)
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId,
      connected: options.connected
    })
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        console.log(res.services)
        that.setData({
          services: res.services
        })
        for (var i = 0; i < that.data.services.length; i++) {
          if (that.data.services[i].uuid.indexOf('A035') >= 0)
            that.setData({
              service_uuid: that.data.services[i].uuid
            })
        }
        wx.getBLEDeviceCharacteristics({
          deviceId: options.connectedDeviceId,
          serviceId: that.data.service_uuid,
          success: function (res) {
            console.log(res.characteristics)
            that.setData({
              characteristics: res.characteristics
            })
            for(var i = 0; i < that.data.characteristics.length; i++) {
              if (that.data.characteristics[i].uuid.indexOf('A040') >= 0)
                that.setData({
                  write_uuid: that.data.characteristics[i].uuid
                })
              if (that.data.characteristics[i].uuid.indexOf('A042') >= 0)
                that.setData({
                  notify_uuid: that.data.characteristics[i].uuid
                })
            }

            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.connectedDeviceId,
              serviceId: that.data.service_uuid,
              characteristicId: that.data.notify_uuid,
              success: function (res) {
                console.log('启用notify成功')
              }
            })
          }
        })
      }
    })
    wx.onBLEConnectionStateChange(function (res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    wx.onBLECharacteristicValueChange(function (res) {
      var receiveText = app.buf2hex(res.value)
      var dataView = new Uint8Array(res.value)
      console.log('接收到数据：' + receiveText)
      if ((dataView.byteLength == 7) && (dataView[3] == 0x8e) && (dataView[4] == 0xa) && (dataView[5] == 0x1)) {
        wx.hideLoading()
        wx.showToast({
          title: '配置成功',
          icon: 'success',
          duration: 1000
        })
      } else if ((dataView.byteLength == 7) && (dataView[3] == 0x8e) && (dataView[4] == 0xa) && (dataView[5] == 0x2)) {
        wx.hideLoading()
        wx.showToast({
          title: '配置失败',
          icon: 'none',
          duration: 1000
        })
      }
    })
    wx.getConnectedWifi({
      success: function (res) {
        console.log(res)
        that.setData({
          inputText: res.wifi.SSID
        })
        wx.getStorage({
          key: that.data.inputText,
          success(res) {
            console.log(res.data)
            that.setData({
              inputText2: res.data
            })
          }
        })
      }
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  }
})