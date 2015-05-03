/**
 * Namespace to house all built-in validators.
 */
var Validators = module.exports = {
    request: require('./requestValidators'),
    response: require('./responseValidators')
};

/** All request validators, to be executed in order */
Validators.requestValidators = [
    Validators.request.methodGetOrHead,
    Validators.request.noCache,
    Validators.request.noStore,
    Validators.request.maxAgeZero
];

/** All response validators, to be executed in order */
Validators.responseValidators = [
    Validators.response.statusCodes,
    Validators.response.onlyPrivate,
    Validators.response.noStore,
    Validators.response.maxAgeZero,
    Validators.response.varyAsterisk,
    Validators.response.maxAgeFuture,
    Validators.response.lastModified,
    Validators.response.eTag
];
