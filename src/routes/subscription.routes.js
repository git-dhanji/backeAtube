import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import mongoose from 'mongoose';

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// Route for subscribing and unsubscribing from a channel
router.route("/subscribe/:channelId")
    .get(async (req, res, next) => {
        const { channelId } = req.params;
        
        // Validate channelId
        if (!mongoose.isValidObjectId(channelId)) {
            return next(new ApiError(400, "Invalid channel ID"));
        }
        
        // Call the controller method to get subscribed channels
        await getSubscribedChannels(req, res, next);
    })
    .post(async (req, res, next) => {
        const { channelId } = req.params;

        // Validate channelId
        if (!mongoose.isValidObjectId(channelId)) {
            return next(new ApiError(400, "Invalid channel ID"));
        }
        
        // Toggle subscription logic in controller
        await toggleSubscription(req, res, next);
    });

// Route for fetching the subscribers of a specific channel
router.route("/subscribers/:channelId")
    .get(async (req, res, next) => {
        const { channelId } = req.params;

        // Validate channelId
        if (!mongoose.isValidObjectId(channelId)) {
            return next(new ApiError(400, "Invalid channel ID"));
        }

        // Call the controller method to get channel subscribers
        await getUserChannelSubscribers(req, res, next);
    });

// Route for getting the subscriptions of the current user
router.route("/subscriptions")
    .get(getSubscribedChannels);

export default router;
