import { Link } from "lucide-react";
import { ShimmerButton } from "./ui/shimmer-button";
import { useUserSync } from "@/hooks/useUserSync";

const UserSyncWrapper = () => {
  useUserSync();

  return (
    <Link href="/dashboard">
      <ShimmerButton className="scale-85">Cortex</ShimmerButton>
    </Link>
  );
};
export default UserSyncWrapper;
