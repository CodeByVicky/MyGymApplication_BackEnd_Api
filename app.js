const connection = require("./db");

const express = require("express");
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());
const port = process.env.PORT || 3000;

//get
app.get("/api/show",(req,res)=>{
    const sql = "select * from gymtable"
    try{
        connection.query(sql,(err,result)=>{
            if(err){
                console.error("Database error:", err);
                res.status(500).json({ error: 'An error occurred while processing your request' });
                return; 
            }
            res.json(result);
        })
    }catch(err){
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})

//post
app.post("/api/create", (req, res) => {
    const sql = "insert into gymtable set ?";
    const data = {
        name: req.body.name, userId: req.body.userId,
        password: req.body.password, joinDate: req.body.joinDate,
        mobileNumber: req.body.mobileNumber, plan: req.body.plan,
        city: req.body.city, profilePhoto: req.body.profilePhoto,
        address : req.body.address
    }
    try {
        connection.query(sql, data, (err, result) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: 'An error occurred while processing your request' });
                return;
            }
            res.json({ message: "record add succesfull..." })
        })
    } catch (err) {
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})

//expires
app.get("/api/expires",(req,res)=>{
    const sql = `SELECT * FROM gymtable WHERE plan = 'Monthly' 
    AND activeDate  > CURDATE() 
    AND activeDate  <= CURDATE() + INTERVAL 3 DAY or plan = 'Semiannually' 
    AND activeDate  > CURDATE() 
    AND activeDate  <= CURDATE() + INTERVAL 3 DAY or plan = 'Annually' 
    AND activeDate  > CURDATE() 
    AND activeDate  <= CURDATE() + INTERVAL 3 DAY`
    try{
        connection.query(sql,(err,result)=>{
            if(err){
                console.error("Database error:", err);
                res.status(500).json({ error: 'An error occurred while processing your request' });
                return; 
            }
            res.json(result);
        })
    }catch(err){
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})


//expired
app.get("/api/expired",(req,res)=>{
    const sql = `SELECT * FROM gymtable WHERE plan = 'Monthly' AND DATE_ADD(joinDate, INTERVAL 1 MONTH)
     < CURDATE() or plan = 'Semiannually' AND DATE_ADD(joinDate, INTERVAL 6 MONTH)
      < CURDATE() or plan = 'Annually' AND DATE_ADD(joinDate, INTERVAL 12 MONTH) < CURDATE()`
    try{
        connection.query(sql,(err,result)=>{
            if(err){
                console.error("Database error:", err);
                res.status(500).json({ error: 'An error occurred while processing your request' });
                return; 
            }
            res.json(result);
        })
    }catch(err){
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})


//cancelled
app.get("/api/cancelled",(req,res)=>{
    const sql = `SELECT * FROM gymtable WHERE plan = 'Monthly' 
    AND DATE_ADD(joinDate, INTERVAL 2 MONTH) <= CURDATE() or plan = 'Semiannually' 
    AND DATE_ADD(joinDate, INTERVAL 7 MONTH) <= CURDATE() or plan = 'Annually' 
    AND DATE_ADD(joinDate, INTERVAL 13 MONTH) <= CURDATE()`
    try{
        connection.query(sql,(err,result)=>{
            if(err){
                console.error("Database error:", err);
                res.status(500).json({ error: 'An error occurred while processing your request' });
                return; 
            }
            res.json(result);
        })
    }catch(err){
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})

//delete

app.delete("/api/delete/:userId", (req, res) => {
  const userId = req.params.userId;

  // First, delete records from the attendance table
  const deleteAttendanceQuery = "DELETE FROM attendance WHERE userId = ?";
  connection.query(deleteAttendanceQuery, [userId], (attendanceErr, attendanceResult) => {
      if (attendanceErr) {
          console.error("Database error:", attendanceErr);
          return res.status(500).json({ error: 'An error occurred while deleting records from the attendance table' });
      }

      // If deletion from the attendance table is successful, proceed to delete from the gymtable
      const deleteGymTableQuery = "DELETE FROM gymtable WHERE userId = ?";
      connection.query(deleteGymTableQuery, [userId], (gymTableErr, gymTableResult) => {
          if (gymTableErr) {
              console.error("Database error:", gymTableErr);
              return res.status(500).json({ error: 'An error occurred while deleting record from the gymtable' });
          }

          // Both deletions were successful
          res.json({ message: "Records deleted successfully" });
      });
  });
});



app.get("/api/search/:userId", (req, res) => {
    const sql = "SELECT * FROM gymtable WHERE userId = ?";
    const userId = req.params.userId;
    try {
      connection.query(sql, [userId], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          res.status(500).json({ error: 'An error occurred while processing your request' });
          return;
        }
        res.json(result);
      });
    } catch (err) {
      console.error("Exception:", err);
      res.status(500).json({ error: 'An error occurred while processing your request' });
    }
  });

  //update
  app.put("/api/update",(req,res)=>{
    let sql = "update gymtable set name = ?  , mobileNumber = ? , address =? ,city = ? , plan = ? , joinDate = ? where userId = ?";
    let data = [req.body.name,req.body.mobileNumber , req.body.address , req.body.city , req.body.plan , req.body.joinDate,req.body.userId];
    try {
        connection.query(sql, data, (err, result) => {
          if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: 'An error occurred while processing your request' });
            return;
          }
          res.json({message : "record update sucessful.."});
        });
      } catch (err) {
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
      }
});


//update Plan

app.put("/api/plan", (req, res) => {
    const { plan, userId } = req.body;

    let interval;
    switch(plan.toLowerCase()) {
        case 'monthly':
            interval = 'INTERVAL 1 MONTH';
            break;
        case 'semiannually':
            interval = 'INTERVAL 6 MONTH';
            break;
        case 'annually':
            interval = 'INTERVAL 12 MONTH';
            break;
        default:
            res.status(400).json({ error: 'Invalid plan type' });
            return;
    }

    const sql = `
    UPDATE gymtable
    SET plan = ?,
        activeDate = DATE_ADD(activeDate, ${interval})
    WHERE userId = ?;
    `;

    const data = [plan, userId];

    try {
        connection.query(sql, data, (err, result) => {
          if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: 'An error occurred while processing your request' });
            return;
          }
          res.json({ message: "Plan update successful." });
        });
    } catch (err) {
        console.error("Exception:", err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

//attendance
app.post('/api/attendance', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }
  
    const attendanceDate = new Date().toISOString().slice(0, 10);
  
    // Check if attendance already marked for today
    const checkQuery = 'SELECT * FROM attendance WHERE userId = ? AND attendanceDate = ?';
    const checkValues = [userId, attendanceDate];
  
    connection.query(checkQuery, checkValues, (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Database error during check:', checkErr);
        return res.status(500).json({ error: 'Failed to check attendance' });
      }
  
      if (checkResults.length > 0) {
        // Attendance already marked
        return res.status(200).json({ message: 'Attendance already marked for today' });
      }
  
      // If not, insert new attendance record
      const insertQuery = 'INSERT INTO attendance (userId, attendanceDate, isPresent) VALUES (?, ?, true)';
      const insertValues = [userId, attendanceDate];
  
      connection.query(insertQuery, insertValues, (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Database error during insert:', insertErr);
          return res.status(500).json({ error: 'Failed to mark attendance' });
        }
        res.json({ message: 'Attendance marked successfully' });
      });
    });
  });
  
// Route to get attendance data
  app.get('/api/attendanceData', (req, res) => {
    const attendanceDate = new Date().toISOString().slice(0, 10);
    const query = 'SELECT g.name, g.userId, g.mobileNumber, g.plan, g.activeDate ,a.isPresent,g.city FROM gymtable AS g JOIN attendance AS a ON g.userId = a.userId WHERE a.attendanceDate = ?';
    
    connection.query(query, [attendanceDate], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch attendance data' });
      }
      res.json(results);
    });
  });
//absent data
  app.get('/api/attendanceDataAbsent', (req, res) => {
    const attendanceDate = new Date().toISOString().slice(0, 10);
    const query = 'SELECT g.name, g.userId, g.mobileNumber, g.plan, g.activeDate, a.isPresent FROM gymtable AS g LEFT JOIN attendance AS a ON g.userId = a.userId AND a.attendanceDate = ? WHERE a.attendanceDate IS NULL';
    
    connection.query(query, [attendanceDate], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch attendance data' });
      }
      res.json(results);
    });
  })

  //showTotal
  app.get('/api/showTotal', (req, res) => {
    const attendanceDate = new Date().toISOString().slice(0, 10);
    const query = `
    SELECT DISTINCT
    g.name,
    g.userId,
    g.mobileNumber,
    g.plan,
    g.activeDate,
    a.attendanceDate,
    a.isPresent
FROM
    gymtable AS g
LEFT JOIN (
    SELECT
        userId,
        attendanceDate,
        isPresent
    FROM (
        SELECT
            userId,
            attendanceDate,
            isPresent,
            ROW_NUMBER() OVER (PARTITION BY userId ORDER BY attendanceDate DESC) AS rn
        FROM
            attendance
    ) AS sub
    WHERE sub.rn = 1
) AS a ON g.userId = a.userId;
`;
    
    connection.query(query, [attendanceDate], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch attendance data' });
      }
      res.json(results);
    });
  })


  //get by Userid

  app.get("/api/find/:userId", (req, res) => {
    const sql = "SELECT * FROM gymtable WHERE userId = ?";
    const userId = req.params.userId;
    connection.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: 'An error occurred while processing your request' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Assuming only one user is expected to match the userId, so returning the first result
        const userData = result[0];
        res.json(userData);
    });
});


//attendence count
app.get("/api/findCount/:userId", (req, res) => {
  const sql = "SELECT *, (SELECT COUNT(*) FROM attendance WHERE userId = 'rohit123' AND MONTH(attendanceDate) = MONTH(CURRENT_DATE) AND YEAR(attendanceDate) = YEAR(CURRENT_DATE)) AS total_days_present FROM attendance WHERE userId = 'rohit123' AND MONTH(attendanceDate) = MONTH(CURRENT_DATE) AND YEAR(attendanceDate) = YEAR(CURRENT_DATE)";
  const userId = req.params.userId;
  connection.query(sql, [userId], (err, result) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: 'An error occurred while processing your request' });
      }
      if (result.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      // Assuming only one user is expected to match the userId, so returning the first result
      const userData = result;
      res.json(userData);
  });
});

//post weights
app.post("/api/weightAdd", (req, res) => {
  const { userId, weightKg } = req.body;
  const weightDate = new Date().toISOString().slice(0, 10);
  const sql = 'INSERT INTO weight (userId, weightDate, weightKg) VALUES (?, ?, ?)';
  const data = [userId, weightDate , weightKg];
  try {
      connection.query(sql, data, (err, result) => {
          if (err) {
              console.error("Database error:", err);
              res.status(500).json({ error: 'An error occurred while processing your request' });
              return;
          }
          res.json({ message: "record add succesfull..." })
      })
  } catch (err) {
      console.error("Exception:", err);
      res.status(500).json({ error: 'An error occurred while processing your request' });
  }
})

//findWeightDAtaList
app.get("/api/weightFind/:userId", (req, res) => {
  const sql = "SELECT * FROM weight WHERE userId = ?";
  const userId = req.params.userId;
  connection.query(sql, [userId], (err, result) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: 'An error occurred while processing your request' });
      }
      if (result.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      // Assuming only one user is expected to match the userId, so returning the first result
      const userData = result;
      res.json(userData);
  });
});

//findLetestWeight
app.get("/api/weightFindNew/:userId", (req, res) => {
  const sql = "SELECT * FROM weight WHERE userId = ? ORDER BY weightId DESC LIMIT 1";
  const userId = req.params.userId;
  connection.query(sql, [userId], (err, result) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: 'An error occurred while processing your request' });
      }
      if (result.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      // Assuming only one user is expected to match the userId, so returning the first result
      const userData = result[0];
      res.json(userData);
  });
});

//login Authontication user

app.post("/api/loginUser",(req,res)=>{
  const sql = "select * from gymtable where userId = ? and password = ?"
  const data = [req.body.userId , req.body.password]
  try{
    connection.query(sql,data,(err,result)=>{
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: 'An error occurred while processing your request' });
    }
    if (result.length > 0) {
      res.json({ message: "User Found Successfully..." });
  } else {
      res.status(404).json({ message: "Record not found" });
  }
    })
  }catch(err){
    console.error("Exception:", err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
  
})


//login Authontication admin
app.post("/api/loginAdmin",(req,res)=>{
  const sql = "select * from adminlogin where email = ? and password = ?"
  const data = [req.body.email , req.body.password]
  try{
    connection.query(sql,data,(err,result)=>{
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: 'An error occurred while processing your request' });
    }
    if (result.length > 0) {
      res.json({ message: "User Found Successfully..." });
  } else {
      res.status(404).json({ message: "Record not found" });
  }
    })
  }catch(err){
    console.error("Exception:", err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
  
})


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});