# Chiba Education Center — Platform Documentation

**Version:** 1.0  
**Date:** January 2025  
**Prepared by:** Anjef Dangol  
**Client:** Chiba Education Center, Nepal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Feature Guide](#4-feature-guide)
5. [Testing Checklist](#5-testing-checklist)
6. [Technical Architecture](#6-technical-architecture)
7. [Deployment Information](#7-deployment-information)
8. [Support & Maintenance](#8-support--maintenance)

---

## 1. Executive Summary

The Chiba Education Center Platform is a complete consultancy management system designed for Nepal-based education consultancies that send students to Japan.

### Key Features
- 📋 Lead management (with Google Forms integration)
- 👨‍🎓 Student lifecycle management
- 📄 Document verification workflow
- 💰 Finance & invoicing
- 🏫 Class management with attendance (QR + manual)
- 📊 Reports & analytics
- 🔔 Multi-channel notifications (in-app, email, push)
- 📱 Progressive Web App (installable on phones)

### Technology Stack
- **Backend:** Node.js + TypeScript + MongoDB Atlas + Redis
- **Frontend:** Next.js 15 + React 18 + Tailwind CSS
- **Storage:** Cloudflare R2 (documents), Cloudinary (images)
- **Email:** Resend
- **Hosting:** Render (backend) + Vercel (frontend)

---

## 2. System Overview

### Access URLs
- **Production Frontend:** https://webchiba.vercel.app
- **Production Backend:** https://chiba-api.onrender.com
- **Admin Login:** admin@chibaeducation.com

### System Architecture
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Web App │────────▶│ API Server │────────▶│ MongoDB │
│ (Vercel) │ HTTPS │ (Render) │ │ (Atlas) │
└──────────────┘ └──────────────┘ └──────────────┘
│
▼
┌──────────────┐
│ Redis Cache │
│ (Upstash) │
└──────────────┘
│
▼
┌──────────────────────────────┐
│ Cloudflare R2 | Cloudinary │
│ Resend Email | Web Push │
└──────────────────────────────┘

---

## 3. User Roles & Permissions

The system supports 6 primary roles:

| Role | Description | Access Scope |
|------|-------------|--------------|
| **Super Admin** | Full system access | Organization-wide |
| **Admin** | Management access | Organization-wide |
| **Branch Manager** | Manages one branch | Single branch |
| **Counselor** | Handles leads/students | Single branch |
| **Teacher** | Manages classes | Own classes only |
| **Student** | Portal access | Own data only |

### Permission Highlights

**Super Admin can:**
- Manage all branches, users, roles
- View all data across organization
- Configure system settings
- Access audit logs

**Branch Manager can:**
- Manage users within branch
- View branch statistics
- Approve documents
- Transfer students

**Counselor can:**
- Create/manage leads
- Convert leads to students
- Schedule counseling
- Upload documents

**Student can:**
- View own profile, application
- Upload required documents
- View fees & payment history
- Access attendance QR
- See journey progress

---

## 4. Feature Guide

### 4.1 Lead Management

**Purpose:** Track potential students from first contact to enrollment.

**Key Features:**
- Manual lead creation
- Google Forms auto-intake
- Status tracking (New → Contacted → Qualified → Converted)
- Counselor assignment
- Source tracking

**How to Use:**
1. Navigate to **Leads** in sidebar
2. Click **+ New Lead**
3. Fill personal info, education, preferences
4. Assign counselor (optional)
5. Save

**Google Forms Integration:**
- Public form URL: [your Google Form link]
- Auto-creates lead when submitted
- Sends confirmation email to student
- Notifies admin of new lead

---

### 4.2 Student Management

**Purpose:** Manage active students through their entire journey.

**Key Features:**
- Convert leads to students
- Complete profile management
- Referral tracking
- Branch transfers
- Archive/reactivate

**Student Fields:**
- Personal information
- Contact details
- Emergency contact
- Passport information
- Educational background
- Assigned counselor
- Referred by (other student)

---

### 4.3 Application Management

**Purpose:** Track visa applications through stages.

**Application Workflow:**
Draft → Documents Under Review → Ready to Submit
→ Submitted → Interview → Approved / Rejected

**Features:**
- One active application per student
- Program & school assignment
- Intake year/month tracking
- Status change with audit trail
- Automatic notifications on status change

---

### 4.4 Document Management

**Purpose:** Verify and approve student documents.

**Document Statuses:**
- **Submitted:** Uploaded by student
- **Under Review:** Being verified
- **Verified:** Passed initial check
- **Approved:** Final approval
- **Rejected:** Failed verification
- **Resubmission Required:** Student needs to re-upload

**Workflow:**
1. Student uploads document
2. Counselor marks "Under Review"
3. Counselor verifies OR rejects
4. Branch Manager gives final approval
5. Rejected documents → student notified to re-upload

---

### 4.5 Finance & Invoicing

**Purpose:** Manage student fees and payments.

**Features:**
- Create invoices with line items
- Record payments (multiple methods)
- Track outstanding balances
- Overdue invoice alerts
- Void payments (with reason)
- Automatic email receipts

**Payment Methods Supported:**
- Cash
- Bank Transfer
- Cheque
- Online (eSewa, Khalti, etc.)

---

### 4.6 Class Management

**Purpose:** Manage classes and enroll students.

**Features:**
- Create classes with schedule
- Assign teachers
- Enroll/unenroll students
- Weekly recurring schedule
- Room assignments
- Multiple statuses (Active, Completed, Cancelled)

---

### 4.7 Attendance Tracking

**Purpose:** Track daily attendance via QR or manual entry.

**Two Methods:**

**QR Scan (Automatic):**
1. Student shows QR code from `/my/qr` page
2. Teacher scans with device
3. Attendance auto-recorded as PRESENT

**Manual Entry:**
1. Go to **Attendance** page
2. Click **Mark Manual**
3. Select class
4. Mark each student: Present / Absent / Late / Leave
5. Bulk actions: "All Present", "All Absent"
6. Save

**Attendance Statuses:**
- PRESENT
- ABSENT
- LATE
- LEAVE

---

### 4.8 Reports & Analytics

**Available Reports:**
- Overview (leads, students, applications, active)
- Lead conversion rate (by source, monthly)
- Application pipeline (by status, success rate)
- Finance summary (invoiced, collected, outstanding)
- Attendance summary (rate, by status)

Access via **Reports** in sidebar.

---

### 4.9 Notifications

**Three Channels:**

| Channel | When | Where |
|---------|------|-------|
| In-App | Every event | Bell icon in top nav |
| Email | Critical events | User's email inbox |
| Push | HIGH priority events | Desktop/mobile banner |

**Events that trigger notifications:**
- Application status change
- Document verified/rejected
- Invoice created
- Payment received
- Counseling scheduled
- Announcement broadcast

---

### 4.10 Announcements (Broadcast)

**Purpose:** Send messages to multiple users at once.

**Audience Options:**
- All users
- All students
- All staff
- By branch
- By role

**Categories:**
- 🎉 Holiday
- 📅 Event
- 📢 Notice
- 💬 General

---

### 4.11 Student Portal

Students have their own dashboard with:
- Journey progress bar (visual milestone tracker)
- Application status
- Fees summary (paid vs outstanding)
- Attendance rate (last 30 days)
- Document upload
- QR code for attendance
- Counselor contact
- Notifications

---

## 5. Testing Checklist

Use this checklist before going live with the client.

### 5.1 Authentication Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Login (valid) | Enter admin@chibaeducation.com + password | Redirect to dashboard | ☐ |
| Login (invalid) | Wrong password | Error message shown | ☐ |
| Forgot Password | Click forgot → enter email | Email received with reset link | ☐ |
| Reset Password | Click reset link → new password | Login works with new password | ☐ |
| Account Activation | New user gets invite email | Can activate + set password | ☐ |
| Logout | Click Sign Out | Redirect to login page | ☐ |
| Session Persistence | Refresh page after login | Stays logged in | ☐ |
| MFA (if enabled) | Login → enter OTP | Access granted | ☐ |

### 5.2 Lead Management Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Create lead | Fill form → Save | Lead appears in list | ☐ |
| Edit lead | Click lead → Edit → Save | Changes persist | ☐ |
| Change status | Change from NEW to CONTACTED | Status updated + audit log | ☐ |
| Assign counselor | Select counselor → Assign | Counselor shown on lead | ☐ |
| Google Form intake | Submit test form | Lead auto-created | ☐ |
| Delete lead | Click delete → confirm | Lead removed | ☐ |
| Filter leads | Filter by status | Only matching leads shown | ☐ |
| Search leads | Search by name/phone | Matching leads shown | ☐ |

### 5.3 Student Management Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Convert lead | Lead → Convert to Student | User account created + email sent | ☐ |
| Create student direct | + New Student → Fill → Save | Student created + invitation sent | ☐ |
| Student receives email | Check test email | Invitation email arrives | ☐ |
| Student activates account | Click activation link | Can set password + login | ☐ |
| Add referrer | Create student with referrer | Referrer shows on profile | ☐ |
| Transfer student | Transfer to another branch | New branch reflected | ☐ |
| Archive student | Archive → Confirm | Status = ARCHIVED | ☐ |

### 5.4 Application Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Create application | Student → New Application | Application number generated | ☐ |
| Change status | Move to APPROVED | Email + notification sent to student | ☐ |
| One active app rule | Try creating 2nd active app | Error: "already has active app" | ☐ |
| Quick complete | Use quick complete feature | All required fields filled | ☐ |

### 5.5 Document Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Upload document | Select file → Upload | Document appears in list | ☐ |
| View document | Click document | Signed URL opens | ☐ |
| Mark under review | Click Under Review | Status changes | ☐ |
| Verify document | Click Verify | Status = VERIFIED | ☐ |
| Reject document | Reject with reason | Student gets email | ☐ |
| Request resubmission | Click Request Resubmission | Student notified | ☐ |
| Upload new version | Upload → new file | Version count increases | ☐ |

### 5.6 Finance Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Create invoice | Student → New Invoice → Save | Invoice created + email sent | ☐ |
| Record payment | Invoice → Record Payment | Balance reduces | ☐ |
| Partial payment | Pay less than total | Status = PARTIALLY_PAID | ☐ |
| Full payment | Pay full amount | Status = PAID | ☐ |
| Void payment | Void with reason | Payment marked void | ☐ |
| Overdue detection | Wait past due date | Marked overdue in list | ☐ |
| Student sees fees | Login as student → /my/fees | All invoices visible | ☐ |

### 5.7 Class & Attendance Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Create class | Fill form → Save | Class created | ☐ |
| Enroll students | Add students to class | Students appear enrolled | ☐ |
| Unenroll student | Remove student | Student removed | ☐ |
| Manual attendance | Mark Manual → Class → Mark all Present → Save | Attendance recorded | ☐ |
| QR scan | Student shows QR → scan | Attendance recorded | ☐ |
| Duplicate prevention | Mark twice for same day | Error shown | ☐ |
| Attendance visible to student | Student → /my/attendance | Records shown | ☐ |
| Attendance in dashboard | Check /my/dashboard | Attendance % updated | ☐ |

### 5.8 Notifications Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| In-app notification | Trigger event (e.g. approve doc) | Bell icon shows count | ☐ |
| Email notification | Trigger critical event | Email received | ☐ |
| Push notification | Enable push → trigger HIGH event | Browser banner shows | ☐ |
| Mark as read | Click notification | Count decreases | ☐ |
| Mark all read | Click mark all read | All notifications read | ☐ |
| Announcement | Send announcement to All | All users receive it | ☐ |

### 5.9 Reports Testing

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| Overview report | Navigate to Reports | Numbers match reality | ☐ |
| Lead conversion | Check conversion rate | Correctly calculated | ☐ |
| Finance summary | Check totals | Match invoice sums | ☐ |
| Attendance summary | Check rate | Matches manual count | ☐ |

### 5.10 Mobile Responsive Testing

| Test | Device | ✓ |
|------|--------|---|
| Login page | iPhone Safari | ☐ |
| Dashboard | iPhone Safari | ☐ |
| Tables scroll horizontally | iPhone Safari | ☐ |
| Dialogs fit screen | iPhone Safari | ☐ |
| Sidebar toggle | iPhone Safari | ☐ |
| QR code display | iPhone Safari | ☐ |
| Login persists | iPhone Safari | ☐ |
| Same on Android | Chrome Android | ☐ |

### 5.11 Permission Testing

| Role | Test | Expected | ✓ |
|------|------|----------|---|
| Counselor | Try accessing /users | Access denied | ☐ |
| Teacher | Try accessing /leads | Access denied | ☐ |
| Student | Try accessing /dashboard | Redirected to /my/dashboard | ☐ |
| Branch Manager | See other branch data | Only own branch shown | ☐ |

---

## 6. Technical Architecture

### 6.1 Backend Stack
- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Cache:** Upstash Redis
- **Auth:** Session-based (cookies) + JWT for QR

### 6.2 Frontend Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** React 18 + Tailwind CSS
- **Components:** shadcn/ui
- **State:** TanStack Query (React Query)
- **Forms:** react-hook-form + Zod

### 6.3 Storage & Services
- **Documents:** Cloudflare R2 (S3-compatible)
- **Images:** Cloudinary
- **Email:** Resend
- **Push:** VAPID Web Push

### 6.4 Security
- Password hashing: Argon2
- Session cookies: HttpOnly, Secure, SameSite=None
- CORS: Whitelist-based
- Rate limiting: 100 req/15 min
- Login rate limit: 5 attempts/15 min
- Encrypted at rest: MongoDB Atlas encryption
- HTTPS everywhere

---

## 7. Deployment Information

### 7.1 Production URLs
- **Frontend:** https://webchiba.vercel.app
- **Backend API:** https://chiba-api.onrender.com

### 7.2 Environment Variables

**Backend (Render):**

NODE_ENV=production
MONGODB_URI=[MongoDB Atlas connection string]
REDIS_URL=[Upstash Redis URL]
SESSION_SECRET=[Random 64-char string]
JWT_SECRET=[Random 64-char string]
ENCRYPTION_KEY=[Random 32-byte string]
RESEND_API_KEY=[Resend API key]
CLOUDFLARE_R2_=[R2 credentials]
CLOUDINARY_=[Cloudinary credentials]
VAPID_PUBLIC_KEY=[Web push public]
VAPID_PRIVATE_KEY=[Web push private]
LEAD_INTAKE_API_KEY=[Random API key for Google Forms]
COOKIE_SECURE=true
COOKIE_SAMESITE=none
CORS_ALLOWED_ORIGINS=https://webchiba.vercel.app

**Frontend (Vercel):**
NEXT_PUBLIC_API_BASE_URL=https://chiba-api.onrender.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[Same as backend]


### 7.3 Third-Party Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| MongoDB Atlas | Database | 512 MB free |
| Upstash Redis | Caching | 10k commands/day free |
| Render | Backend hosting | Free tier (sleeps) or $7/mo |
| Vercel | Frontend hosting | Free tier generous |
| Cloudflare R2 | Document storage | 10 GB free |
| Cloudinary | Image storage | 25 GB free |
| Resend | Email sending | 3k emails/month free |
| Cron-Job.org | Keep-alive pings | Free |

### 7.4 Domain Setup (Optional)
- Point domain to Vercel: A record → 76.76.21.21
- Custom API subdomain: CNAME → chiba-api.onrender.com

---

## 8. Support & Maintenance

### 8.1 Regular Tasks

**Daily:**
- Monitor uptime (UptimeRobot alerts)
- Check for failed notifications in logs

**Weekly:**
- Review audit logs for suspicious activity
- Check MongoDB storage usage
- Review Render/Vercel usage

**Monthly:**
- Update dependencies (`npm outdated`)
- Backup MongoDB (via Atlas snapshot)
- Review email delivery in Resend dashboard

### 8.2 Common Issues & Fixes

**Issue: Users can't log in on iPhone Safari**
- Check `COOKIE_SAMESITE=none` in Render env
- Check `COOKIE_SECURE=true` in Render env
- Check `CORS_ALLOWED_ORIGINS` matches frontend URL exactly (no trailing slash)

**Issue: Emails not sending**
- Verify Resend API key valid
- Check Resend dashboard for send failures
- Confirm sender domain verified in Resend

**Issue: Documents not uploading**
- Check R2 credentials in env
- Check R2 bucket CORS policy
- Verify file size under limit

**Issue: Push notifications not working**
- Confirm VAPID keys match (backend + frontend)
- User must accept notification permission
- Brave browser: enable "Use Google services for push messaging"

**Issue: First page load is slow**
- Render free tier sleeps → upgrade to Starter ($7/mo)
- OR use cron-job.org to ping every 10 min

### 8.3 Contact & Support

**Developer:** Anjef Dangol  
**Website:** https://www.anjef.com.np/  
**For technical issues:** [your email]  
**Response time:** Within 24 hours business days

---

## Appendix A: Change Log

**Version 1.0 (January 2025)**
- Initial release
- Full lead-to-student pipeline
- Document workflow
- Finance module
- Attendance (QR + Manual)
- Reports
- Notifications (in-app + email + push)
- Google Forms integration
- iOS Safari support

---

**End of Documentation**

*This document is confidential and prepared exclusively for Chiba Education Center.*