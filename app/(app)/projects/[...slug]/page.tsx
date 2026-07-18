import { redirect } from "next/navigation";

export default function LegacyProjectRoute() {
  redirect("/tasks");
}
