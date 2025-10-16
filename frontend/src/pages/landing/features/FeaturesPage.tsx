import { TrendingUp, ShieldCheck, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TextAnimate } from "@/components/ui/text-animate";
import { motion } from "framer-motion";

const FeaturesPage = () => {
  return (
    <section
      id="features"
      className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-[#0d0d0d]  text-white py-20 px-6 flex items-center border-t-4 border-[#2a2a2a]"
    >
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-black uppercase text-center mb-16 text-white">
          <TextAnimate animation="blurInUp" by="character" once>
            HOW DOES IT
          </TextAnimate>{" "}
          <span className="text-[#00A2FF]">
            <TextAnimate animation="blurInUp" by="character" once>
              WORK?
            </TextAnimate>
          </span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 text-center border-4 border-[#00ff99] bg-[#00FF9910] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-green">
              <CardContent className="flex flex-col justify-between h-full">
                <TrendingUp className="mx-auto mb-6 h-16 w-16 text-[#00FF99]" />
                <h3 className="text-2xl font-black uppercase mb-4 text-white">STAKE</h3>
                <p className="text-lg font-semibold text-gray-300">
                  Back students or yourself like stocks.
                  <br />
                  Invest in their potential.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 text-center border-4 border-[#ff4444] bg-[#FF4C4C15] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-red">
              <CardContent className="flex flex-col justify-between h-full">
                <ShieldCheck className="mx-auto mb-6 h-16 w-16 text-[#FF4C4C]" />
                <h3 className="text-2xl font-black uppercase mb-4 text-white">VERIFY</h3>
                <p className="text-lg font-semibold text-gray-300">
                  Results are released
                  <br />
                  by the verifier.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 text-center border-4 border-[#ffd700] bg-[#FFE66D10] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-gold">
              <CardContent className="flex flex-col justify-between h-full">
                <Medal className="mx-auto mb-6 h-16 w-16 text-[#FFD700]" />
                <h3 className="text-2xl font-black uppercase mb-4 text-white">EARN</h3>
                <p className="text-lg font-semibold text-gray-300">
                  Gain from their success.
                  <br />
                  Your confidence in others or yourself pays off.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesPage;
