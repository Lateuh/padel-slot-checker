const express = require('express');
const checkSlots = require('./api/check_slots');

const app = express();
const port = process.env.PORT || 3000;


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

const server = app.listen(port, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Serveur démarré sur : http://' + host + ':' + port);
});
