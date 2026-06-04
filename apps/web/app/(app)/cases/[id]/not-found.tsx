import { redirect } from "next/navigation";

export default function CaseNotFoundRedirect() {
  redirect("/situations");
}
