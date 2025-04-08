# Insomnia Web Application Test Automation
This repository contains automated tests for some of the Insomnia web application (app.insomnia.rest) using Playwright test framework.

## Table of Contents
- [Test Strategy](#test-strategy)
- [Playwright E2E Test Suites Covered](#playwright-e2e-test-suites-covered)
  - [Dashboard Tests](#dashboard-tests-dashboardspects)
  - [Settings Profile Tests](#settings-profile-tests-settings-profilespects)
  - [AI Runners Tests](#ai-runners-tests-ai-runnersspects)
  - [Accessibility Tests](#accessibility-tests-a11ysettingsprofilespects)
- [Quick Start](#quick-start)
  - [Local Environment Setup](#local-environment-setup)
  - [Generate Auth File](#generate-auth-file)
  - [Run All E2E Tests](#run-all-e2e-tests)
  - [Check Playwright Report and Trace](#check-playwright-report-and-trace)
- [GitHub Actions](#github-actions)
- [Test Results](#test-results)
- [To-do list](#to-do-list)


## Test Strategy
- Page Object Model (POM) and fixtures for testing app.insomnia.rest webpages
- Playwright for automation (e2e test suites covered in detail below)
- Shared account authentication in all tests (store authenticated browser state on the file system using context().storageState)
- Accessibility (a11y) testing for account profile page
- Manual testing for Insomnia macOS client
- Locale testing configured in playwright config

## Playwright E2E Test Suites Covered
### Dashboard Tests (dashboard.spec.ts)
- Verifies dashboard elements visibility
- Tests navigation functionality
- Validates welcome message format
- Tests download links functionality
- Verifies footer links

### Settings Profile Tests (settings-profile.spec.ts)
- Tests form validation functionality
- Verifies profile updates are reflected across the application
- Tests social media link validation
- Validates error message display

### AI Runners Tests (ai-runners.spec.ts)
- Verifies page elements visibility
- Tests LLM provider selection functionality
- Validates button and option availability

### Accessibility Tests (a11y.settingsProfile.spec.ts)
- Tests WCAG 2.1 AA compliance
- Verifies form elements have proper labels and descriptions
- Tests keyboard navigation functionality

## Quick Start
### Local Environment Setup
a. Installation
```bash
# Clone the repository, develop branch
git clone https://github.com/feiyingplus/insomnia-webpages.git
cd insomnia-webpages

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

b. Generate Auth File
he authentication state is stored in playwright/.auth/user.json and is used as a dependency for the e2e project.
To generate a new auth file (if needed):
```bash
# IMPORTANT: Run the following command to authenticate with your account 
# This will store the authenticated browser state on the file system using context().storageState
#('*****************************************************');
#  ('MANUAL LOGIN REQUIRED:');
#  ('1. Go to https://app.insomnia.rest/app/authorize login page.');
#  ('2. Click the one of the available Login options.');
#  ('3. COMPLETE the login MANUALLY in the browser window.');
#  ('4. Ensure you are redirected back to your application (https://app.insomnia.rest).');
#  ('5. Once logged in successfully, press Enter here to save the state.');
#  ('*****************************************************');
npm run auth
```
This will create the necessary authentication state file that will be used by all tests.

c. Run All E2E Tests
```bash
# Run all e2e tests after authentication
npm run test:e2e

# Run tests with specific tag e.g. @Negative
npx playwright test --project=e2e --grep @Negative

# codegen with auth file and goes to the login page
npx playwright codegen --load-storage=playwright/.auth/user.json https://app.insomnia.rest
```
d. Check Playwright Report and Trace
```bash
# Show HTML report
npx playwright show-report

# Open last trace for debugging
npx playwright show-trace test-results/trace.zip
```

## GitHub Actions
This project is configured to run tests automatically using GitHub Actions. The workflow is defined in .github/workflows/playwright.yml.
Key features of the CI setup:
- Runs on push to master and develop branches
- Runs on pull requests to master and develop branches
- Can be triggered manually via workflow_dispatch
- Uses Node.js 22
- Restores authentication state from GitHub Secrets
- Uploads test reports and traces as artifacts

To view test results in GitHub:
- Go to the Actions tab in the repository
- Select the latest workflow run
- Download the artifacts to view the test report and traces


##  Test Results
Issues found during the Playwright E2E automation and manual testing:
| No. | Issue Description | Screen Capture | Detail Steps |
|-----|-------------------|----------------|--------------|
| 1 | LLM provider name misspelled as "Open AI" instead of "OpenAI" | ![Open AI](/Docs/imgs/open_ai.png) vs OpenAI website logo ![OpenAI](/Docs/imgs/openai.png) | 1. Navigate to AI Runners page<br>2. Click on LLM provider dropdown<br>3. Observe "Open AI" is incorrectly spelled |
| 2 | Profile page allows name field to be set to EMPTY(only spaces) | ![Empty name](/Docs/imgs/empty_user_name.png) | 1. Go to Settings Profile page<br>2. Set name field to " "<br>3. Click Update<br>4. Observe the form accepts spaces as valid input |
| 3 | Profile allows a very long name | ![Long name](/Docs/imgs/long_name.png) | 1. Go to Settings Profile page<br>2. Set a long text string for the name<br>3. click Update<br>4. Overflows the name field container |
| 4 | Inconsistent social media link validation | ![Inconsistent social media link validation](/Docs/imgs/social_media_link_not_align_same_check.png) | 1. Go to Settings Profile page<br>2. Enter "github.com/user" without https://<br>3. Observe only Twitter shows error while GitHub doesn't |
| 5 | Error messages not localized consistently | ![locale_error_messages](/Docs/imgs/locale_error_msg.png) | 1. Set browser to Chinese locale<br>2. Go to Settings Profile<br>3. Trigger multiple validation errors: clear Name field, enter invalid Linkedub link (without https://)<br>4. Observe Name errors in Chinese, others in English |
| 6 | Dashboard download links extended  for _Windows /_  not _Windows_ | ![Dashboard download links](/Docs/imgs/download_link_extended.png) | 1. Navigate to Dashboard<br>2. Check download links _Windows /_<br>3. Observe the / also has the download link |
| 7 | AI Runnders - guardrails count not correct | ![guardrails](/Docs/imgs/1_guardrail.png) ![guardrails](/Docs/imgs/2_guardrails_on_popup.png) | 1. Navigate to AI Runnder page<br>2. Click guardrails button and select 1 rule and click Send button to save<br>3. Click the guardrails button again and select another 1 rule(two rules selected in total now) and mouse cursor click outside of the pop-up guardrails window and click Send button to save<br>4. Observe the guardrails count is still 1 but when click the guardrails button, it shows two rules selected |
| 8 | Insomnia MacOS client -  Generate code - language dropdown not show full list| medium size Insomnia window ![app page](/Docs/imgs/insomnia_shell_dropdown_short.png) vs full screen shell dropdown![app page](/Docs/imgs/insomnia_shell_dropdown_full.png) | 1. In Insomnia MacOS client(not full-screen mode), select any reqeust to Generate code by right mouse click  <br>2. Click language downdown<br>3. Observe dorpdown list not able to show full list unless in full-screen mode |
| 9 | https://app.insomnia.rest/app page should redirect to some working page | ![/app route page](/Docs/imgs/app_route.png) | 1. Navigate to https://app.insomnia.rest/app page <br>2.Observe the page has no body content |
| 10 | A11y test by Lighthouse for Account Settings page | ![a11y test in Account Settings](/Docs/imgs/a11y_account_settings_contrast.png) | 1. Navigate to https://app.insomnia.rest/app/settings/profile <br> 2. Observe that Background and foreground colors do not have a sufficient contrast ratio. Low-contrast text is difficult or impossible for many users to read |


## To-do list
- [In Progress] Top 100+ Issues Analysis in Insomnia GitHub Repo (filter by is:issue state:open label:B-bug)
    1. refer to https://github.com/Kong/insomnia/issues?q=is%3Aissue+is%3Aopen+label%3AB-bug
    2. issues exported from GitHub to JSON files at ./Insomnia-GitHub-Issues-Export folder
    3. use LLM to analysis the issues [Insomnia-GitHub-Issues-Export/Summary.md](Insomnia-GitHub-Issues-Export/Summary.md)

    
- [ ] Add more tests for other pages
- [ ] Add more tests for other browsers

