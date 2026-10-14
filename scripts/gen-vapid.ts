import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();

console.log("\n--- Generated VAPID Keys ---");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log("----------------------------\n");
console.log("Copy these keys to your .env.local file.\n");
