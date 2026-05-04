import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getSessionId } from "@/lib/installation-cache";

export const USER_DATABASE_COLLECTION = "user-database";

export type UserDbFields = {
  answerText?: string;
  chosenQuestion?: string;
  storyCategory?: string;
  editedImageUrl?: string;
  email?: string;
  name?: string;
  pic01?: string;
  pic02?: string;
  pic03?: string;
  pic04?: string;
  photoboothRedoCount?: number;
  webcamImageUrl?: string;
};

export async function updateUserDb(fields: UserDbFields) {
  const ref = doc(db, USER_DATABASE_COLLECTION, getSessionId());

  await setDoc(
    ref,
    {
      ...fields,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserDb() {
  const ref = doc(db, USER_DATABASE_COLLECTION, getSessionId());
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserDbFields) : null;
}

export type ResponseEntry = {
  id: string;
  name: string;
  storyCategory: string;
  chosenQuestion: string;
  answerText: string;
};

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function getLastEntry(): Promise<ResponseEntry | null> {
  const sessionId = getSessionId();
  const q = query(
    collection(db, USER_DATABASE_COLLECTION),
    where("answerText", "!=", ""),
    limit(50)
  );
  const snap = await getDocs(q);
  const entries: ResponseEntry[] = [];
  for (const d of snap.docs) {
    if (d.id === sessionId) continue;
    const data = d.data() as UserDbFields;
    if (data.chosenQuestion && data.answerText && data.name) {
      entries.push({
        id: d.id,
        name: data.name,
        storyCategory: data.storyCategory ?? "",
        chosenQuestion: data.chosenQuestion,
        answerText: data.answerText,
      });
    }
  }
  if (entries.length === 0) return null;
  return entries[hashCode(sessionId) % entries.length];
}

export async function getAllResponses(): Promise<ResponseEntry[]> {
  const snap = await getDocs(collection(db, USER_DATABASE_COLLECTION));
  const results: ResponseEntry[] = [];
  snap.forEach((d) => {
    const data = d.data() as UserDbFields;
    if (data.chosenQuestion && data.answerText) {
      results.push({
        id: d.id,
        name: data.name ?? "Anonymous",
        storyCategory: data.storyCategory ?? "",
        chosenQuestion: data.chosenQuestion,
        answerText: data.answerText,
      });
    }
  });
  return results.sort((a, b) => a.chosenQuestion.localeCompare(b.chosenQuestion));
}