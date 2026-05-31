import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Yeh function ek baar chalega — sab users ka Firestore profile banayega
export const seedAllUsers = async () => {
  const users = [
    {
      uid_email: 'sohail@spco.sa',
      name: 'Sohail Aslam',
      role: 'admin',
      dc: 'Head Office',
      department: 'Management',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'shakeer@spco.sa',
      name: 'Muhammad Shakeel',
      role: 'planning',
      dc: 'Head Office',
      department: 'Planning',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'baber@spco.sa',
      name: 'Baber',
      role: 'planning',
      dc: 'Head Office',
      department: 'Planning',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'waleed.alqahtani@spco.sa',
      name: 'AlWaleed Qahtani',
      role: 'manager',
      dc: 'Riyadh',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'mansoor@spco.sa',
      name: 'Mansoor Khattaf',
      role: 'manager',
      dc: 'Riyadh',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'anas@spco.sa',
      name: 'Muhammad Anas',
      role: 'manager',
      dc: 'Jeddah',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'saleh@spco.sa',
      name: 'Muhammad Saleh',
      role: 'manager',
      dc: 'Dammam',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver1.riyadh@spco.sa',
      name: 'Driver 1 Riyadh',
      role: 'driver',
      dc: 'Riyadh',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver2.riyadh@spco.sa',
      name: 'Driver 2 Riyadh',
      role: 'driver',
      dc: 'Riyadh',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver1.jeddah@spco.sa',
      name: 'Driver 1 Jeddah',
      role: 'driver',
      dc: 'Jeddah',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver2.jeddah@spco.sa',
      name: 'Driver 2 Jeddah',
      role: 'driver',
      dc: 'Jeddah',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver1.dammam@spco.sa',
      name: 'Driver 1 Dammam',
      role: 'driver',
      dc: 'Dammam',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'driver2.dammam@spco.sa',
      name: 'Driver 2 Dammam',
      role: 'driver',
      dc: 'Dammam',
      department: 'Logistics',
      mobile: '',
      status: 'active'
    },
    {
      uid_email: 'asim@spco.sa',
      name: 'Asim Ahmed',
      role: 'viewonly',
      dc: 'All',
      department: 'Management',
      mobile: '',
      status: 'active'
    }
  ];

  console.log('Seeding users to Firestore...');
  
  for (const user of users) {
    await setDoc(doc(db, 'users_seed', user.uid_email), user);
    console.log('Added:', user.uid_email);
  }
  
  console.log('All users seeded!');
};
