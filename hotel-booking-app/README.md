# Hotel Booking Testing Application

Una aplicación fullstack para pruebas de testing. Incluye un backend con Node.js/Express y un frontend con React.

## 📋 Descripción

Esta es una aplicación **intencionalmente defectuosa** diseñada para propósitos de testing y QA. La aplicación permite registrar usuarios, hacer login y reservar hoteles.

## 🎯 Características

- ✅ Sistema de login con usuarios habilitados e inhabilitados
- ✅ Búsqueda y filtrado de hoteles
- ✅ Reserva de hoteles con validación de fechas
- ✅ Gestión de reservas
- ✅ **Bugs intencionales para testing**

## 🐛 Bugs Intencionales

El proyecto contiene los siguientes bugs para propósitos de testing:

### Backend
1. **Contraseñas en texto plano** - Las contraseñas se almacenan sin encriptar
2. **No valida usuarios inhabilitados** - Los usuarios inhabilitados pueden hacer login
3. **Sin tokens con expiración** - Los tokens JWT no expiran
4. **Validación de fechas ausente** - Permite fechas inválidas en reservas
5. **Sin autenticación en eliminar booking** - Cualquiera puede cancelar cualquier reserva
6. **Comparison bug en filtros** - El filtro de precio compara strings con números

### Frontend
1. **Sin validación de cliente** - Los formularios no validan antes de enviar
2. **Test credentials expuestos** - Las credenciales de prueba se muestran en la UI
3. **Sin verificación de disponibilidad** - Se puede reservar hoteles no disponibles
4. **Sin validación de fechas** - Permite fechas inválidas

## 🚀 Instalación

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend correrá en `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm start
```

El frontend correrá en `http://localhost:3000`

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Estado |
|---------|-----------|--------|
| testuser | password123 | Habilitado |
| disableduser | password123 | **Inhabilitado** |
| admin | admin123 | Habilitado |

## 📝 Notas para Testing

- Intenta hacer login con un usuario inhabilitado (debería fallar pero no falla)
- Intenta filtrar hoteles por precio (el filtro tiene un bug de comparación)
- Intenta reservar un hotel con fechas inválidas (debería validar)
- Intenta reservar un hotel marcado como no disponible (debería rechazarse)
- Verifica si puedes cancelar reservas de otros usuarios

## 🔧 Stack Tecnológico

- **Backend**: Node.js, Express, CORS, JWT (básicos)
- **Frontend**: React, Axios, CSS3
- **Database**: Mock en memoria (Arrays)

## 📄 Estructura del Proyecto

```
hotel-booking-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   │       ├── Login.js
│   │       ├── HotelSearch.js
│   │       └── HotelCard.js
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## 🎓 Propósito Educativo

Este proyecto es ideal para:
- Aprender a identificar vulnerabilidades de seguridad
- Practicar testing y QA
- Entender bugs comunes en aplicaciones web
- Practicar debugging

---

¡Bienvenido al testing! 🧪
