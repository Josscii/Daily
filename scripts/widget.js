const TOOL_TYPE_PEROID = 0;
const TOOL_TYPE_TOMATO = 1;
const TOOL_TYPE_COUNTER = 2;
const TOOL_TYPE_NOTIFICATION = 3;
const TOOL_TYPE_CHECK = 4;

var dataManager = require('scripts/data-manager')
var helper = require('scripts/helper')
var notificationManager = require('scripts/notification-manager')
var mainData = dataManager.getCachedMainData()
var timers = {}
var isFirstDidAppear = true

$app.listen({
    exit: function() {
        // invalidate timer
        for (var key in timers) {
            if (timers.hasOwnProperty(key)) {
                timers.key.invalidate()
            }
        }
    }
})

function getMainMatrixData() {
    return mainData.map(n => {
        return {
            emoji: {
                text: n.emoji
            },
            title: {
                text: n.name
            },
            text: {
                text: ""
            }
        }
    });
}

function reloadMatrixData() {
    mainData = dataManager.getCachedMainData()
    $("matrix").data = getMainMatrixData()
}

/**
 * 番茄相关
 */

function tappedTomato(tomatoItem, sender) {
    if (tomatoItem.state == 1) {//暂停
        tomatoItem.state = 2
        dataManager.cacheMainData(mainData)

        invalidateTimer(tomatoItem)
        notificationManager.cancelNotifications(tomatoItem.id)
        
        return
    }

    if (tomatoItem.state == 0) { //开始
        sender.get("emoji").alpha = 0.3
        sender.get("text").text = tomatoItem.interval + ":" + "00"

        tomatoItem.beginDate = new Date()
        tomatoItem.remainSeconds = tomatoItem.interval * 60
    }
    
    scheduleTimer(tomatoItem, sender)

    notificationManager.scheduleDelayNotification(
        tomatoItem.beginDate,
        tomatoItem.remainSeconds,
        tomatoItem.name,
        tomatoItem.text,
        tomatoItem.id)
}

function doubleTappedTomato(tomatoItem, sender) {
    if (tomatoItem.state == 0) {
        return
    }

    invalidateTimer(tomatoItem)

    tomatoItem.state = 0
    tomatoItem.remainSeconds = 0
    tomatoItem.beginDate = null
    dataManager.cacheMainData(mainData)

    sender.get("emoji").alpha = 1
    sender.get("text").text = ""

    notificationManager.cancelNotifications(tomatoItem.id)
}

function restartTomatoIfNeeded(tomatoItem, sender) {
    if (tomatoItem.beginDate == null) {//如果还没开始过，那么直接返回
        return
    }

    if (tomatoItem.state == 1) {//如果是在开始过程中被销毁，那么重新计算剩余时间
        tomatoItem.remainSeconds = tomatoItem.interval * 60 - Math.floor((new Date().getTime() - tomatoItem.beginDate.getTime())/1000)
    }

    if (tomatoItem.remainSeconds > 0) {
        sender.get("emoji").alpha = 0.3
        sender.get("text").text = helper.minAndSecText(tomatoItem.remainSeconds)
        
        if (tomatoItem.state == 1) {//重新开始
            scheduleTimer(tomatoItem, sender)
        }
    } else {
        tomatoItem.state = 0
        tomatoItem.beginDate = null
    }
}

function scheduleTimer(tomatoItem, sender) {
    tomatoItem.state = 1
    dataManager.cacheMainData(mainData)

    const timer = $timer.schedule({
        interval: 1,
        handler: function() {
            tomatoItem.remainSeconds -= 1
            sender.get("text").text = helper.minAndSecText(tomatoItem.remainSeconds)

            if (tomatoItem.remainSeconds == 0) {
                tomatoItem.state = 0
                tomatoItem.beginDate = null

                sender.get("emoji").alpha = 1
                sender.get("text").text = ""

                invalidateTimer(tomatoItem)
            }

            dataManager.cacheMainData(mainData)
        }
    })

    timers[tomatoItem.id] = timer
}

function invalidateTimer(tomatoItem) {
    if (timers[tomatoItem.id] != undefined) {
        timers[tomatoItem.id].invalidate()
        delete timers[tomatoItem.id]
    }
}

/**
 * 计数器
 */

function tappedCounter(counterItem, sender) {
    counterItem.count += 1
    dataManager.cacheMainData(mainData)

    sender.get("emoji").alpha = 0.3
    sender.get("text").text = `${counterItem.count}`
}

function doubleTappedCounter(counterItem, sender) {
    counterItem.count = 0
    dataManager.cacheMainData(mainData)

    sender.get("emoji").alpha = 1
    sender.get("text").text = ""
}

function reloadCounterIfNeeded(counterItem, sender) {
    if (counterItem.count > 0) {
        sender.get("emoji").alpha = 0.3
        sender.get("text").text = `${counterItem.count}`
    }
}

/**
 * 打卡
 */

function tappedCheck(checkItem, sender) {
    if (checkItem.state == 0) {
        if (checkItem.beginDate > new Date()) {
            $ui.toast("还没到打卡时间哦")
            return
        }

        checkItem.state = 1
        dataManager.cacheMainData(mainData)

        sender.get("emoji").text = "✅"
        notificationManager.scheduleCheckNotification(checkItem)
    }
}

function doubleTappedCheck(checkItem, sender) {
    checkItem.state = 0
    dataManager.cacheMainData(mainData)

    sender.get("emoji").text = "❌"
    notificationManager.cancelNotifications(checkItem.id)
}

function reloadCheckIfNeeded(checkItem, sender) {
    sender.get("emoji").text = checkItem.state == 0 ? "❌" : "✅"
}

/**
 * main
 */

function main() {
    $ui.render({
        views: [
            {
                type: "matrix",
                props: {
                    id: "matrix",
                    data: getMainMatrixData(),
                    columns: 4,
                    itemHeight: 88,
                    spacing: 5,
                    selectable: false,
                    template: {
                        views: [
                            {
                                type: "gradient",
                                props: {
                                    id: "gradient",
                                    colors: [$color("#E3FEE7"), $color("#DAE8FF")],
                                    locations: [0.0, 1.0],
                                    startPoint: $point(0.5, 0),
                                    endPoint: $point(0.5, 1),
                                    smoothRadius: 13,
                                    radius: 13
                                },
                                layout: function(make, view) {
                                    make.top.equalTo(view.super).offset(16)
                                    make.centerX.equalTo(view.super)
                                    make.size.equalTo($size(60, 60))
                                },
                                events: {
                                    tapped: function(sender) {
                                        if (dataManager.isTapticOn()) {
                                            $device.taptic(0)
                                        }

                                        const cell = sender.super.super
                                        const matrix = $("matrix")
                                        const index = matrix.runtimeValue().invoke("indexPathForCell", cell).rawValue()
                                        let item = mainData[index.item]
                                        if (item.type == TOOL_TYPE_NOTIFICATION) {
                                            openURL(item)
                                        } else if (item.type == TOOL_TYPE_TOMATO) {
                                            tappedTomato(item, cell)
                                        } else if (item.type == TOOL_TYPE_CHECK) {
                                            tappedCheck(item, cell)
                                        } else if (item.type == TOOL_TYPE_COUNTER) {
                                            tappedCounter(item, cell)
                                        }
                                    },
                                    doubleTapped: function(sender) {
                                        const cell = sender.super.super
                                        const matrix = $("matrix")
                                        const index = matrix.runtimeValue().invoke("indexPathForCell", cell).rawValue()
                                        let item = mainData[index.item]
                                        
                                        if (item.type == TOOL_TYPE_TOMATO) {
                                            doubleTappedTomato(item, cell)
                                        } else if (item.type == TOOL_TYPE_CHECK) {
                                            doubleTappedCheck(item, cell)
                                        } else if (item.type == TOOL_TYPE_COUNTER) {
                                            doubleTappedCounter(item, cell)
                                        }
                                    },
                                    longPressed: function(sender) {
                                        const cell = sender.sender.super.super
                                        const matrix = $("matrix")
                                        const index = matrix.runtimeValue().invoke("indexPathForCell", cell).rawValue()
                                        let item = mainData[index.item]
                                        openURL(item)
                                    }
                                }
                            },
                            {
                                type: "label",
                                props: {
                                    id: "emoji",
                                    font: $font(36),
                                    alpha: 1
                                },
                                layout: function(make, view) {
                                    make.center.equalTo($("gradient"))
                                }
                            },
                            {
                                type: "label",
                                props: {
                                    id: "text",
                                    font: $font("bold", 20)
                                },
                                layout: function(make, view) {
                                    make.center.equalTo($("gradient"))
                                }
                            },
                            {
                                type: "label",
                                props: {
                                    id: "title",
                                    font: $font(12),
                                    textColor: $color("black"),
                                    alpha: 0.5
                                },
                                layout: function(make, view) {
                                    make.centerX.equalTo($("gradient"))
                                    make.top.equalTo($("gradient").bottom).offset(4)
                                }
                            }
                        ]
                    }
                },
                layout: $layout.fill
            }
        ],
        events: {
            didAppear: function() {
                if (isFirstDidAppear) {
                    $delay(0.1, function() {
                        for (let index = 0; index < mainData.length; index++) {
                            const item = mainData[index];
                            const cell = $("matrix").cell($indexPath(0, index))
                            if (item.type == TOOL_TYPE_TOMATO) {
                                restartTomatoIfNeeded(item, cell)
                            } else if (item.type == TOOL_TYPE_COUNTER) {
                                reloadCounterIfNeeded(item, cell)
                            } else if (item.type == TOOL_TYPE_CHECK) {
                                reloadCheckIfNeeded(item, cell)
                            }
                        }
                    })
                    isFirstDidAppear = false
                } else {
                    if (dataManager.getWidgetDataShouldReload() != undefined) {
                        reloadMatrixData()
                    }
                }
            }
        }
    })
}

function openURL(item) {
    const json = JSON.stringify(item)
    $app.openURL(`jsbox://run?name=${encodeURIComponent($addin.current.name)}&json=${encodeURIComponent(json)}`)
}

module.exports = {
    main: main
}