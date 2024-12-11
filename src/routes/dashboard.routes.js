import { Router } from 'express';
import {
    getChannelVideos,
    getChannelAnalytics,
    getLikedVideosForUser,
    getUserSubscriptions
} from "../controllers/dashboard.controller.js"; // Updated to reflect all controller imports
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// Route to get all videos uploaded by a channel
router.route("/channel/:channelId/videos").get(getChannelVideos);

// Route to get channel analytics (total videos, likes, subscribers)
router.route("/channel/:channelId/analytics").get(getChannelAnalytics);

// Route to get all videos liked by the authenticated user
router.route("/user/liked-videos").get(getLikedVideosForUser);

// Route to get all subscriptions for the authenticated user
router.route("/user/subscriptions").get(getUserSubscriptions);

export default router;
