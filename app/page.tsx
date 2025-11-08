import Home from "@/components/Home";
export const dynamic = "force-dynamic"; // Add this line

const page = () => {
  return (
    <div className="w-screen overflow-hidden ">
      <Home />
    </div>
  );
};

export default page;
