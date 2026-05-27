import { localDb } from './local-db';

export async function syncLocalToRemote() {
  const unsyncedFiles = await localDb.files.where('synced').equals(0).toArray();

  for (const file of unsyncedFiles) {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.title,
          content: file.content,
          confidenceScore: file.confidenceScore,
          privacy: file.privacy,
        }),
      });

      if (response.ok) {
        await localDb.files.update(file.id, { synced: 1 });
      }
    } catch (error) {
      console.error(`Failed to sync file ${file.id}`, error);
    }
  }
}

export async function saveFileLocally(fileData: any) {
  await localDb.files.put({
    ...fileData,
    synced: 0,
    lastModified: Date.now(),
    updatedAt: new Date(),
  });

  // Trigger background sync
  syncLocalToRemote();
}
