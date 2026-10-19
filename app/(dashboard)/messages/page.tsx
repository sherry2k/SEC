// Save as: app/(dashboard)/messages/page.tsx
import { requirePermission } from "@/lib/auth";
import { getDirectory } from "@/lib/messages";
import MessagesClient from "@/components/MessagesClient";

export default async function MessagesPage() {
  const user = await requirePermission("messages.use");
  const directory = await getDirectory(user.id);

  return <MessagesClient currentUser={{ id: user.id, name: user.name }} initialDirectory={directory} />;
}
