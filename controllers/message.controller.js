const scheduleMessage = require("../services/messageScheduler");

const createMessage = async (req, res) => {
    try {
        const { message, day, time } = req.body;

        if (!message || !day || !time) {
            return res.status(400).json({
                success: false,
                message: "message, day and time are required"
            });
        }

        const scheduledAt = new Date(`${day}T${time}`);

        if (isNaN(scheduledAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date or time"
            });
        }

        if (scheduledAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Date and time must be in the future"
            });
        }

        scheduleMessage(message, scheduledAt);

        res.status(202).json({
            success: true,
            message: "Message scheduled successfully",
            scheduledAt
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMessages= async (req,res) =>{
    try{

        
    }catch(err){
        console.log(err)

    }
}


module.exports = {
    createMessage
};