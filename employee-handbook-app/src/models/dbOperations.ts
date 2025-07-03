/* eslint-disable */
import { db } from "../dbConfig/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  collectionGroup,
  writeBatch
} from "firebase/firestore";

export {
  db,
  collection,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch
};

import {
  User,
  UserType,
  Company,
  Chat,
  Message,
  Document
} from "./schema";

// collections - users
const usersRef = collection(db, "users");

export const createUser = async (userData: Omit<User, "id">) => {
  return await addDoc(usersRef, {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const getUser = async (userId: string) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as User) : null;
};

// collections - companies
const companiesRef = collection(db, "companies");

export const createCompany = async (companyData: Omit<Company, "id">) => {
  return await addDoc(companiesRef, {
    ...companyData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

// collection - chats
const chatsRef = collection(db, "chats");

export const createChat = async (chatData: Omit<Chat, "id">) => {
  return await addDoc(chatsRef, {
    ...chatData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const getChat = async (chatId: string) => {
  const docRef = doc(db, "chats", chatId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Chat) : null;
};

// subcollections - messages (under each chat)
export const addMessageToChat = async (
  chatId: string,
  messageData: Omit<Message, "id">
) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  return await addDoc(messagesRef, {
    ...messageData,
    createdAt: new Date(),
  });
};

// collections - documents
const documentsRef = collection(db, "documents");

export const addDocument = async (documentData: Omit<Document, "id">) => {
  return await addDoc(documentsRef, {
    ...documentData,
    uploadDate: new Date(),
  });
};

// advanced queries
export const getUserChats = async (userId: string) => {
  const q = query(chatsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
};

export const getCompanyDocuments = async (companyId: string) => {
  const q = query(documentsRef, where("companyId", "==", companyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
};