import Link from "next/link";
import { FaDiscord, FaEnvelope, FaEnvelopeOpen, FaEnvelopeOpenText, FaGithub, FaHome, FaMailBulk, FaRegEnvelope } from "react-icons/fa";

function NavbarLink({ href, children }) {
  return (
    <Link href={href} className="text-lg font-medium px-3 py-1 hover:bg-gray-100 rounded transition-all">
      {children}
    </Link>
  );
}

export default function Navbar() {
  return (
    <nav className="p-4">
      <div className="container mx-auto flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Link href={"/"}>
            <h1 className="text-2xl font-bold ">
              <FaHome />
            </h1>
          </Link>
        </div>
        <div className="flex items-center space-x-1 justify-between w-full font-medium text-lg">
          <div className="flex items-center">
            <NavbarLink href={"#about"}>ABOUT</NavbarLink>
            <NavbarLink href={"#experience"}>EXPERIENCE</NavbarLink>
            <NavbarLink href={"#projects"}>PROJECTS</NavbarLink>
          </div>
          <div className="flex items-center space-x-1 ml-auto">
            <NavbarLink href={"https://github.com/willrees23"}>
              <FaGithub className="text-2xl" />
            </NavbarLink>
            <NavbarLink href={"mailto:willrees43@gmail.com"}>
              <FaRegEnvelope className="text-2xl" />
            </NavbarLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
