// server.js (top)
require('dotenv').config(); // MUST be first, so process.env is available to all modules

const express = require('express');
const app = express();
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const path = require('path');
const connectDb = require('./db/connectDb');
const session = require('express-session');
const nocache = require('nocache');
const flash = require('connect-flash');

// Use env vars with safe defaults
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';

//--------Session , Cookies , flash & Cache Setup----------------
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: Number(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60 * 24
    }
}));
app.use(flash());
app.use(nocache());

// make flash available in all views (optional but convenient)
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

//--------View Engine Setup----------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

//--------Body Parser Setup----------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//--------Routes Setup----------------
app.use('/user', userRouter);
app.use('/admin', adminRouter);

app.get('/', (req, res) => {
    res.redirect('/user/login');
});

//--------Server & Database Connection----------------
connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server Started on port: ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect DB, server not started:', err);
    process.exit(1);
});
