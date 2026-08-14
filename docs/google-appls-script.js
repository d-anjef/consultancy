/**
 * Google Apps Script for Chiba Education Center
 * Auto-creates leads from Google Form submissions.
 *
 * SETUP:
 * 1. Replace API_URL with your actual backend URL
 * 2. Replace API_KEY with your LEAD_INTAKE_API_KEY from .env
 * 3. Replace BRANCH_CODE with your default branch code (e.g., "BRN-KTM-01")
 */

// ─── CONFIGURATION ─────────────────────────────────────
var API_URL = 'https://YOUR_BACKEND_URL/api/v1/leads/intake';
var API_KEY = 'YOUR_LEAD_INTAKE_API_KEY';
var BRANCH_CODE = 'BRN-KTM-01'; // Default branch for form leads
// ─────────────────────────────────────────────────────────

/**
 * Triggered when form is submitted.
 * Maps form responses to lead fields and sends to API.
 */
function onFormSubmit(e) {
  try {
    var responses = e.response.getItemResponses();

    var data = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      source: 'GOOGLE_FORM',
      branchCode: BRANCH_CODE,
      notes: '',
      formId: e.response.getId(),
      externalRef: 'google-form-' + e.response.getId(),
    };

    // Map form responses to data fields
    for (var i = 0; i < responses.length; i++) {
      var title = responses[i].getItem().getTitle().toLowerCase().trim();
      var answer = responses[i].getResponse();

      if (!answer) continue;

      if (title.includes('first name') || title === 'first name') {
        data.firstName = answer.toString().trim();
      } else if (title.includes('last name') || title === 'last name') {
        data.lastName = answer.toString().trim();
      } else if (title.includes('phone') || title.includes('mobile') || title.includes('contact')) {
        data.phone = answer.toString().trim();
        // Add +977 prefix if not present
        if (data.phone && !data.phone.startsWith('+')) {
          data.phone = '+977' + data.phone;
        }
      } else if (title.includes('email')) {
        data.email = answer.toString().trim().toLowerCase();
      } else if (title.includes('program') || title.includes('interested')) {
        data.interestedProgram = answer.toString().trim();
      } else if (title.includes('note') || title.includes('message') || title.includes('comment')) {
        data.notes = answer.toString().trim();
      }
    }

    // Validate required fields
    if (!data.firstName || !data.phone) {
      Logger.log('ERROR: Missing required fields (firstName or phone)');
      Logger.log('Data: ' + JSON.stringify(data));
      return;
    }

    // If no last name, use first name
    if (!data.lastName) {
      data.lastName = data.firstName;
    }

    // Send to API
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': API_KEY,
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(API_URL, options);
    var statusCode = response.getResponseCode();
    var responseBody = response.getContentText();

    Logger.log('API Response [' + statusCode + ']: ' + responseBody);

    if (statusCode === 201 || statusCode === 200) {
      Logger.log('SUCCESS: Lead created for ' + data.firstName + ' ' + data.lastName);
    } else {
      Logger.log('ERROR: API returned ' + statusCode);
      Logger.log('Response: ' + responseBody);

      // Send email notification to admin about failed submission
      sendErrorNotification(data, statusCode, responseBody);
    }
  } catch (error) {
    Logger.log('EXCEPTION: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Send email to admin if form submission fails.
 */
function sendErrorNotification(data, statusCode, responseBody) {
  try {
    var adminEmail = 'admin@chibaeducation.com'; // Change this
    var subject = '[Chiba] Google Form Lead Intake Failed';
    var body =
      'A Google Form submission failed to create a lead.\n\n' +
      'Name: ' + data.firstName + ' ' + data.lastName + '\n' +
      'Phone: ' + data.phone + '\n' +
      'Email: ' + (data.email || 'N/A') + '\n\n' +
      'API Status: ' + statusCode + '\n' +
      'Response: ' + responseBody + '\n\n' +
      'Please check the system and create the lead manually if needed.';

    MailApp.sendEmail(adminEmail, subject, body);
  } catch (e) {
    Logger.log('Failed to send error notification: ' + e.toString());
  }
}

/**
 * Test function — run manually to verify API connection.
 */
function testApiConnection() {
  var testData = {
    firstName: 'Test',
    lastName: 'User',
    phone: '+9779800000000',
    email: 'test@example.com',
    source: 'GOOGLE_FORM',
    branchCode: BRANCH_CODE,
    notes: 'Test submission from Google Apps Script',
    formId: 'test-' + new Date().getTime(),
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': API_KEY,
    },
    payload: JSON.stringify(testData),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(API_URL, options);
  Logger.log('Test Response [' + response.getResponseCode() + ']: ' + response.getContentText());
}