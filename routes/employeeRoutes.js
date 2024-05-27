const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeControlloer');

router.get('/tasks', employeeController.getEmployeeTasks);
router.post('/complete-task/:taskId', employeeController.completeTask);
module.exports = router;
