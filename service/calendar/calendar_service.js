const axios = require('axios');
const dotenv = require('dotenv').config();
const { formatSpecificDay } = require('../../utils/date_utils');

async function fetchNotifications() {
    try {
        const response = await axios.get(process.env.URL_API_CALENDAR + '/notifications');
        const notifications = response.data.notifications;
        if (process.env.NODE_ENV === 'debug') console.log(notifications);
        return notifications || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications : ', error);
        return [];
    }
}

async function getNotificationsDates() {
    let notifications = await fetchNotifications();
    notifications = notifications.map(notif => formatSpecificDay(new Date(notif.date)));
    if (process.env.NODE_ENV === 'debug') console.log('Dates de notifications désactivées : ', notifications);
    return notifications;
}


module.exports = { getNotificationsDates };