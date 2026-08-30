require("dotenv").config();

const {
    parentPort,
    workerData
} = require("worker_threads");

const mongoose = require("mongoose");
const XLSX = require("xlsx");

const Agent = require("../models/agent.model");
const User = require("../models/user.model");
const UserAccount = require("../models/userAccount.model");
const PolicyCategory = require("../models/policyCategory.model");
const PolicyCarrier = require("../models/policyCarrier.model");
const PolicyInfo = require("../models/policyInfo.model");


/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Worker connected to MongoDB");
};


/*
|--------------------------------------------------------------------------
| Process File
|--------------------------------------------------------------------------
*/

const processFile = async () => {

    try {

        console.log("Worker started");

        console.log(
            "Processing:",
            workerData.filePath
        );


        /*
        |--------------------------------------------------------------------------
        | Connect MongoDB
        |--------------------------------------------------------------------------
        */

        await connectDB();


        /*
        |--------------------------------------------------------------------------
        | Read XLSX / CSV
        |--------------------------------------------------------------------------
        */

        const workbook = XLSX.readFile(
            workerData.filePath
        );

        const sheetName =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[sheetName];


        /*
        |--------------------------------------------------------------------------
        | Convert Excel → JSON
        |--------------------------------------------------------------------------
        */

        const rawRows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: null
                }
            );


        /*
        |--------------------------------------------------------------------------
        | Normalize Column Names
        |--------------------------------------------------------------------------
        */

        const rows = rawRows.map((row) => {

            const normalizedRow = {};

            Object.keys(row).forEach((key) => {

                normalizedRow[
                    key.trim().toLowerCase()
                ] = row[key];

            });

            return normalizedRow;
        });


        console.log(
            `Total rows found: ${rows.length}`
        );


        /*
        |--------------------------------------------------------------------------
        | Show Headers
        |--------------------------------------------------------------------------
        */

        if (rows.length > 0) {

            console.log(
                "Excel columns:",
                Object.keys(rows[0])
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Arrays
        |--------------------------------------------------------------------------
        */

        const agents = [];
        const users = [];
        const accounts = [];
        const categories = [];
        const carriers = [];
        const policies = [];


        /*
        |--------------------------------------------------------------------------
        | Duplicate Maps
        |--------------------------------------------------------------------------
        */

        const agentMap = new Map();
        const userMap = new Map();
        const accountMap = new Map();
        const categoryMap = new Map();
        const carrierMap = new Map();


        /*
        |--------------------------------------------------------------------------
        | Process Rows
        |--------------------------------------------------------------------------
        */

        for (const row of rows) {


            /*
            |--------------------------------------------------------------------------
            | 1. AGENT
            |--------------------------------------------------------------------------
            |
            | Excel:
            | agent
            |
            */

            if (row.agent) {

                const agentName =
                    String(row.agent).trim();


                if (
                    !agentMap.has(agentName)
                ) {

                    agentMap.set(
                        agentName,
                        true
                    );


                    agents.push({
                        agentName
                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | USER EMAIL
            |--------------------------------------------------------------------------
            */

            const email =
                row.email
                    ? String(row.email)
                        .trim()
                        .toLowerCase()
                    : null;


            /*
            |--------------------------------------------------------------------------
            | 2. USER
            |--------------------------------------------------------------------------
            */

            if (
                email &&
                !userMap.has(email)
            ) {

                userMap.set(
                    email,
                    true
                );


                users.push({

                    firstName:
                        row.firstname,

                    dob:
                        row.dob,

                    address:
                        row.address,

                    phoneNumber:
                        row.phone,

                    state:
                        row.state,

                    zipCode:
                        row.zip,

                    email,

                    gender:
                        row.gender,

                    userType:
                        row.usertype
                });
            }


            /*
            |--------------------------------------------------------------------------
            | 3. USER ACCOUNT
            |--------------------------------------------------------------------------
            */

            if (
                row.account_name &&
                email
            ) {

                const accountName =
                    String(
                        row.account_name
                    ).trim();


                const accountKey =
                    `${email}_${accountName}`;


                if (
                    !accountMap.has(
                        accountKey
                    )
                ) {

                    accountMap.set(
                        accountKey,
                        true
                    );


                    accounts.push({

                        accountName,

                        userEmail:
                            email
                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | 4. POLICY CATEGORY / LOB
            |--------------------------------------------------------------------------
            */

            if (
                row.category_name
            ) {

                const categoryName =
                    String(
                        row.category_name
                    ).trim();


                if (
                    !categoryMap.has(
                        categoryName
                    )
                ) {

                    categoryMap.set(
                        categoryName,
                        true
                    );


                    categories.push({

                        categoryName
                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | 5. POLICY CARRIER
            |--------------------------------------------------------------------------
            */

            if (
                row.company_name
            ) {

                const companyName =
                    String(
                        row.company_name
                    ).trim();


                if (
                    !carrierMap.has(
                        companyName
                    )
                ) {

                    carrierMap.set(
                        companyName,
                        true
                    );


                    carriers.push({

                        companyName
                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | 6. POLICY
            |--------------------------------------------------------------------------
            */

            if (
                row.policy_number
            ) {

                policies.push({

                    policyNumber:
                        String(
                            row.policy_number
                        ).trim(),

                    policyStartDate:
                        row.policy_start_date,

                    policyEndDate:
                        row.policy_end_date,

                    userEmail:
                        email,

                    categoryName:
                        row.category_name
                            ? String(
                                row.category_name
                            ).trim()
                            : null,

                    companyName:
                        row.company_name
                            ? String(
                                row.company_name
                            ).trim()
                            : null
                });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT AGENTS
        |--------------------------------------------------------------------------
        */

        if (agents.length) {

            await Agent.bulkWrite(

                agents.map((agent) => ({

                    updateOne: {

                        filter: {
                            agentName:
                                agent.agentName
                        },

                        update: {
                            $set: agent
                        },

                        upsert: true
                    }

                }))
            );
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT USERS
        |--------------------------------------------------------------------------
        */

        if (users.length) {

            await User.bulkWrite(

                users.map((user) => ({

                    updateOne: {

                        filter: {
                            email:
                                user.email
                        },

                        update: {
                            $set: user
                        },

                        upsert: true
                    }

                }))
            );
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT LOB / CATEGORY
        |--------------------------------------------------------------------------
        */

        if (categories.length) {

            await PolicyCategory.bulkWrite(

                categories.map(
                    (category) => ({

                        updateOne: {

                            filter: {
                                categoryName:
                                    category.categoryName
                            },

                            update: {
                                $set: category
                            },

                            upsert: true
                        }

                    })
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT CARRIERS
        |--------------------------------------------------------------------------
        */

        if (carriers.length) {

            await PolicyCarrier.bulkWrite(

                carriers.map(
                    (carrier) => ({

                        updateOne: {

                            filter: {
                                companyName:
                                    carrier.companyName
                            },

                            update: {
                                $set: carrier
                            },

                            upsert: true
                        }

                    })
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GET USERS
        |--------------------------------------------------------------------------
        */

        const savedUsers =
            await User.find({

                email: {
                    $in:
                        users.map(
                            user => user.email
                        )
                }

            }).lean();


        /*
        |--------------------------------------------------------------------------
        | GET CATEGORIES
        |--------------------------------------------------------------------------
        */

        const savedCategories =
            await PolicyCategory.find({

                categoryName: {
                    $in:
                        categories.map(
                            category =>
                                category.categoryName
                        )
                }

            }).lean();


        /*
        |--------------------------------------------------------------------------
        | GET CARRIERS
        |--------------------------------------------------------------------------
        */

        const savedCarriers =
            await PolicyCarrier.find({

                companyName: {
                    $in:
                        carriers.map(
                            carrier =>
                                carrier.companyName
                        )
                }

            }).lean();


        /*
        |--------------------------------------------------------------------------
        | CREATE LOOKUP MAPS
        |--------------------------------------------------------------------------
        */

        const userIdMap =
            new Map(

                savedUsers.map(
                    user => [
                        user.email,
                        user._id
                    ]
                )
            );


        const categoryIdMap =
            new Map(

                savedCategories.map(
                    category => [
                        category.categoryName,
                        category._id
                    ]
                )
            );


        const carrierIdMap =
            new Map(

                savedCarriers.map(
                    carrier => [
                        carrier.companyName,
                        carrier._id
                    ]
                )
            );


        /*
        |--------------------------------------------------------------------------
        | CREATE POLICY DOCUMENTS
        |--------------------------------------------------------------------------
        */

        const policyDocuments = [];


        for (
            const policy
            of policies
        ) {

            const userId =
                userIdMap.get(
                    policy.userEmail
                );


            const categoryId =
                categoryIdMap.get(
                    policy.categoryName
                );


            const carrierId =
                carrierIdMap.get(
                    policy.companyName
                );


            /*
            | Skip if relationship missing
            */

            if (
                !userId ||
                !categoryId ||
                !carrierId
            ) {

                continue;
            }


            policyDocuments.push({

                policyNumber:
                    policy.policyNumber,

                policyStartDate:
                    policy.policyStartDate,

                policyEndDate:
                    policy.policyEndDate,

                userId,

                policyCategoryId:
                    categoryId,

                companyId:
                    carrierId
            });
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT POLICIES
        |--------------------------------------------------------------------------
        */

        if (
            policyDocuments.length
        ) {

            await PolicyInfo.bulkWrite(

                policyDocuments.map(
                    (policy) => ({

                        updateOne: {

                            filter: {

                                policyNumber:
                                    policy.policyNumber
                            },

                            update: {

                                $set:
                                    policy
                            },

                            upsert: true
                        }

                    })
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE ACCOUNT DOCUMENTS
        |--------------------------------------------------------------------------
        */

        const accountDocuments = [];


        for (
            const account
            of accounts
        ) {

            const userId =
                userIdMap.get(
                    account.userEmail
                );


            if (!userId) {
                continue;
            }


            accountDocuments.push({

                accountName:
                    account.accountName,

                userId
            });
        }


        /*
        |--------------------------------------------------------------------------
        | INSERT ACCOUNTS
        |--------------------------------------------------------------------------
        */

        if (
            accountDocuments.length
        ) {

            await UserAccount.bulkWrite(

                accountDocuments.map(
                    (account) => ({

                        updateOne: {

                            filter: {

                                accountName:
                                    account.accountName,

                                userId:
                                    account.userId
                            },

                            update: {

                                $set:
                                    account
                            },

                            upsert: true
                        }

                    })
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | SEND RESULT TO MAIN THREAD
        |--------------------------------------------------------------------------
        */

        parentPort.postMessage({

            success: true,

            message:
                "File processed successfully",

            statistics: {

                rows:
                    rows.length,

                agents:
                    agents.length,

                users:
                    users.length,

                accounts:
                    accountDocuments.length,

                categories:
                    categories.length,

                carriers:
                    carriers.length,

                policies:
                    policyDocuments.length
            }
        });


    } catch (error) {

        console.error(
            "Worker error:",
            error
        );


        parentPort.postMessage({

            success: false,

            message:
                error.message
        });


    } finally {

        /*
        |--------------------------------------------------------------------------
        | Close MongoDB
        |--------------------------------------------------------------------------
        */

        if (
            mongoose.connection.readyState !== 0
        ) {

            await mongoose.connection.close();

            console.log(
                "Worker MongoDB connection closed"
            );
        }
    }
};


/*
|--------------------------------------------------------------------------
| START WORKER
|--------------------------------------------------------------------------
*/

processFile();