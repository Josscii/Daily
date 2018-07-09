
const PENDINGNOTIFICATIONIDS_CACHE_KEY = "pendingNotificationIds"

var pendingNotificationIds = getPendingNotificationIds() || []

function getPendingNotificationIds() {
    return $cache.get(PENDINGNOTIFICATIONIDS_CACHE_KEY)
}

function cachePendingNotificationIds() {
    $cache.set(PENDINGNOTIFICATIONIDS_CACHE_KEY, pendingNotificationIds)
}

function removePendingsNotificaionIds() {
    $cache.remove(PENDINGNOTIFICATIONIDS_CACHE_KEY)
}

function scheduleEventNotification(date, text, id) {
    $push.schedule({
        title: "通知",
        body: text,
        date: date,
        handler: function(result) {
            const pendingId = `${id}-${result.id}`
            pendingNotificationIds.push(pendingId)
        }
    })
}

function scheduleDelayNotification(beginDate, delay, title, body, id) {
    const date = new Date(beginDate.getTime() + delay * 1000)
    $push.schedule({
        title: title,
        body: body,
        date: date,
        handler: function(result) {
            const pendingId = `${id}-${result.id}`
            pendingNotificationIds.push(pendingId)
        }
    })
}

function scheduleCheckNotification(item) {
    const interval = new Date().getTime() - item.beginDate.getTime()
    const date = new Date(item.endDate.getTime() + interval)
    $push.schedule({
        title: item.name,
        body: item.text,
        date: date,
        handler: function(result) {
            const pendingId = `${item.id}-${result.id}`
            pendingNotificationIds.push(pendingId)
        }
    })
}

function cancelNotifications(id) {
    pendingNotificationIds.forEach(pendingId => {
        if (pendingId.includes(id)) {
            const searchText = `${id}-`
            const realId = pendingId.replace(searchText, '')
            $push.cancel({id: realId})
        }
    })
}

module.exports = {
    scheduleEventNotification: scheduleEventNotification,
    scheduleDelayNotification: scheduleDelayNotification,
    cachePendingNotificationIds: cachePendingNotificationIds,
    scheduleCheckNotification: scheduleCheckNotification,
    cancelNotifications: cancelNotifications,
    removePendingsNotificaionIds: removePendingsNotificaionIds
}