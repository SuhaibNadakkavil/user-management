const adminModel = require('../model/adminModel');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const userModel = require('../model/userModel');

const loadLogin = async (req, res) => {
    res.render('admin/login', { errors: {}, old: {} });
}

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

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = validateLogin({ email, password });

        if (Object.keys(errors).length > 0) {
            return res.render('admin/login', { errors, old: req.body});
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.render('admin/login', { errors: { email: 'Admin not found' }, old: req.body});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.render('admin/login', { errors: { password: 'Invalid password' }, old: req.body});
        }

        req.session.admin = { id: admin._id, email: admin.email };
        res.redirect('/admin/dashboard');
    }
    catch (error) {
        res.render('admin/login', { errors: { general: 'Login failed, please try again.' }, old: req.body});
        console.error('Error during admin login:', error);
    }
}

const loadDashboard = async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) return res.redirect('/admin/login');

        const users = await userModel.find({});

        res.render('admin/dashboard', { users, errors: {}, errors2: {}, oldAdd: {}, oldEdit: {}});
    }
    catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.render('admin/dashboard', {
            users: [],
            errors: {},
            errors2: {},
            oldAdd: {},
            oldEdit: {},
            message: 'Failed to load dashboard, please try again.'
        });
    }
}

const logout = (req, res) => {
    req.session.admin = null;
    res.redirect('/admin/login');
}

const addUserValidation = ({ name, email, password }) => {
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
    return errors;
};

const addUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const errors = addUserValidation({ name, email, password });

        if (Object.keys(errors).length > 0) {
            const users = await userModel.find();
            return res.render('admin/dashboard', { users, errors, errors2: {}, oldAdd: req.body, oldEdit: {} });
        }

        const existingName = await userModel.findOne({ name });
        if (existingName) {
            const users = await userModel.find();
            return res.render('admin/dashboard', {
                users,
                errors: { name: 'Name already exists' },
                errors2: {},
                oldAdd: req.body,
                oldEdit: {}
            });
        }

        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            const users = await userModel.find();
            return res.render('admin/dashboard', {
                users,
                errors: { email: 'Email already exists' },
                old: req.body,
                oldEdit: {},
                success: ''
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await userModel.create({ name, email, password: hashedPassword });

        const users = await userModel.find();

        req.flash("success", "User added successfully.");
        res.redirect("/admin/dashboard");
    } catch (error) {
        req.flash("error", "Failed to add user, please try again.");
        res.redirect("/admin/dashboard");
    }
}

const editUserValidation = ({ name, email, password }) => {
    const errors2 = {};
    if (!name) {
        errors2.name = 'Name is required.';
    }else if (!/^[a-zA-Z ]{2,}$/.test(name.trim())){
        errors2.name = "Please enter a valid name.";
    }

    if (!email) {
        errors2.email = "Email is required.";
    } else if (/\s/.test(email)) {
        errors2.email = "Email cannot contain spaces.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors2.email = "Please enter a valid email.";
    }

    if (password && password.length > 0) {
        if (/\s/.test(password)) {
            errors2.password = "Password cannot contain spaces.";
        } else if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};'"\\|,.<>\/?]).{4,}$/.test(password)
        ) {
            errors2.password =
                "Password must be at least 4 characters with uppercase, lowercase, number & symbol.";
        }
    }
    return errors2;
};

const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const errors2 = editUserValidation({ name, email, password });

        if (Object.keys(errors2).length > 0) {
            const users = await userModel.find();
            return res.render('admin/dashboard', { users, errors: {}, errors2, oldAdd: {}, oldEdit: { ...req.body, _id: id } });
        }


        const existingName = await userModel.findOne({ name, _id: { $ne: id } });
        if (existingName) {
            const users = await userModel.find();
            return res.render('admin/dashboard', {
                users,
                errors: {},
                errors2: { name: 'Name already exists' },
                oldAdd: {},
                oldEdit: { ...req.body, _id: id }
            });
        }


        const existingEmail = await userModel.findOne({ email, _id: { $ne: id } });
        if (existingEmail) {
            const users = await userModel.find();
            return res.render('admin/dashboard', {
                users,
                errors: {},
                errors2: { email: 'Email already exists' },
                oldAdd: {},
                oldEdit: { ...req.body, _id: id }
            });
        }

        const user = await userModel.findById(id);
        if (!user) {
            const users = await userModel.find();
      req.flash("error", "User not found.");
      return res.redirect("/admin/dashboard");
        }

        user.name = name;
        user.email = email;
        if (password) {
            user.password = await bcrypt.hash(password, saltRounds);
        }
        await user.save();

        const users = await userModel.find();
    req.flash("success", "User updated successfully.");
    res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Error updating user:", error);
        req.flash("error", "Failed to update user, please try again.");
        res.redirect("/admin/dashboard");
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await userModel.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: "Error deleting user" });
    }
};

const searchUser = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === "") {
            return res.redirect('/admin/dashboard');
        }
        const pattern = q.split('').join('.*');

        const users = await userModel.find({
            name: { $regex: pattern, $options: 'i' } 
        });
        res.render('admin/dashboard', { users, errors: {}, errors2: {}, oldAdd: {}, oldEdit: {}});
    } catch (error) {
        console.error('Error searching users:', error);
        res.render('admin/dashboard', { users: [], errors: { general: 'Search failed, please try again.' }, errors2: {}, oldAdd: {}, oldEdit: {}});
    }
};


module.exports = {
    loadLogin,
    login,
    loadDashboard,
    logout,
    addUser,
    editUser,
    deleteUser,
    searchUser

};