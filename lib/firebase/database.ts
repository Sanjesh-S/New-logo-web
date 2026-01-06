import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  addDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'

// Database Schema Types
export interface Valuation {
  id?: string
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
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  pickupAddress?: string
  pickupDate?: Date
  paymentMethod?: string
}

export interface Device {
  id: string
  brand: string
  model: string
  category: 'cameras' | 'phones' | 'laptops'
  basePrice: number
  imageUrl?: string
  specifications?: Record<string, any>
  createdAt: Timestamp | Date
}

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  address?: string
  createdAt: Timestamp | Date
}

// Valuation Operations
export async function createValuation(valuation: Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const valuationRef = collection(db, 'valuations')
  const newValuation = {
    ...valuation,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  const docRef = await addDoc(valuationRef, newValuation)
  return docRef.id
}

export async function getValuation(id: string): Promise<Valuation | null> {
  const docRef = doc(db, 'valuations', id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Valuation
  }
  return null
}

export async function updateValuation(id: string, updates: Partial<Valuation>): Promise<void> {
  const docRef = doc(db, 'valuations', id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

export async function getUserValuations(userId: string): Promise<Valuation[]> {
  const valuationsRef = collection(db, 'valuations')
  const q = query(valuationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Valuation[]
}

// Device Operations
export async function getDevices(category: string, brand?: string): Promise<Device[]> {
  const devicesRef = collection(db, 'devices')
  let q
  
  if (brand) {
    q = query(
      devicesRef,
      where('category', '==', category),
      where('brand', '==', brand.toLowerCase())
    )
  } else {
    q = query(devicesRef, where('category', '==', category))
  }
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Device[]
}

export async function getDevice(brand: string, model: string): Promise<Device | null> {
  const devicesRef = collection(db, 'devices')
  const q = query(
    devicesRef,
    where('brand', '==', brand.toLowerCase()),
    where('model', '==', model)
  )
  const querySnapshot = await getDocs(q)
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Device
  }
  return null
}

// User Operations
export async function createOrUpdateUser(userId: string, userData: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)
  
  if (userDoc.exists()) {
    await updateDoc(userRef, userData)
  } else {
    await setDoc(userRef, {
      id: userId,
      ...userData,
      createdAt: Timestamp.now(),
    })
  }
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User
  }
  return null
}



