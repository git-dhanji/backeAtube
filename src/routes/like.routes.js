import { Router } from "express";
import {
  toggleVideoLike,
  toggleCommentLike,
  getLikedVideos,
  getLikedComments,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

/**
 * Routes for toggling likes
 */
router.post("/toggle/video/:videoId", toggleVideoLike); // Like/unlike a video
router.post("/toggle/comment/:commentId", toggleCommentLike); // Like/unlike a comment

/**
 * Routes for fetching liked resources
 */
router.get("/videos", getLikedVideos); // Get all liked videos of the authenticated user
router.get("/comments", getLikedComments); // Get all liked comments of the authenticated user

export default router;
