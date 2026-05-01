const bookingRepository = require('../repositories/bookingRepository');
const hotelRepository = require('../repositories/hotelRepository');

function isValidDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end - start) / 86400000);
  return Math.max(1, diff);
}

async function createBooking({ hotelId, userId, checkIn, checkOut }) {
  if (!hotelId || !userId) {
    const err = new Error('Faltan datos');
    err.status = 400;
    throw err;
  }
  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    const err = new Error('Fechas inválidas');
    err.status = 400;
    throw err;
  }
  const hotel = await hotelRepository.getHotelById(hotelId);
  if (!hotel) {
    const err = new Error('Hotel no existe');
    err.status = 404;
    throw err;
  }
  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = hotel.price * nights;

  const bookingId = await bookingRepository.createBooking({
    hotelId,
    userId,
    checkIn,
    checkOut,
    pricePerNight: hotel.price,
    totalPrice
  });

  return bookingId;
}

async function getBookingsAll() {
  return bookingRepository.getBookingsAll();
}

async function getBookingsByUserId(userId) {
  return bookingRepository.getBookingsByUserId(userId);
}

async function getBookingById(id) {
  return bookingRepository.getBookingById(id);
}

async function deleteBooking(id) {
  const deleted = await bookingRepository.deleteBooking(id);
  if (!deleted) {
    const err = new Error('Reserva no encontrada');
    err.status = 404;
    throw err;
  }
  return true;
}

module.exports = {
  createBooking,
  getBookingsAll,
  getBookingsByUserId,
  getBookingById,
  deleteBooking
};
