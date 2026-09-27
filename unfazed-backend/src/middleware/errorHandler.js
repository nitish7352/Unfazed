/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    message    = `Resource not found with id: ${err.value}`;
    statusCode = 404;
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message    = `Duplicate value for field: ${field}`;
    statusCode = 400;
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { message = 'Invalid token';          statusCode = 401; }
  if (err.name === 'TokenExpiredError')  { message = 'Token expired';          statusCode = 401; }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') { message = 'File size too large';     statusCode = 400; }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
