const express = require('express');
const checkSlots = require('./api/check_slots');

const app = express();
const ip = require('ip');
const port = process.env.SLOT_CHECKER_PORT || 3000;


// Route pour vérifier les créneaux disponibles
app.get('/api/check-slots', async (req, res) => {
    try {
        console.log('Début de la recherche de créneau.');
        const slotFound = await checkSlots();
        console.log('Fin de la recherche de créneau.');
        if (slotFound !== '') {
            res.status(200).json({ success: true, message: 'Créneau de ' + slotFound + ' trouvé.' });
        } else {
            res.status(404).json({ success: false, message: 'Aucun créneau intéressant trouvé.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur https://${ip.address()}:${port}`);
});