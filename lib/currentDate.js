var getCurrentDate = exports.getCurrentDate = function () {
    return Date.now();
};

exports.getCurrentDateSeconds = function () {
    return getCurrentDate() / 1000;
};
