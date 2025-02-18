const express = require('express');
const checkSlots = require('./api/checkSlots');

const app = express();
const port = process.env.PORT || 3000;


// Route pour vérifier les créneaux disponibles
app.get('/api/checkSlots', async (req, res) => {
    try {
        const slotFound = await checkSlots();
        if (slotFound) {
            res.status(200).json({ success: true, message: 'Créneau de 19h trouvé.' });
        } else {
            res.status(404).json({ success: false, message: 'Aucun créneau de 19h trouvé.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port : ${port}`);
});
