import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controller to toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // The channel to be subscribed/unsubscribed
    const userId = req.user._id; // Extract the current user's ID from req.user (assuming authentication middleware)

    // Check if the user is authenticated
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    // Validate channel ID
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (existingSubscription) {
        // Unsubscribe the user if already subscribed
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
    }

    // Subscribe the user
    await Subscription.create({
        subscriber: userId,
        channel: channelId,
    });

    res.status(201).json(new ApiResponse(201, null, "Subscribed successfully"));
});

// Controller to get the subscriber list for a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channel ID
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Fetch subscribers
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username fullName avatar")
        .exec();

    if (!subscribers.length) {
        return res.status(200).json(new ApiResponse(200, [], "No subscribers found"));
    }

    res.status(200).json(
        new ApiResponse(200, subscribers, "Fetched channel subscribers successfully")
    );
});

// Controller to get the list of channels a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriber ID
    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    // Check if the subscriber exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    // Fetch subscribed channels
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username fullName avatar")
        .exec();

    if (!subscriptions.length) {
        return res.status(200).json(new ApiResponse(200, [], "No channels subscribed"));
    }

    res.status(200).json(
        new ApiResponse(200, subscriptions, "Fetched subscribed channels successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
