# Policy Management System

A Node.js backend API for managing insurance policies, users, and scheduling messages with real-time CPU monitoring.

## Overview

This system implements a complete technical assessment covering:
- **Task 1**: Data management APIs with MongoDB and worker threads
- **Task 2**: CPU monitoring and message scheduling services

---

## Task 1: Data Management

### Database Collections

The system uses 6 MongoDB collections to manage policy data:

1. **Agent** - Insurance agents
   - Fields: `agentName`

2. **User** - Policy holders/customers
   - Fields: `firstName`, `dob`, `address`, `phoneNumber`, `state`, `zipCode`, `email`, `gender`, `userType`

3. **User's Account** - Customer accounts
   - Fields: `accountName`, linked to User via `userId`

4. **Policy Category (LOB)** - Lines of Business
   - Fields: `categoryName`

5. **Policy Carrier** - Insurance companies
   - Fields: `companyName`

6. **Policy Info** - Policy details
   - Fields: `policyNumber`, `policyStartDate`, `policyEndDate`, `policyCategoryId`, `companyId`, `userId`

---

## APIs

### 1. Upload Data API

**Endpoint:** `POST /policy/upload`



**Purpose:** Upload XLSX/CSV files containing policy and user data

**Implementation:**
- Uses **Node.js Worker Threads** to process files asynchronously
- Prevents blocking the main server thread
- Handles bulk data import efficiently
- Automatically deduplicates records
- Creates relationships between collections

**Request:**
```
Content-Type: multipart/form-data
Body: { file: <XLSX or CSV file> }
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and processing started",
  "file": "filename.xlsx"
}
```

**Expected CSV Columns:**
```
agent
firstname, dob, address, phone, state, zip, email, gender, usertype
account_name
category_name
company_name
policy_number, policy_start_date, policy_end_date
```

**How it works:**
- Main thread receives file
- Creates worker thread
- Worker reads XLSX/CSV
- Normalizes data (lowercase, trimmed)
- Deduplicates entries
- Performs bulk inserts/updates
- Returns processing statistics

---

### 2. Search Policy by Username

**Endpoint:** `GET /policy/search?username=<username>`

**Purpose:** Find all policies associated with a specific user

**Implementation:**
- Searches User collection
- Returns matching policies with category and carrier details
- Shows total policy count

**Query Parameters:**
- `username` (required) - User email or name to search

**Request Example:**
```
GET /policy/search?username=mustafa@example.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "Mustafa",
      "email": "mustafa@example.com",
      "phoneNumber": "1234567890",
      "address": "123 Main St",
      "state": "TX",
      "zipCode": "75001",
      "gender": "male",
      "userType": "individual",
      "dob": "1990-01-15T00:00:00.000Z"
    },
    "policies": [
      {
        "_id": "policy_id",
        "policyNumber": "POL-2024-001",
        "policyStartDate": "2024-01-01",
        "policyEndDate": "2025-01-01",
        "policyCategoryId": {
          "_id": "category_id",
          "categoryName": "Auto Insurance"
        },
        "companyId": {
          "_id": "company_id",
          "companyName": "ABC Insurance Co"
        }
      }
    ],
    "totalPolicies": 1
  }
}
```

---

### 3. Aggregated Policies by User

**Endpoint:** `GET /policy/aggregated`

**Purpose:** Get a summary of all policies grouped by user

**Implementation:**
- Uses MongoDB aggregation pipeline
- Groups policies by user
- Counts total policies per user
- Retrieves category and carrier information
- Sorted by total policies (highest first)

**Request:**
```
GET /policy/aggregated
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "userName": "Mustafa",
      "userEmail": "mustafa@example.com",
      "totalPolicies": 3,
      "policies": [
        {
          "policyNumber": "POL-2024-001",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2025-01-01T00:00:00.000Z",
          "category": "Auto Insurance",
          "carrier": "ABC Insurance Co"
        },
        {
          "policyNumber": "POL-2024-002",
          "startDate": "2024-02-01T00:00:00.000Z",
          "endDate": "2025-02-01T00:00:00.000Z",
          "category": "Home Insurance",
          "carrier": "XYZ Insurance Ltd"
        }
      ]
    }
  ],
  "totalUsers": 1
}
```

---

## Task 2: Monitoring & Services

### 1. CPU Monitoring Service with PM2 Auto-Restart

**Location:** `services/cpuMonitor.js`

**Purpose:** Monitor real-time CPU usage and auto-restart server when threshold exceeded

**Configuration:**
```javascript
const CPU_THRESHOLD = 70;      // % usage threshold
const CHECK_INTERVAL = 5000;   // Check interval (5 seconds)
```

**How it works:**
1. Starts automatically when server launches
2. Monitors CPU usage every 5 seconds
3. Calculates usage across all CPU cores
4. If CPU usage ≥ 70%, server exits with code 1
5. **PM2 detects the exit and automatically restarts the process**
6. Logs CPU metrics to console with timestamps

**PM2 Integration:**
- **Auto-restart:** Enabled via `ecosystem.config.js`
- **Max restarts:** 10 attempts before giving up
- **Min uptime:** 10 seconds before considering startup successful
- **Memory limit:** 500MB (auto-restart if exceeded)
- **Graceful shutdown:** 5 second timeout before force-kill

**Console Output Example:**
```
[CPU Monitor] Started - Threshold: 70%, Check Interval: 5000ms
[CPU Monitor] Current Usage: 45.23%
[CPU Monitor] Current Usage: 52.15%
[CPU Monitor] Current Usage: 71.89%
[ALERT] CPU usage exceeded 70% (71.89%) - Server will restart via PM2

App <tech> exited with code 1 via signal SIGTERM
App <tech> restarted
```

**View CPU monitoring logs in real-time:**
```bash
npm run pm2:logs
```

---

### 2. Message Scheduling Service

**Endpoint:** `POST /services/messages`

**Purpose:** Schedule messages to be delivered at a specific date and time

**Implementation:**
- Pre-saves message to MongoDB
- Uses Node.js `setTimeout` for scheduling
- Validates future date/time
- Non-blocking scheduling

**Request Body:**
```json
{
  "message": "Your policy renewal is due",
  "day": "2024-12-25",
  "time": "14:30"
}
```

**Date/Time Format:**
- `day`: YYYY-MM-DD (ISO date)
- `time`: HH:mm (24-hour format)

**Response:**
```json
{
  "success": true,
  "message": "Message scheduled successfully",
  "scheduledAt": "2024-12-25T14:30:00.000Z"
}
```

**Error Responses:**

Missing parameters:
```json
{
  "success": false,
  "message": "message, day and time are required"
}
```

Invalid date/time format:
```json
{
  "success": false,
  "message": "Invalid date or time"
}
```

Date/time in the past:
```json
{
  "success": false,
  "message": "Date and time must be in the future"
}
```

**Message Model (MongoDB):**
```javascript
{
  message: String,        // Message content
  scheduledAt: Date,     // Delivery time
  createdAt: Date,       // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

---

## Project Structure

```
tech/
├── config/
│   └── db.js                    # MongoDB connection configuration
├── controllers/
│   ├── policy.controller.js     # Upload, search, aggregation logic
│   └── message.controller.js    # Message scheduling logic
├── models/
│   ├── agent.model.js
│   ├── user.model.js
│   ├── userAccount.model.js
│   ├── policyCategory.model.js
│   ├── policyCarrier.model.js
│   ├── policyInfo.model.js
│   └── message.model.js
├── routes/
│   ├── policy.routes.js         # Policy upload, search, aggregation endpoints
│   └── message.routes.js        # Message scheduling endpoints
├── services/
│   ├── cpuMonitor.js            # CPU monitoring and auto-restart
│   └── messageScheduler.js      # Message scheduling logic
├── workers/
│   └── upload.worker.js         # Worker thread for file processing
├── logs/                        # PM2 log files
├── uploads/                     # Directory for uploaded files
├── ecosystem.config.js          # PM2 configuration file
├── PM2_SETUP.md                 # PM2 setup guide
├── README.md                    # This file
├── package.json                 # Dependencies
├── data-sheet.csv               # Sample data file
└── index.js                     # Main server entry point
```

---

## Setup & Installation

### Prerequisites
- **Node.js** 16 or higher
- **MongoDB** running (locally or remote connection)
- **npm** package manager

### Installation Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file in project root:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/tech
NODE_ENV=development
```

3. **Start the server:**

**Option A: With PM2 (Recommended for Production)**
```bash
npm start
```
This starts the application with PM2, which automatically restarts the server when CPU usage exceeds 70%.

**Option B: Development Mode (Direct Node)**
```bash
npm run dev
```
This runs the server directly without PM2.

Server will run on `http://localhost:5000`

### PM2 Management Commands

Once running with PM2, use these commands:

```bash
npm run pm2:stop      # Stop the application
npm run pm2:restart   # Restart the application
npm run pm2:logs      # View real-time logs
npm run pm2:kill      # Kill all PM2 processes
```

For detailed PM2 setup and configuration, see [PM2_SETUP.md](./PM2_SETUP.md)

---

## API Testing

### Health Check
```bash
curl http://localhost:5000/
```

### Upload CSV/XLSX Data
```bash
curl -X POST \
  -F "file=@data-sheet.csv" \
  http://localhost:5000/policy/upload
```

### Search Policy by Username
```bash
curl "http://localhost:5000/policy/search?username=mustafa@example.com"
```

### Get Aggregated Policies
```bash
curl http://localhost:5000/policy/aggregated
```

### Schedule a Message
```bash
curl -X POST http://localhost:5000/services/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Reminder: Policy expires in 30 days",
    "day": "2024-12-25",
    "time": "09:00"
  }'
```

---

## Key Features

✅ **Asynchronous File Processing** - Worker threads handle bulk imports without blocking  
✅ **Bulk Database Operations** - Efficient bulk writes for large datasets  
✅ **Data Deduplication** - Prevents duplicate records during import  
✅ **CPU Monitoring** - Real-time monitoring with automatic server restart  
✅ **Message Scheduling** - Schedule messages for future delivery  
✅ **Collection Relationships** - Automatic linking between collections  
✅ **Error Handling** - Comprehensive validation and error responses  
✅ **MongoDB Integration** - Full integration with Mongoose ODM  

---

## How Data Import Works

**Step-by-step process:**

1. **Upload** - Client sends XLSX/CSV file via POST request
2. **Spawn Worker** - Main thread creates worker thread with file path
3. **Read & Parse** - Worker reads file using `xlsx` library
4. **Normalize** - Column names converted to lowercase, trimmed
5. **Deduplicate** - Map data structure prevents duplicates
6. **Process** - Data organized into 6 collection types
7. **Lookup** - Creates ID mappings for relationships
8. **Bulk Insert** - Performs bulk upsert operations on MongoDB
9. **Relationships** - Links records across collections
10. **Response** - Worker sends statistics back to main thread

---

## Monitoring

### CPU Usage Logs
The CPU monitor continuously logs usage:
```
CPU Usage: 35.42%
CPU Usage: 42.18%
CPU Usage: 71.23%
[ERROR] CPU usage exceeded 70% - Server will restart
```

### Message Scheduler Logs
Messages are logged when scheduled and delivered:
```
Message scheduled for delivery at 2024-12-25T14:30:00Z
Message delivered successfully
```

---

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **multer** - File upload handling
- **xlsx** - Excel/CSV parsing
- **dotenv** - Environment variable management
- **worker_threads** - Node.js built-in for async processing
- **os** - Node.js built-in for CPU monitoring

---

## Support

For issues or questions:
1. Check `.env` configuration
2. Verify MongoDB connection
3. Review console logs for error details
4. Ensure file format matches expected CSV columns
5. Verify date/time format (YYYY-MM-DD and HH:mm)

---

## Notes

- Messages are stored in database before scheduling
- File uploads return 202 Accepted (asynchronous processing)
- All timestamps use ISO 8601 format
- Email addresses are case-insensitive
- Worker thread closes automatically after processing
- CPU monitor checks every 5 seconds
