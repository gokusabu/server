const express = require('express')
require('dotenv').config()
const verifyUser = require('../middleware/verifyUser')
const reviewModel = require('../models/reviewModel')

const reviewRouter = express.Router(); // Change from express() to express.Router()

reviewRouter.post('/:userID/:productID', async (req, res) => {
    try {
        const productID = req.params.productID;
        const userID = req.params.userID;
        const comment = req.body.comment;
        const rating = req.body.rating;

        // Check if the rating is provided
        if (!rating) {
            return res.status(400).json({ error: 'Please provide a rating.' });
        }

        // Check if the user has already posted a review for this product
        let existingReview = await reviewModel.findOne({ user: userID, product: productID });

        if (existingReview) {
            // Update existing review
            existingReview.comment = comment;
            existingReview.rating = rating;
            await existingReview.save();
            return res.status(200).json({ message: 'Review updated!!' });
        } else {
            // Create new review
            const newReview = new reviewModel({
                user: userID,
                product: productID,
                comment: comment,
                rating: rating
            });
            await newReview.save();
            return res.status(201).json({ message: 'Review added!!' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

reviewRouter.get('/:productID',async(req,res)=>{
    const productID = req.params.productID
    try{
        const review = await reviewModel.find({product:productID}).populate('user', 'username')
        res.json({review})
    }
    catch(err){
        return res.status(500).json({ error: err.message });
    }
})

reviewRouter.delete('/:userID/:productID', async (req, res) => {
    try {
        const productID = req.params.productID;
        const userID = req.params.userID;

    
         await reviewModel.findOneAndDelete({ user: userID, product: productID });

        
       
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


module.exports = reviewRouter;