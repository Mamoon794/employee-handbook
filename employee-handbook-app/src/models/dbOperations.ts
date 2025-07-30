import { db } from "../dbConfig/firebaseConfig";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from 'firebase-admin';
import {
  User,
  Company,
  Chat,
  Message,
  Document,
  UserType,
  PopularQuestion
} from "./schema";

// collections - users
const usersRef = db.collection("users");

export const createUser = async (userData: Omit<User, "id">) => {
  const dataToAdd = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await usersRef.add(dataToAdd);
  return docRef;
};

export const getUser = async (userId: string) => {
  const docRef = usersRef.doc(userId);
  const docSnap = await docRef.get();
  return docSnap.exists ? ({ id: docSnap.id, ...docSnap.data() } as User) : null;
};

export const getClerkUser = async (clerkId: string) => {
  const theQuery = usersRef.where("clerkUserId", "==", clerkId);
  const querySnapshot = await theQuery.get();
  return querySnapshot.docs.map((doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => ({ id: doc.id, ...doc.data() } as User));
}

export const getAllUsers = async (companyId: string, sort: string) => {
  const query = usersRef
    .where("companyId", "==", companyId)
    .orderBy(sort);
  const querySnapshot = await query.get();
  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => 
      ({ id: doc.id, ...doc.data() } as User)
  );
}

export const updateUser = async (userId: string, userType: UserType) => {
  const query = usersRef.where("clerkUserId", "==", userId).limit(1);
  const querySnapshot = await query.get();
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  const currentData = userDoc.data() as User;
  
  // only update if userType has changed
  if (currentData.userType === userType) {
    return { id: userDoc.id, ...currentData };
  }

  await userDoc.ref.update({ userType, updatedAt: new Date() });
  const updatedDoc = await userDoc.ref.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

export const deleteUser = async (userId: string) => {
  const query = usersRef.where("clerkUserId", "==", userId).limit(1);
  const querySnapshot = await query.get();
  if (querySnapshot.empty) {
    return false;
  }
  const userDoc = querySnapshot.docs[0];
  await userDoc.ref.delete();
  return true;
}

// // collections - companies
const companiesRef = db.collection("companies");

export const createCompany = async (companyData: Omit<Company, "id">) => {
  const dataToAdd = {
    ...companyData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const docRef = await companiesRef.add(dataToAdd);
  return docRef;
};

export const getCompany = async (companyId: string) => {
  const docRef = companiesRef.doc(companyId);
  const docSnap = await docRef.get();
  const docData = docSnap.data();
  if (docData.createdAt instanceof Timestamp) docData.createdAt = docData.createdAt.toDate();
  if (docData.updatedAt instanceof Timestamp) docData.updatedAt = docData.updatedAt.toDate();
  return docSnap.exists ? ({ id: docSnap.id, ...docData } as Company) : null;
};

export const updateCompany = async (companyId: string, companyData: Partial<Omit<Company, "id">>) => {
  const docRef = companiesRef.doc(companyId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error(`Company with ID ${companyId} does not exist.`);
  }
  const updatedData = {
    ...docSnap.data(),
    ...companyData,
    updatedAt: new Date(),
  };
  await docRef.update(updatedData);
  return { id: docSnap.id, ...updatedData } as Company;
};

// // collection - chats
const chatsRef = db.collection("chats");

export const createChat = async (chatData: Omit<Chat, "id">) => {
  const dataToAdd = {
    ...chatData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const docRef = await chatsRef.add(dataToAdd);
  return docRef;
};

export const getChat = async (chatId: string) => {
  const docRef = chatsRef.doc(chatId);
  const docSnap = await docRef.get();
  const docData = docSnap.data();
  if (docData.createdAt instanceof Timestamp) docData.createdAt = docData.createdAt.toDate();
  if (docData.updatedAt instanceof Timestamp) docData.updatedAt = docData.updatedAt.toDate();
  return docSnap.exists ? ({ id: docSnap.id, ...docData } as Chat) : null;
};

// updating chat titles
export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  await chatsRef.doc(chatId).update({ 
    title,
    updatedAt: new Date() 
  });
};

export const getFirstMessageContent = async (chatId: string): Promise<string | null> => {
  const chat = await getChat(chatId);
  return chat?.messages?.[0]?.content || null; 
};

// // subcollections - messages (under each chat)
export const addMessageToChat = async (
  chatId: string,
  messageData: Omit<Message, "id">
) => {
  const theChat = await getChat(chatId);
  if (!theChat) {
    throw new Error(`Chat with ID ${chatId} does not exist.`);
  }
  const messages = theChat.messages || [];
  const dataToAdd = {
    ...messageData,
    createdAt: new Date(),
  };
  messages.push(dataToAdd);
  const docRef = await chatsRef.doc(chatId).update({ messages });
  if (!docRef) {
    throw new Error(`Failed to add message to chat with ID ${chatId}.`);
  }
  return docRef;
};

export const deleteChat = async (chatId: string) => {
  const docRef = chatsRef.doc(chatId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error(`Chat with ID ${chatId} does not exist.`);
  }
  await docRef.delete();
  return { message: `Chat with ID ${chatId} deleted successfully.` };
};

// // collections - documents
const documentsRef = db.collection("documents");

export const addDocument = async (documentData: Omit<Document, "id">) => {
  const dataToAdd = {
      ...documentData,
      uploadDate: new Date(),
    };
  const docRef = await documentsRef.add(dataToAdd);
  return docRef;
};

// // advanced queries
export const getUserChats = async (userId: string) => {
  const theQuery = chatsRef.where("userId", "==", userId);
  const querySnapshot = await theQuery.get();
  return querySnapshot.docs.map((doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => ({ id: doc.id, ...doc.data() } as Chat));
};

export const getCompanyDocuments = async (companyId: string) => {
  const theQuery = documentsRef.where("companyId", "==", companyId);
  const querySnapshot = await theQuery.get();
  return querySnapshot.docs.map((doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => ({ id: doc.id, ...doc.data() } as Document));
};

// collection - popular_questions
const popularQuestionsRef = db.collection("popular_questions");

/**
 * Saves an array of popular questions to Firestore `popular_questions` collection in a batch.
 * @param popularQuestions Array of PopularQuestion objects.
 */
export const savePopularQuestions = async (
  popularQuestions: PopularQuestion[]
): Promise<void> => {
  const batch = db.batch();

  popularQuestions.forEach(q => {
    const docRef = popularQuestionsRef.doc();
    batch.set(docRef, {
      province: q.province,
      company: q.company,
      text: q.text,
      createdAt: Timestamp.now()
    });
  });

  await batch.commit();
};

/**
 * Retrieves popular questions within the past 7 days and a specific scope (i.e. company name and province).
 * @param company The name of the user's company.
 * @param province The user's province.
 */
export const getPopularQuestions = async (
  company: string,
  province: string
): Promise<PopularQuestion[]> => {
  const sevenDaysAgo = Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const query = popularQuestionsRef
    .where("company", "==", company)
    .where("province", "==", province)
    .where("createdAt", ">=", sevenDaysAgo);
  
  const snapshot = await query.get();
  return snapshot.docs.map((doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => ({ id: doc.id, ...doc.data() } as PopularQuestion));
}