import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // Use promise-based FS API

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        await fs.unlink(localFilePath); // Clean up local file
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        await fs.unlink(localFilePath).catch((cleanupError) =>
            console.error("Failed to clean up file:", cleanupError)
        );
        return null;
    }
};

export { uploadOnCloudinary };
