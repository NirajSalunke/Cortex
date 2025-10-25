"use client";
import React from "react";
import PillNav from "./PillNav";
import { useTheme } from "next-themes";

const Navbar = () => {
  return (
    <div className="flex justify-center items-center">
      <PillNav
        logo="/logo.svg"
        logoAlt="Company Logo"
        items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Services", href: "/services" },
          { label: "Contact", href: "/contact" },
        ]}
        activeHref="/"
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="#F9F6EE"
        pillColor="#000000"
        hoveredPillTextColor="#000000"
        pillTextColor="#F9F6EE"
      />
    </div>
  );
};

export default Navbar;
