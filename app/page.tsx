import Model from "@/components/Model";
import { ModeToggle } from "@/components/Modetoggle";
// import { ModeToggle } from "@/components/Modetoggle";
import Navbar from "@/components/Navbar";

const page = () => {
  return (
    <div className="w-screen overflow-hidden ">
      <Navbar />
      <div className="w-screen h-screen overflow-hidden">
        <Model />
      </div>
      {/* <ModeToggle /> */}
    </div>
  );
};

export default page;
