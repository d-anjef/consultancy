# Google Forms → Auto Lead Intake Setup Guide

## Overview

When someone fills a Google Form, the data automatically creates a lead
in the Chiba Education Center system.

## Step 1: Create Google Form

Create a Google Form with these fields (names must match exactly):

| Field Label | Type | Required |
|---|---|---|
| First Name | Short answer | Yes |
| Last Name | Short answer | Yes |
| Phone | Short answer | Yes |
| Email | Short answer | No |
| Interested Program | Dropdown | No |
| Notes | Paragraph | No |

## Step 2: Create Google Apps Script

1. Open your Google Form
2. Click the three dots (⋮) → Script editor
3. Delete everything and paste the script from `google-apps-script.js` below
4. Update the `API_URL` and `API_KEY` values
5. Click Save
6. Click Run → `onFormSubmit` (to test permissions)
7. Authorize the script when prompted

## Step 3: Set Up Trigger

1. In Script Editor → Triggers (clock icon on left)
2. Click "+ Add Trigger"
3. Function: `onFormSubmit`
4. Event source: From form
5. Event type: On form submit
6. Click Save

## Step 4: Get API Key

Your API key is in your backend `.env` file: