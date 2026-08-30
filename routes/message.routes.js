const express = require("express");

const {
    createMessage
} = require("../controllers/message.controller");

const router = express.Router();
router.get("/",(req,res)=> res.status(200).json({msg:"messages"}));

router.post("/messages", createMessage);

module.exports = router;