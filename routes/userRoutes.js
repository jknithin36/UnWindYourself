const express = require('express');

const userController = require('../controllers/userController');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
//NO AUTH FOR UPPER ROUTES

///**********############# */
router.use(authController.protect);
//THIS MIDDLE WARE WORKS FOE NEXT ALL ROUTES

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
//ONLY FOR ADMIN
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllusers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
