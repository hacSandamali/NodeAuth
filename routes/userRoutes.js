const express = require('express');

const UserController = require('../controller/UserController');

const router = express.Router();

router.post('/signup',UserController.register);
router.get('/login',UserController.login);

router.get("/confirm/:confirmationCode", UserController.verifyUser)

module.exports=router;