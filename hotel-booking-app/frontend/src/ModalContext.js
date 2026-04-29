import React, { createContext, useState, useContext } from 'react';
import CustomModal from './components/CustomModal';

const ModalContext = createContext();

export const useModal = () => {
  return useContext(ModalContext);
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    type: 'alert', // 'alert' or 'confirm'
    onConfirm: null,
  });

  const showAlert = (message) => {
    setModalState({
      isOpen: true,
      message,
      type: 'alert',
      onConfirm: null,
    });
  };

  const showConfirm = (message, onConfirm) => {
    setModalState({
      isOpen: true,
      message,
      type: 'confirm',
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modalState.isOpen && (
        <CustomModal
          message={modalState.message}
          type={modalState.type}
          onClose={closeModal}
          onConfirm={handleConfirm}
        />
      )}
    </ModalContext.Provider>
  );
};
