import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import HotelCard from './HotelCard';
import './HotelSearch.css';

function HotelSearch({ token, userId }) {
  const { t } = useLanguage();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHotels();
    fetchBookings();
  }, []);

  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/hotels');
      setHotels(response.data);
      setFilteredHotels(response.data);
      setError('');
    } catch (err) {
      setError(t('failedLoadHotels'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`/api/bookings/${userId}`);
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // BUG: maxPrice filter uses string comparison instead of number
    let results = hotels;

    if (city) {
      results = results.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
    }

    if (maxPrice) {
      results = results.filter(h => h.price <= parseInt(maxPrice));
    }

    setFilteredHotels(results);
  };

  const handleReset = () => {
    setCity('');
    setMaxPrice('');
    setFilteredHotels(hotels);
  };

  const handleBooking = async (hotelId, checkIn, checkOut) => {
    try {
      // BUG: No validation that checkOut > checkIn
      if (!checkIn || !checkOut) {
        alert(t('selectDates'));
        return;
      }

      const response = await axios.post('/api/bookings', {
        hotelId,
        userId,
        checkIn,
        checkOut
      });

      alert(t('bookingSuccessful'));
      fetchBookings();
    } catch (err) {
      alert(t('bookingFailed') + err.response?.data?.error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm(t('confirmCancelBooking'))) {
      try {
        await axios.delete(`/api/bookings/${bookingId}`);
        alert(t('bookingCancelled'));
        fetchBookings();
      } catch (err) {
        alert(t('cancelBookingFailed'));
      }
    }
  };

  return (
    <div className="hotel-search">
      <h2>{t('availableHotels')}</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-group">
          <input
            type="text"
            placeholder={t('searchByCity')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="search-group">
          <input
            type="number"
            placeholder={t('maxPrice')}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
          />
        </div>

        <div className="button-group">
          <button type="submit">{t('search')}</button>
          <button type="button" onClick={handleReset} className="secondary">
            {t('reset')}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">{t('loadingHotels')}</div>
      ) : (
        <>
          <div className="hotels-grid">
            {filteredHotels.length > 0 ? (
              filteredHotels.map(hotel => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onBook={handleBooking}
                />
              ))
            ) : (
              <div className="no-results">{t('noResults')}</div>
            )}
          </div>

          {bookings.length > 0 && (
            <div className="bookings-section">
              <h3>{t('yourBookings')}</h3>
              <div className="bookings-list">
                {bookings.map(booking => {
                  const hotel = hotels.find(h => h.id === booking.hotelId);
                  return (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-info">
                        <strong>{hotel?.name}</strong>
                        <p>{t('checkIn')}: {booking.checkIn}</p>
                        <p>{t('checkOut')}: {booking.checkOut}</p>
                        <p>{t('status')} <span className="status">{booking.status}</span></p>
                      </div>
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="cancel-btn"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HotelSearch;
