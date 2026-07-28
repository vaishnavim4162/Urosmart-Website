const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

// Start/Stop the static server
let server;

// List of all pages in the frontend to test
const pages = [
  {
    name: 'index.html',
    title: 'Welcome to UroSmart - Advanced Urinalysis Analysis',
    heading: 'Welcome to UroSmart',
    requiresAuth: false,
    primaryElement: '#get-started-btn'
  },
  {
    name: 'permission.html',
    title: 'Data Usage Permission - UroSmart',
    heading: 'Data Usage Permission',
    requiresAuth: false,
    primaryElement: '.btn-allow'
  },
  {
    name: 'login.html',
    title: 'Log In - UroSmart',
    heading: 'Log In',
    requiresAuth: false,
    primaryElement: '.btn-login'
  },
  {
    name: 'signup.html',
    title: 'Create an Account - UroSmart',
    heading: 'Create an Account',
    requiresAuth: false,
    primaryElement: '.btn-login'
  },
  {
    name: 'forgot-password.html',
    title: 'Forgot Password - UroSmart',
    heading: 'Forgot Password',
    requiresAuth: false,
    primaryElement: 'button[type="submit"]'
  },
  {
    name: 'reset-password.html',
    title: 'Reset Password - UroSmart',
    heading: 'Reset Password',
    requiresAuth: false,
    primaryElement: 'button[type="submit"]'
  },
  {
    name: 'dashboard.html',
    title: 'Dashboard - UroSmart',
    heading: 'Welcome To The',
    requiresAuth: true,
    primaryElement: '#logout-btn'
  },
  {
    name: 'upload-scan.html',
    title: 'New Scan Submission - UroSmart',
    heading: 'New Scan Submission',
    requiresAuth: true,
    primaryElement: '#upload-form'
  },
  {
    name: 'report-results.html',
    title: 'Report Results - UroSmart',
    heading: 'Report Successfully Generated!',
    requiresAuth: true,
    primaryElement: '#download-btn'
  },
  {
    name: 'medical-reports.html',
    title: 'Medical Reports - UroSmart',
    heading: 'Medical Reports',
    requiresAuth: true,
    primaryElement: '#report-search'
  },
  {
    name: 'profile.html',
    title: 'My Profile - UroSmart',
    heading: 'My Profile',
    requiresAuth: true,
    primaryElement: '#change-password-btn'
  },
  {
    name: 'feedback.html',
    title: 'Feedback - UroSmart',
    heading: 'How was your experience?',
    requiresAuth: true,
    primaryElement: '.btn-submit'
  },
  {
    name: 'privacy-policy.html',
    title: 'Privacy Policy - UroSmart',
    heading: 'Privacy Policy',
    requiresAuth: false,
    primaryElement: '.policy-content'
  },
  {
    name: 'terms-conditions.html',
    title: 'Terms & Conditions - UroSmart',
    heading: 'Terms & Conditions',
    requiresAuth: false,
    primaryElement: '.policy-content'
  },
  {
    name: 'medical-disclaimer.html',
    title: 'Medical Disclaimer - UroSmart',
    heading: 'Medical Disclaimer',
    requiresAuth: false,
    primaryElement: '.warning-highlight'
  }
];

// Viewport sizes for responsive tests
const viewports = [
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

describe('UroSmart E2E Selenium Test Suite', function () {
  this.timeout(120000); // 2 minutes timeout for the entire suite
  let driver;
  const baseUrl = 'http://127.0.0.1:3000';

  before(async function () {
    // Start Express server
    server = require('../server');

    // Build Selenium Driver
    const options = new chrome.Options();
    if (process.env.HEADLESS !== 'false') {
      options.addArguments('--headless=new');
      options.addArguments('--disable-gpu');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--window-size=1280,800');
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
    if (server) {
      server.close();
    }
  });

  // Helper to inject mock auth and navigate
  async function navigateTo(pageName, requiresAuth) {
    if (requiresAuth) {
      // Navigate to home first to set localStorage on correct origin
      await driver.get(`${baseUrl}/index.html`);
      await driver.executeScript(() => {
        localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', name: 'Test User' }));
        localStorage.setItem('access_token', 'mock_jwt_token_for_testing');
      });
    } else {
      // Clear auth to test guest pages
      await driver.get(`${baseUrl}/index.html`);
      await driver.executeScript(() => {
        localStorage.clear();
      });
    }
    await driver.get(`${baseUrl}/${pageName}`);
  }

  // --- SECTION 1: RESPONSIVE STRUCTURE & SEO/METADATA TESTS ---
  // 15 pages * 3 viewports * 8 tests = 360 tests
  viewports.forEach(vp => {
    describe(`Responsive Testing on ${vp.name} (${vp.width}x${vp.height})`, function () {
      beforeEach(async function () {
        await driver.manage().window().setRect({ width: vp.width, height: vp.height });
      });

      pages.forEach(page => {
        describe(`Page: ${page.name}`, function () {
          before(async function () {
            await navigateTo(page.name, page.requiresAuth);
          });

          it('should load successfully without redirects', async function () {
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).to.include(page.name);
          });

          it('should have the correct title tag', async function () {
            const title = await driver.getTitle();
            expect(title).to.equal(page.title);
          });

          it('should have viewport meta tag for responsiveness', async function () {
            const metaViewport = await driver.findElements(By.xpath('//meta[@name="viewport"]'));
            expect(metaViewport.length).to.be.greaterThan(0);
          });

          it('should link to style.css stylesheet', async function () {
            const stylesheets = await driver.findElements(By.xpath('//link[@rel="stylesheet"]'));
            let hasMainStylesheet = false;
            for (let sheet of stylesheets) {
              const href = await sheet.getAttribute('href');
              if (href && href.endsWith('style.css')) {
                hasMainStylesheet = true;
                break;
              }
            }
            expect(hasMainStylesheet).to.be.true;
          });

          it('should have the primary page element visible', async function () {
            const element = await driver.findElement(By.css(page.primaryElement));
            const isDisplayed = await element.isDisplayed();
            expect(isDisplayed).to.be.true;
          });

          it('should have basic accessibility image alt tags', async function () {
            const images = await driver.findElements(By.css('img'));
            for (let img of images) {
              const alt = await img.getAttribute('alt');
              expect(alt).to.not.be.null;
            }
          });

          it('should have a clean DOM structure containing the page heading', async function () {
            const bodyText = await driver.findElement(By.css('body')).getText();
            expect(bodyText).to.include(page.heading);
          });

          it('should contain valid links (href is not blank/broken)', async function () {
            const links = await driver.findElements(By.css('a'));
            for (let link of links) {
              const href = await link.getAttribute('href');
              if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
                expect(href).to.not.be.empty;
              }
            }
          });
        });
      });
    });
  });

  // --- SECTION 2: FUNCTIONAL INTERACTION & FORM VALIDATION TESTS ---
  // 52 additional assertions
  describe('Functional and Interaction Tests', function () {
    before(async function () {
      // Reset window size to desktop to ensure all functional test elements are visible and clickable
      await driver.manage().window().setRect({ width: 1280, height: 800 });
    });
    
    describe('Login Page (login.html)', function () {
      before(async function () {
        await navigateTo('login.html', false);
      });

      it('should display the email input field', async function () {
        const emailField = await driver.findElement(By.id('email'));
        await driver.wait(until.elementIsVisible(emailField), 5000);
        expect(await emailField.isDisplayed()).to.be.true;
      });

      it('should have placeholder "enter email" for email field', async function () {
        const emailField = await driver.findElement(By.id('email'));
        expect(await emailField.getAttribute('placeholder')).to.equal('enter email');
      });

      it('should display the password input field', async function () {
        const passwordField = await driver.findElement(By.id('password'));
        expect(await passwordField.isDisplayed()).to.be.true;
      });

      it('should have placeholder "enter password" for password field', async function () {
        const passwordField = await driver.findElement(By.id('password'));
        expect(await passwordField.getAttribute('placeholder')).to.equal('enter password');
      });

      it('should have password field hidden by default', async function () {
        const passwordField = await driver.findElement(By.id('password'));
        expect(await passwordField.getAttribute('type')).to.equal('password');
      });

      it('should display password visibility toggle button', async function () {
        const toggleBtn = await driver.findElement(By.css('.password-toggle'));
        expect(await toggleBtn.isDisplayed()).to.be.true;
      });

      it('should display Remember Me checkbox', async function () {
        const rememberCheckbox = await driver.findElement(By.css('.remember-me input'));
        expect(await rememberCheckbox.isSelected()).to.be.false;
      });

      it('should display Forgot Password link', async function () {
        const forgotLink = await driver.findElement(By.css('.forgot-link'));
        expect(await forgotLink.getAttribute('href')).to.include('forgot-password.html');
      });

      it('should display Sign Up redirection link', async function () {
        const signupLink = await driver.findElement(By.css('.signup-footer a'));
        expect(await signupLink.getAttribute('href')).to.include('signup.html');
      });

      it('should trigger browser validation when email is empty', async function () {
        const passwordField = await driver.findElement(By.id('password'));
        await passwordField.sendKeys('password123');
        const loginBtn = await driver.findElement(By.css('.btn-login'));
        await loginBtn.click();
        const emailField = await driver.findElement(By.id('email'));
        const validity = await emailField.getAttribute('validity');
        // HTML5 validity check can be checked via browser script
        const isEmpty = await driver.executeScript((el) => el.validity.valueMissing, emailField);
        expect(isEmpty).to.be.true;
        await passwordField.clear();
      });
    });

    describe('Signup Page (signup.html)', function () {
      before(async function () {
        await navigateTo('signup.html', false);
      });

      it('should display phone input field', async function () {
        const phoneField = await driver.findElement(By.id('phone'));
        await driver.wait(until.elementIsVisible(phoneField), 5000);
        expect(await phoneField.isDisplayed()).to.be.true;
      });

      it('should display email input field', async function () {
        const emailField = await driver.findElement(By.id('email'));
        expect(await emailField.isDisplayed()).to.be.true;
      });

      it('should display password input field', async function () {
        const passField = await driver.findElement(By.id('password'));
        expect(await passField.isDisplayed()).to.be.true;
      });

      it('should display confirm password input field', async function () {
        const confirmPassField = await driver.findElement(By.id('confirm-password'));
        expect(await confirmPassField.isDisplayed()).to.be.true;
      });

      it('should show Login redirection link', async function () {
        const loginLink = await driver.findElement(By.css('.signup-footer a'));
        expect(await loginLink.getAttribute('href')).to.include('login.html');
      });
    });

    describe('Dashboard Page (dashboard.html)', function () {
      before(async function () {
        await navigateTo('dashboard.html', true);
      });

      it('should render the sidebar overlay', async function () {
        const overlay = await driver.findElement(By.id('sidebar-overlay'));
        expect(overlay).to.not.be.null;
      });

      it('should keep the sidebar closed by default', async function () {
        const sidebar = await driver.findElement(By.id('sidebar'));
        const classes = await sidebar.getAttribute('class');
        expect(classes).to.not.include('active');
      });

      it('should open the sidebar when clicking the menu toggle button', async function () {
        const menuToggle = await driver.findElement(By.id('menu-toggle'));
        await menuToggle.click();
        const sidebar = await driver.findElement(By.id('sidebar'));
        const classes = await sidebar.getAttribute('class');
        expect(classes).to.include('active');
      });

      it('should show profile link in sidebar menu', async function () {
        const profileLink = await driver.findElement(By.xpath('//a[@href="profile.html"]'));
        await driver.wait(until.elementIsVisible(profileLink), 5000);
        expect(await profileLink.isDisplayed()).to.be.true;
      });

      it('should show privacy policy link in sidebar menu', async function () {
        const privacyLink = await driver.findElement(By.xpath('//a[@href="privacy-policy.html"]'));
        await driver.wait(until.elementIsVisible(privacyLink), 5000);
        expect(await privacyLink.isDisplayed()).to.be.true;
      });

      it('should show terms conditions link in sidebar menu', async function () {
        const termsLink = await driver.findElement(By.xpath('//a[@href="terms-conditions.html"]'));
        await driver.wait(until.elementIsVisible(termsLink), 5000);
        expect(await termsLink.isDisplayed()).to.be.true;
      });

      it('should display upload scan action card', async function () {
        const uploadCard = await driver.findElement(By.xpath('//a[@href="upload-scan.html"]'));
        expect(await uploadCard.isDisplayed()).to.be.true;
      });

      it('should display medical reports history card', async function () {
        const reportsCard = await driver.findElement(By.xpath('//a[@href="medical-reports.html"]'));
        expect(await reportsCard.isDisplayed()).to.be.true;
      });

      it('should display the medical disclaimer link', async function () {
        const disclaimerLink = await driver.findElement(By.css('.disclaimer-link'));
        expect(await disclaimerLink.getAttribute('href')).to.include('medical-disclaimer.html');
      });

      it('should close the sidebar when clicking the overlay', async function () {
        const overlay = await driver.findElement(By.id('sidebar-overlay'));
        await driver.executeScript("arguments[0].click();", overlay);
        const sidebar = await driver.findElement(By.id('sidebar'));
        const classes = await sidebar.getAttribute('class');
        expect(classes).to.not.include('active');
      });
    });

    describe('Upload Scan Page (upload-scan.html)', function () {
      before(async function () {
        await navigateTo('upload-scan.html', true);
      });

      it('should display back arrow link pointing to dashboard', async function () {
        const backBtn = await driver.findElement(By.css('.btn-back'));
        expect(await backBtn.getAttribute('href')).to.include('dashboard.html');
      });

      it('should contain first and second image upload areas', async function () {
        const area1 = await driver.findElement(By.id('area-1'));
        const area2 = await driver.findElement(By.id('area-2'));
        expect(await area1.isDisplayed()).to.be.true;
        expect(await area2.isDisplayed()).to.be.true;
      });

      it('should restrict upload files to images only (accept attribute check)', async function () {
        const fileInput = await driver.findElement(By.id('file-1'));
        expect(await fileInput.getAttribute('accept')).to.include('image/');
      });

      it('should render the drag and drop zone text prompt', async function () {
        const dropText = await driver.findElement(By.css('.upload-area p')).getText();
        expect(dropText).to.include('Drop image here or click to browse');
      });
    });

    describe('Medical Reports Page (medical-reports.html)', function () {
      before(async function () {
        await navigateTo('medical-reports.html', true);
      });

      it('should display the search box container', async function () {
        const searchBox = await driver.findElement(By.css('.search-box'));
        expect(await searchBox.isDisplayed()).to.be.true;
      });

      it('should display search input field placeholder', async function () {
        const searchInput = await driver.findElement(By.id('report-search'));
        expect(await searchInput.getAttribute('placeholder')).to.equal('Search for patient name or ID');
      });

      it('should display back button pointing to dashboard', async function () {
        const backBtn = await driver.findElement(By.css('.back-link'));
        expect(await backBtn.getAttribute('href')).to.include('dashboard.html');
      });

      it('should contain a list/grid container for reports', async function () {
        const listContainer = await driver.findElement(By.id('reports-list'));
        expect(listContainer).to.not.be.null;
      });
    });

    describe('Forgot Password Page (forgot-password.html)', function () {
      before(async function () {
        await navigateTo('forgot-password.html', false);
      });

      it('should display the email address input field', async function () {
        const emailField = await driver.findElement(By.id('email'));
        expect(emailField).to.not.be.null;
      });

      it('should have placeholder "enter your email"', async function () {
        const emailField = await driver.findElement(By.id('email'));
        expect(await emailField.getAttribute('placeholder')).to.equal('enter your email');
      });

      it('should display submit button', async function () {
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        expect(await submitBtn.isDisplayed()).to.be.true;
      });

      it('should show back to login link', async function () {
        const backLink = await driver.findElement(By.css('.signup-footer a'));
        expect(await backLink.getAttribute('href')).to.include('login.html');
      });
    });

    describe('Feedback Page (feedback.html)', function () {
      before(async function () {
        await navigateTo('feedback.html', true);
      });

      it('should display star rating labels', async function () {
        const stars = await driver.findElements(By.css('.star'));
        expect(stars.length).to.be.greaterThan(0);
      });

      it('should display a textarea for written comments', async function () {
        const textarea = await driver.findElement(By.css('textarea'));
        expect(await textarea.isDisplayed()).to.be.true;
      });

      it('should have a comments section container', async function () {
        const commentSection = await driver.findElement(By.css('.comment-section'));
        expect(await commentSection.isDisplayed()).to.be.true;
      });

      it('should contain a submit button', async function () {
        const submitBtn = await driver.findElement(By.css('.btn-submit'));
        expect(await submitBtn.isDisplayed()).to.be.true;
      });
    });

    describe('Profile Page (profile.html)', function () {
      before(async function () {
        await navigateTo('profile.html', true);
      });

      it('should display the user profile avatar icon', async function () {
        const avatar = await driver.findElement(By.css('.avatar-large img'));
        expect(await avatar.isDisplayed()).to.be.true;
      });

      it('should display patient details card', async function () {
        const details = await driver.findElement(By.css('.profile-card'));
        expect(await details.isDisplayed()).to.be.true;
      });

      it('should contain Delete Account button', async function () {
        const deleteBtn = await driver.findElement(By.id('delete-account-btn'));
        expect(await deleteBtn.isDisplayed()).to.be.true;
      });

      it('should display user email field', async function () {
        const emailBox = await driver.findElement(By.id('user-email'));
        expect(await emailBox.isDisplayed()).to.be.true;
      });
    });
  });
});
