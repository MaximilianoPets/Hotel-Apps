const express = require('express');
const bookingService = require('../services/bookingService');
const { authenticate } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');

const router = express.Router();

router.post('/bookings', authenticate, async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut } = req.body;
    const bookingId = await bookingService.createBooking({
      hotelId,
      userId: req.user.id,
      checkIn,
      checkOut
    });
    res.status(201).json({ id: bookingId });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error booking' });
  }
});

router.get('/bookings', authenticate, isAdmin, async (req, res) => {
  try {
    const bookings = await bookingService.getBookingsAll();
    res.json(bookings.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
      hotelName: r.hotel_name,
      hotelCity: r.hotel_city,
      userId: r.user_id,
      userName: r.user_name,
      checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : r.check_in,
      checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : r.check_out,
      status: r.status,
      pricePerNight: r.price_per_night,
      totalPrice: r.total_price
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error bookings' });
  }
});

router.get('/bookings/:userId', authenticate, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (req.user.id !== userId && req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const bookings = await bookingService.getBookingsByUserId(userId);
    res.json(bookings.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
      hotelName: r.hotel_name,
      hotelCity: r.hotel_city,
      userId: r.user_id,
      userName: r.user_name,
      checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : r.check_in,
      checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : r.check_out,
      status: r.status,
      pricePerNight: r.price_per_night,
      totalPrice: r.total_price
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error bookings' });
  }
});

router.delete('/bookings/:id', authenticate, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    if (booking.user_id !== req.user.id && req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await bookingService.deleteBooking(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error eliminando reserva' });
  }
});

module.exports = router;
