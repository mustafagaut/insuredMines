const Message = require("../models/message.model");

function scheduleMessage(message, scheduledAt) {
    const delay = new Date(scheduledAt).getTime() - Date.now();

    setTimeout(async () => {
        try {
            await Message.create({
                message,
                scheduledAt
            });

            console.log("Message inserted into DB");
        } catch (error) {
            console.error("Message insert error:", error);
        }
    }, delay);
}

module.exports = scheduleMessage;