const pool = require('../db/connection');

async function getLocations() {
  const [rows] = await pool.query(
    "SELECT DISTINCT CONCAT(city, ', ', country) AS location FROM hotels WHERE country IS NOT NULL AND country != '' ORDER BY location"
  );
  return rows.map(r => r.location);
}

async function getHotels(filters = {}) {
  let query = 'SELECT * FROM hotels WHERE 1=1';
  const values = [];

  if (filters.location) {
    query += " AND LOWER(CONCAT(city, ', ', country)) LIKE ?";
    values.push(`%${filters.location.toLowerCase()}%`);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    query += ' AND price < ?';
    values.push(filters.maxPrice);
  }

  const [rows] = await pool.query(query, values);
  return rows.map(h => ({
    ...h,
    available: h.available === 1
  }));
}

async function getHotelById(id) {
  const [rows] = await pool.query('SELECT * FROM hotels WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function createHotel({ name, city, country, price, rating, available }) {
  const [result] = await pool.query(
    'INSERT INTO hotels (name, city, country, price, rating, available) VALUES (?, ?, ?, ?, ?, ?)',
    [name, city, country, price, rating, available !== undefined ? available : 1]
  );
  return {
    id: result.insertId,
    name,
    city,
    country,
    price,
    rating,
    available: available !== undefined ? available : true
  };
}

async function updateHotel(id, { name, city, country, price, rating, available }) {
  const [result] = await pool.query(
    'UPDATE hotels SET name = ?, city = ?, country = ?, price = ?, rating = ?, available = ? WHERE id = ?',
    [name, city, country, price, rating, available ? 1 : 0, id]
  );
  return result.affectedRows > 0;
}

async function deleteHotel(id) {
  const [result] = await pool.query('DELETE FROM hotels WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function countConfirmedBookingsForHotel(hotelId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE hotel_id = ? AND status = 'confirmed'",
    [hotelId]
  );
  return rows[0]?.count || 0;
}

module.exports = {
  getLocations,
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  countConfirmedBookingsForHotel
};
