import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Helper function to toggle like on a resource (e.g., video, comment)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} resourceType - Type of resource ('video' or 'comment')
 */
const toggleLikeOnResource = asyncHandler(async (req, res, resourceType) => {
    const { resourceId } = req.params;
    const userId = req.user._id;

    // Validate resourceId
    if (!mongoose.isValidObjectId(resourceId)) {
        throw new ApiError(400, `Invalid ${resourceType} ID`);
    }

    // Fetch resource to ensure it exists
    const resourceModel = resourceType === "video" ? "Video" : resourceType === "comment" ? "Comment" : null;
    if (!resourceModel) {
        throw new ApiError(400, "Unsupported resource type");
    }
    const resource = await mongoose.model(resourceModel).findById(resourceId);
    if (!resource) {
        throw new ApiError(404, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`);
    }

    // Check if like already exists
    const existingLike = await Like.findOne({ [resourceType]: resourceId, likedBy: userId });

    if (existingLike) {
        // Unlike the resource if already liked
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200, null, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} unliked successfully`));
    }

    // Like the resource
    const newLike = await Like.create({ [resourceType]: resourceId, likedBy: userId });
    return res.json(new ApiResponse(201, newLike, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} liked successfully`));
});

/**
 * Controller to toggle like on a video
 */
const toggleVideoLike = (req, res) => toggleLikeOnResource(req, res, "video");

/**
 * Controller to toggle like on a comment
 */
const toggleCommentLike = (req, res) => toggleLikeOnResource(req, res, "comment");

/**
 * Get all videos liked by the authenticated user
 */
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
        .populate("video", "title description thumbnailUrl createdAt")
        .exec();

    return res.json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

/**
 * Get all comments liked by the authenticated user
 */
const getLikedComments = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedComments = await Like.find({ likedBy: userId, comment: { $exists: true } })
        .populate("comment", "text createdAt")
        .exec();

    return res.json(new ApiResponse(200, likedComments, "Liked comments fetched successfully"));
});

// Exporting controllers
export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
    getLikedComments,
};
