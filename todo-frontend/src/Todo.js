// frontend/src/Todo.js
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Todo() {
  const [Name, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [Phone, setPhone] = useState("");
  const [Address, setAddress] = useState("");
  const [Department, setDepartment] = useState("");
  const [Salary, setSalary] = useState("");

  const [todos, setTodos] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(-1);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSalary, setFilterSalary] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("list"); // employee main view
  const [attendanceView, setAttendanceView] = useState("list"); // attendance subview

  const apiUrl = "http://localhost:8000";

  useEffect(() => {
    fetchTodos();
    fetchAttendanceSummary();
  }, []);

  const fetchTodos = () => {
    fetch(apiUrl + "/todos")
      .then((res) => res.json())
      .then((res) => setTodos(res || []))
      .catch(() => setError("Unable to fetch employees"));
  };

  const fetchAttendanceSummary = () => {
    fetch(apiUrl + "/attendance/summary")
      .then((res) => res.json())
      .then((res) => setAttendanceSummary(res || []))
      .catch(() => setError("Unable to fetch attendance summary"));
  };

  const normalizeDept = (dept) => (dept ? dept.trim().toLowerCase() : "unassigned");
  const formatDept = (dept) =>
    dept ? dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase() : "Unassigned";

  // CREATE
  const handleSubmit = () => {
    setError("");
    if (!Name || !Email || !Phone || !Address || !Salary) {
      setError("Please fill required fields (Name, Email, Phone, Address, Salary)");
      return;
    }
    const payload = {
      Name,
      Email,
      Phone,
      Address,
      Department: normalizeDept(Department),
      Salary,
    };
    fetch(apiUrl + "/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error adding employee");
        return data;
      })
      .then((data) => {
        setTodos((prev) => [...prev, data]);
        setMessage("Employee added successfully");
        setTimeout(() => setMessage(""), 3000);
        setName(""); setEmail(""); setPhone(""); setAddress(""); setDepartment(""); setSalary(""); setShowForm(false);
      })
      .catch((err) => setError(err.message));
  };

  // EDIT
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditName(item.Name); setEditEmail(item.Email); setEditPhone(item.Phone);
    setEditAddress(item.Address); setEditDepartment(item.Department); setEditSalary(item.Salary);
  };

  const handleUpdate = () => {
    setError("");
    if (!editName || !editEmail || !editPhone || !editAddress || !editSalary) {
      setError("Please fill required fields");
      return;
    }
    const payload = {
      Name: editName,
      Email: editEmail,
      Phone: editPhone,
      Address: editAddress,
      Department: normalizeDept(editDepartment),
      Salary: editSalary,
    };
    fetch(apiUrl + "/todos/" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error updating employee");
        return data;
      })
      .then((data) => {
        setTodos((prev) => prev.map((t) => (t._id === editId ? data : t)));
        setMessage("Employee updated successfully");
        setTimeout(() => setMessage(""), 3000);
        setEditId(-1);
      })
      .catch((err) => setError(err.message));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure to delete this employee?")) return;
    fetch(apiUrl + "/todos/" + id, { method: "DELETE" })
      .then(() => setTodos((prev) => prev.filter((t) => t._id !== id)))
      .catch(() => setError("Unable to delete employee"));
  };

  // Attendance
  const markAttendance = (id, status) => {
    fetch(apiUrl + "/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: id, status }),
    })
      .then((res) => res.json())
      .then(() => fetchAttendanceSummary())
      .catch(() => setError("Error marking attendance"));
  };

  const getAttendancePercent = (id) => {
    const record = attendanceSummary.find((a) => a._id === id);
    return record ? record.percentage.toFixed(1) + "%" : "0%";
  };

  // Filtered employee list
  const filteredTodos = todos.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || [item.Name, item.Email, item.Phone, item.Department].some((v) => v?.toLowerCase().includes(q));
    let matchesFilter = true;
    if (filterSalary === "low") matchesFilter = Number(item.Salary) < 50000;
    else if (filterSalary === "high") matchesFilter = Number(item.Salary) >= 50000;
    return matchesSearch && matchesFilter;
  });

  const toNumber = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const getTotalEmployees = () => filteredTodos.length;
  const getTotalSalary = () => filteredTodos.reduce((sum, e) => sum + toNumber(e.Salary), 0);
  const getAverageSalary = () => filteredTodos.length ? (getTotalSalary() / filteredTodos.length).toFixed(2) : 0;
  const getHighestSalary = () => filteredTodos.length ? Math.max(...filteredTodos.map((e) => toNumber(e.Salary))) : 0;
  const getLowestSalary = () => filteredTodos.length ? Math.min(...filteredTodos.map((e) => toNumber(e.Salary))) : 0;

  const salaryByDepartment = () => {
    const map = {};
    filteredTodos.forEach((e) => { const d = normalizeDept(e.Department); map[d] = (map[d]||0)+toNumber(e.Salary); });
    return Object.entries(map).map(([name,total]) => ({ name: formatDept(name), total }));
  };
  const countByDepartment = () => {
    const map = {};
    filteredTodos.forEach((e) => { const d = normalizeDept(e.Department); map[d] = (map[d]||0)+1; });
    return Object.entries(map).map(([name,value]) => ({ name: formatDept(name), value }));
  };

  const salaryData = filteredTodos.map(e=>({ name:e.Name||"Unknown", salary:toNumber(e.Salary)})).sort((a,b)=>b.salary-a.salary).slice(0,12);
  const deptCountData = countByDepartment();
  const COLORS = ["#0088FE","#00C49F","#FFBB28","#FF8042","#A28BFF","#FF6B6B"];

  return (
    <>
      <div className="p-3 bg-success text-light text-center"><h1>Employee Management System</h1></div>

      <div className="d-flex gap-2 mt-3">
        <button className={`btn w-100 ${view==="list"?"btn-dark":"btn-outline-dark"}`} onClick={()=>setView("list")}>Employee List</button>
        <button className={`btn w-100 ${view==="insights"?"btn-dark":"btn-outline-dark"}`} onClick={()=>setView("insights")}>Employee Insights</button>
        <button className={`btn w-100 ${view==="attendance"?"btn-dark":"btn-outline-dark"}`} onClick={()=>setView("attendance")}>Attendance</button>
      </div>

      {/* Employee List */}
      {view==="list" && (
        <div>
          {/* Add Form */}
          <div className="mt-3">
            {!showForm ? (
              <button className="btn btn-success mb-3" onClick={()=>setShowForm(true)}>Add New Employee</button>
            ) : (
              <div className="d-flex flex-wrap gap-2 mb-3">
                <input placeholder="Name" value={Name} onChange={e=>setName(e.target.value)} className="form-control"/>
                <input placeholder="Email" value={Email} onChange={e=>setEmail(e.target.value)} className="form-control"/>
                <input placeholder="Phone" value={Phone} onChange={e=>setPhone(e.target.value)} className="form-control"/>
                <input placeholder="Address" value={Address} onChange={e=>setAddress(e.target.value)} className="form-control"/>
                <input placeholder="Department" value={Department} onChange={e=>setDepartment(e.target.value)} className="form-control" style={{maxWidth:200}}/>
                <input placeholder="Salary" type="number" value={Salary} onChange={e=>setSalary(e.target.value)} className="form-control" style={{maxWidth:160}}/>
                <div className="d-flex gap-2">
                  <button className="btn btn-success" onClick={handleSubmit}>OK</button>
                  <button className="btn btn-secondary" onClick={()=>{setShowForm(false); setName(""); setEmail(""); setPhone(""); setAddress(""); setDepartment(""); setSalary("");}}>Cancel</button>
                </div>
              </div>
            )}
            {message && <p className="text-success">{message}</p>}
            {error && <p className="text-danger">{error}</p>}
          </div>

          {/* Search & Filter */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <input placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="form-control"/>
            <select value={filterSalary} onChange={e=>setFilterSalary(e.target.value)} className="form-select" style={{maxWidth:200}}>
              <option value="all">All Salaries</option>
              <option value="low">Below 50,000</option>
              <option value="high">50,000 and Above</option>
            </select>
            <button className="btn btn-outline-secondary" onClick={()=>{setSearchTerm(""); setFilterSalary("all")}}>Reset Filters</button>
          </div>

          {/* Table */}
          <table className="table table-striped table-bordered text-center">
            <thead className="bg-success text-white">
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Attendance %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTodos.map((item,index)=>(editId===item._id ? (
                <tr key={item._id}>
                  <td>{index+1}</td>
                  <td><input value={editName} onChange={e=>setEditName(e.target.value)} className="form-control"/></td>
                  <td><input value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="form-control"/></td>
                  <td><input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="form-control"/></td>
                  <td><input value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="form-control"/></td>
                  <td><input value={editDepartment} onChange={e=>setEditDepartment(e.target.value)} className="form-control"/></td>
                  <td><input type="number" value={editSalary} onChange={e=>setEditSalary(e.target.value)} className="form-control"/></td>
                  <td>{getAttendancePercent(item._id)}</td>
                  <td colSpan={2}><button className="btn btn-success btn-sm me-2" onClick={handleUpdate}>Save</button><button className="btn btn-secondary btn-sm" onClick={()=>setEditId(-1)}>Cancel</button></td>
                </tr>
              ) : (
                <tr key={item._id}>
                  <td>{index+1}</td>
                  <td>{item.Name}</td>
                  <td>{item.Email}</td>
                  <td>{item.Phone}</td>
                  <td>{item.Address}</td>
                  <td>{formatDept(item.Department)}</td>
                  <td>{item.Salary}</td>
                  <td>{getAttendancePercent(item._id)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm me-2" onClick={()=>handleEdit(item)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(item._id)}>Delete</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Insights */}
      {view==="insights" && (
        <div className="mt-4">
          <h3>Employee Insights</h3>
          <div className="row text-center mb-4">
            <div className="col"><div className="card p-3"><h5>Total Employees</h5><h4>{getTotalEmployees()}</h4></div></div>
            <div className="col"><div className="card p-3"><h5>Total Salary</h5><h4>{getTotalSalary()}</h4></div></div>
            <div className="col"><div className="card p-3"><h5>Avg Salary</h5><h4>{getAverageSalary()}</h4></div></div>
            <div className="col"><div className="card p-3"><h5>Highest Salary</h5><h4>{getHighestSalary()}</h4></div></div>
            <div className="col"><div className="card p-3"><h5>Lowest Salary</h5><h4>{getLowestSalary()}</h4></div></div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <h5 className="text-center">Top Salaries</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="salary" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-md-6 mb-4">
              <h5 className="text-center">Employees by Department</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={deptCountData} cx="50%" cy="50%" labelLine={false} label={({ name, percent })=>`${name} ${(percent*100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                    {deptCountData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="row mt-4">
            <div className="col">
              <h5 className="text-center">Salary by Department</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryByDepartment()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Section */}
      {view==="attendance" && (
        <div className="mt-4">
          <h3>Attendance</h3>
          <div className="d-flex gap-2 mb-3">
            <button className={`btn ${attendanceView==="list"?"btn-dark":"btn-outline-dark"}`} onClick={()=>setAttendanceView("list")}>List</button>
            <button className={`btn ${attendanceView==="insights"?"btn-dark":"btn-outline-dark"}`} onClick={()=>setAttendanceView("insights")}>Insights</button>
          </div>

          {attendanceView==="list" && (
            <table className="table table-striped table-bordered text-center">
              <thead className="bg-success text-white">
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Attendance %</th>
                  <th>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {todos.map((item,index)=>(
                  <tr key={item._id}>
                    <td>{index+1}</td>
                    <td>{item.Name}</td>
                    <td>{formatDept(item.Department)}</td>
                    <td>{getAttendancePercent(item._id)}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        defaultValue=""
                        onChange={(e)=>{if(e.target.value) markAttendance(item._id, e.target.value)}}
                      >
                        <option value="">Select</option>
                        <option value="Present">✅ Present</option>
                        <option value="Absent">❌ Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {attendanceView==="insights" && (
            <div className="row text-center">
              <div className="col"><div className="card p-3"><h5>Average Attendance</h5><h4>{
                attendanceSummary.length
                  ? (attendanceSummary.reduce((sum,a)=>sum+a.percentage,0)/attendanceSummary.length).toFixed(1)+"%"
                  : "0%"
              }</h4></div></div>
              <div className="col"><div className="card p-3"><h5>Perfect Attendance</h5><h4>{
                attendanceSummary.filter(a=>a.percentage===100).length
              }</h4></div></div>
              <div className="col"><div className="card p-3"><h5>Poor Attendance (&lt;50%)</h5><h4>{
                attendanceSummary.filter(a=>a.percentage<50).length
              }</h4></div></div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
