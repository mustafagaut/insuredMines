const express = require("express");
const router = express.Router();

const {
    uploadFile,
    searchPolicyByUsername,
    getAggregatedPolicies
} = require("../controllers/policy.controller");

router.post("/upload", uploadMiddleware.single("file"), uploadFile);

router.get("/search", searchPolicyByUsername);

router.get("/aggregated", getAggregatedPolicies);

module.exports = router;