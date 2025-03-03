const puppeteer = require('puppeteer');
const dotenv = require('dotenv').config();
const { sendEmailNotification } = require('../service/mailer');
const { skippingThisDay, isSeventeenOk } = require('../utils/dateUtils');
const { delay } = require('../utils/systemUtils');


async function checkSlots() {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const [page] = await browser.pages();

    // Ecoute la console du navigateur
    if (process.env.NODE_ENV === 'debug') page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Accès à la page des terrains
    await page.setDefaultTimeout(45 * 1000);
    await page.goto(process.env.PADEL_PLAYGROUND_URL, { waitUntil: 'networkidle0' });
    if (process.env.NODE_ENV === 'debug') console.log('Page des terrains chargée.');

    // Récupère la date du jour
    const today = new Date();
    const currentHour = today.getHours();

    await page.waitForSelector('div.value');

    // Vérifie si la div "value" a un texte qui correspond à 16:00 - 20:00
    await selectHourRange(page, currentHour);

    // Sélection de l'horaire 19:00
    await page.evaluate(() => {
      const timeSlots = document.querySelectorAll('.slot-time');
      timeSlots.forEach((slot) => {
        if (slot.innerText.trim() === '19:00') {
          slot.click();
        }
      });
    });
    if (process.env.NODE_ENV === 'debug') console.log('Créneau horaire 19:00 sélectionné.');

    // Recherche d'un créneau de 19h disponible dans les 9 prochains jours 
    return await findSlotAndSendMail(page);
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
    if (process.env.NODE_ENV === 'debug') console.log('Navigateur fermé.');
  }

};


async function findSlotAndSendMail(page) {
  let slotFound = '';
  for (let numberOfDaysAfterToday = 0; numberOfDaysAfterToday < 10; numberOfDaysAfterToday++) {
    // On récupère le jour sélectionné
    let daySelected = await page.evaluate(() => {
      return document.querySelectorAll('.date-slot')[1].childNodes[0].textContent;
    });
    if (process.env.NODE_ENV === 'debug') console.log('J+' + numberOfDaysAfterToday + ' sélectionné : ' + daySelected);

    if (skippingThisDay(daySelected)) {
      if (process.env.NODE_ENV === 'debug') console.log('-SKIP- On ne veut pas de créneau ce jour.');
      await goNextDay(page);
      continue;
    }

    await page.waitForSelector('div.playground-slot', { visible: true });

    if (isSeventeenOk(daySelected)) {
      if (process.env.NODE_ENV === 'debug') console.log('Le créneau de 17h30 est ok pour ce jour.');
      slotFound = await findSlotAvailable(page, '17:30');
      if (slotFound !== '') sendMail(daySelected, slotFound);
    }

    slotFound = await findSlotAvailable(page, '19:00');
    if (slotFound !== '') sendMail(daySelected, slotFound);

    await goNextDay(page);
  }
  return slotFound;
}

async function sendMail(daySelected, slotFound) {
  console.log('Un créneau de ' + slotFound + ' est disponible le ' + daySelected);

  if (process.env.NODE_ENV === 'debug') console.log('Tentative d\'envoi de mail...');
  await sendEmailNotification(daySelected + ' SET PADEL AUTO', 'Créneau de ' + slotFound + ' trouvé le ' + daySelected);
}

// On sélectionne le jour suivant (le 3ème élément de la liste)
async function goNextDay(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.date-slot')[2].click();
  });
}

// On récupère tous les créneaux de 17h30 ou 19h et on prend l'index du premier créneau disponible
async function findSlotAvailable(page, hourSlotWanted) {
  let possibleSlotIndex = await page.evaluate((hourSlotWanted) => {
    const possibleSlotNode = document.querySelectorAll('span.time');
    return Array.from(possibleSlotNode).findIndex((slot) => slot.innerText === hourSlotWanted);
  });
  if (possibleSlotIndex !== -1) {
    return hourSlotWanted;
  } else {
    return '';
  }
}

async function selectHourRange(page, currentHour) {
  let goodSlot = await page.$eval('div.value', elem => elem.innerText) === '16:00 - 20:00';

  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  // On clique sur un bouton pour changer de créneau horaire élargi
  while (!goodSlot && attempts < MAX_ATTEMPTS) {
    if (currentHour < 16) {
      await page.evaluate(() => {
        document.querySelector('.btn-arrow-right')?.click();
      });
    } else if (currentHour >= 20) {
      await page.evaluate(() => {
        document.querySelector('.btn-arrow-left')?.click();
      });
    }
    goodSlot = await page.$eval('.value', el => el.innerText) === '16:00 - 20:00';
    attempts++;
  }

  if (!goodSlot) {
    throw new Error('Erreur lors de la modification du créneau horaire élargi.');
  } else {
    if (process.env.NODE_ENV === 'debug') console.log('Créneau horaire élargi 16:00 - 20:00 sélectionné.');
  }
}

async function connectAccount(page) {
  await page.locator('h4 ::-p-text(Se connecter)').click();
  await page.waitForSelector('input[name="ion-input-0"]', { visible: true });
  await page.type('input[name="ion-input-0"]', process.env.PADEL_USERNAME);
  await delay(2000);
  await page.locator('div ::-p-text(Valider mon email)').click();

  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', process.env.PADEL_PASSWORD);
  await delay(2000);
  await page.locator('div ::-p-text(Valider)').click();

  // Attendre que la popup de connexion disparaisse
  await page.waitForSelector('div.sign-container', { hidden: true, timeout: 5000 });

  // Vérifie qu'on est bien connecté
  const elementHandle = await page.$('h4 ::-p-text(Se connecter)');
  if (elementHandle) {
    throw new Error('Erreur lors de la connexion utilisateur.');
  } else {
    if (process.env.NODE_ENV === 'debug') console.log('Connexion utilisateur réussie.');
  }
}

module.exports = checkSlots;