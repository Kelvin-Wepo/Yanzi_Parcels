importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging.js");

firebase.initializeApp({
    apiKey: "AIzaSyCTWnfHBuJLr2BmYiLKL8QFI7YmUFXZRAg",
    authDomain: "yanzi-parcels.firebaseapp.com",
    projectId: "yanzi-parcels",
    storageBucket: "yanzi-parcels.appspot.com",
    messagingSenderId: "734651121642",
    appId: "1:734651121642:web:bf8d151edbc32868647c93",
});

const messaging = firebase.messaging();