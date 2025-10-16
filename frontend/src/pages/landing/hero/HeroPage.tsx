import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/ui/text-animate";
import { motion } from "framer-motion";
import Scroller from "../Scroller/Scroller";
import { useNavigate } from "react-router-dom";

const HeroPage = () => {
  const navigate=useNavigate();

  return (
    <section
      id="home"
      className="min-h-screen bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#050505]

      text-white border-b-4 border-[#2a2a2a] flex flex-col items-center overflow-x-hidden"
    >
      <div className="w-full flex-shrink-0 border-b border-[#2e2e2e] bg-[#181818]">
        <Scroller />
      </div>

      <div className="flex flex-col items-center justify-center w-full flex-grow pb-10 sm:pb-16 px-4 sm:px-8 text-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,157,0.08)_0%,transparent_70%)] pointer-events-none"></div>

        <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter mb-6 sm:mb-8 leading-tight break-words relative z-10">
          <div className="flex flex-wrap justify-center gap-2">
            <TextAnimate
              animation="blurInUp"
              by="character"
              className="m-0 text-[#ff4444] drop-shadow-[0_0_4px_#ff4444]"
              once
            >
              Stake
            </TextAnimate>
            <TextAnimate
              animation="blurInUp"
              by="character"
              className="m-0 text-white"
              once
            >
              on performance
            </TextAnimate>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1 sm:mt-2">
            <TextAnimate
              animation="blurInUp"
              by="character"
              className="m-0 text-white"
              once
            >
              Earn on
            </TextAnimate>
            <TextAnimate
              animation="blurInUp"
              by="character"
              className="m-0 text-[#00ff9d] drop-shadow-[0_0_4px_#00ff9d]"
              once
            >
              results.
            </TextAnimate>
          </div>
        </h1>

        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-8 sm:mb-10 text-gray-400 max-w-2xl sm:max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed relative z-10">
          <TextAnimate animation="blurInUp" by="word" once>
            Stake your academic performance like stocks. Bet on yourself and earn rewards on-chain.
          </TextAnimate>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-2 relative z-10"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Button
            className="bg-black text-white font-extrabold text-lg px-8 py-4 border-4 border-black shadow-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer uppercase"
            onClick={()=>(navigate("/user/dashboard"))}
          >
            🦊 CONNECT WALLET (METAMASK)
          </Button>

        </motion.div>
      </div>
    </section>
  );
};

export default HeroPage;
