import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { TextAnimate } from "@/components/ui/text-animate";
import Scroller from "../Scroller/Scroller";

const Faq = () => {
  return (
    <section
      id="faq"
      className="min-h-screen bg-[#F9F9F9] border-b-4 border-foreground flex flex-col items-center overflow-x-hidden"
    >
      <div className="flex flex-col items-center justify-center w-full flex-grow pb-10 sm:pb-16 px-4 sm:px-8 text-center">
        <h2 className="text-5xl sm:text-6xl font-black uppercase text-center mb-16 text-[#111]">
          <TextAnimate animation="blurInUp" by="word" once>
            FREQUENTLY ASKED
          </TextAnimate>{" "}
          <span className="text-[#00A2FF]">
            <TextAnimate animation="blurInUp" by="word" once>
              QUESTIONS
            </TextAnimate>
          </span>
        </h2>

        <div className="w-full max-w-4xl text-left">
          <Accordion type="single" collapsible className="space-y-6">
            {[
              {
                id: "item-1",
                question: "What is StakED?",
                answer:
                  "StakED is a gamified platform where students can stake on their own academic or skill performance, and others can back them based on confidence in their success.",
              },
              {
                id: "item-2",
                question: "How does staking fit into education?",
                answer:
                  "StakED turns learning into a friendly, gamified challenge. It rewards confidence and improvement, encouraging students to study smarter and stay motivated.",
              },
              {
                id: "item-3",
                question: "How do I get started with StakED?",
                answer:
                  "To get started, all you need is a MetaMask wallet. Once you sign up, you can join classes, place stakes, and track your progress. The platform makes it easy to participate and earn rewards.",
              },
              {
                id: "item-4",
                question: "Can students lowball their scores and win always?",
                answer:
                  "No. There’s a minimum score threshold to prevent lowballing, ensuring stakes reward genuine effort and achievement.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <AccordionItem value={faq.id}>
                  <div className="border-4 border-black bg-white rounded-lg text-left">
                    <AccordionTrigger className="text-lg sm:text-xl font-bold px-6 py-4 text-black">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 text-base sm:text-lg font-medium text-black">
                      {faq.answer}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
      <div className="w-full flex-shrink-0">
        <Scroller />
      </div>
    </section>
  );
};

export default Faq;
