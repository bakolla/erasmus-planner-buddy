import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/credentials")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
