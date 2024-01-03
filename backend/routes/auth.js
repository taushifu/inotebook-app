const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = process.env.JWT_SECRET;


//ROUTE 1: To create new user
router.post('/createuser', [
    check('name', 'name must not be empty').notEmpty(),
    check('email').isEmail(),
    check('password', 'password must be atleast 5 characters').isLength({ min: 5 })
],
    async (req, res) => {
        const errors = validationResult(req);

        //if error is there, return bad request.
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            //check whether a user with given email exists
            const user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            //hashing plaintext password
            const hashedPass = await bcrypt.hash(req.body.password, 10);

            //if no user exists, create a new one
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPass
            });
            await newUser.save();

            //sending JWT to the user for authentication purposes
            const data = {
                newUser: {
                    id: newUser.id
                }
            }
            const authToken = jwt.sign(data, JWT_SECRET);
            res.json({ authToken });
        }

        catch (err) {
            console.error('Error saving user:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


//ROUTE 2: To login existing user
router.post('/login', [
    check('email', 'Enter a valid email.').isEmail()
],
    async (req, res) => {

        //validating user input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            //check if a user with the given email exists
            const { email, password } = req.body; //destructing req body
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: 'Incorrect credentials' });
            }

            //check if the given password matches with the stored password
            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(400).json({ error: 'Incorrect credentials' })
            }

            //if correct credentials, send the JWT to the user
            const data = {
                user: {
                    id: user.id
                }
            }

            const authToken = jwt.sign(data, JWT_SECRET);
            res.json({ authToken });

        } catch (err) {
            console.error('Error saving user:', err);
            res.status(500).json({ error: 'Internal server error' });
        }

    });


//ROUTE 3: To get user information from the received JWT token
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        res.send(user);
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;