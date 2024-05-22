function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      message: err.message,
    });
  }
  return res.status(500).json({
    error: "Internal Server Error",
    errorMessage: err.message, // Send the error message for debugging (remove in production)
    errorName: err.name,
  });
}
module.exports = errorHandler;
