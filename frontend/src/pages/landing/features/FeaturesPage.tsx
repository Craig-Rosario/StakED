  import { TrendingUp, ShieldCheck, Medal } from "lucide-react";
  import { Card, CardContent } from "@/components/ui/card";
  import { TextAnimate } from "@/components/ui/text-animate";
  import { motion } from "framer-motion";

  const FeaturesPage = () => {
    return (
      <section id="features" className="min-h-screen bg-white py-20 px-6 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-5xl sm:text-6xl font-black uppercase text-center mb-16 text-black">
            <TextAnimate animation="blurInUp" by="character" once>
              HOW IT
            </TextAnimate>{" "}
            <span className="text-[#00A2FF]">
              <TextAnimate animation="blurInUp" by="character" once>
                WORKS
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
              <Card className="p-7 text-center border-4 border-black bg-[#00FF9920] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-[6px_6px_0px_#111]">
                <CardContent className="flex flex-col justify-between h-full">
                  <TrendingUp className="mx-auto mb-6 h-16 w-16 text-[#00A884]" />
                  <h3 className="text-2xl font-black uppercase mb-4 text-black">STAKE</h3>
                  <p className="text-lg font-bold text-gray-800">
                    Put your skills where your stake is. 
                    <br />
                    Back yourself or classmates with PYUSD tokens.
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
              <Card className="p-8 text-center border-4 border-black bg-[#FF4C4C20] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-[6px_6px_0px_#111]">
                <CardContent className="flex flex-col justify-between h-full">
                  <ShieldCheck className="mx-auto mb-6 h-16 w-16 text-[#FF4C4C]" />
                  <h3 className="text-2xl font-black uppercase mb-4 text-black">VERIFY</h3>
                  <p className="text-lg font-bold text-gray-800">
                    Results are sealed and revealed on-chain by the verifier through a tamper-proof process
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
              <Card className="p-8 text-center border-4 border-black bg-[#FFE66D30] h-full flex flex-col justify-center hover:translate-y-1 transition-transform shadow-[6px_6px_0px_#111]">
                <CardContent className="flex flex-col justify-between h-full">
                  <Medal className="mx-auto mb-6 h-16 w-16 text-[#D4AF37]" />
                  <h3 className="text-2xl font-black uppercase mb-4 text-black">EARN</h3>
                  <p className="text-lg font-bold text-gray-800">
                    Profit from performance.
                    <br />
                    Your confidence and stake turn into real rewards.
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
