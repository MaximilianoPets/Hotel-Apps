import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import { useModal } from '../ModalContext';
import HotelCard from './HotelCard';
import './HotelSearch.css';

function HotelSearch({ token, userId }) {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const { t } = useLanguage();
  const { showAlert, showConfirm } = useModal();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [location, setLocation] = useState('');
  const [allLocations, setAllLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchBookings();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setAllLocations(response.data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`/api/bookings/${userId}`, { headers: authHeaders });
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    if (val.length > 0) {
      const normalizeStr = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      
      const filtered = allLocations.filter(loc => 
        normalizeStr(loc).includes(normalizeStr(val))
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (loc) => {
    setLocation(loc);
    setShowSuggestions(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      setIsLoading(true);
      const response = await axios.get('/api/hotels', {
        params: { location, maxPrice }
      });
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

  const handleReset = () => {
    setLocation('');
    setMaxPrice('');
    setHasSearched(false);
    setFilteredHotels([]);
    setShowSuggestions(false);
  };

  const handleBooking = async (hotelId, checkIn, checkOut) => {
    try {
      if (!checkIn || !checkOut) {
        showAlert(t('selectDates'));
        return;
      }

      const response = await axios.post('/api/bookings', {
        hotelId,
        checkIn,
        checkOut
      }, { headers: authHeaders });

      showAlert(t('bookingSuccessful'));
      fetchBookings();
    } catch (err) {
      showAlert(t('bookingFailed') + (err.response?.data?.error || ''));
    }
  };

  const handleCancelBooking = (bookingId) => {
    showConfirm(t('confirmCancelBooking'), async () => {
      try {
        await axios.delete(`/api/bookings/${bookingId}`, { headers: authHeaders });
        showAlert(t('bookingCancelled'));
        fetchBookings();
      } catch (err) {
        showAlert(t('cancelBookingFailed'));
      }
    });
  };

  return (
    <div className="hotel-search">
      <h2>{t('availableHotels')}</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-group autocomplete-container">
          <input
            type="text"
            placeholder={t('searchByLocation')}
            value={location}
            onChange={handleLocationChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => {if (location.length > 0) setShowSuggestions(true)}}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((loc, idx) => (
                <li key={idx} onClick={() => handleSuggestionClick(loc)}>
                  {loc}
                </li>
              ))}
            </ul>
          )}
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
          {hasSearched && (
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
          )}

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
                        {booking.pricePerNight && <p>{t('pricePerNight')}: ${booking.pricePerNight}</p>}
                        {booking.totalPrice && <p><strong>{t('totalPrice')}: ${booking.totalPrice}</strong></p>}
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
