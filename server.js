const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in this folder (ludo.html, ludo.css, lodo.js) as static files
app.use(express.static(path.join(__dirname)));

// Any route falls back to ludo.html (useful if you add client-side routing later)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'ludo.html'));
});

app.listen(PORT, () => {
    console.log(`Ludo server chal raha hai: http://localhost:${PORT}`);
});
