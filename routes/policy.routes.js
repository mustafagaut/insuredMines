const express = require("express");
const router = express.Router();

const {
    uploadFile,
    searchPolicyByUsername,
    getAggregatedPolicies
} = require("../controllers/policy.controller");
const uploadMiddleware = require("../middleware/upload.middleware");

router.post("/upload", uploadMiddleware.single("file"), uploadFile);

router.get("/search", searchPolicyByUsername);

router.get("/aggregated", getAggregatedPolicies);

module.exports = router;