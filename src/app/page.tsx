import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";

/** The app has no public landing page: signed-in users go to the directory, everyone else to sign-in. */
export default async function Home() {
  redirect((await getSession()) ? "/directory" : "/sign-in");
}
