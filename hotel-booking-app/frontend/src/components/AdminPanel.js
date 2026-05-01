import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import { useModal } from '../ModalContext';
import './AdminPanel.css';

function AdminPanel({ token, userId }) {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const { t } = useLanguage();
  const { showAlert, showConfirm } = useModal();
  const [activeSection, setActiveSection] = useState(null);
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [editHotelData, setEditHotelData] = useState({});
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelData, setNewHotelData] = useState({ name: '', city: '', country: '', price: '', rating: '', available: true });
  const [hotelSearch, setHotelSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/usuarios', {
        headers: authHeaders
      });
      setUsers(response.data);
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get('/api/hotels');
      setHotels(response.data);
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings', { headers: authHeaders });
      setBookings(response.data);
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    if (activeSection === 'users') {
      setLoading(true);
      fetchUsers().finally(() => setLoading(false));
    } else if (activeSection === 'hotels') {
      setLoading(true);
      fetchHotels().finally(() => setLoading(false));
    } else if (activeSection === 'bookings') {
      setLoading(true);
      fetchBookings().finally(() => setLoading(false));
    }
  }, [activeSection]);

  // ─── User actions ──────────────────────────────────
  const handleDeleteUser = (id) => {
    showConfirm(t('deleteConfirm'), async () => {
      try {
        await axios.delete(`/api/admin/usuarios/${id}`, { headers: authHeaders });
        showAlert(t('userDeleted'));
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setEditFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      mail: user.mail || '',
      enabled: user.enabled,
      is_admin: user.is_admin
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`/api/admin/usuarios/${id}`, editFormData, {
        headers: authHeaders
      });
      showAlert(t('userUpdated'));
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  // ─── Hotel actions ──────────────────────────────────
  const handleDeleteHotel = (id) => {
    showConfirm(t('deleteHotelConfirm'), async () => {
      try {
        await axios.delete(`/api/hotels/${id}`, { headers: authHeaders });
        showAlert(t('hotelDeleted'));
        setHotels(hotels.filter(h => h.id !== id));
      } catch (error) {
        if (error.response?.status === 409) {
          showAlert(t('hotelHasBookings'));
        } else {
          showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
        }
      }
    });
  };

  const handleEditHotelClick = (hotel) => {
    setEditingHotelId(hotel.id);
    setEditHotelData({
      name: hotel.name || '',
      city: hotel.city || '',
      country: hotel.country || '',
      price: hotel.price || '',
      rating: hotel.rating || '',
      available: hotel.available ? 1 : 0
    });
  };

  const handleCancelEditHotel = () => {
    setEditingHotelId(null);
    setEditHotelData({});
  };

  const handleHotelFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditHotelData({
      ...editHotelData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    });
  };

  const handleSaveHotel = async (id) => {
    if (!editHotelData.name || !editHotelData.city || !editHotelData.country || !editHotelData.price || !editHotelData.rating) {
      showAlert(t('allFieldsRequired'));
      return;
    }
    try {
      await axios.put(`/api/hotels/${id}`, {
        ...editHotelData,
        available: editHotelData.available === 1
      }, { headers: authHeaders });
      showAlert(t('hotelUpdated'));
      setEditingHotelId(null);
      fetchHotels();
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const handleNewHotelChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewHotelData({
      ...newHotelData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddHotel = async () => {
    if (!newHotelData.name || !newHotelData.city || !newHotelData.country || !newHotelData.price || !newHotelData.rating) {
      showAlert(t('allFieldsRequired'));
      return;
    }
    try {
      await axios.post('/api/hotels', {
        ...newHotelData,
        price: parseFloat(newHotelData.price),
        rating: parseFloat(newHotelData.rating),
        available: newHotelData.available ? 1 : 0
      }, { headers: authHeaders });
      showAlert(t('hotelCreated'));
      setShowAddHotelModal(false);
      setNewHotelData({ name: '', city: '', country: '', price: '', rating: '', available: true });
      fetchHotels();
    } catch (error) {
      showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  // ─── Booking actions ──────────────────────────────────
  const handleDeleteBooking = (id) => {
    showConfirm(t('deleteBookingConfirm'), async () => {
      try {
        await axios.delete(`/api/bookings/${id}`, { headers: authHeaders });
        showAlert(t('bookingDeleted'));
        setBookings(bookings.filter(b => b.id !== id));
      } catch (error) {
        showAlert(t('actionFailed') + ': ' + (error.response?.data?.error || error.message));
      }
    });
  };

  // ─── Dashboard view ──────────────────────────────────
  if (!activeSection) {
    return (
      <div className="admin-panel">
        <h2 className="section-title">{t('adminPanel')}</h2>
        <div className="admin-dashboard">
          <div className="dashboard-card" onClick={() => setActiveSection('users')}>
            <div className="dashboard-icon">👥</div>
            <h3>{t('manageUsers')}</h3>
            <p>{t('manageUsersDesc')}</p>
          </div>
          <div className="dashboard-card" onClick={() => setActiveSection('hotels')}>
            <div className="dashboard-icon">🏨</div>
            <h3>{t('manageHotels')}</h3>
            <p>{t('manageHotelsDesc')}</p>
          </div>
          <div className="dashboard-card" onClick={() => setActiveSection('bookings')}>
            <div className="dashboard-icon">📋</div>
            <h3>{t('manageBookings')}</h3>
            <p>{t('manageBookingsDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Section views ──────────────────────────────────
  return (
    <div className="admin-panel">
      <button className="btn-back" onClick={() => setActiveSection(null)}>
        ← {t('backToDashboard')}
      </button>

      {loading && <p>Loading...</p>}

      {/* ─── USERS SECTION ─── */}
      {activeSection === 'users' && !loading && (
        <>
          <h2 className="section-title">{t('manageUsers')}</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('username')}</th>
                  <th>{t('name')}</th>
                  <th>{t('lastNameField')}</th>
                  <th>{t('emailField')}</th>
                  <th>{t('enabled')}</th>
                  <th>{t('role')}</th>
                  <th>{t('edit')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.usuario}</td>
                    {editingUserId === u.id ? (
                      <>
                        <td><input type="text" name="nombre" value={editFormData.nombre} onChange={handleFormChange} /></td>
                        <td><input type="text" name="apellido" value={editFormData.apellido} onChange={handleFormChange} /></td>
                        <td><input type="email" name="mail" value={editFormData.mail} onChange={handleFormChange} /></td>
                        <td><input type="checkbox" name="enabled" checked={editFormData.enabled === 1} onChange={handleFormChange} /></td>
                        <td>
                          <select name="is_admin" value={editFormData.is_admin} onChange={handleFormChange}>
                            <option value={0}>{t('userRole')}</option>
                            <option value={1}>{t('adminRole')}</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn-save" onClick={() => handleSave(u.id)}>{t('save')}</button>
                          <button className="btn-cancel" onClick={handleCancelEdit}>{t('cancelEdit')}</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.nombre}</td>
                        <td>{u.apellido}</td>
                        <td>{u.mail}</td>
                        <td>{u.enabled ? t('yes') : t('no')}</td>
                        <td>{u.is_admin ? t('adminRole') : t('userRole')}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditClick(u)}>{t('edit')}</button>
                          <button className="btn-delete" onClick={() => handleDeleteUser(u.id)}>{t('delete')}</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── HOTELS SECTION ─── */}
      {activeSection === 'hotels' && !loading && (
        <>
          <h2 className="section-title">{t('manageHotels')}</h2>
          <div className="section-actions">
            <input
              type="text"
              className="hotel-search-input"
              placeholder={t('searchByLocation')}
              value={hotelSearch}
              onChange={(e) => setHotelSearch(e.target.value)}
            />
            <button className="btn-add" onClick={() => setShowAddHotelModal(true)}>+ {t('addHotel')}</button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('hotelName')}</th>
                  <th>{t('city')}</th>
                  <th>{t('country')}</th>
                  <th>{t('price')}</th>
                  <th>{t('rating')}</th>
                  <th>{t('available')}</th>
                  <th>{t('edit')}</th>
                </tr>
              </thead>
              <tbody>
                {hotels.filter(h => {
                  if (!hotelSearch) return true;
                  const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                  const q = normalize(hotelSearch);
                  return (
                    String(h.id).includes(q) ||
                    normalize(h.name).includes(q) ||
                    normalize(h.city).includes(q) ||
                    normalize(h.country).includes(q)
                  );
                }).map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    {editingHotelId === h.id ? (
                      <>
                        <td><input type="text" name="name" value={editHotelData.name} onChange={handleHotelFormChange} /></td>
                        <td><input type="text" name="city" value={editHotelData.city} onChange={handleHotelFormChange} /></td>
                        <td><input type="text" name="country" value={editHotelData.country} onChange={handleHotelFormChange} /></td>
                        <td><input type="number" name="price" value={editHotelData.price} onChange={handleHotelFormChange} step="0.01" min="0" /></td>
                        <td><input type="number" name="rating" value={editHotelData.rating} onChange={handleHotelFormChange} step="0.1" min="0" max="5" /></td>
                        <td><input type="checkbox" name="available" checked={editHotelData.available === 1} onChange={handleHotelFormChange} /></td>
                        <td>
                          <button className="btn-save" onClick={() => handleSaveHotel(h.id)}>{t('save')}</button>
                          <button className="btn-cancel" onClick={handleCancelEditHotel}>{t('cancelEdit')}</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{h.name}</strong></td>
                        <td>{h.city}</td>
                        <td>{h.country}</td>
                        <td>${h.price}</td>
                        <td>⭐ {h.rating}</td>
                        <td>{h.available ? t('yes') : t('no')}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditHotelClick(h)}>{t('edit')}</button>
                          <button className="btn-delete" onClick={() => handleDeleteHotel(h.id)}>{t('delete')}</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── BOOKINGS SECTION ─── */}
      {activeSection === 'bookings' && !loading && (
        <>
          <h2 className="section-title">{t('manageBookings')}</h2>
          <div className="table-container">
            {bookings.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('user')}</th>
                    <th>{t('hotel')}</th>
                    <th>{t('city')}</th>
                    <th>{t('checkIn')}</th>
                    <th>{t('checkOut')}</th>
                    <th>{t('pricePerNight')}</th>
                    <th>{t('totalPrice')}</th>
                    <th>{t('status')}</th>
                    <th>{t('edit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.userName || `ID: ${b.userId}`}</td>
                      <td>{b.hotelName || `ID: ${b.hotelId}`}</td>
                      <td>{b.hotelCity || '-'}</td>
                      <td>{b.checkIn}</td>
                      <td>{b.checkOut}</td>
                      <td>${b.pricePerNight}</td>
                      <td><strong>${b.totalPrice}</strong></td>
                      <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteBooking(b.id)}>{t('delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-results">{t('noBookingsFound')}</div>
            )}
          </div>
        </>
      )}

      {/* ─── ADD HOTEL MODAL ─── */}
      {showAddHotelModal && (
        <div className="modal-overlay" onClick={() => setShowAddHotelModal(false)}>
          <div className="modal-content add-hotel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addHotel')}</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>{t('hotelName')} *</label>
                <input type="text" name="name" value={newHotelData.name} onChange={handleNewHotelChange} required />
              </div>
              <div className="form-group">
                <label>{t('city')} *</label>
                <input type="text" name="city" value={newHotelData.city} onChange={handleNewHotelChange} required />
              </div>
              <div className="form-group">
                <label>{t('country')} *</label>
                <input type="text" name="country" value={newHotelData.country} onChange={handleNewHotelChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('price')} *</label>
                  <input type="number" name="price" value={newHotelData.price} onChange={handleNewHotelChange} step="0.01" min="0" required />
                </div>
                <div className="form-group">
                  <label>{t('rating')} *</label>
                  <input type="number" name="rating" value={newHotelData.rating} onChange={handleNewHotelChange} step="0.1" min="0" max="5" required />
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="available" checked={newHotelData.available} onChange={handleNewHotelChange} />
                  {t('available')}
                </label>
              </div>
              <div className="modal-buttons">
                <button className="btn-save" onClick={handleAddHotel}>{t('save')}</button>
                <button className="btn-cancel" onClick={() => setShowAddHotelModal(false)}>{t('cancelEdit')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
