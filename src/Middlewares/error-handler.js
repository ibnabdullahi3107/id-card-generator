const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, please try again later",
  };

  if (err.name === "SequelizeValidationError") {
    customError.msg = err.errors.map((error) => error.message).join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    customError.msg = `Duplicate value entered for ${
      Object.keys(err.fields)[0]
    } field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (
    err.name === "SequelizeDatabaseError" &&
    err.parent &&
    err.parent.code === "23503"
  ) {
    customError.msg = "Record is in use and cannot be deleted.";
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (
    err.name === "SequelizeDatabaseError" &&
    err.parent &&
    err.parent.code === "23505"
  ) {
    customError.msg = "Duplicate key value violates unique constraint.";
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  return res.status(customError.statusCode).json({ error: customError.msg });
};

module.exports = errorHandlerMiddleware;
