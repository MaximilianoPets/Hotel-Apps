const pool = require('../db/connection');

async function createBooking({ hotelId, userId, checkIn, checkOut, pricePerNight, totalPrice }) {
  const [result] = await pool.query(
    'INSERT INTO bookings (hotel_id, user_id, check_in, check_out, price_per_night, total_price) VALUES (?, ?, ?, ?, ?, ?)',
    [hotelId, userId, checkIn, checkOut, pricePerNight, totalPrice]
  );
  return result.insertId;
}

async function getBookingsAll() {
  const [rows] = await pool.query(`
    SELECT b.*, h.name AS hotel_name, h.city AS hotel_city, u.usuario AS user_name
    FROM bookings b
    LEFT JOIN hotels h ON b.hotel_id = h.id
    LEFT JOIN usuarios u ON b.user_id = u.id
    ORDER BY b.check_in DESC
  `);
  return rows;
}

async function getBookingsByUserId(userId) {
  const [rows] = await pool.query(`
    SELECT b.*, h.name AS hotel_name, h.city AS hotel_city, u.usuario AS user_name
    FROM bookings b
    LEFT JOIN hotels h ON b.hotel_id = h.id
    LEFT JOIN usuarios u ON b.user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.check_in DESC
  `, [userId]);
  return rows;
}

async function getBookingById(id) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function deleteBooking(id) {
  const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createBooking,
  getBookingsAll,
  getBookingsByUserId,
  getBookingById,
  deleteBooking
};
