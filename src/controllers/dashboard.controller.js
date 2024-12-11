import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Query to fetch videos, sorted by latest
    const videos = await Video.find({ channel: channelId }).sort({ createdAt: -1 }).exec();

    if (!videos || videos.length === 0) {
        return res.json(new ApiResponse(200, [], "No videos found for this channel"));
    }

    return res.json(new ApiResponse(200, videos, "Videos fetched successfully"));
});


// Get analytics for a channel (total videos, total likes, total subscribers)
const getChannelAnalytics = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        // Aggregation pipeline to fetch video, like, and subscription counts efficiently
        const analytics = await Video.aggregate([
            { $match: { channel: mongoose.Types.ObjectId(channelId) } },
            {
                $facet: {
                    totalVideos: [{ $count: "count" }],
                    totalLikes: [
                        {
                            $lookup: {
                                from: "likes",
                                localField: "_id",
                                foreignField: "video",
                                as: "likes"
                            }
                        },
                        { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: null, totalLikes: { $sum: 1 } } },
                    ],
                    totalSubscribers: [
                        { $lookup: { from: "subscriptions", localField: "channel", foreignField: "channel", as: "subscriptions" } },
                        { $unwind: { path: "$subscriptions", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: null, totalSubscribers: { $sum: 1 } } },
                    ],
                }
            },
            {
                $project: {
                    totalVideos: { $arrayElemAt: ["$totalVideos.count", 0] },
                    totalLikes: { $arrayElemAt: ["$totalLikes.totalLikes", 0] },
                    totalSubscribers: { $arrayElemAt: ["$totalSubscribers.totalSubscribers", 0] },
                }
            }
        ]);

        // If analytics data doesn't exist, set them to 0
        const data = analytics[0] || { totalVideos: 0, totalLikes: 0, totalSubscribers: 0 };

        return res.json(new ApiResponse(200, data, "Channel analytics fetched successfully"));
    } catch (error) {
        Console.error("Error fetching channel analytics: ", error);
        throw new ApiError(500, "Error fetching channel analytics");
    }
});


// Get all videos liked by a user
const getLikedVideosForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
            .populate("video", "title description thumbnailUrl")
            .exec();

        return res.json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
    } catch (error) {
        Console.error("Error fetching liked videos for user: ", error);
        throw new ApiError(500, "Error fetching liked videos");
    }
});


// Get all subscriptions for a user
const getUserSubscriptions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const subscriptions = await Subscription.find({ subscriber: userId })
            .populate("channel", "username fullName avatar")
            .exec();

        return res.json(new ApiResponse(200, subscriptions, "User subscriptions fetched successfully"));
    } catch (error) {
        Console.error("Error fetching user subscriptions: ", error);
        throw new ApiError(500, "Error fetching subscriptions");
    }
});

export {
    getChannelVideos,
    getChannelAnalytics,
    getLikedVideosForUser,
    getUserSubscriptions,
};
