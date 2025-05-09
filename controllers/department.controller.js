const Department = require("../models/Department");

// Create Department
const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = await Department.create({ name });
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

// Get All Departments
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

// Update Department
const updateDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.name = name;
    await department.save();

    res.json({ message: "Department updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Delete Department
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    await department.deleteOne();
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
};
