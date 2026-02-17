require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const itemRoutes = require('./routes/itemRoutes');
const usageRoutes = require('./routes/usageRoutes');

const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

mongoose.connect("mongodb+srv://mess_user:mess123@cluster0.pvegjbp.mongodb.net/mess_Int")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("Mongo Error:", err));

app.use('/api/items', itemRoutes);
app.use('/api/usage', usageRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));