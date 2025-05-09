const express = require('express');
const {protect} = require('../middlewares/auth.middleware');
const {authorizeRoles} = require('../middlewares/role.middleware');
const { createDepartment, updateDepartment, deleteDepartment, getAllDepartments } = require('../controllers/department.controller');
const router = express.Router();

// Admin Department Management
router.post('/', protect, authorizeRoles('admin'), createDepartment);
router.get('/', protect, getAllDepartments);
router.put('/:id', protect, authorizeRoles('admin'), updateDepartment);
router.delete('/:id', protect, authorizeRoles('admin'), deleteDepartment);

module.exports = router;
