const userSchema = require('../model/userModel');
const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.SALT_ROUNDS) || 10;


/* -------------------- VALIDATION HELPERS -------------------- */
const validateRegister = ({ name, email, password, confirmPassword }) => {
    const errors = {};
    if (!name) {
        errors.name = 'Name is required.';
    }else if (!/^[a-zA-Z ]{2,}$/.test(name.trim())){
        errors.name = "Please enter a valid name.";
    }

    if (!email) {
        errors.email = "Email is required.";
    } else if (/\s/.test(email)) {
        errors.email = "Email cannot contain spaces.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.email = "Please enter a valid email.";
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (/\s/.test(password)) {
        errors.password = "Password cannot contain spaces.";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};'"\\|,.<>\/?]).{4,}$/.test(password)) {
        errors.password = "Password must be at least 4 characters with uppercase, lowercase, number & symbol.";
    }

    if (!confirmPassword) {
        errors.confirmPassword = 'Confirm Password is required.';
    }else if (password !== confirmPassword){
        errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
};

const validateLogin = ({ email, password }) => {
    const errors = {};
    if (!email) {
        errors.email = "Email is required.";
    } else if (/\s/.test(email)) {
        errors.email = "Email cannot contain spaces.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (/\s/.test(password)) {
        errors.password = "Password cannot contain spaces.";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};'"\\|,.<>\/?]).{4,}$/.test(password)) {
        errors.password = "Password must be at least 4 characters with uppercase, lowercase, number & symbol.";
    }

    return errors;
};

/* -------------------- CONTROLLERS -------------------- */

// ✅ Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        const errors = validateRegister({ name, email, password, confirmPassword });

        if (Object.keys(errors).length > 0) {
            return res.render('user/register', { 
                errors, 
                old: req.body, 
                success: null, 
                error: null 
            });
        }

        const userName = await userSchema.findOne({ name });
        if (userName) {
            return res.render('user/register', { 
                errors: { name: 'Name already exists' }, 
                old: req.body, 
                success: null, 
                error: null 
            });
        }

        const userEmail = await userSchema.findOne({ email });
        if (userEmail) {
            return res.render('user/register', { 
                errors: { email: 'User already exists' }, 
                old: req.body, 
                success: null, 
                error: null 
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new userSchema({ name, email, password: hashedPassword });
        await newUser.save();

        req.flash('success', 'Registration successful! Please login.');
        return res.redirect('/user/login');
    } catch (error) {
        console.error('Error during registration:', error);
        res.render('user/register', { 
            errors: { general: 'Registration failed, please try again.' }, 
            old: req.body, 
            success: null, 
            error: null 
        });
    }
};

// ✅ Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = validateLogin({ email, password });

        if (Object.keys(errors).length > 0) {
            return res.render('user/login', { 
                errors, 
                old: req.body, 
                success: null, 
                error: null 
            });
        }

        const user = await userSchema.findOne({ email });
        if (!user) {
            return res.render('user/login', { 
                errors: { email: 'User not found' }, 
                old: req.body, 
                success: null, 
                error: null 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render('user/login', { 
                errors: { password: 'Invalid password' }, 
                old: req.body, 
                success: null, 
                error: null
            });
        }

        req.session.user = { id: user._id, name: user.name };
        res.redirect('/user/home');
    } catch (error) {
        console.error('Error during login:', error);
        res.render('user/login', { 
            errors: { general: 'Login failed, please try again.' }, 
            old: req.body, 
            success: null, 
            error: null 
        });
    }
};

// ✅ Logout User
const logout = (req, res) => {
    req.session.user = null;
    req.flash("success", "You have been logged out successfully.");
    res.redirect('/user/login');
};

// ✅ Load Register Page
const loadRegister = (req, res) => {
    res.render('user/register', { 
        errors: {}, 
        old: {}
    });
};

// ✅ Load Login Page
const loadLogin = (req, res) => {
    res.render('user/login', { 
        errors: {}, 
        old: {}
    });
};


// ✅ Load Home Page
const loadHome = (req, res) => {
    const name = req.session.user ? req.session.user.name : '';
    res.render('user/userHome', { name });
};

module.exports = {
    registerUser,
    loadRegister,
    loadLogin,
    login,
    loadHome,
    logout
};
