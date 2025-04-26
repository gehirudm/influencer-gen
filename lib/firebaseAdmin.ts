import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

const appAdmin = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

export default appAdmin;