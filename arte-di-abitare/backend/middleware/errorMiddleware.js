const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Determine the status code. If the res already has a status code, use it.
    // Otherwise, it's a server error (500).
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    console.error(err.stack); // Log the full error stack for debugging

    res.json({
        message: err.message,
        // Only show the stack trace if we are not in production for security reasons
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };
