export const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            console.error("Unhandled error in asyncHandler:", err); // Optional: Log unhandled errors
            next(err);
        });
    };
};
