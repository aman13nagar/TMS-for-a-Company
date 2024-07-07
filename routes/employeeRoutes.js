const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeControlloer');
const Task=require('../models/TaskModal');

router.get('/tasks', employeeController.getEmployeeTasks);
router.get('/tasks-tracking', async (req, res) => {
    try {
      const tasks = await Task.find();
      res.status(200).send(tasks);
    } catch (error) {
      res.status(500).send(error);
    }
});
router.post('/complete-task/:taskId', employeeController.completeTask);
module.exports = router;
