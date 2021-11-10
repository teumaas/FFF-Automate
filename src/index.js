const puppeteer = require("puppeteer");
const date = Date.now();
const dotenv = require("dotenv").config({ path: "./config.env" });

// Datum hier.
const RES_DATE = "2020-11-23";
const RES_TIME = "17:00";

const USERNAME_SELECTOR = '#login-username';
const PASSWORD_SELECTOR = '#login-password';
const CTA_SELECTOR = '#login-button';

const CLUB_SELECTOR = '#edit-clubs';
const CLUB_ID = '1373';

const LESSON_SELECTOR = '#edit-lesson-names';
const LESSON_NAME = 'Free Fitness';

const CARD_SELECTOR = '#edit-card-number';
const ZIPCODE_SELECTOR = '#edit-postal-code';

(async () => {
  const { browser, page } = await startBrowser();
  await login("https://id.fitforfree.nl/user/login", browser, page);
})();

async function reservation(browser, page) {
  try {
    await page.click(`span[content="${RES_DATE}T${RES_TIME}"]`);

    const [button] = await page.$x("//span[contains(., 'Reserveren')]");

    if (button) {
      await button.click();
      console.log("Plek is vrij!");

      await page.click(CARD_SELECTOR);
      await page.keyboard.type(process.env.FFF_CARDNUMBER);
      await page.click(ZIPCODE_SELECTOR);
      await page.keyboard.type(process.env.FFF_ZIPCODE);

      const confirmLogin = await page.$('input[value="Inloggen"]');
      await confirmLogin.click();

      await page.waitForTimeout(3000).then(async() => {
        const confirmButton = await page.$('input[value="Reservering bevestigen"]');
        await confirmButton.click();
      });

      await page.waitForTimeout(3000).then(async() => {
        console.log('Je bent aangemeld!')
        return await closeBrowser(browser);
      });
    } else {
      console.log("Plek nog niet vrij...");
      await page.screenshot({path: './sc/res-error.png'});
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      return await page.waitForTimeout(600000).then(() => reservation(browser, page));
    }

  } catch (err) {
    console.log(err);
  }
}

async function login(url, browser, page) {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(process.env.FFF_USERNAME);
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(process.env.FFF_PASSWORD);
    await page.click(CTA_SELECTOR);
    await page.evaluate(() => window.find("Gebruikersnaam en/of wachtwoord is onjuist."));

    await page.screenshot({path: '.png/sc/error-login.png'});

    return console.log("Error! Inloggen mislukt..."), closeBrowser(browser);
  } catch (err) {
    console.log("Je bent succesvol ingelogd!");

    await page.goto("https://www.fitforfree.nl/groepslessen/", { waitUntil: "networkidle2",});
    await page.select(`select${CLUB_SELECTOR}`, CLUB_ID);
    await page.waitForNavigation();
    await page.select(`select${LESSON_SELECTOR}`, LESSON_NAME);
    
    await page.screenshot({path: './sc/success-login.png'});

    return await reservation(browser, page);
  }
}

async function startBrowser() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  return { browser, page };
}

async function closeBrowser(browser) {
  browser.close();
  return process.exit(1);
}
