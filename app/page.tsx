import Model from "@/components/Model";
import { Button } from "@/components/ui/button";
import React from "react";

const page = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <div className="w-screen h-11/12 overflow-hidden">
        <Model />
      </div>
    </div>
  );
};

export default page;
