const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
};
