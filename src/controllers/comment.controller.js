import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check for valid video ID
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
    };

    try {
        // Aggregation pipeline to fetch comments
        const pipeline = [
            { $match: { video: mongoose.Types.ObjectId(videoId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            { $unwind: "$ownerDetails" },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    "ownerDetails.username": 1,
                    "ownerDetails.avatar": 1,
                },
            },
        ];

        const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

        // If no comments found, respond with an empty list
        if (!comments || comments.length === 0) {
            return res.json(new ApiResponse(200, [], "No comments found"));
        }

        return res.json(new ApiResponse(200, comments, "Comments fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Error fetching comments");
    }
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate video ID and content
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    try {
        // Create a new comment and populate the owner field with username and avatar
        const newComment = await Comment.create({
            content,
            video: videoId,
            owner: userId,
        });

        const populatedComment = await newComment.populate("owner", "username avatar");

        return res.status(201).json(new ApiResponse(201, populatedComment, "Comment added successfully"));
    } catch (error) {
        throw new ApiError(500, "Error adding comment");
    }
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate comment ID and check if content is provided
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    try {
        const comment = await Comment.findById(commentId);

        // Check if the comment exists
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        // Check if the current user is the owner of the comment
        if (!comment.owner.equals(userId)) {
            throw new ApiError(403, "You are not authorized to update this comment");
        }

        // Validate content
        if (!content || content.trim() === "") {
            throw new ApiError(400, "Comment content cannot be empty");
        }

        // Update the comment content
        comment.content = content;
        await comment.save();

        return res.json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error updating comment");
    }
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Validate comment ID
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    try {
        const comment = await Comment.findById(commentId);

        // Check if the comment exists
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        // Check if the current user is the owner of the comment
        if (!comment.owner.equals(userId)) {
            throw new ApiError(403, "You are not authorized to delete this comment");
        }

        // Remove the comment
        await comment.remove();

        return res.json(new ApiResponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        throw new ApiError(500, "Error deleting comment");
    }
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};
