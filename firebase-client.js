import {firebaseConfig} from './firebase-config.js?v=20261016';
let client;
export async function getClient(){
 if(!firebaseConfig?.projectId)return null;
 if(!client)client=(async()=>{
 const [app,auth,db]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')]);
 const instance=app.initializeApp(firebaseConfig);return {authApi:auth,dbApi:db,auth:auth.getAuth(instance),db:db.getFirestore(instance)};
 })();return client;
}

