const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Post Model
const Post = require('../../models/Post');

// Profile Model
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({
    msg: 'Posts Works'
}));

// @route   GET api/posts
// @desc    Get Posts
// @access  Public
router.get('/', (req, res) => {
    Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }));
});

// @route   GET api/posts/:id
// @desc    Get post for a user
// @access  Public
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopostfound: 'No posts found for given ID' }));
});

// @route   POST api/posts
// @desc    Create Post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if(!isValid) {
        return res.status(400).json(errors);
    }
    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    }); 

    newPost.save().then(post => res.json(post));
});

// @route   POST api/posts/:id
// @desc    Delete Post
// @access  Private
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
    .then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            if(post.user.toString() !== req.user.id) {
                res.status(401).json({ notauthorized: 'User not authorized' });
            }
            // Delete post
            Post.remove().then(() => res.json({success: true}));
        });
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

// @route   POST api/posts/like/:id
// @desc    Like Post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
    .then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).json({ alreadyliked: 'User already liked this post' });
            }
            // Add user to likes array
            post.likes.unshift({ user: req.user.id });

            // Save
            post.save().then(post => res.json(post));
        });
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

// @route   POST api/posts/unlike/:id
// @desc    Unlike Post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
    .then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                return res.status(400).json({ notliked: 'You have not yet liked this post' });
            }
            // Get Remove Index
            const removeIndex = post.likes.findIndex(like => like.user.toString() === req.user.id);
            post.likes.splice(removeIndex, 1);  
            
            // Save
            post.save().then(post => res.json(post));
        });
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

module.exports = router;
