const express= require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const dotenv =require("dotenv");
const policyRoutes = require("./routes/policy.routes");
const { startCPUMonitor } = require("./services/cpuMonitor");
const messageRoutes = require("./routes/message.routes");
dotenv.config();



const app = express();
app.use(express.json());
connectDB()
startCPUMonitor();


app.get("/",(req,res)=>res.json({status:true,message:"Server is running on 5000"}))

app.use("/services", messageRoutes);

app.use("/policy", policyRoutes);





app.listen(process.env.PORT,(err)=>{console.log(err)});
