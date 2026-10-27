// Local and self-hosted entry point: `npm run dev` / `npm start`.
import app from './app.js';

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`D/F API listening on http://localhost:${PORT}`));
