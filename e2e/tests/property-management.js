// Owner flow: add a new property through the wizard, then edit its details.
//
// Assumes the app is already running (frontend on :3001, backend on :8080)
// with AUTH_DISABLED=true / NEXT_PUBLIC_AUTH_DISABLED=true so the dashboard
// is reachable as the seeded dummy owner without a real login. See
// backend/.env and frontend/.env.local.

describe('Owner property management', function () {
  const timestamp = Date.now();
  const propertyTitle = `E2E Test Property ${timestamp}`;
  const updatedTitle = `${propertyTitle} (edited)`;

  it('owner can add a new property through the wizard', function (browser) {
    browser
      .navigateTo('/dashboard/properties/new')
      .waitForElementVisible('[data-testid="wizard-step-details"]')

      // Step 1: Details
      .setValue('[data-testid="details-title"]', propertyTitle)
      .setValue('[data-testid="details-description"]', 'A lovely test listing created by Nightwatch.')
      .setValue('[data-testid="details-address"]', '221B Test Street')
      .setValue('[data-testid="details-city"]', 'Hyderabad')
      .setValue('[data-testid="details-state"]', 'Telangana')
      .click('[data-testid="details-continue"]')

      // Step 2: Pricing — submitting this creates the property record
      .waitForElementVisible('[data-testid="wizard-step-pricing"].on')
      .setValue('[data-testid="pricing-price"]', '4500000')
      .click('[data-testid="pricing-continue"]')

      // Step 3: Photos — skip, we're only testing the core flow here
      .waitForElementVisible('[data-testid="wizard-step-photos"].on', 15000)
      .click('[data-testid="photos-skip"]')

      // Step 4: Documents — reaching this step confirms the property was created
      .waitForElementVisible('[data-testid="wizard-step-documents"].on')
      .assert.textContains('.doc-card', 'Ownership Document');
  });

  it("owner can edit the property's details", function (browser) {
    browser
      .navigateTo('/dashboard/properties')
      .waitForElementVisible('.tbl')
      .assert.textContains('.tbl', propertyTitle)

      // Find the row for the property we just created and click its Edit link
      .useXpath()
      .click(`//tr[.//*[contains(text(), "${propertyTitle}")]]//*[@data-testid="property-edit-link"]`)
      .useCss()

      .waitForElementVisible('[data-testid="property-form-title"]')
      .assert.valueEquals('[data-testid="property-form-title"]', propertyTitle)
      .clearValue('[data-testid="property-form-title"]')
      .setValue('[data-testid="property-form-title"]', updatedTitle)
      .click('[data-testid="property-form-submit"]')

      // PropertyForm's onSuccess redirects back to /dashboard/properties
      .waitForElementVisible('.tbl')
      .assert.urlContains('/dashboard/properties')
      .assert.textContains('.tbl', updatedTitle)
      .end();
  });
});
