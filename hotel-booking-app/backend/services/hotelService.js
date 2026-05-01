const hotelRepository = require('../repositories/hotelRepository');

function validateHotelData({ name, city, country, price, rating }) {
  if (!name || !city || !country) {
    return 'Todos los campos son obligatorios';
  }
  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    return 'Precio inválido';
  }
  if (typeof rating !== 'number' || Number.isNaN(rating) || rating < 0 || rating > 5) {
    return 'Rating inválido';
  }
  return null;
}

async function getLocations() {
  return hotelRepository.getLocations();
}

async function getHotels(filters) {
  return hotelRepository.getHotels(filters);
}

async function getHotelById(id) {
  return hotelRepository.getHotelById(id);
}

async function createHotel(data) {
  const error = validateHotelData(data);
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }
  return hotelRepository.createHotel(data);
}

async function updateHotel(id, data) {
  const error = validateHotelData(data);
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }
  const updated = await hotelRepository.updateHotel(id, data);
  if (!updated) {
    const err = new Error('Hotel no encontrado');
    err.status = 404;
    throw err;
  }
  return true;
}

async function deleteHotel(id) {
  const count = await hotelRepository.countConfirmedBookingsForHotel(id);
  if (count > 0) {
    const err = new Error('No se puede eliminar el hotel ya que tiene reservas vigentes');
    err.status = 409;
    throw err;
  }
  const deleted = await hotelRepository.deleteHotel(id);
  if (!deleted) {
    const err = new Error('Hotel no encontrado');
    err.status = 404;
    throw err;
  }
  return true;
}

module.exports = {
  getLocations,
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};
