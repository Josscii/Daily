const NOTIFICATIONS_DATA_CACHE_KEY = "notifications-data"

var notificationManager = require('scripts/notification-manager')
var notifications = getNotifications()

function getNotifications() {
    return $cache.get(NOTIFICATIONS_DATA_CACHE_KEY) || []
}

function cacheNotifications() {
    return $cache.set(NOTIFICATIONS_DATA_CACHE_KEY, notifications)
}

function getNotifiListData() {
    notifiListData = []
    notifications.forEach(notifi => {

        const n = {
            title: {
                text: notifi.content
            },
            value: {
                get text() {
                    const year = notifi.date.getFullYear()
                    const month = notifi.date.getMonth()
                    const day = notifi.date.getDate()
                    const hour = notifi.date.getHours()
                    const min = notifi.date.getMinutes()

                    return year + "/" + month + "/" + day + " " + hour + ":" + (min < 10 ? '0' : '') + min
                }
            }
        }

        notifiListData.push(n)
    })
    return notifiListData
}

function addNotification() {
    $input.text({
        placeholder: "提醒",
        handler: function(text) {
            $picker.date({
                handler: function(date) {
                    const notifi = {
                        id: new Date().getTime(),
                        content: text,
                        "date": date
                    }

                    notificationManager.scheduleEventNotification(date, text, notifi.id)

                    notifications.splice(0, 0, notifi)

                    cacheNotifications()

                    reloadNotificationList()
                }
            })
        }
    })
}

function reloadNotificationList() {
    $("notiList").data = getNotifiListData()
}

function push(beginEditing) {
    $ui.push({
        props: {
            title: "通知"
        },
        views: [
            {
                type: "list",
                props: {
                    id: "notiList",
                    contentInset: $insets(0, 0, 70, 0),
                    data: getNotifiListData(),
                    actions: [
                        {
                            title: "delete",
                            handler: function(sender, indexPath) {
                                const notifi = notifications[indexPath.row]

                                notificationManager.cancelNotifications(notifi.id)

                                notifications.splice(indexPath.row, 1)

                                cacheNotifications()

                                sender.data = getNotifiListData()
                            }
                        }
                    ],
                    template: {
                        views: [
                            {
                                type: "label",
                                props: {
                                    id: "title",
                                    lines: 0
                                },
                                layout: function(make, view) {
                                    make.top.bottom.left.inset(8)
                                    make.right.inset(100)
                                }
                            },
                            {
                                type: "label",
                                props: {
                                    id: "value",
                                    font: $font(13),
                                    color: $color("gray")
                                },
                                layout: function(make, view) {
                                    make.top.equalTo(view.super).inset(8)
                                    make.right.equalTo(view.super).inset(8)
                                }
                            }
                        ]
                    },
                    rowHeight: -1,
                    estimatedRowHeight: 50
                },
                layout: $layout.fill
            },
            {
                type: "button",
                props: {
                  title: "新增"
                },
                layout: function(make, view) {
                    make.left.right.bottom.equalTo(view.super).inset(15)
                    make.height.equalTo(50)
                },
                events: {
                    tapped: function(sender) {
                        addNotification()
                    }
                }
            }
        ],
        events: {
            didAppear: function() {
                if (beginEditing) {
                    addNotification()
                }
            }
        }
    })
}


module.exports = {
    push: push
}