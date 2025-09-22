const userSchema = require("../model/userModel");

const checkAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect("/user/login");
        }

        const user = await userSchema.findById(req.session.user.id);

        if (!user) {
            req.session.user = null;
            req.flash("error", "Your account was deleted. Please register again.");
            return res.redirect("/user/login");
        } else {
            next();
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        req.session.user = null;
        req.flash("error", "Something went wrong, please login again.");
        return res.redirect("/user/login");
    }
};

const isLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/user/home");
    }
    next();
};

module.exports = {
    checkAuth,
    isLogin
};
