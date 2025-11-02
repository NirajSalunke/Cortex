import Model from "@/components/Model";

import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Link } from "lucide-react";
import React from "react";

const Home = () => {
  return (
    <>
      <div className="w-screen flex justify-end px-10 items-center h-16 absolute">
        <SignedIn>
          <Link href="/dashboard">
            <ShimmerButton className="scale-85">Cortex</ShimmerButton>
          </Link>
        </SignedIn>
        <SignedOut>
          <Link href="/auth/sign-in">
            <ShimmerButton className="scale-85">Get Started</ShimmerButton>
          </Link>
        </SignedOut>
      </div>
      <div className="w-screen h-screen overflow-hidden">
        <Model />
      </div>
    </>
  );
};

export default Home;
