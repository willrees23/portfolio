import { gradient, gradientDefault } from "@/util/utils";
import Link from "next/link";
import { FaJava, FaJs, FaPython, FaReact } from "react-icons/fa";

export default function Home() {
  return (
    <>
      <section id="about" className="mt-10 flex flex-col">
        <h1
          className={gradientDefault({
            from: "from-blue-600",
            to: "to-teal-500",
            className: "text-8xl font-bold",
          })} // Using gradient utility
        >
          ABOUT
        </h1>
        <div className="mt-4">
          <p className="text-2xl">~ 18 years old</p>
          <p className="text-2xl">~ Full-stack developer</p>
          <p className="text-2xl">~ Passionate about community management</p>
          <p className="text-2xl">~ Based in the UK</p>
          <p className="text-2xl flex gap-x-3 items-center *:text-3xl">
            ~ Experienced in <FaJava /> <FaJs /> <FaReact /> <FaPython />
          </p>
          {/* separator */}
          <hr className="my-8 w-1/3 border-gray-300" />
          <p className="text-2xl">
            ~{" "}
            <Link href="/mineplex" className="text-blue-600 underline">
              Mineplex
            </Link>
          </p>
          <p className="text-2xl">~ Fierce Network</p>
        </div>
      </section>
      <div
        id="seperator"
        className="before:content-[''] before:absolute before:w-full before:h-1 before:bg-zinc-300 before:top-0 before:left-0 relative mt-32 mb-32"
      ></div>
      <section id="experience" className="mt-64 flex flex-col items-center">
        <h1
          className={gradientDefault({
            from: "from-emerald-600",
            to: "to-green-500",
            className: "text-8xl font-bold",
          })} // Using gradient utility
        >
          EXPERIENCE
        </h1>
        <div className="mt-8 relative max-w-6xl w-full">
          {/* Central Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500"></div>

          {/* Timeline Items */}
          <div className="space-y-12">
            {/* Timeline Item 1 - Right Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8"></div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="p-6 border rounded-lg shadow-md bg-white">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Feb 2025 – Present
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    McDonald&apos;s Crew Member
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Part-time role developing customer service skills and
                    working in a fast-paced environment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Customer Service
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Teamwork
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Time Management
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Item 2 - Left Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="p-6 border rounded-lg shadow-md bg-white text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Oct 2023 – Jun 2024
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Nishtha Business Services
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Work experience gaining insights into business operations
                    and professional environments
                  </p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Business Operations
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Professional Skills
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Administration
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <div className="w-1/2 pl-8"></div>
            </div>

            {/* Timeline Item 3 - Right Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8"></div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="p-6 border rounded-lg shadow-md bg-white">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Jul 2023 – Sep 2023
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Oliver&apos;s Gardening Services
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Summer work developing practical skills and work ethic in
                    outdoor environments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Physical Work
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Reliability
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Outdoor Skills
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Item 4 - Left Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="p-6 border rounded-lg shadow-md bg-white text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Jan 2022 – Present
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Freelance Minecraft Developer
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Creating custom Minecraft plugins and servers, developing
                    programming and project management skills
                  </p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      Java
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      Plugin Development
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      Client Relations
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-purple-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <div className="w-1/2 pl-8"></div>
            </div>

            {/* Timeline Item 5 - Right Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8"></div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-indigo-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <Link href={"/mineplex"} className="w-1/2 pl-8">
                <div className="p-6 border rounded-lg shadow-md bg-white">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      2020 – 2023
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Mineplex - Event Assistance
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Assisted with community events and server management,
                    developing organizational skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                      Event Management
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                      Community Support
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                      Organization
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Timeline Item 6 - Left Side */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="p-6 border rounded-lg shadow-md bg-white text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      2019 – 2020
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Fierce Network - Moderator+
                  </h2>
                  <p className="text-gray-700 mb-3">
                    Community moderation role developing leadership and conflict
                    resolution skills
                  </p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                      Moderation
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                      Leadership
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                      Conflict Resolution
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Timeline dot */}
                <div className="w-6 h-6 bg-teal-500 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
              </div>
              <div className="w-1/2 pl-8"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
