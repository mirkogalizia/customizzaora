import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDrj9cyfoPmup3ydj2sUm7qYGafAUxSksQ",
  authDomain: "mio-print-shop.firebaseapp.com",
  projectId: "mio-print-shop",
  storageBucket: "mio-print-shop.firebasestorage.app",
  messagingSenderId: "761369700408",
  appId: "1:761369700408:web:6b96dde9831eaa3e1a9ecd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = 'admin@printshop.com';
  const password = 'admin123456';
  const name = 'Admin';

  console.log('🔧 Creating admin user...');
  console.log('Email:', email);
  console.log('Password:', password);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Auth user created:', userCredential.user.uid);

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🔗 Go to: http://localhost:3000/login');
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists. Try logging in.');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createAdmin();
