# CameraTrade - Premium Device Trade-In Platform

A modern, premium web application for device trade-ins with a focus on cameras (Canon, Nikon, Sony, Fujifilm). Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Design Philosophy

- **Premium Feel**: App-like experience, not a generic e-commerce site
- **Mobile-First**: Responsive design optimized for all devices
- **Visual Storytelling**: Minimal text, maximum visual impact
- **3D Depth Effects**: Subtle 3D transforms and glassmorphism
- **Smooth Animations**: Micro-interactions and scroll animations

## ✨ Features

### Home Page
- **Hero Section**: Full-screen hero with 3D camera visualization and floating animations
- **Category Section**: 3D floating cards for device categories (Cameras active, Phones/Laptops coming soon)
- **How It Works**: Visual step-by-step guide with animated icons
- **Trust Section**: Clean badges showing key benefits
- **CTA Section**: Strong call-to-action with gradient animations

### Trade-In Flow
- Step-by-step valuation process
- Real-time price calculation
- Progress indicator
- Dynamic price updates based on condition, usage, and accessories
- Smooth transitions without page reloads

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Animations**: Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (ready for integration)

## 📦 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🗄️ Database Schema

### Valuations Collection
```typescript
{
  id: string
  userId?: string
  category: 'cameras' | 'phones' | 'laptops'
  brand: string
  model: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  usage: 'light' | 'moderate' | 'heavy'
  accessories: string[]
  basePrice: number
  estimatedValue: number
  finalValue?: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: Timestamp
  updatedAt: Timestamp
  pickupAddress?: string
  pickupDate?: Date
  paymentMethod?: string
}
```

### Devices Collection
```typescript
{
  id: string
  brand: string
  model: string
  category: 'cameras' | 'phones' | 'laptops'
  basePrice: number
  imageUrl?: string
  specifications?: Record<string, any>
  createdAt: Timestamp
}
```

### Users Collection
```typescript
{
  id: string
  email: string
  name?: string
  phone?: string
  address?: string
  createdAt: Timestamp
}
```

## 🚀 API Routes

### POST `/api/valuations`
Create a new valuation
```json
{
  "category": "cameras",
  "brand": "canon",
  "model": "EOS R5",
  "condition": "excellent",
  "usage": "light",
  "accessories": ["box", "charger"],
  "basePrice": 2500,
  "estimatedValue": 2650,
  "userId": "optional"
}
```

### GET `/api/valuations?id={id}`
Get a specific valuation by ID

### GET `/api/valuations?userId={userId}`
Get all valuations for a user

### PATCH `/api/valuations`
Update a valuation
```json
{
  "id": "valuation_id",
  "status": "approved",
  "finalValue": 2600
}
```

### GET `/api/devices?category={category}`
Get all devices in a category

### GET `/api/devices?brand={brand}&model={model}`
Get a specific device

### POST `/api/calculate`
Calculate device value
```json
{
  "brand": "canon",
  "model": "EOS R5",
  "condition": "excellent",
  "usage": "light",
  "accessories": ["box", "charger"]
}
```

## 🎯 Architecture Decisions

### UI/UX
- **3D Effects**: CSS transforms with `perspective` and `preserve-3d` for lightweight 3D effects without heavy libraries
- **Glassmorphism**: Backdrop blur effects for modern, premium feel
- **Micro-animations**: Framer Motion for smooth, performant animations
- **Progressive Disclosure**: Step-by-step flow reduces cognitive load

### Backend
- **Next.js API Routes**: Serverless functions for easy deployment
- **Firebase Firestore**: NoSQL database for flexible schema and real-time updates
- **Type Safety**: Full TypeScript coverage for better developer experience

### Performance
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component ready
- **Lazy Loading**: Components load on demand

## 📱 Mobile Optimization

- Touch-friendly button sizes (min 44x44px)
- Swipe gestures ready for implementation
- Responsive typography scales
- Optimized animations for mobile performance

## 🔮 Future Enhancements

- [ ] User authentication and profiles
- [ ] Image upload for device condition
- [ ] Pickup scheduling
- [ ] Payment integration
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Phone and laptop categories
- [ ] Advanced search and filters
- [ ] Device comparison tool

## 📄 License

MIT





