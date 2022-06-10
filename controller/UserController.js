const user = require('../models/user');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const {authSchema} = require('../helpers/validation_schema');
const createError = require('http-errors');
const Joi = require('@hapi/joi');
const config = require('../config/auth.config');
const nodemailer = require("../config/nodemailer.config");

dotenv.config();

// const register = async(req, resp) => {
//     //Validation
//     //const validate = authSchema.validate(req.body);
//     let value;
//     // try {
//     //     const value = await authSchema.validateAsync( req.body );

//     //     const doesExist = await user.findOne({ email: value.email});
//     //     if(doesExist){
//     //         message ('Email is already existed.');
//     //     }
//     try{
//         authSchema.validate({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password: req.body.password });
//         // -> { value: { username: 'abc', birth_year: 1994 } }

//         authSchema.validate({});

//     }catch(err){}
    
//         // await bcrypt.hash(req.body.password, 10, function(err, hash) {
//         //     if(err){
//         //         return resp.status(500).json({
//         //             message: "Password hash error", err
//         //         });
//         //     }
//         //     const email = value.email;
//         //     const userObject = new user({
//         //         firstName: value.firstName,
//         //         lastName: value.lastName,
//         //         email: value.email,
//         //         password: hash,
//         //     });

//         //     // Create token
//         //     const token = jwt.sign(
//         //         { user_id: user._id, email},
//         //         ""+process.env.TOKEN_KEY,
//         //         {
//         //         expiresIn: "2h",
//         //         }
//         //     );
//         //     // save user token
//         //     userObject.token = token;

//         //     userObject.save().then(result=>{
//         //         resp.status(200).json(userObject);
//         //     }).catch(error=>{
//         //         resp.status(500).json(error);
//         //     });
//         // });
//     // }catch (err) { 
//     //     if(err.isJoi === true){
//     //         err.status = 422
//     //     }
//     // }

// };

// const register = async(req, res) => {
//     try {
//         //const {firstName, lastName, email, password} = req.body;
//         //if( !email || !password ) throw createError.BadRequest()
//         try {
//             const result = await authSchema.validateAsync(req.body);
//             console.log(result);
//             const doesExist = await user.findOne({ email: result.email});
//             if(doesExist){
//                 throw createError.Conflict('Email is already registered');
//             }

//             const User = new user({ result });
//             const savedUser = await User.save();
//             res.send(savedUser);
//         } catch (error) {
            
//         }
   
       
//     } catch (error) {
        
//         next(error);
//     }
// }

const register = async(req, resp) => {
    //Validation
    registerUserValidator(req.body);
        //console.log(value);
    //Method I
    // try {
    //     const value = await authSchema.validateAsync( req.body );

    //     const doesExist = await user.findOne(req.body.email);
    //     console.log(doesExist);
    // }
    // catch (err) { 
    //     if(err.isJoi === true){
    //         err.status = 422
    //     }
    // }

    //Method II
    // function validate(req) {
    //     var schema = {
    //         firstName: Joi.string().alphanum().required(),
    //         lastName: Joi.string().alphanum().required(),
    //         email: Joi.string().min(3).required().email(),
    //         password: Joi.string().min(3).required()
    //     }
    //     return Joi.validate(req, schema)
    // }

    const token = jwt.sign({email: req.body.email}, config.secret);

    const userObject = new user({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token
    });

    userObject.save((err) => {
        if (err) {
            resp.status(500).send({ message: err });
            return;
        }
        resp.send({
            message:
                "User was registered successfully! Please check your email",
        });
     
        nodemailer.sendConfirmationEmail(
            userObject.firstName,
            userObject.email,
            userObject.confirmationCode
        );
    });


    // await bcrypt.hash(req.body.password, 10, function(err, hash) {
    //     if(err){
    //         return resp.status(500).json({
    //             error: err
    //         });
    //     }
    //     const email = req.email;
    //     const userObject = new user({
    //         firstName: req.body.firstName,
    //         lastName: req.body.lastName,
    //         email: req.body.email,
    //         password: hash,
    //     });

    //     // Create token
    //     const token = jwt.sign(
    //         { user_id: user._id, email},
    //         ""+process.env.TOKEN_KEY,
    //         {
    //         expiresIn: "2h",
    //         }
    //     );
    //     // save user token
    //     userObject.token = token;

    //     userObject.save().then(result=>{
    //         resp.status(200).json(userObject);
    //     }).catch(error=>{
    //         resp.status(500).json(error);
    //     });
    // });
};

const registerUserValidator = (event) => {
    //console.log(event);
    if (!event) console.log("400");
  
    const { firstName, lastName, email, password } = event;
    try {
        const { error } = authSchema.validate({
            firstName,
            lastName,
            email,
            password,
          });
        if(error){
            console.log(error.message);
        }
    } catch (error) {
        //console.log(error);
    }
    
  
    
};

const login = async(req, resp, next) => {
    user.findOne({email: req.body.email}).then(result=>{
        //console.log(result);

        if(!result){
            return resp.status(404).send({ message: "User Not found." });
        }

        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            result.password
        );
        //console.log(passwordIsValid);

        if (!passwordIsValid) {
            return resp.status(401).send({
              //accessToken: null,
              message: "Invalid Username or Password!",
            });
        }

        if (result.status != "Active") {
            return resp.status(401).send({
              message: "Pending Account. Please Verify Your Email!",
            });
        }

        var token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: 86400, // 24 hours
        });

        resp.status(200).redirect('/posts'
            // id: result._id,
            // firstName: result.firstName,
            // email: result.email,
            // accessToken: token,
            // status: result.status,
            // message: "Successfully login!"
        );

        // return resp.redirect("/posts");
        // next();
    }).catch(onerror=>{
        resp.status(500).json(onerror);
    });

    // user.findOne({email: req.body.email}).then(result=>{
    //     const email = req.email;
    //     if(result!=null){
    //         bcrypt.compare(req.body.password, result.password, function(err, finalOutput) {
    //             if(finalOutput == true){
    //                 const User = {
    //                     "email": result.email,
    //                     "name": result.firstName
    //                 }
    //                 // Create token
    //                 const token = jwt.sign(
    //                     { user_id: user._id, email },
    //                     ""+process.env.TOKEN_KEY,
    //                     {
    //                     expiresIn: "2h",
    //                     }
    //                 );

    //                 // save user token
    //                 User.token = token;

    //                 resp.status(200).json({message: "Success!", userData: User});
    //             }else{
    //                 resp.status(200).json({message: "User Email or Password are not Valid"});
    //             }
    //         });
    //     }else{
    //         resp.status(200).json({message: "Record Not Found!"});
    //     }
    // }).catch(onerror=>{
    //     resp.status(500).json(onerror);
    // })
};

const verifyUser = (req, res, next) => {
    user.findOne({
      confirmationCode: req.params.confirmationCode,
    })
      .then((user) => {
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }
  
        user.status = "Active";
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
        });
      })
      .catch((e) => console.log("error", e));
  };

module.exports={
    register,
    login,
    verifyUser
};