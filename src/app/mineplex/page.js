import { gradientDefault } from "@/util/utils";
import Link from "next/link";
import { FaArrowCircleLeft, FaArrowLeft } from "react-icons/fa";

export default function MineplexPage() {
  return (
    <div className="mt-10 flex flex-col">
      <Link href={"/"} className="text-blue-600 underline mb-4">
        Back to Home
      </Link>
      <h1
        className={gradientDefault({
          from: "from-orange-400",
          to: "to-yellow-500",
          className: "text-8xl font-bold",
        })} // Using gradient utility
      >
        MINEPLEX
      </h1>
      <p className="text-gray-600 text-xl mt-4">
        Mineplex was a popular Minecraft server known for its mini-games and
        community. It offered a variety of game modes, including survival,
        creative, and competitive games. Players enjoyed the vibrant community
        and the diverse range of activities available on the server.
      </p>
      <p className="text-gray-600 text-xl mt-4">
        Unfortunately, Mineplex has faced challenges in recent years, leading to
        a decline in its player base and eventual shutdown. Despite this, it
        remains a nostalgic part of many players&apos; Minecraft experiences, and has
        been recently revived.
      </p>
      {/* separator */}
      <hr className="my-8 border-gray-300" />
      <p className="text-gray-600 text-xl mt-4">
        Whilst I played on Mineplex, I frequently applied for their Trainee
        program. I was never accepted, but I did learn a lot about moderation
        and community management. The experience helped me understand the
        importance of maintaining a positive environment in online communities.
      </p>
      <p className="text-gray-600 text-xl mt-4">
        I applied and was accepted for the Event Assistance program, which was a volunteer
        position that allowed me to help organize and run events on the server.
        This experience taught me valuable skills in event planning and
        community engagement. I learned how to coordinate with other volunteers,
        communicate effectively, and create engaging experiences for players.
      </p>
    </div>
  );
}
