import { deleteDoc, doc } from 'firebase/firestore';
import { db, COLLECTIONS, VerificationReport } from './firebase';

// Deletes a report and, best effort, its upload record so it stops counting on the overview
export const deleteReport = async (report: VerificationReport) => {
  await deleteDoc(doc(db, COLLECTIONS.verificationReports, report.id));
  if (report.video_id) {
    await deleteDoc(doc(db, COLLECTIONS.videoUploads, report.video_id)).catch(() => {});
  }
};
