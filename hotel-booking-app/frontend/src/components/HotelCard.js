import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './HotelCard.css';

function HotelCard({ hotel, onBook }) {
  const { t } = useLanguage();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const handleBook = () => {
    // BUG: No validation - can book unavailable hotels
    onBook(hotel.id, checkIn, checkOut);
    setShowBookingForm(false);
    setCheckIn('');
    setCheckOut('');
  };

  return (
    <div className="hotel-card">
      <div className="hotel-header">
        <h3>{hotel.name}</h3>
        <span className="rating">⭐ {hotel.rating}</span>
      </div>

      <div className="hotel-details">
        <p><strong>{t('city')}</strong> {hotel.city}</p>
        <p><strong>{t('price')}</strong> ${hotel.price} {t('price').split(':')[1] || ''}</p>
        <p>
          <strong>{t('available')}:</strong>{' '}
          {/* BUG: Shows availability but booking still works regardless */}
          <span className={hotel.available ? 'available' : 'unavailable'}>
            {hotel.available ? t('yes') : t('no')}
          </span>
        </p>
      </div>

      {!showBookingForm ? (
        <button
          onClick={() => setShowBookingForm(true)}
          disabled={!hotel.available}
          className={hotel.available ? '' : 'disabled'}
        >
          {hotel.available ? t('bookNow') : t('unavailable')}
        </button>
      ) : (
        <div className="booking-form">
          <div className="form-group">
            <label>{t('checkIn')}</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t('checkOut')}</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="booking-actions">
            <button onClick={handleBook} className="confirm">
              {t('confirmBooking')}
            </button>
            <button
              onClick={() => setShowBookingForm(false)}
              className="cancel"
            >
              {t('cancelBooking')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelCard;
