import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/ui/text-animate";
import { motion } from "framer-motion";
import Scroller from "../Scroller/Scroller";
import { loginWithMetaMask } from "@/lib/web3Auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 

const HeroPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate(); 

  const handleMetaMaskLogin = async () => {
    try {
      setLoading(true);
      const loggedUser = await loginWithMetaMask();
      setUser(loggedUser);

      navigate("/user/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "MetaMask login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <section
      id="home"
      className="min-h-screen bg-[#F9F9F9] border-b-4 border-foreground flex flex-col items-center overflow-x-hidden"
    >
      <div className="w-full flex-shrink-0">
        <Scroller />
      </div>

      <div className="flex flex-col items-center justify-center w-full flex-grow pb-10 sm:pb-16 px-4 sm:px-8 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter mb-6 sm:mb-8 text-foreground leading-tight break-words">
          <div className="flex flex-wrap justify-center gap-2">
            <TextAnimate animation="blurInUp" by="word" className="m-0 text-red-500" once>
              Stake
            </TextAnimate>
            <TextAnimate animation="blurInUp" by="word" className="m-0" once>
              on performance
            </TextAnimate>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1 sm:mt-2">
            <TextAnimate animation="blurInUp" by="word" className="m-0" once>
              Earn on
            </TextAnimate>
            <TextAnimate animation="blurInUp" by="word" className="m-0 text-green-400" once>
              results.
            </TextAnimate>
          </div>
        </h1>

        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-8 sm:mb-10 text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed">
          <TextAnimate animation="blurInUp" by="word" once>
            Stake your academic performance like stocks. Bet on yourself and earn rewards on-chain.
          </TextAnimate>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-2"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Button
            className="bg-gray-800 text-white font-extrabold text-lg px-8 py-4 border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
            onClick={handleMetaMaskLogin}
            disabled={loading}
          >
            {loading ? "Connecting..." : "🦊 CONNECT WALLET (METAMASK)"}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroPage;
