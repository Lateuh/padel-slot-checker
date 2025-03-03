function formatToday() {
  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monthsOfYear = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  const date = new Date();
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const month = monthsOfYear[date.getMonth()];

  return `${dayOfWeek}${dayOfMonth}${month}`;
}

function skippingThisDay(day) {
  return LIST_OF_DAYS_NO_SLOT.includes(day.substring(0, 3)) || LIST_OF_SPECIFIC_DAYS_MANUALLY_SKIPPED.includes(day);
}

function isSeventeenOk(day) {
  return LIST_OF_DAYS_SEVENTEEN_IS_OK.includes(day.substring(0, 3));
}

const LIST_OF_DAYS_NO_SLOT = ["Ven", "Sam", "Dim"];
const LIST_OF_DAYS_SEVENTEEN_IS_OK = ["Mer"];
const LIST_OF_SPECIFIC_DAYS_MANUALLY_SKIPPED = ["Mer05Mar", "Mar11Mar", "Lun14Avr"]

module.exports = { skippingThisDay, formatToday, isSeventeenOk };