const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const monthsOfYear = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatToday() {
  const date = new Date();
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const month = monthsOfYear[date.getMonth()];

  return `${dayOfWeek}${dayOfMonth}${month}`;
}

function skippingThisDay(day) {
  return LIST_OF_DAYS_NO_SLOT.includes(day.substring(0, 3));
}

function isSeventeenOk(day) {
  return LIST_OF_DAYS_SEVENTEEN_IS_OK.includes(day.substring(0, 3));
}

/**
 * Check if it's a good time to send an email
 * Sleeping between 01:00 and 06:59
 * @returns {boolean} True if it's a good time to send an email
 */
function subscribersAreSleeping() {
  const now = new Date().getHours();
  return now < 7 || (now > 0 && now < 6);
}

/**
 * Format a specific day to the format "Jeu02Sep"
 * @param {Date} date with the 'new Date()' format
 * @returns {string} The formatted date
 */
function formatSpecificDay(date) {
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const month = monthsOfYear[date.getMonth()];

  return `${dayOfWeek}${dayOfMonth}${month}`;
}


const LIST_OF_DAYS_NO_SLOT = ["Ven", "Sam", "Dim"];
const LIST_OF_DAYS_SEVENTEEN_IS_OK = ["Mer"];

module.exports = { skippingThisDay, formatToday, isSeventeenOk, subscribersAreSleeping, formatSpecificDay };