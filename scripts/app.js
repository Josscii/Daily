const TOOL_TYPE_PEROID = 0;
const TOOL_TYPE_TOMATO = 1;
const TOOL_TYPE_COUNTER = 2;
const TOOL_TYPE_NOTIFICATION = 3;
const TOOL_TYPE_CHECK = 4;

var dataManager = require('scripts/data-manager')
var helper = require('scripts/helper')
var mainData = dataManager.getCachedMainData()
var isFirstDidAppear = true

function main() {
    var mainListData = [
        {
            title: "点击右上角新建工具",
            get rows() {
                return mainData.map(n => n.emoji + " " + n.name)
            }
        },
        {
            rows: [
                "其他"
            ]
        }
    ]

    $ui.render({
        props: {
            title: "日常",
            navButtons: [
                {
                    title: "新建",
                    handler: function() {
                        $ui.menu({
                            items: ["🍅番茄", "🔢计数器", "✅打卡"],//"⏰循环提醒"
                            handler: function(title, idx) {
                                if (idx == 0) {
                                    newTomatoTimer()
                                } else if (idx == 1) {
                                    newCounter()
                                } else if (idx == 2) {
                                    newCheck()
                                }
                            }
                        })
                    }
                }
            ]
        },
        views: [
            {
                type: "list",
                props: {
                    data: mainListData,
                    template: {
                        props: {
                            accessoryType: 1
                        }
                    },
                    actions: [
                        {
                            title: "delete",
                            handler: function(sender, indexPath) {
                                if (indexPath.section == 0) {
                                    const item = mainData[indexPath.row]
                                    if (item.type == TOOL_TYPE_NOTIFICATION) {
                                        $ui.toast("⚠️此项无法删除哦")
                                        sender.data = mainListData
                                        return
                                    }

                                    helper.arrayRemove(mainData, indexPath.row)
                                    dataManager.cacheMainData(mainData)
                                    sender.data = mainListData
                                } else {
                                    $ui.toast("⚠️此项无法删除哦")
                                    sender.data = mainListData
                                }
                            }
                        }
                    ],
                    reorder: true,
                    crossSections: false,
                    id: "main-list"
                },
                layout: $layout.fill,
                events: {
                    didSelect: function(sender, indexPath, data) {
                        if (indexPath.section == 0) {
                            let item = mainData[indexPath.row]
                            if (item.type == TOOL_TYPE_TOMATO) {
                                pushToTomatoTimer(item)
                            } else if (item.type == TOOL_TYPE_CHECK) {
                                pushToCheckDetail(item)
                            } else if (item.type == TOOL_TYPE_NOTIFICATION) {
                                pushToNotificationList(false)
                            } else if (item.type == TOOL_TYPE_COUNTER) {
                                pushToCounterDetail(item)
                            }
                        } else {
                            pushToOthers()
                        }
                    },
                    reorderMoved: function(fromIndexPath, toIndexPath) {
                        helper.arrayMove(mainData, fromIndexPath.row, toIndexPath.row)
                    },
                    reorderFinished: function(data) {
                        dataManager.cacheMainData(mainData)
                    }
                }
            }
        ],
        events: {
            didAppear: function () {
                if (isFirstDidAppear) {
                    isFirstDidAppear = false

                    routeToPageIfNeeded()
                } else {
                    reloadMainList()
                }
            }
        }
    })
    
    function reloadMainList() {
        dataManager.cacheMainData(mainData)
        $("main-list").data = mainListData
    }

    function routeToPageIfNeeded() {
        const json = $context.query.json

        if (json != undefined) {
            const item = JSON.parse(json)
    
            if (item.type == TOOL_TYPE_NOTIFICATION) {
                pushToNotificationList(true)
            } else {
                let coorItem = mainData.filter(n => n.id == item.id)[0]

                if (coorItem.type == TOOL_TYPE_TOMATO) {
                    pushToTomatoTimer(coorItem)
                } else if (coorItem.type == TOOL_TYPE_CHECK) {
                    pushToCheckDetail(coorItem)
                } else if (coorItem.type == TOOL_TYPE_COUNTER) {
                    pushToCounterDetail(coorItem)
                }
            }
        }
    }

    /// other
    function pushToOthers() {
        var otherList = require('scripts/other-list')
        otherList.push()
    }

    /// notification
    function pushToNotificationList(beginEditing) {
        var notificationList = require('scripts/notification-list')
        notificationList.push(beginEditing)
    }

    /// check
    function newCheck() {
        $input.text({
            placeholder: "打卡名称",
            handler: function(text) {
                if (text.length == 0) {
                    $ui.alert({
                        title: "提示",
                        message: "请输入名称哦",
                    })

                    return
                }

                check = {
                    id: new Date().getTime(),
                    name: text,
                    beginDate: new Date(),
                    endDate: new Date(),
                    state: 0, // 0 未打卡 1 已打卡
                    text: "时间到了！",
                    type: TOOL_TYPE_CHECK,
                    emoji: "✅"
                }
        
                mainData.splice(0, 0, check)
                reloadMainList()
                pushToCheckDetail(check)
            }
        })
    }

    function pushToCheckDetail(check) {
        const checkListData = [
            {
                title: "模拟的是弹性工作制，在开始时间之后打卡，会在结束时间上加上时间差时提醒。",
                rows: [
                    {
                        title: {
                            text: "名称"
                        },
                        value: {
                            get text() {
                                return check.name
                            }
                        }
                    },
                    {
                        title: {
                            text: "开始时间"
                        },
                        value: {
                            get text() {
                                return helper.hourAndMinText(check.beginDate)
                            }
                        }
                    },
                    {
                        title: {
                            text: "结束时间"
                        },
                        value: {
                            get text() {
                                return helper.hourAndMinText(check.endDate)
                            }
                        }
                    },
                    {
                        title: {
                            text: "提示语"
                        },
                        value: {
                            get text() {
                                return check.text
                            }
                        }
                    }
                ]
            }
        ]
    
        $ui.push({
            props: {
                title: "打卡"
            },
            views: [
                {
                    type: "list",
                    props: {
                        data: checkListData,
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
                                        make.top.equalTo(view.super).offset(8)
                                        make.left.inset(15)
                                    }
                                },
                                {
                                    type: "label",
                                    props: {
                                        id: "value",
                                        lines: 0
                                    },
                                    layout: function(make, view) {
                                        make.right.equalTo(view.super)
                                        make.left.greaterThanOrEqualTo(view.super).offset(80)
                                        make.top.equalTo(view.super).offset(8)
                                        make.bottom.equalTo(view.super).offset(-8)
                                    }
                                }
                            ]
                        },
                        rowHeight: -1,
                        estimatedRowHeight: 50
                    },
                    layout: $layout.fill,
                    events: {
                        didSelect: function(sender, indexPath, data) {
                            if (indexPath.row == 0) {
                                $input.text({
                                    placeholder: "名称",
                                    handler: function(text) {
                                        check.name = text
                                        sender.data = checkListData
                                    }
                                })
                            } else if (indexPath.row == 1) {
                                $picker.date({
                                    props: {
                                        mode: 0
                                    },
                                    handler: function(date) {
                                        check.beginDate = date
                                        sender.data = checkListData
                                    }
                                })
                            } else if (indexPath.row == 2) {
                                $picker.date({
                                    props: {
                                        mode: 0
                                    },
                                    handler: function(date) {
                                        check.endDate = date
                                        sender.data = checkListData
                                    }
                                })
                            } else if (indexPath.row == 3) {
                                $input.text({
                                    placeholder: "提示语",
                                    handler: function(text) {
                                        check.text = text
                                        sender.data = checkListData
                                    }
                                })
                            }
                        }
                    }
                }
            ]
        })
    }

    /// tomato
    function newTomatoTimer() {
        $input.text({
            placeholder: "番茄名称",
            handler: function(text) {
                if (text.length == 0) {
                    $ui.alert({
                        title: "提示",
                        message: "请输入名称哦",
                    })

                    return
                }

                tomatoTimer = {
                    id: new Date().getTime(),
                    name: text,
                    interval : 25,
                    beginDate: null,
                    state: 0, // 0 初始 1 开始 2 暂停
                    remainSeconds: 0,
                    text: "时间到了！",
                    type: TOOL_TYPE_TOMATO,
                    emoji: "🍅"
                }

                mainData.splice(0, 0, tomatoTimer)
                reloadMainList()
                pushToTomatoTimer(tomatoTimer)
            }
        })
    }

    function pushToTomatoTimer(tomatoTimer) {
        const tomatoTimerListData = [
            {
                title: {
                    text: "名称"
                },
                value: {
                    get text() {
                        return tomatoTimer.name
                    }
                }
            },
            {
                title: {
                    text: "持续时间"
                },
                value: {
                    get text() {
                        return tomatoTimer.interval + "分钟"
                    }
                }
            },
            {
                title: {
                    text: "提示语"
                },
                value: {
                    get text() {
                        return tomatoTimer.text
                    }
                }
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
                        data: tomatoTimerListData,
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
                                        make.top.equalTo(view.super).offset(8)
                                        make.left.inset(15)
                                    }
                                },
                                {
                                    type: "label",
                                    props: {
                                        id: "value",
                                        lines: 0
                                    },
                                    layout: function(make, view) {
                                        make.right.equalTo(view.super)
                                        make.left.greaterThanOrEqualTo(view.super).offset(80)
                                        make.top.equalTo(view.super).offset(8)
                                        make.bottom.equalTo(view.super).offset(-8)
                                    }
                                }
                            ]
                        },
                        rowHeight: -1,
                        estimatedRowHeight: 50
                    },
                    layout: $layout.fill,
                    events: {
                        didSelect: function(sender, indexPath, data) {
                            if (indexPath.row == 0) {
                                $input.text({
                                    placeholder: "名称",
                                    handler: function(text) {
                                        tomatoTimer.name = text
                                        sender.data = tomatoTimerListData
                                    }
                                })
                            } else if (indexPath.row == 1) {
                                $input.text({
                                    type: $kbType.number,
                                    placeholder: "持续时间",
                                    handler: function(text) {
                                        tomatoTimer.interval = parseInt(text)
                                        sender.data = tomatoTimerListData
                                    }
                                })
                            } else if (indexPath.row == 2) {
                                $input.text({
                                    placeholder: "提示语",
                                    handler: function(text) {
                                        tomatoTimer.text = text
                                        sender.data = tomatoTimerListData
                                    }
                                })
                            }
                        }
                    }
                }
            ]
        })
    }

    /// counter
    function newCounter() {
        $input.text({
            placeholder: "计数名称",
            handler: function(text) {
                if (text.length == 0) {
                    $ui.alert({
                        title: "提示",
                        message: "请输入名称哦",
                    })

                    return
                }

                counter = {
                    id: new Date().getTime(),
                    name: text,
                    count: 0,
                    type: TOOL_TYPE_COUNTER,
                    emoji: "🔢"
                }
        
                mainData.splice(0, 0, counter)
                reloadMainList()
                pushToCounterDetail(counter)
            }
        })
    }

    function pushToCounterDetail(counter) {
        const counterListData = [
            {
                title: {
                    text: "名称"
                },
                value: {
                    get text() {
                        return counter.name
                    }
                }
            }
        ]

        $ui.push({
            props: {
                title: "计数器"
            },
            views: [
                {
                    type: "list",
                    props: {
                        data: counterListData,
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
                                        make.top.equalTo(view.super).offset(8)
                                        make.left.inset(15)
                                    }
                                },
                                {
                                    type: "label",
                                    props: {
                                        id: "value",
                                        lines: 0
                                    },
                                    layout: function(make, view) {
                                        make.right.equalTo(view.super)
                                        make.left.greaterThanOrEqualTo(view.super).offset(80)
                                        make.top.equalTo(view.super).offset(8)
                                        make.bottom.equalTo(view.super).offset(-8)
                                    }
                                }
                            ]
                        },
                        rowHeight: -1,
                        estimatedRowHeight: 50
                    },
                    layout: $layout.fill,
                    events: {
                        didSelect: function(sender, indexPath, data) {
                            if (indexPath.row == 0) {
                                $input.text({
                                    placeholder: "名称",
                                    handler: function(text) {
                                        counter.name = text
                                        sender.data = counterListData
                                    }
                                })
                            }
                        }
                    }
                }
            ]
        })
    }
}

module.exports = {
  main: main
}