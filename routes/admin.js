const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const adminAuth = require('../middleware/adminAuth')

router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminController.login)
router.get('/dashboard', adminAuth.checkAuth, adminController.loadDashboard)
router.get('/logout', adminAuth.checkAuth, adminController.logout)
router.post('/dashboard', adminAuth.checkAuth, adminController.addUser)
router.get('/add', adminAuth.checkAuth, adminController.loadDashboard)
router.post('/edit/:id', adminAuth.checkAuth, adminController.editUser)
router.get('/edit/:id', adminAuth.checkAuth, adminController.loadDashboard)
router.delete('/delete/:id', adminAuth.checkAuth, adminController.deleteUser)
router.get('/search', adminAuth.checkAuth, adminController.searchUser)


module.exports = router