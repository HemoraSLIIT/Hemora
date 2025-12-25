import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#45607A] text-white text-center p-4 fixed bottom-0">
      <p>&copy; {new Date().getFullYear()} Hemora. All rights reserved.</p>
    </footer>
  );
}
