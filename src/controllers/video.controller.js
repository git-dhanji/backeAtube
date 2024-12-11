import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos with optional filters, pagination, and sorting
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = -1, userId } = req.query;

    const filters = {};
    if (query) {
        filters.title = { $regex: query, $options: "i" };
    }
    if (userId && isValidObjectId(userId)) {
        filters.owner = userId;
    }

    const sortOptions = { [sortBy]: parseInt(sortType) };

    const videos = await Video.aggregate([
        { $match: filters },
        { $sort: sortOptions },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } }
                ]
            }
        },
        { $unwind: "$ownerDetails" }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// Publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration } = req.body;
    const { user } = req;

    if (!title || !description || !duration) {
        throw new ApiError(400, "Title, description, and duration are required");
    }

    if (!req.files?.videoFile?.path || !req.files?.thumbnail?.path) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(req.files.videoFile.path);
    const thumbnail = await uploadOnCloudinary(req.files.thumbnail.path);

    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Error uploading files to Cloudinary");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner: user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

// Get a single video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username avatar fullName");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;

    if (req.files?.thumbnail?.path) {
        const thumbnail = await uploadOnCloudinary(req.files.thumbnail.path);
        if (!thumbnail?.url) {
            throw new ApiError(500, "Error uploading thumbnail");
        }
        updates.thumbnail = thumbnail.url;
    }

    const video = await Video.findByIdAndUpdate(videoId, { $set: updates }, { new: true });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // TODO: Delete files from Cloudinary here

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video publish status updated"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
