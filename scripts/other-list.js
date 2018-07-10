var dataManager = require('scripts/data-manager')

function push() {
    config = JSON.parse($file.read("_config.json").string)

    const otherData = [
        {
            rows: [
                {
                    title: {
                        text: "检查更新"
                    },
                    value: {
                        text: config.version
                    }
                },
                {
                    title: {
                        text: "反馈问题"
                    },
                    value: {
                        text: "微博 @josscii"
                    }
                }
            ]
        },
        {
            rows: [
                {
                    title: {
                        text: "清除缓存"
                    }
                },
                {
                    type: "view",
                    props: {
                        accessoryType: 1
                    },
                    views: [
                        {
                            type: "label",
                            props: {
                                id: "title",
                                text: "触感反馈"
                            },
                            layout: function(make, view) {
                                make.centerY.equalTo(view.super)
                                make.left.inset(15)
                            }
                        },
                        {
                            type: "switch",
                            props: {
                                id: "switch",
                                get on() {
                                    return dataManager.isTapticOn()
                                }
                            },
                            layout: function(make, view) {
                                make.centerY.equalTo(view.super)
                                make.right.inset(15)
                            },
                            events: {
                                changed: function(sender) {
                                    dataManager.setTapticOn(sender.on)
                                }
                            }
                        }
                    ],
                    layout: $layout.fill
                }
            ]
        }
    ]

    $ui.push({
        props: {
            title: "其他"
        },
        views: [
            {
                type: "list",
                props: {
                  data: otherData,
                  template: {
                        props: {
                            accessoryType: 1
                        },
                        views: [
                            {
                                type: "label",
                                props: {
                                    id: "title"
                                },
                                layout: function(make, view) {
                                    make.centerY.equalTo(view.super)
                                    make.left.inset(15)
                                }
                            },
                            {
                                type: "label",
                                props: {
                                    id: "value",
                                },
                                layout: function(make, view) {
                                    make.centerY.equalTo(view.super)
                                    make.right.equalTo(view.super)
                                    make.left.greaterThanOrEqualTo(view.prev.right).offset(20)
                                }
                            }
                        ]
                    }
                },
                layout: $layout.fill,
                events: {
                    didSelect: function(sender, indexPath, data) {
                        if (indexPath.section == 0) {
                            if (indexPath.row == 0) {
                                checkUpdate()
                            } else if (indexPath.row == 1) {
                                gotoMyWeibo()
                            }
                        } else {
                            if (indexPath.row == 0) {
                                clearCacheAndNotifications()
                            }
                        }
                    }
                }
            }
        ]
    })
}

function clearCacheAndNotifications() {
    const notificationManager = require('scripts/notification-manager')
    notificationManager.removePendingsNotificaionIds()
    $ui.toast("清除成功！")
}

function gotoMyWeibo() {
    $app.openURL("weibo://userinfo?uid=2268468831")
}

const LEANCLOUD_APP_ID = "ysUuE04Lk4BW3BHFKx1D0J8m-gzGzoHsz"
const LEANCLOUD_APP_KEY = "V2ndP6GxVkAiB6MuEYbkht0U"

function checkUpdate() {
    $ui.loading(true)
    $http.get({
        url: "https://ysuue04l.api.lncld.net/1.1/classes/AppInfo",
        timeout: 10,
        header: {
            "X-LC-Id": LEANCLOUD_APP_ID,
            "X-LC-Key": LEANCLOUD_APP_KEY
        },
        handler: function(resp) {
            $ui.loading(false)
            const response = resp.response

            if (response.statusCode == 200) {
                const data = resp.data
                const result = data.results.pop()
                const version = result.version
                const updateInfo = result.updateInfo
                
                const currentVersion = config.version

                if (version.localeCompare(currentVersion) == 1) {
                    $ui.alert({
                        title: `新版 ${version} 来啦！`,
                        message: updateInfo,
                        actions: [
                          {
                            title: "取消",
                            handler: function() {
                            }
                          },
                          {
                            title: "更新",
                            handler: function() {
                                replaceAddin()
                            }
                          }
                        ]
                      })
                } else {
                    $ui.toast("已经是最新的啦！")
                }
            } else {
                $ui.toast("貌似网络有问题😢")
            }
        }
    })
}

// 感谢 RYAN
function replaceAddin() {
    var url = `jsbox://install?url=${encodeURIComponent(config.url)}&name=${encodeURIComponent(config.name)}&types=${encodeURIComponent(config.types)}`
    $app.openURL(url)
    $app.close()
}

module.exports = {
    push: push
}