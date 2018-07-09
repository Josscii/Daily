const TOOL_TYPE_NOTIFICATION = 3;
const TOOL_TYPE_CHECK = 4;
const MAIN_DATA_CACHE_KEY = "main-data"
const WIDGET_DATA_SHOULD_RELOAD_CACHE_KEY = "widget-data-should-reload"

function init() {
    let mainData = getCachedMainData()

    // 默认一定有通知
    if (mainData.filter(n => n.type == TOOL_TYPE_NOTIFICATION).length == 0) {
        mainData.push({
            name: "通知",
            type: TOOL_TYPE_NOTIFICATION,
            emoji: "📥"
        })
        cacheMainData(mainData)
    }

    // 重新把打卡的时间调整为今天
    mainData.forEach(n => {
        if (n.type == TOOL_TYPE_CHECK) {
            n.beginDate.setDate(new Date().getDate())
            n.endDate.setDate(new Date().getDate())
        }
    })
    
    cacheMainData(mainData)
}

function cacheMainData(mainData) {
    $cache.set(MAIN_DATA_CACHE_KEY, mainData)
    if ($app.env != $env.today) {//在主 app 保存数据的时候就标志 today 的数据需要刷新
        cacheWidgetDataShouldReload()
    }
}

function getCachedMainData() {
    return $cache.get(MAIN_DATA_CACHE_KEY) || []
}

function getWidgetDataShouldReload() {
    const shouldReload = $cache.get(WIDGET_DATA_SHOULD_RELOAD_CACHE_KEY)
    if (shouldReload) {
        $cache.remove(WIDGET_DATA_SHOULD_RELOAD_CACHE_KEY)
    }
    return shouldReload
}

function cacheWidgetDataShouldReload() {
    $cache.set(WIDGET_DATA_SHOULD_RELOAD_CACHE_KEY, 1)
}

module.exports = {
    init: init,
    getCachedMainData: getCachedMainData,
    cacheMainData: cacheMainData,
    getWidgetDataShouldReload: getWidgetDataShouldReload
}