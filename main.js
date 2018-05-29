var WatchJS = require("scripts/watch")
var watch = WatchJS.watch

const env = $app.env

$app.listen({
    ready: function() {
        getData()
        if (env == $env.today) {
            initWidgetUI()
            restartTimerIfNeeded()
        } else {
            initAppUI()
            routeToPageIfNeeded()
        }
    },
    exit: function() {
        if (env == $env.today) {
            if (timer != undefined) {
                timer.invalidate()
            }
        }
    }
})

//------------------------------------- 数据

const DRINK_MODEL_KEY = "DRINK_MODEL_KEY"
const STAND_MODEL_KEY = "STAND_MODEL_KEY"
const TOMATO_MODEL_KEY = "TOMATO_MODEL_KEY"
const NOTIFI_MODEL_KEY = "NOTIFI_MODEL_KEY"

function getData() {
    getDrinkData()
    getStandData()
    getTomatoData()
    getNotifiData()

    resetDrinkNotification()
    resetStandNotification()
}

function getDrinkData() {
    drinkModel = {
        ml: 300,
        notifi: false,
        beginDate: new Date(),
        endDate: new Date(),
        interval: 30, //min
        notiText: "喝水",
        days: [],
        notiIds: []
    }

    const drink = $cache.get(DRINK_MODEL_KEY)
    if (drink != undefined) {
        drinkModel = drink
    }

    watch(drinkModel, function(){
        cacheDrink()
    })

    let hasToday = false
    drinkModel.days.forEach(day => {
        if (isSameDay(day.date, new Date())) {
            hasToday = true
            return
        }
    })

    if (!hasToday) {
        drinkModel.days.splice(0, 0, {
            times: 0,
            date: new Date()
        })
    }
}

function getStandData() {
    standModel = {
        notifi: false,
        interval: 30, //min
        beginDate: new Date(),
        endDate: new Date(),
        notiText: "站起来！",
        days:[],
        notiIds: []
    }

    const stand = $cache.get(STAND_MODEL_KEY)
    if (stand != undefined) {
        standModel = stand
    }

    watch(standModel, function(){
        cacheStand()
    })

    let hasToday = false
    standModel.days.forEach(day => {
        if (isSameDay(day.date, new Date())) {
            hasToday = true
            return
        }
    })

    if (!hasToday) {
        standModel.days.splice(0, 0, {
            times: 0,
            date: new Date()
        })
    }
}

function getTomatoData() {
    tomatoModel = {
        interval : 25,
        beginDate: null,
        state: 0, // 0 初始 1 开始 2 暂停
        remainSeconds: 0,
        notifiOnEnded: true
    }

    const tomato = $cache.get(TOMATO_MODEL_KEY)
    if (tomato != undefined) {
        tomatoModel = tomato
    }

    watch(tomatoModel, function(){
        cacheTomato()
    })
}

function getNotifiData() {
    notifiModel = []

    const notifi = $cache.get(NOTIFI_MODEL_KEY)
    if (notifi != undefined) {
        notifiModel = notifi
    }

    watch(notifiModel, function(){
        cacheNotifi()
    })
}

function restartTimerIfNeeded() {
    timer = undefined

    if (tomatoModel.beginDate == null) {
        return
    }

    totalSeconds = tomatoModel.interval * 60
    if (tomatoModel.state != 2) {// 如果是在暂停状态下被销毁，那么回到暂停状态
        tomatoModel.remainSeconds = totalSeconds - Math.floor((new Date().getTime() - tomatoModel.beginDate.getTime())/1000)
    }

    if (tomatoModel.remainSeconds > 0) {
        $("tomato").get("emoji").alpha = 0.3
        min = Math.floor(tomatoModel.remainSeconds / 60)
        s = tomatoModel.remainSeconds % 60
        $("tomato").get("times").text = min + ":" + (s < 10 ? '0' : '') + s
        
        if (tomatoModel.state != 2) {
            tomatoModel.state = 1
            timer = $timer.schedule({
                interval: 1,
                handler: function() {
                    tomatoModel.remainSeconds -= 1
                    min = Math.floor(tomatoModel.remainSeconds / 60)
                    s = tomatoModel.remainSeconds % 60
                    $("tomato").get("times").text = min + ":" + (s < 10 ? '0' : '') + s

                    if (tomatoModel.remainSeconds == 0) {
                        timer.invalidate()
                        tomatoModel.state = 0
                        $("tomato").get("emoji").alpha = 1
                        $("tomato").get("times").text = ""
                    }
                }
            })
        }
    } else {
        tomatoModel.state = 0
    }
}

function isSameDay(date1, date2) {
    // return true
    return date1.getFullYear() == date2.getFullYear() && 
           date1.getMonth() == date2.getMonth() && 
           date1.getDate() == date2.getDate()
}

function cacheDrink() {
    $cache.set(DRINK_MODEL_KEY, drinkModel)
}

function cacheStand() {
    $cache.set(STAND_MODEL_KEY, standModel)
}

function cacheTomato() {
    $cache.set(TOMATO_MODEL_KEY, tomatoModel)
}

function cacheNotifi() {
    $cache.set(NOTIFI_MODEL_KEY, notifiModel)
}

function cacheData() {    
    cacheDrink()
    cacheStand()
    cacheTomato()
    cacheNotifi()
}

function clearData() {
    $cache.clear() 
}

//------------------------------------ widget 界面

function initWidgetUI() {
    $ui.render({
        props: {
            title: ""
        },
        views: [
            {
                type: "view",
                props: {
                    id: "drink",
                    bgcolor: $color("clear")
                },
                layout: function(make, view) {
                    make.top.equalTo(view.super)
                    make.left.equalTo(view.super)
                    make.height.equalTo(view.super)
                    make.width.equalTo(view.super).dividedBy(4)
                },
                events: {
                    tapped: function(sender) {
                        drinkModel.days[0].times += 1
                        sender.get("times").text = drinkModel.days[0].times
                        sender.get("emoji").alpha = 0.3
                    },
                    // doubleTapped: function(sender) {
                    //     drinkModel.days[0].times = Math.max(drinkModel.days[0].times-1, 0)
                    //     sender.get("times").text = drinkModel.days[0].times == 0 ? "" : "" + drinkModel.days[0].times
                    //     sender.get("emoji").alpha = drinkModel.days[0].times == 0 ? 1 : 0.3
                    // },
                    longPressed: function(sender) {
                        openURL("drink")
                    }
                },
                views: [
                    {
                        type: "gradient",
                        props: {
                            id: "gradient",
                            colors: [$color("#E3FEE7"), $color("#DAE8FF")],
                            locations: [0.0, 1.0],
                            startPoint: $point(0.5, 0),
                            endPoint: $point(0.5, 1),
                            smoothRadius: 13
                        },
                        layout: function(make, view) {
                            make.top.equalTo(view.super).offset(16)
                            make.centerX.equalTo(view.super)
                            make.size.equalTo($size(60, 60))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "emoji",
                            text: "💧",
                            font: $font(36),
                            alpha: drinkModel.days[0].times == 0 ? 1 : 0.3
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "times",
                            text: drinkModel.days[0].times == 0 ? "" : "" + drinkModel.days[0].times,
                            font: $font("bold", 36)
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "title",
                            text: "喝水",
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
            },
            {
                type: "view",
                props: {
                    id: "stand",
                    bgcolor: $color("clear")
                },
                layout: function(make, view) {
                    make.top.equalTo(view.super)
                    make.left.equalTo(view.prev.right)
                    make.height.equalTo(view.super)
                    make.width.equalTo(view.super).dividedBy(4)
                },
                events: {
                    tapped: function(sender) {
                        standModel.days[0].times += 1
                        sender.get("times").text = standModel.days[0].times
                        sender.get("emoji").alpha = 0.3
                    },
                    // doubleTapped: function(sender) {
                    //     standModel.days[0].times = Math.max(standModel.days[0].times-1, 0)
                    //     sender.get("times").text = standModel.days[0].times == 0 ? "" : "" + standModel.days[0].times
                    //     sender.get("emoji").alpha = standModel.days[0].times == 0 ? 1 : 0.3
                    // },
                    longPressed: function(sender) {
                        openURL("stand")
                    }
                },
                views: [
                    {
                        type: "gradient",
                        props: {
                            id: "gradient",
                            colors: [$color("#E3FEE7"), $color("#DAE8FF")],
                            locations: [0.0, 1.0],
                            startPoint: $point(0.5, 0),
                            endPoint: $point(0.5, 1),
                            smoothRadius: 13
                        },
                        layout: function(make, view) {
                            make.top.equalTo(view.super).offset(16)
                            make.centerX.equalTo(view.super)
                            make.size.equalTo($size(60, 60))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "emoji",
                            text: "🚶",
                            font: $font(36),
                            alpha: standModel.days[0].times == 0 ? 1 : 0.3
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"));
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "times",
                            text: standModel.days[0].times == 0 ? "" : "" + standModel.days[0].times,
                            font: $font("bold", 36)
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"));
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "title",
                            text: "站立",
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
            },
            {
                type: "view",
                props: {
                    id: "tomato",
                    bgcolor: $color("clear")
                },
                layout: function(make, view) {
                    make.top.equalTo(view.super)
                    make.left.equalTo(view.prev.right)
                    make.height.equalTo(view.super)
                    make.width.equalTo(view.super).dividedBy(4)
                },
                events: {
                    tapped: function(sender) {
                        if (tomatoModel.state == 1) {
                            tomatoModel.state = 2
                            timer.invalidate()

                            //暂停时取消推送
                            $push.cancel({
                                title: "本次专注结束啦！",
                                body: "休息一会吧！"
                            })
                            return
                        }
    
                        if (tomatoModel.state == 0) {
                            sender.get("emoji").alpha = 0.3;
                            sender.get("times").text = tomatoModel.interval + ":" + "00"

                            tomatoModel.beginDate = new Date()
                            tomatoModel.remainSeconds = tomatoModel.interval * 60
                        }
    
                        tomatoModel.state = 1
                        
                        timer = $timer.schedule({
                            interval: 1,
                            handler: function() {
                                tomatoModel.remainSeconds -= 1
                                min = Math.floor(tomatoModel.remainSeconds / 60)
                                s = tomatoModel.remainSeconds % 60
                                $("tomato").get("times").text = min + ":" + (s < 10 ? '0' : '') + s

                                if (tomatoModel.remainSeconds == 0) {
                                    tomatoModel.state = 0
                                    $("tomato").get("emoji").alpha = 1
                                    $("tomato").get("times").text = ""
                                    timer.invalidate()
                                }
                            }
                        })

                        if (tomatoModel.notifiOnEnded) {
                            const tomatoNotifiDate =  new Date(new Date().getTime() + tomatoModel.remainSeconds*1000)
                            $push.schedule({
                                title: "本次专注结束啦！",
                                body: "休息一会吧！",
                                date: tomatoNotifiDate
                            })
                        }
                    },
                    doubleTapped: function(sender) {
                        if (tomatoModel.state == 0) {
                            return
                        }
    
                        timer.invalidate()
    
                        tomatoModel.state = 0
                        tomatoModel.remainSeconds = 0
                        tomatoModel.beginDate = null
    
                        sender.get("emoji").alpha = 1
                        sender.get("times").text = ""

                        $push.cancel({
                            title: "本次专注结束啦！",
                            body: "休息一会吧！"
                        })
                    },
                    longPressed: function(sender) {
                        openURL("tomato")
                    }
                },
                views: [
                    {
                        type: "gradient",
                        props: {
                            id: "gradient",
                            colors: [$color("#E3FEE7"), $color("#DAE8FF")],
                            locations: [0.0, 1.0],
                            startPoint: $point(0.5, 0),
                            endPoint: $point(0.5, 1),
                            smoothRadius: 13
                        },
                        layout: function(make, view) {
                            make.top.equalTo(view.super).offset(16)
                            make.centerX.equalTo(view.super)
                            make.size.equalTo($size(60, 60))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "emoji",
                            text: "🍅",
                            font: $font(36)
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"));
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "times",
                            text: "",
                            font: $font("bold", 18),
                            hidden: false
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"));
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "title",
                            text: "番茄",
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
            },
            {
                type: "view",
                props: {
                    id: "notifi",
                    bgcolor: $color("clear")
                },
                layout: function(make, view) {
                    make.top.equalTo(view.super)
                    make.left.equalTo(view.prev.right)
                    make.height.equalTo(view.super)
                    make.width.equalTo(view.super).dividedBy(4)
                },
                events: {
                    tapped: function(sender) {
                        openURL("notifi")
                    }
                },
                views: [
                    {
                        type: "gradient",
                        props: {
                            id: "gradient",
                            colors: [$color("#E3FEE7"), $color("#DAE8FF")],
                            locations: [0.0, 1.0],
                            startPoint: $point(0.5, 0),
                            endPoint: $point(0.5, 1),
                            smoothRadius: 13
                        },
                        layout: function(make, view) {
                            make.top.equalTo(view.super).offset(16)
                            make.centerX.equalTo(view.super)
                            make.size.equalTo($size(60, 60))
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "emoji",
                            text: "📲",
                            font: $font(36)
                        },
                        layout: function(make, view) {
                            make.center.equalTo($("gradient"));
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "title",
                            text: "提醒",
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
        ]
    })
}

//------------------------------------ 主界面

function initAppUI() {
    let data = [
        {
            rows: [
                "喝水", 
                "站立", 
                "番茄", 
                "通知",
                "统计"
            ]
        }
    ]

    $ui.render({
        props: {
            title: "日常"
        },
        views: [
            {
                type: "list",
                props: {
                  data: data,
                  template: {
                    props: {
                        accessoryType: 1
                    }
                  }
                },
                layout: $layout.fill,
                events: {
                    didSelect: function(sender, indexPath, data) {
                        if (indexPath.section == 0) {
                            if (indexPath.row == 0) {
                                pushToDrinkSetting()
                            } else if (indexPath.row == 1) {
                                pushToStandSetting()
                            } else if (indexPath.row == 2) {
                                pushToTomatoSetting()
                            } else if (indexPath.row == 3) {
                                pushToNotifiList()
                            } else if (indexPath.row == 4) {
                                pushToStatistics()
                            }
                        } else {
                            
                        }
                    }
                }
            }
        ]
    })
}

//------------------------------ 喝水

function pushToDrinkSetting() {
    drinkSettingData = [
        {
            rows: [
                {
                    title: {
                        text: "水杯容量"
                    },
                    value: {
                        get text() {
                            return drinkModel.ml + "ml"
                        } 
                    }
                }
            ]
        },
        {
            rows: [
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
                                text: "提醒"
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
                                    return drinkModel.notifi
                                }
                            },
                            layout: function(make, view) {
                                make.centerY.equalTo(view.super)
                                make.right.inset(15)
                            },
                            events: {
                                changed: function(sender) {
                                    drinkModel.notifi = sender.on
                                    if (sender.on) {
                                        scheduleDrinkNotification()
                                    } else {
                                        cancelDrinkNotification()
                                    }
                                }
                            }
                        }
                    ],
                    layout: $layout.fill
                },
                {
                    title: {
                        text: "开始时间"
                    },
                    value: {
                        get text() {
                            return drinkModel.beginDate.getHours() + ":" + drinkModel.beginDate.getMinutes()
                        }
                    }
                },
                {
                    title: {
                        text: "结束时间"
                    },
                    value: {
                        get text() {
                            return drinkModel.endDate.getHours() + ":" + drinkModel.endDate.getMinutes()
                        }
                    }
                },
                {
                    title: {
                        text: "间隔"
                    },
                    value: {
                        get text() {
                            return drinkModel.interval +  " 分钟"
                        }
                    }
                },
                {
                    title: {
                        text: "提示语"
                    },
                    value: {
                        get text() {
                            return drinkModel.notiText
                        }
                    }
                }
            ]
        }
    ]

    $ui.push({
        props: {
            title: "喝水"
        },
        views: [
            {
                type: "list",
                props: {
                  data: drinkSettingData,
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
                            $input.text({
                                type: $kbType.number,
                                placeholder: "水杯容量",
                                handler: function(text) {
                                    drinkModel.ml = parseInt(text)
                                    sender.data = drinkSettingData
                                }
                            })
                        } else {
                            if (indexPath.row == 1) {
                                $picker.date({
                                    props: {
                                        mode: 0
                                    },
                                    // events: {
                                    //     changed: function(picker) {
                                    //         drinkModel.beginDate = picker.date
                                    //         sender.data = drinkSettingData
                                    //     }
                                    // },
                                    handler: function(date) {
                                        drinkModel.beginDate = date
                                        sender.data = drinkSettingData

                                        resetDrinkNotification()
                                    }
                                })
                            } else if (indexPath.row == 2) {
                                $picker.date({
                                    props: {
                                        mode: 0
                                    },
                                    // events: {
                                    //     changed: function(picker) {
                                    //         drinkModel.endDate = picker.date
                                    //         sender.data = drinkSettingData
                                    //     }
                                    // },
                                    handler: function(date) {
                                        drinkModel.endDate = date
                                        sender.data = drinkSettingData

                                        resetDrinkNotification()
                                    }
                                })
                            } else if (indexPath.row == 3) {
                                $input.text({
                                    type: $kbType.number,
                                    placeholder: "间隔",
                                    handler: function(text) {
                                        drinkModel.interval = parseInt(text)
                                        sender.data = drinkSettingData
                                    }
                                })
                            } else if (indexPath.row == 4) {
                                $input.text({
                                    placeholder: "提示语",
                                    handler: function(text) {
                                        drinkModel.notiText = text
                                        sender.data = drinkSettingData
                                    }
                                })
                            }
                        }
                    }
                }
            }
        ]
    })
}

function scheduleDrinkNotification() {
    let beginDate = drinkModel.beginDate
    const endDate = drinkModel.endDate

    let padding = ""
    beginDate = new Date(beginDate.getTime() + drinkModel.interval*60000)

    while (beginDate < endDate) {
        padding += " "
        $push.schedule({
            title: "喝水提醒",
            body: drinkModel.notiText + padding,
            date: beginDate,
            handler: function(result) {// 方法是异步的
                let id = result.id
                drinkModel.notiIds.push(id)
            }
        })
        beginDate = new Date(beginDate.getTime() + drinkModel.interval*60000)
    }
}

function cancelDrinkNotification() {
    drinkModel.notiIds.forEach(notifiId => {
        $push.cancel({id: notifiId})
    })

    drinkModel.notiIds = []
}

function resetDrinkNotification() {
    if (drinkModel.notifi) {
        cancelDrinkNotification()
        scheduleDrinkNotification()
    }
}

//------------------------------ 站立

function pushToStandSetting() {
    standSettingData = [
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
                        text: "提醒"
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
                            return standModel.notifi
                        }
                    },
                    layout: function(make, view) {
                        make.centerY.equalTo(view.super)
                        make.right.inset(15)
                    },
                    events: {
                        changed: function(sender) {
                            standSettingData.notifi = sender.on
                            if (sender.on) {
                                scheduleStandNotification()
                            } else {
                                cancelStandNotification()
                            }
                        }
                    }
                }
            ],
            layout: $layout.fill
        },
        {
            title: {
                text: "开始时间"
            },
            value: {
                get text() {
                    return standModel.beginDate.getHours() + ":" + standModel.beginDate.getMinutes()
                }
            }
        },
        {
            title: {
                text: "结束时间"
            },
            value: {
                get text() {
                    return standModel.endDate.getHours() + ":" + standModel.endDate.getMinutes()
                }
            }
        },
        {
            title: {
                text: "间隔"
            },
            value: {
                get text() {
                    return standModel.interval +  " 分钟"
                }
            }
        },
        {
            title: {
                text: "提示语"
            },
            value: {
                get text() {
                    return standModel.notiText
                }
            }
        }
    ]

    $ui.push({
        props: {
            title: "站立"
        },
        views: [
            {
                type: "list",
                props: {
                  data: standSettingData,
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
                        if (indexPath.row == 1) {
                            $picker.date({
                                props: {
                                    mode: 0
                                },
                                // events: {
                                //     changed: function(picker) {
                                //         standModel.beginDate = picker.date
                                //         sender.data = standSettingData
                                //     }
                                // },
                                handler: function(date) {
                                    standModel.beginDate = date
                                    sender.data = standSettingData

                                    resetStandNotification()
                                }
                            })
                        } else if (indexPath.row == 2) {
                            $picker.date({
                                props: {
                                    mode: 0
                                },
                                // events: {
                                //     changed: function(picker) {
                                //         standModel.endDate = picker.date
                                //         sender.data = standSettingData
                                //     }
                                // },
                                handler: function(date) {
                                    standModel.endDate = date
                                    sender.data = standSettingData

                                    resetStandNotification()
                                }
                            })
                        } else if (indexPath.row == 3) {
                            $input.text({
                                type: $kbType.number,
                                placeholder: "间隔",
                                handler: function(text) {
                                    standModel.interval = parseInt(text)
                                    sender.data = standSettingData
                                }
                            })
                        } else if (indexPath.row == 4) {
                            $input.text({
                                placeholder: "提示语",
                                handler: function(text) {
                                    standModel.notiText = text
                                    sender.data = standSettingData
                                }
                            })
                        }
                    }
                }
            }
        ]
    })
}

function scheduleStandNotification(on) {
    let beginDate = standModel.beginDate
    const endDate = standModel.endDate

    let padding = ""
    beginDate = new Date(beginDate.getTime() + standModel.interval*60000)

    while (beginDate < endDate) {
        padding += " "

        $push.schedule({
            title: "站立提醒",
            body: standModel.notiText + padding,
            date: beginDate,
            handler: function(result) {
                let id = result.id
                standModel.notiIds.push(id)
            }
        })

        beginDate = new Date(beginDate.getTime() + standModel.interval*60000)
    }
}

function cancelStandNotification() {
    standModel.notiIds.forEach(notifiId => {
        $push.cancel({id: notifiId})
    })

    standModel.notiIds = []
}

function resetStandNotification() {
    if (standModel.notifi) {
        cancelStandNotification()
        scheduleStandNotification()
    }
}

//------------------------------ 番茄

function pushToTomatoSetting() {
    tomatoSettingData = [
        {
            rows: [
                {
                    title: {
                        text: "持续时间"
                    },
                    value: {
                        get text() {
                            return tomatoModel.interval + " 分钟"
                        }
                    }
                }
            ]
        },
        {
            title: "开启和关闭从下次开始番茄钟生效",
            rows: [
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
                                text: "结束时提醒"
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
                                    return tomatoModel.notifiOnEnded
                                }
                            },
                            layout: function(make, view) {
                                make.centerY.equalTo(view.super)
                                make.right.inset(15)
                            },
                            events: {
                                changed: function(sender) {
                                    tomatoModel.notifiOnEnded = sender.on
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
            title: "番茄"
        },
        views: [
            {
                type: "list",
                props: {
                  data: tomatoSettingData,
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
                        if (indexPath.row == 0) {
                            $input.text({
                                type: $kbType.number,
                                placeholder: "持续时间",
                                handler: function(text) {
                                    tomatoModel.interval = parseInt(text)
                                    sender.data = tomatoSettingData
                                }
                            })
                        }
                    }
                }
            }
        ]
    })
}

//----------------------------- 通知

function getNotifiList() {
    notifiList = []
    notifiModel.forEach(notifi => {

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

                    return year + "/" + month + "/" + day + " " + hour + ":" + min
                }
            }
        }

        notifiList.push(n)
    })
}

function pushToNotifiList() {
    getNotifiList()

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
                    data: notifiList,
                    actions: [
                        {
                            title: "delete",
                            color: $color("gray"), // default to gray
                            handler: function(sender, indexPath) {
                                const notifi = notifiModel[indexPath.row]
                                cancelNotification(notifi)

                                notifiModel.splice(indexPath.row, 1)
                                getNotifiList()
                                sender.data = notifiList
                            }
                        }
                    ],
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
                                    font: $font(13),
                                    color: $color("gray")
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
                        addNotifi()
                    }
                }
            }
        ]
    })
}

function addNotifi() {
    $input.text({
        placeholder: "提醒",
        handler: function(text) {
            $picker.date({
                handler: function(date) {
                    const notifi = {
                        content: text,
                        "date": date
                    }

                    scheduleNotification(notifi)
                }
            })
        }
    })
}

function scheduleNotification(notifi) {
    $push.schedule({
        title: "日常提醒",
        body: notifi.content,
        date: notifi.date,
        handler: function(result) {
            notifi.id = result.id
            notifiModel.splice(0, 0, notifi)
            getNotifiList()
            $("notiList").data = notifiList
        }
    })
}

function cancelNotification(notifi) {
    $push.cancel({
        id: notifi.id
    })
}

//-------------------------------- 统计

function pushToStatistics() {
    const file = $file.read("statistics.html")

    const drinkTimes = drinkModel.days[0].times
    const drinkMLs = drinkTimes * drinkModel.ml
    let greatOrEqualTimes1 = 0
    for (let index = 1; index < drinkModel.days.length; index++) {
        const day = drinkModel.days[index];
        if (day.times < drinkTimes) {
            greatOrEqualTimes1 += 1
        }
    }
    const drinkPer = greatOrEqualTimes1 / drinkModel.days.length

    const standTimes = standModel.days[0].times
    let greatOrEqualTimes2 = 0
    for (let index = 1; index < standModel.days.length; index++) {
        const day = standModel.days[index];
        if (day.times < standTimes) {
            greatOrEqualTimes2 += 1
        }
    }
    const standPer = greatOrEqualTimes2 / standModel.days.length

    let htmlStr = file.string
    htmlStr = htmlStr.replace("{0}", drinkTimes)
    htmlStr = htmlStr.replace("{1}", drinkMLs)
    htmlStr = htmlStr.replace("{2}", `${drinkPer}%`)
    htmlStr = htmlStr.replace("{3}", standTimes)
    htmlStr = htmlStr.replace("{4}", `${standPer}%`)

    $ui.push({
        props: {
            title: " 统计"
        },
        views: [
            {
                type: "web",
                props: {
                    html: htmlStr
                },
                layout: $layout.fill
            }
        ]
    })
}

//--------------------------------- 外部

function openURL(id) {
    $app.openURL(`jsbox://run?name=${encodeURI($addin.current.name)}&id=${id}`)
}

function routeToPageIfNeeded() {
    const id = $context.query.id

    if (id === "drink") {
        pushToDrinkSetting()
    } else if (id === "stand") {
        pushToStandSetting()
    } else if (id === "tomato") {
        pushToTomatoSetting()
    } else if (id === "notifi") {
        pushToNotifiList()
    }
}