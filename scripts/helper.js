function minAndSecText(seconds) {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60

    return min + ":" + (sec < 10 ? '0' : '') + sec
}

function hourAndMinText(date) {
    const hour = date.getHours()
    const min = date.getMinutes()

    return hour + ":" + (min < 10 ? '0' : '') + min
}

function arrayMove(array, oldIndex, newIndex) {
    if (newIndex >= array.length) {
      var k = newIndex - array.length + 1;
      while (k--) {
        array.push(undefined);
      }
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
}

function arrayRemove(array, index) {
    array.splice(index, 1);
}

module.exports = {
    minAndSecText: minAndSecText,
    hourAndMinText: hourAndMinText,
    arrayMove: arrayMove,
    arrayRemove: arrayRemove
}