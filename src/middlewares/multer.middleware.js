import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // Ensure this path exists or handle errors appropriately
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileExt = path.extname(file.originalname); // Get the file extension
        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
    },
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 80 * 1024 * 1024, // Limit file size to 80 MB
    },
    fileFilter: (req, file, cb) => {
        // Optional: filter allowed file types
        const allowedMimeTypes = ["image/jpeg", "image/png", "video/mp4"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"), false);
        }
    },
});
