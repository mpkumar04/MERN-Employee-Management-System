// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// create express app
const app = express();
app.use(express.json());
app.use(cors());

// connecting to mongodb
mongoose
  .connect("mongodb://localhost:27017/mern-app")
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Employee Schema
const todoSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Phone: { type: String, required: true },
  Address: { type: String, required: true },
  Department: { type: String, required: true },
  Salary: { type: Number, required: true },
});

// create indexes
todoSchema.index({ Salary: 1 });
todoSchema.index({ Email: 1 });

// Employee Model
const todoModel = mongoose.model("Todo", todoSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Todo", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent"], required: true },
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
const attendanceModel = mongoose.model("Attendance", attendanceSchema);

//emp crud Operation

// creat a new employee
app.post("/todos", async (req, res) => {
  const { Name, Email, Phone, Address, Department, Salary } = req.body;
  try {
    const newTodo = new todoModel({
      Name,
      Email,
      Phone,
      Address,
      Department,
      Salary: Number(Salary),
    });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Error creating employee" });
  }
});

// get all employees
app.get("/todos", async (req, res) => {
  try {
    const todos = await todoModel.find();
    res.json(todos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching employees" });
  }
});

// update employee
app.put("/todos/:id", async (req, res) => {
  try {
    const { Name, Email, Phone, Address, Department, Salary } = req.body;
    const updatedTodo = await todoModel.findByIdAndUpdate(
      req.params.id,
      { Name, Email, Phone, Address, Department, Salary: Number(Salary) },
      { new: true, runValidators: true }
    );
    if (!updatedTodo)
      return res.status(404).json({ error: "Employee not found" });
    res.json(updatedTodo);
  } catch (error) {
    console.log(error);
    if (error.code === 11000)
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Error updating employee" });
  }
});

// delete employee
app.delete("/todos/:id", async (req, res) => {
  try {
    await todoModel.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting employee" });
  }
});

// ---------------- Attendance summary ----------------

// mark attendance
app.post("/attendance", async (req, res) => {
  try {
    const { employeeId, status } = req.body;
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const record = await attendanceModel.findOneAndUpdate(
      { employeeId, date },
      { status },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(record);
  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({ error: "Error marking attendance" });
  }
});

// get attendance
app.get("/attendance/summary", async (req, res) => {
  try {
    const summary = await attendanceModel.aggregate([
      {
        $group: {
          _id: "$employeeId",
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $cond: [
              { $eq: ["$totalDays", 0] },
              0,
              { $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100] },
            ],
          },
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    console.error("Attendance Summary Error:", error);
    res.status(500).json({ error: "Error fetching attendance summary" });
  }
});

//inssight
app.get("/todos/insights", async (req, res) => {
  try {
    const result = await todoModel.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalSalary: { $sum: "$Salary" },
          avgSalary: { $avg: "$Salary" },
          highestSalary: { $max: "$Salary" },
          lowestSalary: { $min: "$Salary" },
        },
      },
    ]);
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        totalEmployees: 0,
        totalSalary: 0,
        avgSalary: 0,
        highestSalary: 0,
        lowestSalary: 0,
      });
    }
  } catch (error) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ error: "Error generating insights" });
  }
});

// start the server
const port = 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
