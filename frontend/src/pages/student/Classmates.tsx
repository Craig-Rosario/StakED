import LeaderboardCard from "@/components/custom/LeaderboardCard";
import { NeoButton } from "@/components/custom/NeoButton";
import { Trophy, Medal, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PerformanceDashboard from "@/components/custom/PerformanceDialog";
import StakeDialogContent from "@/components/custom/StakeDialogContent"; 

const mockStudents = [
  {
    rank: 1,
    name: "Alice Johnson",
    address: "0x4A...901",
    change: 8.4,
    avatar: "https://placehold.co/100x100/FFF/333?text=AJ",
  },
  {
    rank: 2,
    name: "Bob Smith",
    address: "0x7B...2C4",
    change: 6.1,
    avatar: "https://placehold.co/100x100/FFF/333?text=BS",
  },
  {
    rank: 3,
    name: "Carol Davis",
    address: "0x9E...5F7",
    change: 4.8,
    avatar: "https://placehold.co/100x100/FFF/333?text=CD",
  },
  {
    rank: 4,
    name: "David Wilson",
    address: "0x2D...8A3",
    change: -1.2,
    avatar: "https://placehold.co/80x80/FFF/333?text=DW",
  },
  {
    rank: 5,
    name: "Emma Brown",
    address: "0x5E...1B6",
    change: 2.7,
    avatar: "https://placehold.co/80x80/FFF/333?text=EB",
  },
  {
    rank: 6,
    name: "Frank Miller",
    address: "0x8F...C9E",
    change: 1.5,
    avatar: "https://placehold.co/80x80/FFF/333?text=FM",
  },
];

const Classmates = () => {
  const topStudents = mockStudents.slice(0, 3);
  const otherStudents = mockStudents.slice(3);

  const podiumData = [
    {
      icon: <Trophy className="w-10 h-10 text-yellow-600" />,
      circleBgClass: "bg-yellow-200",
    },
    {
      icon: <Medal className="w-10 h-10 text-gray-600" />,
      circleBgClass: "bg-gray-200",
    },
    {
      icon: <Award className="w-10 h-10 text-orange-600" />,
      circleBgClass: "bg-orange-200",
    },
  ];

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <header className="mb-16 md:mb-28 text-center">
        <h1 className="text-4xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
          CLASSMATES
          <br />
          <span className="text-accent">LEADERBOARD</span>
        </h1>
        <div className="inline-block bg-card border-4 border-border rounded-xl px-3 sm:px-5 py-1 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
          <p className="text-base sm:text-md font-bold">
            🏆 Top Performing Students 🏆
          </p>
        </div>
      </header>

      <section className="mb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-0 gap-12 items-end">
          <div className="md:order-1 order-2">
            <LeaderboardCard
              {...topStudents[1]}
              isPodium
              trophyImage={podiumData[1].icon}
              trophyCircleBgClass={podiumData[1].circleBgClass}
            />
          </div>
          <div className="md:order-2 order-1 md:transform md:scale-110 md:-translate-y-8">
            <LeaderboardCard
              {...topStudents[0]}
              isPodium
              trophyImage={podiumData[0].icon}
              trophyCircleBgClass={podiumData[0].circleBgClass}
            />
          </div>
          <div className="md:order-3 order-3">
            <LeaderboardCard
              {...topStudents[2]}
              isPodium
              trophyImage={podiumData[2].icon}
              trophyCircleBgClass={podiumData[2].circleBgClass}
            />
          </div>
        </div>
      </section>

      {/* Rest of Students */}
      <section>
        <div className="space-y-4">
          {otherStudents.map((student) => (
            <div
              key={student.rank}
              className="bg-white p-4 border-2 border-black rounded-lg shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg w-6 text-center">
                  {student.rank}
                </span>
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-12 h-12 rounded-full border-2 border-black object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/80x80?text=Error";
                  }}
                />
                <div>
                  <h3 className="font-bold text-lg">{student.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
                    <span>{student.address}</span>
                    <span
                      className={
                        student.change > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {student.change > 0 ? "▲" : "▼"}{" "}
                      {Math.abs(student.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <NeoButton className="bg-blue-400 px-4 py-1 text-sm text-white">
                      VIEW
                    </NeoButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-4xl bg-gray-50 border-4 border-black shadow-[8px_8px_0px_#000] rounded-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
                    <DialogHeader className="flex flex-col sm:flex-row items-center justify-center relative space-y-0 mb-4 pt-4">
                      <div className="absolute left-0 top-0 sm:static sm:flex-shrink-0 mb-2 sm:mb-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-14 h-14 rounded-full border-4 border-black"
                        />
                      </div>
                      <div className="flex-grow text-center">
                        <DialogTitle className="text-2xl font-black mt-12 md:mt-0">
                          {student.name}'s Performance
                        </DialogTitle>
                        <p className="font-mono text-sm text-gray-600 break-all">
                          {student.address}
                        </p>
                      </div>
                    </DialogHeader>
                    <PerformanceDashboard />
                  </DialogContent>
                </Dialog>

                {/* ADDED STAKE DIALOG HERE  */}
                <Dialog>
                  <DialogTrigger asChild>
                    <NeoButton className="bg-red-500 px-4 py-1 text-sm text-white">
                      STAKE
                    </NeoButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
                    <StakeDialogContent studentName={student.name} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Classmates;
