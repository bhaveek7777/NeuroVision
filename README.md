# NeuroVision
### Smart Dynamic AI-Assisted Attendance Management System

**NeuroVision** is an enterprise-grade, presentation-ready AI-assisted attendance management platform engineered for modern colleges and universities.

It bridges the gap between raw computer vision and institutional administration through a robust 6-pillar framework:
$$\text{AI Pipeline} + \text{Faculty Verification} + \text{Cryptographic Record Locking} + \text{Parent Communication} + \text{Governance Audit Trails} + \text{Predictive Analytics}$$

---

## 🌟 Key Architecture & Differentiators

Unlike traditional face-recognition demos that simply output a binary list of names, **NeuroVision** addresses real-world classroom challenges:
1. **AI Face Detection & Biometric Embeddings**: Ingests classroom group images, locates faces via InsightFace Buffalo_L, extracts 512-dimensional normalized embeddings, and computes cosine similarities against registered student profiles.
2. **Confidence Tier Matrix**:
   - **High Confidence ($\ge 90\%$)**: Green border, auto-flagged as Present.
   - **Medium Confidence ($75\% - 89\%$)**: Blue border, matched with standard threshold.
   - **Needs Review ($< 75\%$)**: Amber glowing pulse, flags human instructor for verification (e.g. poor image angle, backlight).
3. **Faculty Verification & Human-in-the-Loop Override**: Instructors can review low-confidence cases, correct detection errors, and provide mandatory audit reasons (*"Poor image quality"*, *"Student manually verified"*, etc.).
4. **Cryptographic Attendance Locking (`🔒 ATTENDANCE LOCKED`)**: Once confirmed, attendance sessions lock permanently. Teachers cannot directly overwrite records; subsequent alterations require formal administrative modification requests.
5. **Real-Time Parent Communication Simulator**: Dispatches instantaneous SMS, WhatsApp, and Email alerts to registered parents upon attendance lock (Present notifications, Absence alerts, and Low Attendance Warnings).
6. **Administrative Governance & Anomaly Detection**: Tracks low-attendance defaulters below the configurable threshold (default 75%), manages faculty petitions, exports accredited PDF/Excel reports, and maintains an immutable audit log.

---

## 🚀 Quick Start & Live Demonstration

### Demo Credentials (One-Click Fill Available on Login)
| Role | Portal / Email | Password | Default Persona |
| :--- | :--- | :--- | :--- |
| **Faculty (Teacher)** | `teacher@neurovision.com` | `teacher123` | **Prof. Ramesh Sharma** (DBMS, Lab 304) |
| **Administrator** | `admin@neurovision.com` | `admin123` | **Dr. Arvind Kulkarni** (Academic Dean) |

> **Presentation Tip**: Use the floating **"Demo Role" pill** at the bottom-right corner or top navigation bar to seamlessly toggle between Teacher and Admin dashboards without logging out!

### Running Locally
```bash
# 1. Start the Node.js REST API Backend (Port 5000)
cd server
npm install
node server.js

# 2. Start the React + TypeScript + Tailwind Frontend (Port 5173 / 5174)
cd ../frontend
npm install
npm run dev
```

- **Frontend**: `http://localhost:5174/` (or `5173`)
- **Backend API**: `http://localhost:5000/api/health`

---

## 📋 Recommended Presentation Demonstration Scenario

Follow these steps for a live presentation or evaluation:

1. **Faculty Login**:
   - Select **Teacher Portal**, click **"Teacher Demo"** to auto-fill credentials, and log in.
2. **Active Lecture Card**:
   - On the Teacher Dashboard, locate today's targeted session: **"DBMS — Division C — 10:00 AM"** (Smart Lab 304).
   - Click **`MARK ATTENDANCE`**.
3. **Step 1: Lecture Details**:
   - Verify auto-filled details for DBMS (Lecture 24, 50 enrolled students). Click **Continue to Verification**.
4. **Step 2: Classroom & Beacon Verification**:
   - Confirm dual-factor location beacon check (`Smart-Lab-304-Beacon: 0.8m`). Click **Proceed to Image Upload**.
5. **Step 3: Capture / Select Classroom Frame**:
   - Click on preset **"Classroom Pic 1 (Full Lab)"** or upload any group classroom photo.
   - Click **`START AI PROCESSING`**.
6. **Step 4: AI Radar & Feature Extraction Pipeline**:
   - Watch the animated radar scan, progress meter, and live counters:
     - *42 Students Detected*
     - *39 High Confidence ($\ge 90\%$)*
     - *3 Need Verification ($< 75\%$)*
7. **Step 5: Interactive Verification & Manual Correction**:
   - Inspect the interactive classroom canvas with detected student bounding boxes.
   - Click **"Filter Review Cases"** to isolate the 3 flagged students (Rahul Patil, Rohan More, Vikram Singh).
   - Click **Manual Edit** on **Rohan More**, mark as **Present**, choose reason *"Poor image quality"*, and apply.
   - Note the status update to **Manually Modified**.
   - Click **`CONFIRM & SUBMIT ATTENDANCE`**.
8. **Step 6: Attendance Locking & Parent Dispatch Simulation**:
   - Enjoy the celebratory feedback, generated session ID (`ATT-20260928-DBMS-C`), and **`🔒 ATTENDANCE LOCKED`** security badge.
   - Click **"Simulate Parent Notifications"** to preview the live smartphone alert sent to parents via WhatsApp/SMS!
9. **Switch to Admin Portal**:
   - Click **"Admin"** in the bottom-right demo role switcher.
   - Observe the updated stats (**42 Present, 8 Absent, 84% Attendance**).
   - Inspect the **Low Attendance Defaulters Watchlist** (highlighting Rahul Patil at 68% in DBMS).
   - Open **Audit Logs** to view the immutable event trail.
   - Open **Modification Requests** to test approving or rejecting faculty requests.

---

## 🗄️ Database Models & Schema

The application is structured with PostgreSQL/Supabase-ready schemas:

- `users` (id, name, email, role, department, designation, avatar)
- `students` (id, student_id, roll_no, name, class_id, division, parent_name, parent_phone, parent_pref, overall_attendance, subject_attendance)
- `teachers` (id, teacher_id, name, email, assigned_subjects, assigned_classes, assigned_divisions)
- `classes` & `divisions` & `subjects`
- `timetable` (id, lecture_no, subject, class_name, division, classroom, teacher_name, start_time, end_time)
- `attendance_sessions` (id, lecture_id, subject, class_name, division, classroom, present_count, absent_count, is_locked, locked_at)
- `attendance_records` (id, session_id, student_id, student_name, roll_no, status, confidence_score, verification_status, modified, modification_reason)
- `attendance_modifications` (id, request_id, session_id, student_id, previous_status, requested_status, reason, status, admin_comment)
- `audit_logs` (id, user, role, action, affected_student, previous_value, new_value, reason, date, time)
- `notifications` (id, type, title, message, recipient_type, channel, status, timestamp)
- `settings` (min_attendance_threshold, ai_confidence_high_threshold, ai_confidence_medium_threshold, parent_channels, academic_year)

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas-Confetti, Vite
- **Backend**: Node.js, Express, REST Architecture, Multer
- **Computer Vision Model Layer**: InsightFace Buffalo_L (512-d ArcFace embeddings) with fallback simulated detection matrix
- **Styling**: Sleek dark futuristic glassmorphism, responsive desktop & tablet layouts
