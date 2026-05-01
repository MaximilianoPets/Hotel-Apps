const express = require('express');
const hotelService = require('../services/hotelService');
const { authenticate } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');

const router = express.Router();

router.get('/locations', async (req, res) => {
  try {
    const locations = await hotelService.getLocations();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Error locations' });
  }
});

router.get('/hotels', async (req, res) => {
  try {
    const { location, maxPrice } = req.query;
    const hotels = await hotelService.getHotels({ location, maxPrice });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Error hoteles' });
  }
});

router.post('/hotels', authenticate, isAdmin, async (req, res) => {
  try {
    const hotel = await hotelService.createHotel(req.body);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error creando hotel' });
  }
});

router.put('/hotels/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await hotelService.updateHotel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error actualizando hotel' });
  }
});

router.delete('/hotels/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await hotelService.deleteHotel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error eliminando hotel' });
  }
});

module.exports = router;
