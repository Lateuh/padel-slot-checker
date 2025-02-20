const puppeteer = require('puppeteer');
const dotenv = require('dotenv').config();
const { sendEmailNotification } = require('../service/mailer');
const { formatToday, skippingThisDay } = require('../utils/dateUtils');
const { delay } = require('../utils/systemUtils');


async function checkSlots() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const [page] = await browser.pages();

  try {
    // Ecoute la console du navigateur
    if (process.env.NODE_ENV === 'dev') {
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    }


    // Accès à la page d'accueil du site
    await page.setDefaultTimeout(25000);
    await page.setViewport({ width: 2136, height: 920 });
    await page.goto(process.env.PADEL_BASE_URL, { waitUntil: 'networkidle0' });
    console.log('Page d\'accueil chargée.');


    // Connexion au compte utilisateur
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
      console.log('Connexion utilisateur réussie.');
    }


    // Accès à la page des terrains en ciblant le troisième élément item-title
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('div.item-title');
      if (buttons.length >= 3) {
        buttons[2].click();
      } else {
        throw new Error('Le bouton "Terrains" n\'a pas été trouvé.');
      }
    });
    console.log('Page des terrains chargée.');


    // Récupère la date du jour
    const today = new Date();
    const currentHour = today.getHours();

    await page.waitForSelector('div.value');

    // Vérifie si la div "value" a un texte qui correspond à 16:00 - 20:00
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
      console.log('Créneau horaire élargi 16:00 - 20:00 sélectionné.');
    }


    // Sélection de l'horaire 19:00
    await page.evaluate(() => {
      const timeSlots = document.querySelectorAll('.slot-time');
      timeSlots.forEach((slot) => {
        if (slot.innerText.trim() === '19:00') {
          slot.click();
        }
      });
    });
    console.log('Créneau horaire 19:00 sélectionné.');


    // Recherche d'un créneau de 19h disponible dans les 9 prochains jours 
    let slotFound = false;
    for (let numberOfDaysAfterToday = 0; numberOfDaysAfterToday < 10; numberOfDaysAfterToday++) {
      // On récupère le jour sélectionné
      let daySelected = await page.evaluate(() => {
        return document.querySelectorAll('.date-slot')[1].childNodes[0].textContent;
      });
      console.log('J+' + numberOfDaysAfterToday + ' sélectionné : ' + daySelected);

      const skipThisDay = skippingThisDay(daySelected);

      let possibleSlotIndex = -1;

      if (skipThisDay) {
        console.log('-SKIP- On ne veut pas de créneau ce jour.');
      } else {
        await page.waitForSelector('div.playground-slot', { visible: true });

        // On récupère tous les créneaux de 19h et on prend l'index du premier
        possibleSlotIndex = await page.evaluate(() => {
          const possibleSlotNode = document.querySelectorAll('span.time');
          return Array.from(possibleSlotNode).findIndex((slot) => slot.innerText === '19:00');
        });
        if (possibleSlotIndex !== -1) {
          slotFound = true;
        }
      }

      // Si un créneau de 19h est trouvé, si c'est aujourd'hui, on envoie un mail, sinon on réserve
      if (slotFound) {
        console.log('Un créneau de 19h est disponible le ', daySelected);

        if (daySelected === formatToday()) {
          console.log('Tentative d\'envoi de mail...');
          await sendEmailNotification(process.env.PADEL_USERNAME, daySelected + ' SET PADEL AUTO', 'Créneau de 19h trouvé le ' + daySelected);
        } else {
          console.log('Tentative d\'envoi de mail...');
          await sendEmailNotification(process.env.PADEL_USERNAME, daySelected + ' SET PADEL AUTO', 'Créneau de 19h trouvé le ' + daySelected);

          console.log('Tentative de réservation automatique...')

          // On se sert de l'index récupéré précédemment pour cliquer sur le créneau de 19h
          await page.evaluate((index) => {
            document.querySelectorAll('.slot-price')[index].click();
          }, possibleSlotIndex);

          await page.waitForSelector('ion-button.btn-next', { visible: true });
          await page.locator('div ::-p-text(Suivant)').click();

          await page.waitForSelector('.payment-method-choice', { visible: true });
          await page.locator('div ::-p-text(Paiement complet)').click();

          await page.waitForSelector('div.action-sheet-group', { visible: true });
          await page.locator('span ::-p-text(Paiement sur place)').click();

          await page.locator('div ::-p-text(Valider réservation)').click();

          console.log('Réservation effectuée avec succès.');
        }
        break;
      } else {
        // On sélectionne le jour suivant (le 3ème élément de la liste)
        await page.evaluate(() => {
          document.querySelectorAll('.date-slot')[2].click();
        });
      }
    }

    return slotFound;
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
    console.log('Navigateur fermé.');
  }

};


module.exports = checkSlots;