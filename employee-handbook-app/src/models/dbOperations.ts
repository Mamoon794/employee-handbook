import { db } from "../dbConfig/firebaseConfig"
import { Timestamp } from "firebase-admin/firestore"
import { firestore } from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import {
  User,
  Company,
  Chat,
  Message,
  Document,
  Invitation,
  UserType,
  PopularQuestion,
} from "./schema"

// collections - users
const usersRef = db.collection("users")

export const createUser = async (userData: Omit<User, "id">) => {
  const dataToAdd = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await usersRef.add(dataToAdd)
  return docRef
}

export const getUser = async (userId: string) => {
  const docRef = usersRef.doc(userId)
  const docSnap = await docRef.get()
  return docSnap.exists ? ({ id: docSnap.id, ...docSnap.data() } as User) : null
}

export const getClerkUser = async (clerkId: string) => {
  const theQuery = usersRef.where("clerkUserId", "==", clerkId)
  const querySnapshot = await theQuery.get()
  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) =>
      ({ id: doc.id, ...doc.data() } as User)
  )
}

export const getAllUsers = async (companyId: string, sort: string) => {
  const query = usersRef.where("companyId", "==", companyId).orderBy(sort)
  const querySnapshot = await query.get()
  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) =>
      ({ id: doc.id, ...doc.data() } as User)
  )
}

export const updateUser = async (userId: string, userType: UserType) => {
  const query = usersRef.where("clerkUserId", "==", userId).limit(1)
  const querySnapshot = await query.get()
  if (querySnapshot.empty) {
    return null
  }
  const userDoc = querySnapshot.docs[0]
  const currentData = userDoc.data() as User

  // only update if userType has changed
  if (currentData.userType === userType) {
    return { id: userDoc.id, ...currentData }
  }

  await userDoc.ref.update({ userType, updatedAt: new Date() })
  const updatedDoc = await userDoc.ref.get()
  return { id: updatedDoc.id, ...updatedDoc.data() } as User
}

export const deleteUser = async (userId: string) => {
  const query = usersRef.where("clerkUserId", "==", userId).limit(1)
  const querySnapshot = await query.get()
  if (querySnapshot.empty) {
    return false
  }
  const userDoc = querySnapshot.docs[0]
  await userDoc.ref.delete()
  return true
}

export const removeUserFromCompany = async (userId: string) => {
  const query = usersRef.where("clerkUserId", "==", userId).limit(1)
  const querySnapshot = await query.get()
  if (querySnapshot.empty) {
    return false
  }
  const userDoc = querySnapshot.docs[0]
  await userDoc.ref.update({
    companyId: FieldValue.delete(),
    companyName: FieldValue.delete(),
  })
  return true
}

// // collections - companies
const companiesRef = db.collection("companies")

export const createCompany = async (companyData: Omit<Company, "id">) => {
  const dataToAdd = {
    ...companyData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await companiesRef.add(dataToAdd)
  return docRef
}

export const getCompany = async (companyId: string) => {
  const docRef = companiesRef.doc(companyId)
  const docSnap = await docRef.get()
  const docData = docSnap.data()
  if (docData.createdAt instanceof Timestamp)
    docData.createdAt = docData.createdAt.toDate()
  if (docData.updatedAt instanceof Timestamp)
    docData.updatedAt = docData.updatedAt.toDate()
  return docSnap.exists ? ({ id: docSnap.id, ...docData } as Company) : null
}

export const updateCompany = async (
  companyId: string,
  companyData: Partial<Omit<Company, "id">>
) => {
  const docRef = companiesRef.doc(companyId)
  const docSnap = await docRef.get()
  if (!docSnap.exists) {
    throw new Error(`Company with ID ${companyId} does not exist.`)
  }
  const updatedData = {
    ...docSnap.data(),
    ...companyData,
    updatedAt: new Date(),
  }
  await docRef.update(updatedData)
  return { id: docSnap.id, ...updatedData } as Company
}

// // collection - chats
const chatsRef = db.collection("chats")

export const createChat = async (chatData: Omit<Chat, "id">) => {
  const dataToAdd = {
    ...chatData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await chatsRef.add(dataToAdd)
  return docRef
}

export const getChat = async (chatId: string) => {
  const docRef = chatsRef.doc(chatId)
  const docSnap = await docRef.get()
  const docData = docSnap.data()
  if (docData.createdAt instanceof Timestamp)
    docData.createdAt = docData.createdAt.toDate()
  if (docData.updatedAt instanceof Timestamp)
    docData.updatedAt = docData.updatedAt.toDate()
  return docSnap.exists ? ({ id: docSnap.id, ...docData } as Chat) : null
}

// updating chat titles
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<void> => {
  await chatsRef.doc(chatId).update({
    title,
    updatedAt: new Date(),
  })
}

export const getFirstMessageContent = async (
  chatId: string
): Promise<string | null> => {
  const chat = await getChat(chatId)
  return chat?.messages?.[0]?.content || null
}

// // subcollections - messages (under each chat)
export const addMessageToChat = async (
  chatId: string,
  messageData: Omit<Message, "id">
) => {
  const theChat = await getChat(chatId)
  if (!theChat) {
    throw new Error(`Chat with ID ${chatId} does not exist.`)
  }
  const messages = theChat.messages || []
  const dataToAdd = {
    ...messageData,
    createdAt: new Date(),
  }
  messages.push(dataToAdd)
  const docRef = await chatsRef.doc(chatId).update({ messages })
  if (!docRef) {
    throw new Error(`Failed to add message to chat with ID ${chatId}.`)
  }
  return docRef
}

export const deleteChat = async (chatId: string) => {
  const docRef = chatsRef.doc(chatId)
  const docSnap = await docRef.get()
  if (!docSnap.exists) {
    throw new Error(`Chat with ID ${chatId} does not exist.`)
  }
  await docRef.delete()
  return { message: `Chat with ID ${chatId} deleted successfully.` }
}

// // collections - documents
const documentsRef = db.collection("documents")

export const addDocument = async (documentData: Omit<Document, "id">) => {
  const dataToAdd = {
    ...documentData,
    uploadDate: new Date(),
  }
  const docRef = await documentsRef.add(dataToAdd)
  return docRef
}

// // advanced queries
export const getUserChats = async (userId: string) => {
  const theQuery = chatsRef.where("userId", "==", userId)
  const querySnapshot = await theQuery.get()
  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) =>
      ({ id: doc.id, ...doc.data() } as Chat)
  )
}

export const getCompanyDocuments = async (companyId: string) => {
  const theQuery = documentsRef.where("companyId", "==", companyId)
  const querySnapshot = await theQuery.get()
  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) =>
      ({ id: doc.id, ...doc.data() } as Document)
  )
}

// for invitations

// collections - invitations
const invitationsRef = db.collection("invitations")

export const createInvitation = async (
  invitationData: Omit<Invitation, "id" | "status">
) => {
  const dataToAdd = {
    ...invitationData,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await invitationsRef.add(dataToAdd)
  return docRef
}

export const getInvitation = async (invitationId: string) => {
  const docRef = invitationsRef.doc(invitationId)
  const docSnap = await docRef.get()
  return docSnap.exists
    ? ({ id: docSnap.id, ...docSnap.data() } as Invitation)
    : null
}

export const updateInvitationStatus = async (
  invitationId: string,
  status: "accepted" | "rejected"
) => {
  await invitationsRef.doc(invitationId).update({
    status,
    updatedAt: new Date(),
  })
}

// also expires invitations over 7 days
export const getPendingInvitationsByCompany = async (
  companyId: string
): Promise<Invitation[]> => {
  const theQuery = invitationsRef
    .where("companyId", "==", companyId)
    .where("status", "in", ["pending", "expired"])
  const querySnapshot = await theQuery.get()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const invitations = querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
      const data = doc.data()
      const createdAt = data.createdAt.toDate()

      if (data.status === "pending" && createdAt < sevenDaysAgo) {
        doc.ref.update({
          status: "expired",
          updatedAt: new Date(),
        })

        return {
          id: doc.id,
          email: data.email,
          createdAt,
          companyId: data.companyId,
          companyName: data.companyName,
          inviterId: data.inviterId,
          status: "expired",
          updatedAt: new Date(),
        } as Invitation
      }

      return {
        id: doc.id,
        email: data.email,
        createdAt,
        companyId: data.companyId,
        companyName: data.companyName,
        inviterId: data.inviterId,
        status: data.status,
        updatedAt: data.updatedAt.toDate(),
      } as Invitation
    }
  )

  return invitations
}

export const getAcceptedInvitationsByCompany = async (
  companyId: string
): Promise<Invitation[]> => {
  const theQuery = invitationsRef
    .where("companyId", "==", companyId)
    .where("status", "==", "accepted")

  const querySnapshot = await theQuery.get()

  return querySnapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        createdAt: data.createdAt.toDate(),
        companyId: data.companyId,
        companyName: data.companyName,
        inviterId: data.inviterId,
        status: data.status,
        updatedAt: data.updatedAt.toDate(),
      } as Invitation
    }
  )
}

export const expireInvitation = async (invitationId: string): Promise<void> => {
  await invitationsRef.doc(invitationId).update({
    status: "expired",
    updatedAt: new Date(),
  })
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    console.log(`Looking up user by email: ${email}`) // debugging
    const theQuery = usersRef.where("email", "==", email)
    const querySnapshot = await theQuery.get()

    const users = querySnapshot.docs.map(
      (doc: firestore.QueryDocumentSnapshot<User>) => ({
        id: doc.id,
        ...doc.data(),
      })
    )

    console.log(`Found ${users.length} users with this email`) // debugging
    return users[0] || null
  } catch (error) {
    console.error("Error in getUserByEmail:", error)
    throw error
  }
}

// collection - popular_questions
const popularQuestionsRef = db.collection("popular_questions")

// ~7 days + 1h overlap
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const OVERLAP_MS = 60 * 60 * 1000
const TTL_MS = 7 * ONE_DAY_MS + OVERLAP_MS

/**
 * Saves an array of popular questions to Firestore `popular_questions` collection in a batch.
 * @param popularQuestions Array of PopularQuestion objects.
 */
export const savePopularQuestions = async (
  popularQuestions: PopularQuestion[]
): Promise<void> => {
  const batch = db.batch()

  popularQuestions.forEach((q) => {
    const docRef = popularQuestionsRef.doc()
    batch.set(docRef, {
      province: q.province,
      company: q.company,
      text: q.text,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + TTL_MS)), // TTL is 7 days + 1 hour
    })
  })

  await batch.commit()
}

/**
 * Retrieves popular questions within the past 7 days and a specific scope (i.e. company name and province).
 * @param company The name of the user's company.
 * @param province The user's province.
 */
export const getPopularQuestions = async (
  company: string,
  province: string
): Promise<PopularQuestion[]> => {
  let query
  if (province == "" || province == "General") {
    query = popularQuestionsRef
      .where("company", "==", company)
      .where("expiresAt", ">", firestore.Timestamp.now())
      .orderBy("expiresAt", "desc")
  } else {
    query = popularQuestionsRef
      .where("company", "==", company)
      .where("province", "==", province)
      .where("expiresAt", ">", firestore.Timestamp.now())
      .orderBy("expiresAt", "desc")
  }

  const snapshot = await query.get()
  return snapshot.docs.map(
    (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) =>
      ({ id: doc.id, ...doc.data() } as PopularQuestion)
  )
}
