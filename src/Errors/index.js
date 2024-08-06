const CustomAPIError = require('./custom-api')
const UnauthenticatedError = require('./unauthenticated')
const NotFoundError = require('./not-found')
const BadRequestError = require('./bad-request')
const ForbiddenError = require('./ForbiddenError')

module.exports = {
  CustomAPIError,
  ForbiddenError,
  UnauthenticatedError,
  NotFoundError,
  BadRequestError,
}
