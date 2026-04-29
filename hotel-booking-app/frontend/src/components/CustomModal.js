import React from 'react';
import './CustomModal.css';

const CustomModal = ({ message, type, onClose, onConfirm }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          {type === 'confirm' ? (
            <>
              <button className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button className="btn-confirm" onClick={onConfirm}>Aceptar</button>
            </>
          ) : (
            <button className="btn-confirm" onClick={onClose}>Aceptar</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
