const path = require("path");
const { Worker } = require("worker_threads");
const PolicyInfo = require("../models/policyInfo.model");
const User = require("../models/user.model");

const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please upload a file"
        });
    }

    const filePath = path.resolve(req.file.path);

    const worker = new Worker(
        path.resolve(__dirname, "../workers/upload.worker.js"),
        {
            workerData: {
                filePath: filePath
            }
        }
    );

    worker.on("message", (result) => {
        console.log("Worker result:", result);
    });

    worker.on("error", (error) => {
        console.log("Worker error:", error);
    });

    worker.on("exit", (code) => {
        console.log("Worker exited:", code);
    });

    res.status(202).json({
        success: true,
        message: "File uploaded and processing started",
        file: req.file.filename
    });
};


// Search policy by username
const searchPolicyByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const user = await User.findOne({
            username: {
                $regex: username,
                $options: "i"
            }
        }).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const policies = await PolicyInfo.find({
            userId: user._id
        })
            .populate("policyCategoryId", "categoryName")
            .populate("companyId", "companyName")
            .lean();

        res.status(200).json({
            success: true,
            data: {
                user: user,
                policies: policies,
                totalPolicies: policies.length
            }
        });

    } catch (error) {
        console.log("Error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// Get aggregated policies by each user
const getAggregatedPolicies = async (req, res) => {
    try {
        const result = await PolicyInfo.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $lookup: {
                    from: "policycategories",
                    localField: "policyCategoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "policycarriers",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "company"
                }
            },
            {
                $unwind: {
                    path: "$company",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$userId",

                    username: {
                        $first: "$user.username"
                    },

                    email: {
                        $first: "$user.email"
                    },

                    totalPolicies: {
                        $sum: 1
                    },

                    policies: {
                        $push: {
                            policyNumber: "$policyNumber",
                            startDate: "$policyStartDate",
                            endDate: "$policyEndDate",
                            category: "$category.categoryName",
                            company: "$company.companyName"
                        }
                    }
                }
            },
            {
                $sort: {
                    totalPolicies: -1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.log("Aggregation error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


module.exports = {
    uploadFile,
    searchPolicyByUsername,
    getAggregatedPolicies
};