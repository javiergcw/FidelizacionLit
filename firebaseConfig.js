// Importa Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para desarrollo
const devConfig = {

    apiKey: "AIzaSyA_sn7JbSzQORvnXXARBPrWacIpq2EMjME",
    authDomain: "foqqus-test.firebaseapp.com",
    projectId: "foqqus-test",
    storageBucket: "foqqus-test.firebasestorage.app",
    messagingSenderId: "104316148487",
    appId: "1:104316148487:web:3546c06efce76bf0e9c3a2",
    //measurementId: "G-30ZF90KBX5",
};

// Configuración de Firebase para producción
const prodConfig = {
    apiKey: "AIzaSyCixI_4M9aq6J3gdGRGkFMAyIJl3lQFrX4",
    authDomain: "foqqustech.firebaseapp.com",
    projectId: "foqqustech",
    storageBucket: "foqqustech.appspot.com",
    messagingSenderId: "675519725560",
    appId: "1:675519725560:web:cafa7612713d5f95cd200d",
    //measurementId: "G-4RX84Y55LB",
};

// Cambia entre 'dev' y 'prod' aquí
const ENV = "prod"; // Cambia a "prod" para producción

// Selecciona la configuración según el entorno
const firebaseConfig = ENV === "prod" ? prodConfig : devConfig;

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Firestore
export const db = getFirestore(app);
