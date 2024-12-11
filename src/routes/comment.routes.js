import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"; // Importing all the comment-related controller functions
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Importing JWT verification middleware

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// Route to get all comments for a video (with pagination) and add a comment to a video
router.route("/:videoId")
    .get(getVideoComments)  // GET request to fetch comments for a video
    .post(addComment);  // POST request to add a new comment to a video

// Route to update or delete a specific comment
router.route("/c/:commentId")
    .patch(updateComment)  // PATCH request to update a specific comment
    .delete(deleteComment);  // DELETE request to remove a specific comment

export default router;
