import CoachClientWrapper from "./CoachClientWrapper";
import { Suspense } from "react";

async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ chatId?: string }>;
}) {
  const { chatId } = await searchParams;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CoachClientWrapper initialChatId={chatId} />
    </Suspense>
  );
}

export default CoachPage;
