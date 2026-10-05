# RoleReady

RoleReady is a full-stack job-readiness planner. Create an account, add one or more candidate profiles, choose each candidate's target role, and track their skills and experience. Each candidate gets a readiness score, actionable recommendations, saved assessment history, and downloadable PDF reports. Candidate profiles are stored under the authenticated account in MongoDB.

## Stack

- React, Vite, and Tailwind CSS
- Node.js and Express
- MongoDB and Mongoose
- JWT authentication with bcrypt password hashing
- jsPDF report generation

## Getting started

Requirements: Node.js 18+ and a MongoDB connection (local MongoDB or MongoDB Atlas).

1. Install dependencies from the project root:

   ```bash
   npm install
   ```
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a long, random `JWT_SECRET`.
   If your system DNS blocks MongoDB Atlas SRV lookups, optionally set `MONGODB_DNS_SERVERS` to comma-separated resolver IPs (for example `8.8.8.8,1.1.1.1`). This changes DNS resolution for the API process only.
3. Start the client and API together:

   ```bash
   npm run dev
   ```
4. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The Vite development server proxies `/api` requests to Express on port 5000. For a production build, run `npm run build`; start the API with `npm start`.

## User journey

Register or sign in, add a candidate's name, gender, and qualification, select their target role, enter proficiency for role-specific skills and optional project/certification details, then add or skip a mock-test score. The app previews readiness; save the assessment to keep it in that candidate's history, download a PDF, or return home to assess another candidate under the same login.

## Readiness scoring

Each assessment scores role-specific skill coverage (65%), projects (15%), certifications (10%), and optional mock-test performance (10%). Skill coverage is calculated from the learner's selected proficiency; "Not yet" is scored as zero. Project and certification points are capped at three and two respectively. If no mock-test score is supplied, the remaining weights are normalized so that the missing optional test does not lower the result. Skill gaps and learning recommendations are generated for the selected role.

This score is a planning aid, not a hiring guarantee. Skills are self-reported and recommendations should be reviewed against current job postings.
