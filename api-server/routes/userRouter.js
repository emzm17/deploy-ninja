const express = require('express');
const {signup,signin,createproject} = require('../controller/userController');
const auth = require('../auth/auth')




const userRouter = express.Router();


userRouter.post('/signup',signup);
userRouter.post('/signin',signin);
userRouter.post('/:userId/project',auth,createproject);
module.exports=userRouter;