const express = require('express');
const multer = require('multer');

const Post = require('../models/post');

const router = express.Router();

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error('Invalid mime type');
        if (isValid) {
            error = null;
        }
        cb(error, '../backend/images');
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

router.post('', multer({storage: storage}).single("image"), (req, res, next) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        imagePath: req.protocol + '://' + req.get('host') + '/images/' + req.file.filename
    });
    post.save().then(createdPost => {
        res.status(201).json({
            message: 'Post added successfully',
            post: {
                ...createdPost,
                id: createdPost._id
            }
        });
    });
});

router.put('/:id', multer({storage: storage}).single("image"), (req, res, next) => {
    let imagePath = req.body.imagePath;
    console.log(req.body);
    if (req.file) {
        const url = req.protocol + '://' + req.get('host');
        imagePath = url + '/images/' + req.file.filename;
        console.log("backend: " + imagePath);
    }

    Post.updateOne({_id: req.params.id}, { $set: {
        id: req.body.id,    
        title: req.body.title,
        content: req.body.content,
        imagePath: imagePath
    }}).then(result => {
        res.status(200).json({
            message: 'Update successful!'
        });
    });
});

router.get('', (req, res, next) => {
    Post.find().then(documents => {
        res.status(200).json({
            message: 'Posts fetched successfully!',
            posts: documents
        });
    });
});

router.get('/:postId', (req, res, next) => {
    Post.findById(req.params.postId).then((post) => {
        if (post) {
            res.status(200).json(post)
        } else{
            res.status(404).json({
                message: "Post not found!"
            })
        }
    })
})

// dynamic path segment :id
router.delete('/:id', (req, res, next) => {
    Post.deleteOne({_id: req.params.id}).then(result => {
        console.log(result);
        res.status(200).json({
            message: 'Post deleted!'
        });
    });
});

module.exports = router;