const fs = require('fs').promises;
const path = require('path');
const { subscribersAreSleeping } = require('../../utils/date_utils');

const HISTORY_FILE = path.join(__dirname, 'email_history.json');
const SPAM_THRESHOLD = 2; // Nombre d'emails considéré comme spam
const SPAM_INTERVAL = 60 * 1000 * 60; // Intervalle de temps en millisecondes


async function writeEmailHistory(subject) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, subject };
  
    try {
      let history = [];
      if (await fileExists(HISTORY_FILE)) {
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        history = JSON.parse(data);
      }
  
      history.push(entry);
      await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
      console.log('Historique des emails mis à jour');
    } catch (error) {
      console.error('Erreur lors de l\'écriture de l\'historique des emails:', error);
    }
  }
  
  async function checkSpam() {
    try {
      if (!await fileExists(HISTORY_FILE)) return false;
  
      if (subscribersAreSleeping()) return true;
  
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      const history = JSON.parse(data);
  
      const now = new Date();
      const recentEmails = history.filter(entry => (now - new Date(entry.timestamp)) <= SPAM_INTERVAL);
      const sameRecentEmailNumber = recentEmails.filter(entry => (subject === entry.subject)).length;
  
      return sameRecentEmailNumber >= SPAM_THRESHOLD;
    } catch (error) {
      console.error('Erreur lors de la vérification du spam:', error);
      return false;
    }
  }
  
  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  module.exports = { checkSpam, writeEmailHistory };