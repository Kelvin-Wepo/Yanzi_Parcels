// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCTWnfHBuJLr2BmYiLKL8QFI7YmUFXZRAg",
  authDomain: "yanzi-parcels.firebaseapp.com",
  projectId: "yanzi-parcels",
  storageBucket: "yanzi-parcels.appspot.com",
  messagingSenderId: "734651121642",
  appId: "1:734651121642:web:bf8d151edbc32868647c93",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { notification, data } = payload;
  
  // Customize notification based on type
  let notificationTitle = notification?.title || 'Yanzi Parcels';
  let notificationOptions = {
    body: notification?.body || 'You have a new notification',
    icon: '/img/logo.png',
    badge: '/img/badge.png',
    vibrate: [200, 100, 200],
    tag: data?.job_id || 'default',
    requireInteraction: true,
    data: data,
  };

  // If it's a new job notification, add actions
  if (data?.type === 'new_job') {
    notificationTitle = '🚚 New Delivery Job!';
    notificationOptions = {
      ...notificationOptions,
      body: `${data.name} - KSh ${Math.round(parseFloat(data.price) * 0.8).toLocaleString()} (${data.distance} km)`,
      actions: [
        { action: 'accept', title: '✅ Accept' },
        { action: 'view', title: '👁️ View' },
        { action: 'decline', title: '❌ Decline' },
      ],
    };
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data;
  let url = '/courier/available-jobs';

  if (data?.job_id) {
    if (event.action === 'accept' || event.action === 'view') {
      url = `/courier/available-jobs/${data.job_id}`;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('/courier') && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(url);
            }
          });
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
